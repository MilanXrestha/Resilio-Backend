/**
 * HTTP-based WebRTC signaling via Supabase storage.
 * Replaces the Socket.IO server so it works on Vercel (serverless).
 *
 * Required Supabase table — run this SQL once in Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS webrtc_signals (
 *     id          bigserial PRIMARY KEY,
 *     room_id     text NOT NULL,
 *     from_user_id text NOT NULL,
 *     event_type  text NOT NULL,
 *     payload     jsonb NOT NULL DEFAULT '{}',
 *     created_at  timestamptz DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_webrtc_signals_room
 *     ON webrtc_signals(room_id, created_at);
 */

const { supabase } = require('../config/supabase-client');

// How long signals are kept alive (ms). Old signals are cleaned up on each POST.
const SIGNAL_TTL_SECONDS = 120;

module.exports = {
  /**
   * POST /api/v1/webrtc/signal
   * Body: { roomId, fromUserId, eventType, payload }
   */
  async emitSignal(req, res) {
    const { roomId, fromUserId, eventType, payload } = req.body;
    if (!roomId || !fromUserId || !eventType) {
      return res.status(400).json({ error: 'roomId, fromUserId, eventType are required' });
    }

    try {
      // Insert signal
      const { error } = await supabase.from('webrtc_signals').insert({
        room_id: roomId,
        from_user_id: fromUserId,
        event_type: eventType,
        payload: payload || {},
      });
      if (error) throw error;

      // Cleanup stale signals (fire-and-forget)
      const cutoff = new Date(Date.now() - SIGNAL_TTL_SECONDS * 1000).toISOString();
      supabase.from('webrtc_signals').delete().lt('created_at', cutoff).then(() => {});

      res.json({ success: true });
    } catch (err) {
      console.error('[WebRTC Signal] emitSignal error:', err.message);
      res.status(500).json({ error: 'Failed to emit signal' });
    }
  },

  /**
   * GET /api/v1/webrtc/signal/:roomId?since=ISO&excludeUserId=uid
   * Returns all signals for the room created after `since` (exclusive) and
   * not sent by `excludeUserId`.
   */
  async pollSignals(req, res) {
    const { roomId } = req.params;
    const { since, excludeUserId } = req.query;

    if (!roomId) return res.status(400).json({ error: 'roomId required' });

    try {
      // Default to last 60 s if no since timestamp (first poll / reconnect)
      const sinceDate = since
        ? new Date(since)
        : new Date(Date.now() - 60_000);

      let query = supabase
        .from('webrtc_signals')
        .select('id, room_id, from_user_id, event_type, payload, created_at')
        .eq('room_id', roomId)
        .gt('created_at', sinceDate.toISOString())
        .order('created_at', { ascending: true });

      if (excludeUserId) {
        query = query.neq('from_user_id', excludeUserId);
      }

      const { data, error } = await query;
      if (error) throw error;

      res.json({ signals: data || [] });
    } catch (err) {
      console.error('[WebRTC Signal] pollSignals error:', err.message);
      res.status(500).json({ error: 'Failed to poll signals' });
    }
  },
};
