const express = require('express');
const router = express.Router();
const {
  initializePayment,
  handleWebhook,
  getVialsByOrgan
} = require('../controllers/vialController');

// POST /api/vials/initialize - Initialize payment
router.post('/initialize', initializePayment);

// POST /api/vials/webhook - Flutterwave webhook
router.post('/webhook', handleWebhook);

// GET /api/vials/:organId - Get vials for an organ
router.get('/:organId', getVialsByOrgan);

module.exports = router;

