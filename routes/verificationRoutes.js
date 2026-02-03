const express = require('express');
const router = express.Router();
const { verifyRestorationImage } = require('../controllers/verificationController');

// POST /api/verify - Verify restoration image
router.post('/', verifyRestorationImage);

module.exports = router;

