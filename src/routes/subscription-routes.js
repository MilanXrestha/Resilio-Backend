const express = require('express');
const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const subscriptionController = require('../controllers/subscription-controller');
const { addUserInfo } = require('../middlewares/auth-middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifySession());
router.use(addUserInfo);

// Subscription routes
router.get('/me', subscriptionController.getSubscription);
router.post('/', subscriptionController.updateSubscription); // Can be used for create or update
router.get('/transactions', subscriptionController.listTransactions);

module.exports = router;
