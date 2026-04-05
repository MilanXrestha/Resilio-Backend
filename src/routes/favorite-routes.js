const express = require('express');
const { FavoriteController } = require('../controllers/favorite-controller');

const router = express.Router();
const controller = new FavoriteController();

/**
 * Route: POST /api/favorites/add
 * Add an item to user favorites
 */
router.post('/add', (req, res) => controller.addFavorite(req, res));

/**
 * Route: POST /api/favorites/remove
 * Remove an item from user favorites
 */
router.post('/remove', (req, res) => controller.removeFavorite(req, res));

/**
 * Route: GET /api/favorites/user/:userId
 * Get all favorites for a specific user
 */
router.get('/user/:userId', (req, res) => controller.getFavorites(req, res));

/**
 * Route: GET /api/favorites/status
 * Check if a specific item is favorited
 */
router.get('/status', (req, res) => controller.checkFavoriteStatus(req, res));

module.exports = router;
