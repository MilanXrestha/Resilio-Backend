const { supabase } = require('../config/supabase-client');

/**
 * Mood Share Controller — patient side.
 * A patient can share/revoke their mood logs with a therapist they have booked
 * (an appointment exists between them). User is always taken from the token.
 */
module.exports = {
  // POST /api/v1/mood/share  { therapistId }
  async shareWithTherapist(req, res) {
    try {
      const patientId = req.user?.id;
      const therapistId = req.body.therapistId || req.body.therapist_id;
      if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      if (!therapistId) {
        return res.status(400).json({ success: false, error: 'therapistId is required' });
      }
      if (!supabase) return res.status(500).json({ success: false, error: 'DB unavailable' });

      // Only allow sharing with a therapist the patient has an appointment with.
      const { data: appt } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patientId)
        .eq('therapist_id', therapistId)
        .limit(1)
        .maybeSingle();

      if (!appt) {
        return res.status(403).json({
          success: false,
          error: 'You can only share with a therapist you have booked.',
        });
      }

      const { error } = await supabase
        .from('mood_shares')
        .upsert(
          { patient_id: patientId, therapist_id: therapistId },
          { onConflict: 'patient_id,therapist_id' },
        );
      if (error) throw error;

      res.status(201).json({ success: true });
    } catch (error) {
      console.error('shareWithTherapist error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  // DELETE /api/v1/mood/share/:therapistId
  async revokeShare(req, res) {
    try {
      const patientId = req.user?.id;
      const { therapistId } = req.params;
      if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      if (!supabase) return res.status(500).json({ success: false, error: 'DB unavailable' });

      const { error } = await supabase
        .from('mood_shares')
        .delete()
        .eq('patient_id', patientId)
        .eq('therapist_id', therapistId);
      if (error) throw error;

      res.json({ success: true });
    } catch (error) {
      console.error('revokeShare error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  // GET /api/v1/mood/therapists → booked therapists (share candidates) with a
  // `shared` flag so the UI can render toggles.
  async listShareCandidates(req, res) {
    try {
      const patientId = req.user?.id;
      if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      if (!supabase) return res.json({ success: true, data: [] });

      const { data: appts, error } = await supabase
        .from('appointments')
        .select('therapist_id, users:therapist_id (id, display_name, photo_url)')
        .eq('patient_id', patientId);
      if (error) throw error;

      const { data: shares } = await supabase
        .from('mood_shares')
        .select('therapist_id')
        .eq('patient_id', patientId);
      const sharedSet = new Set((shares || []).map((s) => s.therapist_id));

      const seen = new Set();
      const candidates = [];
      for (const a of appts || []) {
        if (!a.therapist_id || seen.has(a.therapist_id)) continue;
        seen.add(a.therapist_id);
        candidates.push({
          therapistId: a.therapist_id,
          displayName: a.users?.display_name ?? 'Therapist',
          photoUrl: a.users?.photo_url ?? '',
          shared: sharedSet.has(a.therapist_id),
        });
      }
      res.json({ success: true, data: candidates });
    } catch (error) {
      console.error('listShareCandidates error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  // GET /api/v1/mood/shares  → therapists this patient currently shares with
  async listShares(req, res) {
    try {
      const patientId = req.user?.id;
      if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      if (!supabase) return res.json({ success: true, data: [] });

      const { data, error } = await supabase
        .from('mood_shares')
        .select('therapist_id, created_at, users:therapist_id (id, display_name, photo_url)')
        .eq('patient_id', patientId);
      if (error) throw error;

      const shares = (data || []).map((r) => ({
        therapistId: r.therapist_id,
        displayName: r.users?.display_name ?? 'Therapist',
        photoUrl: r.users?.photo_url ?? '',
        sharedAt: r.created_at,
      }));
      res.json({ success: true, data: shares });
    } catch (error) {
      console.error('listShares error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};
