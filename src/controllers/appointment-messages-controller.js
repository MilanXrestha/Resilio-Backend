// appointment-messages-controller.js
// REST-based messaging for appointments (patient ↔ therapist)
// Messages are grouped by therapist+patient PAIR so the same history shows
// regardless of which appointment the user is viewing.

const { supabase } = require('../config/supabase-client');
const { fcmService } = require('../services/fcm-service');

class MessageRepository {
  // ── Per-appointment (legacy, still used internally) ─────────────────────────
  async getMessages(appointmentId) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('appointment_messages')
      .select('id, appointment_id, sender_id, sender_role, content, is_read, created_at')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(this._map);
  }

  // ── Shared conversation: all messages between a therapist+patient pair ───────
  async getConversationMessages(therapistId, patientId) {
    if (!supabase) return [];

    // Step 1: Find all appointment IDs between this pair
    const { data: appts, error: apptErr } = await supabase
      .from('appointments')
      .select('id')
      .eq('therapist_id', therapistId)
      .eq('patient_id', patientId);
    if (apptErr) throw apptErr;
    if (!appts || appts.length === 0) return [];

    const apptIds = appts.map((a) => a.id);

    // Step 2: Fetch all messages across those appointments
    const { data, error } = await supabase
      .from('appointment_messages')
      .select('id, appointment_id, sender_id, sender_role, content, is_read, created_at')
      .in('appointment_id', apptIds)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(this._map);
  }

  async sendMessage({ appointmentId, senderId, senderRole, content }) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('appointment_messages')
      .insert({
        appointment_id: appointmentId,
        sender_id: senderId,
        sender_role: senderRole,
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return this._map(data);
  }

  async markRead(appointmentId, readerId) {
    if (!supabase) return;
    await supabase
      .from('appointment_messages')
      .update({ is_read: true })
      .eq('appointment_id', appointmentId)
      .neq('sender_id', readerId)
      .eq('is_read', false);
  }

  async verifyParticipant(appointmentId, userId) {
    if (!supabase) return null;
    const { data } = await supabase
      .from('appointments')
      .select('patient_id, therapist_id')
      .eq('id', appointmentId)
      .single();
    if (!data) return null;
    if (data.patient_id === userId) return { role: 'patient', appointment: data };
    if (data.therapist_id === userId) return { role: 'therapist', appointment: data };
    return null;
  }

  _map(row) {
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      senderId: row.sender_id,
      senderRole: row.sender_role,
      content: row.content,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }
}

const repo = new MessageRepository();

// ── Helper: get the FCM token of the OTHER participant ────────────────────────
async function getOtherParticipantToken(appointment, senderRole) {
  const otherUserId =
    senderRole === 'patient' ? appointment.therapist_id : appointment.patient_id;
  if (!otherUserId) return null;
  const { data } = await supabase
    .from('users')
    .select('fcm_token, display_name')
    .eq('id', otherUserId)
    .single();
  return data || null;
}

module.exports = {
  /**
   * GET /appointments/:id/messages
   */
  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const participant = await repo.verifyParticipant(id, userId);
      if (!participant) return res.status(403).json({ error: 'Not a participant' });

      const messages = await repo.getMessages(id);
      repo.markRead(id, userId).catch(() => {});
      res.json({ messages });
    } catch (e) {
      console.error('[Messages] getMessages error:', e);
      res.status(500).json({ error: 'Failed to load messages' });
    }
  },

  /**
   * GET /appointments/conversation/:therapistId/:patientId/messages
   * Returns the full shared conversation between this therapist+patient pair.
   */
  async getConversationMessages(req, res) {
    try {
      const { therapistId, patientId } = req.params;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Only allow participants (either of the two) to read
      if (userId !== therapistId && userId !== patientId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const messages = await repo.getConversationMessages(therapistId, patientId);
      res.json({ messages });
    } catch (e) {
      console.error('[Messages] getConversationMessages error:', e);
      res.status(500).json({ error: 'Failed to load conversation' });
    }
  },

  /**
   * POST /appointments/:id/messages
   * Body: { content: string }
   */
  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const participant = await repo.verifyParticipant(id, userId);
      if (!participant) return res.status(403).json({ error: 'Not a participant' });

      const content = (req.body?.content || '').toString().trim();
      if (!content) return res.status(400).json({ error: 'Content required' });
      if (content.length > 2000) return res.status(400).json({ error: 'Message too long' });

      const message = await repo.sendMessage({
        appointmentId: id,
        senderId: userId,
        senderRole: participant.role,
        content,
      });

      // Fire-and-forget FCM to the other participant
      getOtherParticipantToken(participant.appointment, participant.role)
        .then(async (other) => {
          if (!other?.fcm_token) return;
          const senderLabel = participant.role === 'patient' ? 'Patient' : 'Dr.';
          const { data: sender } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', userId)
            .single();
          const senderName = sender?.display_name || senderLabel;
          await fcmService.sendToToken(
            other.fcm_token,
            senderName,
            content.length > 80 ? content.substring(0, 77) + '…' : content,
            {
              appointmentId: id,
              action: 'OPEN_APPOINTMENT',
              actionType: 'OPEN_APPOINTMENT',
            }
          );
        })
        .catch(() => {});

      res.status(201).json({ message });
    } catch (e) {
      console.error('[Messages] sendMessage error:', e);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },
};
