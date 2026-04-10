// notification-service.js
// Centralised service for persisting in-app notifications to Supabase
// Used by appointment-controller, payment-controller, etc.

const { supabase } = require('../config/supabase-client');

class NotificationService {
  /**
   * Create and persist a notification for a user.
   * Non-fatal — errors are logged but not thrown.
   */
  static async create({ userId, title, body, type, actionType = null, actionPayload = null }) {
    if (!supabase) {
      console.warn('NotificationService: Supabase not available, skipping notification persist.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          type,
          action_type: actionType,
          action_payload: actionPayload,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('NotificationService.create error:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('NotificationService.create exception:', err.message);
      return null;
    }
  }

  /**
   * Get all notifications for a user, newest first.
   */
  static async getForUser(userId, { limit = 50, offset = 0 } = {}) {
    if (!supabase) return { notifications: [], total: 0 };

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('NotificationService.getForUser error:', error.message);
      return { notifications: [], total: 0 };
    }

    return { notifications: data || [], total: count || 0 };
  }

  /**
   * Count unread notifications for a user.
   */
  static async countUnread(userId) {
    if (!supabase) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  }

  /**
   * Mark a single notification as read.
   */
  static async markRead(notificationId, userId) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId) // Security: ensure ownership
      .select()
      .single();

    if (error) {
      console.error('NotificationService.markRead error:', error.message);
      return null;
    }

    return data;
  }

  /**
   * Mark ALL notifications as read for a user.
   */
  static async markAllRead(userId) {
    if (!supabase) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('NotificationService.markAllRead error:', error.message);
      return false;
    }

    return true;
  }

  /**
   * Delete a notification.
   */
  static async delete(notificationId, userId) {
    if (!supabase) return false;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('NotificationService.delete error:', error.message);
      return false;
    }

    return true;
  }
}

module.exports = { NotificationService };
