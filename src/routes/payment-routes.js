const express = require('express');
const router = express.Router();
const { verifyPayment } = require('../controllers/payment-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

// POST /api/v1/payments/verify
// Verifies an eSewa payment and confirms the linked appointment
router.post('/verify', authMiddleware, verifyPayment);

module.exports = router;
