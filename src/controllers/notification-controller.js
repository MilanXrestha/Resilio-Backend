// notification-controller.js
// Handles GET/PATCH/DELETE for user notifications

const { NotificationService } = require('../services/notification-service');
const { supabase } = require('../config/supabase-client');

/**
 * If `userId` is a Firebase UID (not a UUID), resolve it to the DB UUID.
 * auth-middleware sets req.user.id = Firebase UID as the initial value and
 * then overwrites it with the DB UUID only when the Supabase lookup succeeds.
 * If that lookup failed, we end up here with a Firebase UID, which won't match
 * anything in the notifications table.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveDbUserId(userId, firebaseUid) {
  if (UUID_RE.test(userId)) return userId; // already a DB UUID

  // userId is a Firebase UID — look up the DB UUID
  const firebaseUidToResolve = firebaseUid || userId;
  if (!supabase) return userId;

  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUidToResolve)
      .single();
    if (data?.id) {
      console.log(`[notification-controller] Resolved Firebase UID → DB UUID: ${data.id}`);
      return data.id;
    }
  } catch (e) {
    console.warn('[notification-controller] Could not resolve Firebase UID to DB UUID:', e.message);
  }

  return userId; // fallback — query will return 0 rows but won't crash
}

module.exports = {
  // GET /api/v1/notifications
  async listNotifications(req, res) {
    try {
      const rawId = req.user?.id;
      if (!rawId) return res.status(401).json({ error: 'Unauthorized' });

      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const userId = await resolveDbUserId(rawId, req.user?.firebaseUid);
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
      const rawId = req.user?.id;
      if (!rawId) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await resolveDbUserId(rawId, req.user?.firebaseUid);
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
      const rawId = req.user?.id;
      if (!rawId) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await resolveDbUserId(rawId, req.user?.firebaseUid);
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
      const rawId = req.user?.id;
      if (!rawId) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await resolveDbUserId(rawId, req.user?.firebaseUid);
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
      const rawId = req.user?.id;
      if (!rawId) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await resolveDbUserId(rawId, req.user?.firebaseUid);
      const deleted = await NotificationService.delete(req.params.id, userId);
      if (!deleted) return res.status(404).json({ error: 'Notification not found' });

      res.json({ success: true });
    } catch (err) {
      console.error('deleteNotification error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
