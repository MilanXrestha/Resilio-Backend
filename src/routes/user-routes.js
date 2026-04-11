// User Routes
const express = require('express');
const userController = require('../controllers/user-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

const router = express.Router();

// Public routes
router.post('/sync', userController.syncUser);

// Protected routes (require Firebase auth)
router.get('/me', authMiddleware, userController.getCurrentUser);
router.put('/me', authMiddleware, userController.updateCurrentUser);
router.patch('/me', authMiddleware, userController.updateCurrentUser); // Flutter app uses PATCH
router.put('/me/fcm-token', authMiddleware, userController.updateFcmToken);
router.delete('/me', authMiddleware, userController.deleteCurrentUser);
router.get('/:id', authMiddleware, userController.getUserById);
router.get('/', authMiddleware, userController.listUsers);

module.exports = router;
