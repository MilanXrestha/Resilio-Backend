const express = require('express');
const { FavoriteController } = require('../controllers/favorite-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();
const controller = new FavoriteController();

// All favorite routes require a valid session. The user is derived from the
// token (req.user.id), never trusted from the request body/params.

/**
 * Route: POST /api/favorites/add
 * Add an item to user favorites
 */
router.post('/add', authMiddleware, (req, res) => controller.addFavorite(req, res));

/**
 * Route: POST /api/favorites/remove
 * Remove an item from user favorites
 */
router.post('/remove', authMiddleware, (req, res) => controller.removeFavorite(req, res));

/**
 * Route: GET /api/favorites/user/:userId
 * Get all favorites for the authenticated user (the :userId param is ignored).
 */
router.get('/user/:userId', authMiddleware, (req, res) => controller.getFavorites(req, res));

/**
 * Route: GET /api/favorites/status
 * Check if a specific item is favorited
 */
router.get('/status', authMiddleware, (req, res) => controller.checkFavoriteStatus(req, res));

module.exports = router;
