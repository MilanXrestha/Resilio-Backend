const express = require('express');
const subscriptionController = require('../controllers/subscription-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();

// Apply unified auth middleware (supports both Firebase and SuperTokens)
router.use(authMiddleware);

// Subscription routes
router.get('/me', subscriptionController.getSubscription);
router.post('/', subscriptionController.updateSubscription); // Can be used for create or update
router.get('/transactions', subscriptionController.listTransactions);

module.exports = router;
