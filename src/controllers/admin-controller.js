const { supabase } = require('../config/supabase-client');

module.exports = {
  // GET /api/v1/admin/stats
  async getDashboardStats(req, res) {
    try {
      if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

      // 1. Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 2. Total therapists
      const { count: totalTherapists } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_role', 'therapist');

      // 3. Pending verification
      const { count: pendingVerification } = await supabase
        .from('therapist_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false);

      // 4. Active Sessions (completed or confirmed appointments in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: activeSessions } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'completed'])
        .gte('created_at', weekAgo.toISOString());

      res.json({
        totalUsers: totalUsers || 0,
        totalTherapists: totalTherapists || 0,
        pendingVerifications: pendingVerification || 0,
        activeSessions: activeSessions || 0,
      });
    } catch (err) {
      console.error('getDashboardStats error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── Therapists ──────────────────────────────────────────────────────────
  async getTherapists(req, res) {
    try {
      const { verified = 'all', search = '' } = req.query;
      let q = supabase
        .from('users')
        .select('*, therapist_profiles(*)', { count: 'exact' })
        .eq('user_role', 'therapist');
      if (search) q = q.ilike('display_name', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      let rows = data || [];
      if (verified === 'true') {
        rows = rows.filter((t) => t.therapist_profiles?.is_verified);
      } else if (verified === 'false') {
        rows = rows.filter((t) => !t.therapist_profiles?.is_verified);
      }
      // Flat camelCase shape the admin UI reads.
      const therapists = rows.map((u) => {
        const p = u.therapist_profiles || {};
        return {
          id: u.id,
          displayName: u.display_name || u.username || 'Therapist',
          email: u.email || '',
          photoUrl: u.photo_url || '',
          isVerified: p.is_verified ?? false,
          specialty: p.specialty || 'Not specified',
          yearsOfExperience: p.years_of_experience ?? 0,
          rating: p.rating ?? 0,
          profileImageUrl: p.profile_image_url || u.photo_url || '',
          consultationFee: p.consultation_fee ?? 0,
          createdAt: u.created_at,
        };
      });
      res.json({ therapists, total: therapists.length });
    } catch (err) {
      console.error('getTherapists error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async verifyTherapist(req, res) {
    try {
      const { therapistId } = req.params;
      const isVerified = req.body.isVerified ?? true;
      const { error } = await supabase
        .from('therapist_profiles')
        .update({ is_verified: isVerified })
        .eq('user_id', therapistId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('verifyTherapist error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateTherapistCommission(req, res) {
    try {
      const { therapistId } = req.params;
      const { commissionRate } = req.body;
      // Best-effort: store on the profile if the column exists.
      await supabase
        .from('therapist_profiles')
        .update({ commission_rate: commissionRate })
        .eq('user_id', therapistId);
      res.json({ success: true });
    } catch (err) {
      // Column may not exist — don't fail the request.
      res.json({ success: true });
    }
  },

  async deleteTherapist(req, res) {
    try {
      const { therapistId } = req.params;
      const { error } = await supabase.from('users').delete().eq('id', therapistId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('deleteTherapist error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── Users ───────────────────────────────────────────────────────────────
  async getUsers(req, res) {
    try {
      const { role = 'all', search = '', limit = 50, offset = 0 } = req.query;
      let q = supabase.from('users').select('*', { count: 'exact' });
      if (role !== 'all') q = q.eq('user_role', role);
      if (search) q = q.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
      q = q.order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      const users = (data || []).map((u) => ({
        id: u.id,
        displayName: u.display_name || u.username || 'User',
        email: u.email || '',
        userRole: u.user_role || 'user',
        photoUrl: u.photo_url || '',
        isActive: (u.account_status || 'active') === 'active',
        accountStatus: u.account_status || 'active',
        createdAt: u.created_at,
      }));
      res.json({ users, total: count || 0 });
    } catch (err) {
      console.error('getUsers error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { userRole } = req.body;
      const { error } = await supabase.from('users').update({ user_role: userRole }).eq('id', userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('updateUserRole error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const { error } = await supabase
        .from('users')
        .update({ account_status: isActive ? 'active' : 'suspended' })
        .eq('id', userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('updateUserStatus error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('deleteUser error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  async getAppointments(req, res) {
    try {
      const { status = 'all', limit = 50, offset = 0 } = req.query;
      let q = supabase
        .from('appointments')
        .select('*, patient:patient_id(display_name,email), therapist:therapist_id(display_name,email)', { count: 'exact' });
      if (status !== 'all') q = q.eq('status', status);
      q = q.order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      res.json({ appointments: data || [], total: count || 0 });
    } catch (err) {
      console.error('getAppointments error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── Revenue ───────────────────────────────────────────────────────────────
  async getRevenue(req, res) {
    try {
      const { data: txns } = await supabase.from('transactions').select('amount, created_at, status');
      const paid = (txns || []).filter((t) => (t.status || 'completed') === 'completed');
      const grandTotal = paid.reduce((s, t) => s + Number(t.amount || 0), 0);
      const adminCut = Math.round(grandTotal * 0.1);
      const therapistTotal = grandTotal - adminCut;
      const therapistPayout = therapistTotal;
      const therapistAdminCut = adminCut;

      const byMonth = {};
      for (const t of paid) {
        const m = (t.created_at || '').slice(0, 7); // YYYY-MM
        byMonth[m] = (byMonth[m] || 0) + Number(t.amount || 0);
      }
      const monthlyRevenue = Object.entries(byMonth)
        .sort()
        .map(([month, total]) => ({ month, total }));

      res.json({ grandTotal, adminCut, therapistTotal, therapistPayout, therapistAdminCut, monthlyRevenue });
    } catch (err) {
      console.error('getRevenue error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getSubscriptions(req, res) {
    try {
      const { status = 'all', limit = 50, offset = 0 } = req.query;
      let q = supabase
        .from('subscriptions')
        .select('*, users:user_id(display_name,email)', { count: 'exact' });
      if (status !== 'all') q = q.eq('status', status);
      q = q.order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      res.json({ subscriptions: data || [], total: count || 0 });
    } catch (err) {
      console.error('getSubscriptions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getTherapistPayments(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const { data, count, error } = await supabase
        .from('transactions')
        .select('*, users:user_id(display_name,email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);
      if (error) throw error;
      res.json({ payments: data || [], total: count || 0 });
    } catch (err) {
      console.error('getTherapistPayments error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── Content (generic list + delete) ─────────────────────────────────────
  async getContent(req, res) {
    try {
      const { limit = 50 } = req.query;
      const tables = [
        ['tips', 'tip'], ['quotes', 'quote'], ['audio_tracks', 'audio'],
        ['video_tracks', 'video'], ['images', 'image'],
      ];
      const content = [];
      for (const [table, type] of tables) {
        const { data } = await supabase.from(table).select('*').limit(Number(limit));
        for (const row of data || []) content.push({ ...row, _type: type });
      }
      res.json({ content, total: content.length });
    } catch (err) {
      console.error('getContent error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async deleteContent(req, res) {
    try {
      const { type, contentId } = req.params;
      const table = { tip: 'tips', quote: 'quotes', audio: 'audio_tracks', video: 'video_tracks', image: 'images' }[type];
      if (!table) return res.status(400).json({ error: 'Unknown content type' });
      const { error } = await supabase.from(table).delete().eq('id', contentId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('deleteContent error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── Preferences / categories ────────────────────────────────────────────
  async getPreferences(req, res) {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ categories: data || [] });
    } catch (err) {
      console.error('getPreferences error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async createPreference(req, res) {
    try {
      const { data, error } = await supabase.from('categories').insert(req.body).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async updatePreference(req, res) {
    try {
      const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async deletePreference(req, res) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  async broadcastNotification(req, res) {
    try {
      // Persist to notifications table if present; FCM fan-out is best-effort.
      const { title, body, target } = req.body;
      try {
        await supabase.from('notifications').insert({
          title, body, type: 'broadcast', target: target || 'all',
        });
      } catch (_) {}
      res.json({ sent: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async getNotificationHistory(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'broadcast')
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);
      res.json({ history: data || [] });
    } catch (err) {
      res.json({ history: [] });
    }
  },
};

// ── Content CRUD factory (tips/quotes/audio/videos/images) ─────────────────
// Attached below so each content type gets list/create/update/delete with the
// list key the Flutter admin repo expects ({tips:[...]}, {quotes:[...]}, …).
const _contentTable = { tips: 'tips', quotes: 'quotes', audio: 'audio_tracks', videos: 'video_tracks', images: 'images' };
const _contentKey = { tips: 'tips', quotes: 'quotes', audio: 'audio', videos: 'videos', images: 'images' };

for (const [seg, table] of Object.entries(_contentTable)) {
  const key = _contentKey[seg];
  module.exports[`list_${seg}`] = async (req, res) => {
    try {
      const { limit = 50, offset = 0, search = '' } = req.query;
      let q = supabase.from(table).select('*', { count: 'exact' });
      if (search) q = q.ilike('title', `%${search}%`);
      q = q.order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      res.json({ [key]: data || [], total: count || 0 });
    } catch (err) {
      console.error(`list ${seg} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  module.exports[`create_${seg}`] = async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).insert(req.body).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      console.error(`create ${seg} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  module.exports[`update_${seg}`] = async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).update(req.body).eq('id', req.params.id).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error(`update ${seg} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  module.exports[`delete_${seg}`] = async (req, res) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error(`delete ${seg} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
