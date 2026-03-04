// Preference Routes
const express = require('express');
const preferenceController = require('../controllers/preference-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();

// Public route - get all available preferences
router.get('/', preferenceController.getAllPreferences);

// Protected routes - require authentication
router.get('/me', authMiddleware, preferenceController.getUserPreferences);
router.post('/me', authMiddleware, preferenceController.saveUserPreferences);
router.get('/me/completed', authMiddleware, preferenceController.hasCompletedPreferences);

module.exports = router;
