const Vial = require('../models/Vial');
const Organ = require('../models/Organ');
const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

/**
 * Initialize a payment transaction
 * @route POST /api/vials/initialize
 */
const initializePayment = async (req, res) => {
  try {
    const { organId, amount, currency = 'USD', email, name } = req.body;

    // Validate organ exists
    const organ = await Organ.findById(organId);
    if (!organ) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organ not found' 
      });
    }

    // Generate unique transaction reference
    const txRef = `VIAL-${organId}-${Date.now()}`;

    // Create Vial record
    const vial = await Vial.create({
      organId,
      transactionRef: txRef,
      amountUSD: currency === 'USD' ? amount : amount / 1600, // Rough NGN to USD conversion
      currency,
      donorEmail: email,
      donorName: name,
      status: 'PENDING'
    });

    // Initialize Flutterwave payment
    const payload = {
      tx_ref: txRef,
      amount: amount,
      currency: currency,
      redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
      customer: {
        email: email,
        name: name
      },
      customizations: {
        title: `Healing ${organ.name}`,
        description: `Contribution to restore Earth's ${organ.type}`,
        logo: process.env.LOGO_URL || ''
      },
      meta: {
        organId: organId,
        organName: organ.name,
        vialId: vial._id.toString()
      }
    };

    const response = await flw.Charge.card(payload);

    res.status(200).json({
      success: true,
      data: {
        vialId: vial._id,
        paymentLink: response.data?.link || response.meta?.authorization?.redirect,
        txRef: txRef
      }
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
};

/**
 * Flutterwave webhook handler
 * @route POST /api/vials/webhook
 */
const handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const payload = req.body;
    
    // Only process successful payments
    if (payload.status !== 'successful') {
      return res.status(200).json({ message: 'Payment not successful' });
    }

    const txRef = payload.tx_ref || payload.txRef;
    
    // Find the vial transaction
    const vial = await Vial.findOne({ transactionRef: txRef });
    if (!vial) {
      console.error('Vial not found for tx_ref:', txRef);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Prevent duplicate processing
    if (vial.status === 'SUCCESS') {
      return res.status(200).json({ message: 'Already processed' });
    }

    // Update vial status
    vial.status = 'SUCCESS';
    vial.flutterwaveData = payload;
    vial.processedAt = new Date();
    await vial.save();

    // Update organ funding
    const organ = await Organ.findById(vial.organId);
    if (organ) {
      organ.currentFundingUSD += vial.amountUSD;
      
      // Calculate funding percentage
      const fundingPercentage = (organ.currentFundingUSD / organ.targetFundingUSD) * 100;
      
      // Update symptom state based on funding
      if (fundingPercentage >= 50 && organ.symptomState === 'INFLAMED') {
        organ.symptomState = 'HEALING';
      }
      
      organ.lastUpdated = new Date();
      await organ.save();

      console.log(`✓ Vial processed: ${vial.amountUSD} USD → ${organ.name} (${fundingPercentage.toFixed(1)}% funded)`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

/**
 * Get all vials for an organ
 * @route GET /api/vials/:organId
 */
const getVialsByOrgan = async (req, res) => {
  try {
    const { organId } = req.params;
    
    const vials = await Vial.find({ organId, status: 'SUCCESS' })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: vials.length,
      data: vials
    });
  } catch (error) {
    console.error('Error fetching vials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vials',
      error: error.message
    });
  }
};

module.exports = {
  initializePayment,
  handleWebhook,
  getVialsByOrgan
};

