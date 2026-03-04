// Quote Routes - defines API endpoints
const express = require('express');
const quoteController = require('../controllers/quote-controller');

const router = express.Router();

// Public routes - no authentication required for reading quotes
router.get('/featured', quoteController.getFeaturedQuotes);
router.get('/:id', quoteController.getQuoteById);
router.get('/', quoteController.listQuotes);

module.exports = router;
