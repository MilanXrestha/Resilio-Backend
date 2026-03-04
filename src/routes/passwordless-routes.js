// Passwordless Routes - SuperTokens OTP completion and user sync
const express = require('express');
const { completeLogin } = require('../controllers/passwordless-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();

// Protected: requires valid SuperTokens access token
// Called by Flutter after consuming an OTP code successfully
router.post('/complete', authMiddleware, completeLogin);

module.exports = router;
