// notification-controller.js
// Handles GET/PATCH/DELETE for user notifications

const { NotificationService } = require('../services/notification-service');

module.exports = {
  // GET /api/v1/notifications
  async listNotifications(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const { notifications, total } = await NotificationService.getForUser(userId, { limit, offset });

      res.json({ notifications, pagination: { total, limit, offset } });
    } catch (err) {
      console.error('listNotifications error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/notifications/unread-count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const count = await NotificationService.countUnread(userId);
      res.json({ unreadCount: count });
    } catch (err) {
      console.error('getUnreadCount error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PATCH /api/v1/notifications/:id/read
  async markRead(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const notification = await NotificationService.markRead(req.params.id, userId);
      if (!notification) return res.status(404).json({ error: 'Notification not found' });

      res.json({ notification });
    } catch (err) {
      console.error('markRead error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PATCH /api/v1/notifications/read-all
  async markAllRead(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      await NotificationService.markAllRead(userId);
      res.json({ success: true });
    } catch (err) {
      console.error('markAllRead error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // DELETE /api/v1/notifications/:id
  async deleteNotification(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const deleted = await NotificationService.delete(req.params.id, userId);
      if (!deleted) return res.status(404).json({ error: 'Notification not found' });

      res.json({ success: true });
    } catch (err) {
      console.error('deleteNotification error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
