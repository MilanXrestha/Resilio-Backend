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
};
