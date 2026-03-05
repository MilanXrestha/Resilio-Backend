// Tips Routes - defines API endpoints
const express = require('express');
const tipsController = require('../controllers/tips-controller');

const router = express.Router();

// Public routes - no authentication required for reading tips
router.get('/featured', tipsController.getFeaturedTips);
router.get('/:id', tipsController.getTipById);
router.get('/', tipsController.listTips);
router.get('/type/:type', tipsController.getTipsByType);

module.exports = router;
