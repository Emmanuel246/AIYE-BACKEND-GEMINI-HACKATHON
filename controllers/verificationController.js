const { GoogleGenerativeAI } = require('@google/generative-ai');
const Organ = require('../models/Organ');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Verify restoration image using Gemini Vision
 * @route POST /api/verify
 */
const verifyRestorationImage = async (req, res) => {
  try {
    const { organId, imageBase64, ngoName, description } = req.body;

    // Validate required fields
    if (!organId || !imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'organId and imageBase64 are required'
      });
    }

    // Find the organ
    const organ = await Organ.findById(organId);
    if (!organ) {
      return res.status(404).json({
        success: false,
        message: 'Organ not found'
      });
    }

    // Prepare the image data
    let imageData;
    if (imageBase64.startsWith('data:')) {
      // Extract base64 from data URL
      const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format'
        });
      }
      imageData = {
        inlineData: {
          data: matches[2],
          mimeType: `image/${matches[1]}`
        }
      };
    } else {
      // Assume it's raw base64
      imageData = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      };
    }

    // Get Gemini Vision model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    // Construct verification prompt based on organ type
    let verificationPrompt = '';
    switch (organ.type) {
      case 'Lungs':
        verificationPrompt = `You are verifying environmental restoration for Earth's Lungs (forests/rainforests).
        
Organ: ${organ.name}
Current State: ${organ.symptomState}
Submitted by: ${ngoName || 'Anonymous NGO'}
Description: ${description || 'No description provided'}

Analyze this image and determine if it shows genuine forest restoration, reforestation, or conservation efforts.
Look for: new tree growth, healthy vegetation, restoration activities, protected forest areas.
Red flags: deforestation, cleared land, fires, degradation.

Respond in JSON format ONLY:
{
  "verified": true/false,
  "confidence": 0-100,
  "analysis": "Brief analysis of what you see in the image",
  "recommendation": "APPROVE to mark organ as HEALTHY, REJECT to keep current state, or PARTIAL for HEALING state"
}`;
        break;

      case 'Veins':
        verificationPrompt = `You are verifying environmental restoration for Earth's Veins (oceans/coral reefs).
        
Organ: ${organ.name}
Current State: ${organ.symptomState}
Submitted by: ${ngoName || 'Anonymous NGO'}
Description: ${description || 'No description provided'}

Analyze this image and determine if it shows genuine ocean/reef restoration or conservation.
Look for: healthy coral, marine life diversity, clean water, restoration projects.
Red flags: bleached coral, pollution, dead zones, degradation.

Respond in JSON format ONLY:
{
  "verified": true/false,
  "confidence": 0-100,
  "analysis": "Brief analysis of what you see in the image",
  "recommendation": "APPROVE to mark organ as HEALTHY, REJECT to keep current state, or PARTIAL for HEALING state"
}`;
        break;

      case 'Skin':
        verificationPrompt = `You are verifying environmental restoration for Earth's Skin (air quality/soil).
        
Organ: ${organ.name}
Current State: ${organ.symptomState}
Submitted by: ${ngoName || 'Anonymous NGO'}
Description: ${description || 'No description provided'}

Analyze this image and determine if it shows genuine air quality improvement or soil restoration.
Look for: clean air indicators, green spaces, soil conservation, pollution reduction efforts.
Red flags: smog, pollution, degraded soil, industrial emissions.

Respond in JSON format ONLY:
{
  "verified": true/false,
  "confidence": 0-100,
  "analysis": "Brief analysis of what you see in the image",
  "recommendation": "APPROVE to mark organ as HEALTHY, REJECT to keep current state, or PARTIAL for HEALING state"
}`;
        break;
    }

    // Generate verification result
    const result = await model.generateContent([verificationPrompt, imageData]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let verificationResult;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini Vision response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse verification result',
        error: parseError.message
      });
    }

    // Update organ state based on verification
    if (verificationResult.verified && verificationResult.recommendation === 'APPROVE') {
      organ.symptomState = 'HEALTHY';
      organ.healthScore = Math.min(100, organ.healthScore + 20);
      organ.lastUpdated = new Date();
      await organ.save();

      console.log(`✓ Verification approved: ${organ.name} marked as HEALTHY`);
    } else if (verificationResult.verified && verificationResult.recommendation === 'PARTIAL') {
      organ.symptomState = 'HEALING';
      organ.healthScore = Math.min(100, organ.healthScore + 10);
      organ.lastUpdated = new Date();
      await organ.save();

      console.log(`✓ Verification partial: ${organ.name} marked as HEALING`);
    }

    res.status(200).json({
      success: true,
      data: {
        organId: organ._id,
        organName: organ.name,
        previousState: organ.symptomState,
        newState: organ.symptomState,
        verification: verificationResult
      }
    });
  } catch (error) {
    console.error('Error verifying image:', error);
    res.status(500).json({
      success: false,
      message: 'Image verification failed',
      error: error.message
    });
  }
};

module.exports = {
  verifyRestorationImage
};

