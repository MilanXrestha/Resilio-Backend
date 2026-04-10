// notification-routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

// GET /api/v1/notifications
router.get('/', authMiddleware, notificationController.listNotifications);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', authMiddleware, notificationController.markAllRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', authMiddleware, notificationController.markRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

module.exports = router;
