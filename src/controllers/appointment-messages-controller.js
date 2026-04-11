// appointment-messages-controller.js
// REST-based messaging for appointments (patient ↔ therapist)

const { supabase } = require('../config/supabase-client');

class MessageRepository {
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
    // Mark as read all messages NOT sent by the current reader
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
    if (data.patient_id === userId) return 'patient';
    if (data.therapist_id === userId) return 'therapist';
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

module.exports = {
  /**
   * GET /appointments/:id/messages
   * Returns all messages for an appointment (authenticated participant only).
   */
  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const role = await repo.verifyParticipant(id, userId);
      if (!role) return res.status(403).json({ error: 'Not a participant of this appointment' });

      const messages = await repo.getMessages(id);

      // Mark messages sent by the other party as read (fire-and-forget)
      repo.markRead(id, userId).catch(() => {});

      res.json({ messages });
    } catch (e) {
      console.error('[Messages] getMessages error:', e);
      res.status(500).json({ error: 'Failed to load messages' });
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

      const role = await repo.verifyParticipant(id, userId);
      if (!role) return res.status(403).json({ error: 'Not a participant of this appointment' });

      const content = (req.body?.content || '').toString().trim();
      if (!content) return res.status(400).json({ error: 'Message content is required' });
      if (content.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars)' });

      const message = await repo.sendMessage({
        appointmentId: id,
        senderId: userId,
        senderRole: role,
        content,
      });

      res.status(201).json({ message });
    } catch (e) {
      console.error('[Messages] sendMessage error:', e);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },
};
