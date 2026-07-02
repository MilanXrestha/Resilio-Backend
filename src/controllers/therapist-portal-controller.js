// therapist-portal-controller.js
// Comprehensive therapist-facing portal endpoints
// All routes require authMiddleware + therapist role

const { supabase } = require('../config/supabase-client');
const { fcmService } = require('../services/fcm-service');
const { NotificationService } = require('../services/notification-service');
const { TipsRepository } = require('../data/repositories/tips-repository');
const { QuoteRepository } = require('../data/repositories/quote-repository');
const { VideoRepository } = require('../data/repositories/video-repository');
const { AudioRepository } = require('../data/repositories/audio-repository');

const tipsRepo = new TipsRepository();
const quoteRepo = new QuoteRepository();
const videoRepo = new VideoRepository();
const audioRepo = new AudioRepository();

// ─── Helper: enforce therapist role ──────────────────────────────────────────
function requireTherapist(req, res) {
  if (!req.user || req.user.role !== 'therapist') {
    res.status(403).json({ error: 'Forbidden: therapist access only' });
    return false;
  }
  return true;
}

// ─── Helper: map appointment row ─────────────────────────────────────────────
function mapAppointment(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    therapistId: row.therapist_id,
    scheduledTime: row.scheduled_time,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentTransactionId: row.payment_transaction_id,
    meetingRoomId: row.meeting_room_id,
    price: row.price || 0,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Joined patient info
    patient: row.patient_profile
      ? {
          id: row.patient_profile.id,
          displayName: row.patient_profile.display_name || row.patient_profile.username || (row.patient_profile.email ? row.patient_profile.email.split('@')[0] : 'Unknown'),
          email: row.patient_profile.email,
          profilePictureUrl: row.patient_profile.profile_picture_url,
          fcmToken: row.patient_profile.fcm_token,
        }
      : null,
  };
}

module.exports = {
  // ── 1. Dashboard Stats ──────────────────────────────────────────────────────
  // GET /api/v1/therapist-portal/dashboard
  async getDashboardStats(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      // Today's sessions
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .gte('scheduled_time', startOfDay)
        .lte('scheduled_time', endOfDay);

      // Pending requests
      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .eq('status', 'pending');

      // Total unique patients (anyone who has had any appointment)
      const { data: patientRows } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('therapist_id', therapistId)
        .in('status', ['pending', 'confirmed', 'completed']);
      const uniquePatients = new Set((patientRows || []).map((r) => r.patient_id)).size;

      // Weekly earnings (sum of price for confirmed/completed this week)
      const { data: weeklyAppts } = await supabase
        .from('appointments')
        .select('price')
        .eq('therapist_id', therapistId)
        .in('status', ['confirmed', 'completed'])
        .gte('scheduled_time', startOfWeek.toISOString());
      const weeklyEarnings = (weeklyAppts || []).reduce((sum, a) => sum + (a.price || 0), 0);

      // All-time earnings
      const { data: allAppts } = await supabase
        .from('appointments')
        .select('price')
        .eq('therapist_id', therapistId)
        .in('status', ['confirmed', 'completed']);
      const totalEarnings = (allAppts || []).reduce((sum, a) => sum + (a.price || 0), 0);

      // Session volume last 7 days (for chart)
      const { data: chartRows } = await supabase
        .from('appointments')
        .select('scheduled_time')
        .eq('therapist_id', therapistId)
        .in('status', ['confirmed', 'completed'])
        .gte('scheduled_time', startOfWeek.toISOString());

      // Build per-day counts
      const dayCounts = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dayCounts[key] = 0;
      }
      (chartRows || []).forEach((r) => {
        const key = r.scheduled_time?.split('T')[0];
        if (key && dayCounts[key] !== undefined) dayCounts[key]++;
      });
      const sessionChart = Object.entries(dayCounts).map(([date, count]) => ({ date, count }));

      // Next appointment today
      const { data: nextRows } = await supabase
        .from('appointments')
        .select('*, patient_profile:users!patient_id(id, display_name, username, profile_picture_url, email, fcm_token)')
        .eq('therapist_id', therapistId)
        .gte('scheduled_time', new Date().toISOString())
        .in('status', ['confirmed', 'pending'])
        .order('scheduled_time', { ascending: true })
        .limit(1);

      const nextAppointment = nextRows?.[0] ? mapAppointment(nextRows[0]) : null;

      res.json({
        todaySessions: todayCount || 0,
        pendingRequests: pendingCount || 0,
        totalPatients: uniquePatients,
        weeklyEarnings,
        totalEarnings,
        sessionChart,
        nextAppointment,
      });
    } catch (err) {
      console.error('getDashboardStats error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 2. List Appointments ────────────────────────────────────────────────────
  // GET /api/v1/therapist-portal/appointments?status=pending&date=today
  async getAppointments(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;
    const { status, date } = req.query;

    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('therapist_id', therapistId)
        .order('scheduled_time', { ascending: true });

      if (status) query = query.eq('status', status);

      if (date === 'today') {
        const now = new Date();
        const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        query = query.gte('scheduled_time', start).lte('scheduled_time', end);
      } else if (date === 'upcoming') {
        query = query.gte('scheduled_time', new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch patient profiles separately to avoid FK join issues
      const patientIds = [...new Set((data || []).map((r) => r.patient_id).filter(Boolean))];
      let patientMap = {};
      if (patientIds.length > 0) {
        const { data: patients } = await supabase
          .from('users')
          .select('id, display_name, username, profile_picture_url, email, fcm_token')
          .in('id', patientIds);
        (patients || []).forEach((p) => { patientMap[p.id] = p; });
      }

      res.json({
        appointments: (data || []).map((row) =>
          mapAppointment({ ...row, patient_profile: patientMap[row.patient_id] || null })
        ),
      });
    } catch (err) {
      console.error('getAppointments error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 3. Update Appointment Status ────────────────────────────────────────────
  // PATCH /api/v1/therapist-portal/appointments/:id/status
  // Body: { status: 'confirmed' | 'cancelled' | 'completed' }
  async updateAppointmentStatus(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['confirmed', 'cancelled', 'completed', 'no_show'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    try {
      // Verify ownership
      const { data: existing } = await supabase
        .from('appointments')
        .select('*, patient_profile:users!patient_id(id, display_name, username, fcm_token)')
        .eq('id', id)
        .eq('therapist_id', therapistId)
        .single();

      if (!existing) return res.status(404).json({ error: 'Appointment not found' });

      const { data, error } = await supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Send FCM to patient
      const patient = existing.patient_profile;
      if (patient?.fcm_token) {
        const titles = {
          confirmed: 'Session Confirmed! ✅',
          cancelled: 'Session Cancelled',
          completed: 'Session Completed',
        };
        const bodies = {
          confirmed: `Your session on ${new Date(existing.scheduled_time).toLocaleString()} has been confirmed by your therapist.`,
          cancelled: `Your session on ${new Date(existing.scheduled_time).toLocaleString()} was cancelled.`,
          completed: 'Your therapy session has been marked as complete. Take care!',
        };
        if (titles[status]) {
          await fcmService.sendToToken(patient.fcm_token, titles[status], bodies[status], {
            appointmentId: id,
            action: status === 'confirmed' ? 'APPOINTMENT_CONFIRMED' : 'APPOINTMENT_UPDATED',
          });
        }
      }

      // Persist notification
      if (patient?.id && status === 'confirmed') {
        await NotificationService.create({
          userId: patient.id,
          title: 'Session Confirmed! ✅',
          body: `Your session has been confirmed for ${new Date(existing.scheduled_time).toLocaleString()}.`,
          type: 'appointment_confirmed',
          actionType: 'OPEN_APPOINTMENT',
          actionPayload: { appointmentId: id },
        });
      }

      res.json({ appointment: mapAppointment({ ...data, patient_profile: patient }) });
    } catch (err) {
      console.error('updateAppointmentStatus error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 4. Get Patients ─────────────────────────────────────────────────────────
  // GET /api/v1/therapist-portal/patients
  async getPatients(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('patient_id, scheduled_time, status')
        .eq('therapist_id', therapistId)
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      // Fetch patient profiles separately to avoid FK join issues
      const patientIds = [...new Set((data || []).map((r) => r.patient_id).filter(Boolean))];
      let profileMap = {};
      if (patientIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, username, profile_picture_url, email')
          .in('id', patientIds);
        (users || []).forEach((u) => { profileMap[u.id] = u; });
      }

      // Aggregate per-patient
      const patientMap = {};
      (data || []).forEach((row) => {
        const pid = row.patient_id;
        const profile = profileMap[pid];
        if (!patientMap[pid]) {
          patientMap[pid] = {
            id: pid,
            displayName: profile?.display_name || profile?.username || (profile?.email ? profile.email.split('@')[0] : 'Unknown'),
            email: profile?.email || '',
            profilePictureUrl: profile?.profile_picture_url || null,
            sessionCount: 0,
            lastSessionDate: null,
          };
        }
        patientMap[pid].sessionCount++;
        if (!patientMap[pid].lastSessionDate || row.scheduled_time > patientMap[pid].lastSessionDate) {
          patientMap[pid].lastSessionDate = row.scheduled_time;
        }
      });

      res.json({ patients: Object.values(patientMap) });
    } catch (err) {
      console.error('getPatients error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 5. Get Earnings ─────────────────────────────────────────────────────────
  // GET /api/v1/therapist-portal/earnings
  async getEarnings(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_time, price, status, patient_profile:users!patient_id(id, display_name, username, email)')
        .eq('therapist_id', therapistId)
        .in('status', ['confirmed', 'completed'])
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      const totalEarnings = rows.reduce((sum, r) => sum + (r.price || 0), 0);

      // This week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEarnings = rows
        .filter((r) => new Date(r.scheduled_time) >= weekStart)
        .reduce((sum, r) => sum + (r.price || 0), 0);

      // This month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEarnings = rows
        .filter((r) => new Date(r.scheduled_time) >= monthStart)
        .reduce((sum, r) => sum + (r.price || 0), 0);

      // Weekly chart — last 8 weeks
      const weeklyChart = [];
      for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekBegin = new Date(weekEnd);
        weekBegin.setDate(weekBegin.getDate() - 7);
        const label = `W${8 - i}`;
        const amount = rows
          .filter((r) => {
            const d = new Date(r.scheduled_time);
            return d >= weekBegin && d < weekEnd;
          })
          .reduce((sum, r) => sum + (r.price || 0), 0);
        weeklyChart.push({ label, amount });
      }

      // Transactions (recent 50)
      const transactions = rows.slice(0, 50).map((r) => ({
        date: r.scheduled_time,
        patientName: r.patient_profile?.display_name || 'Patient',
        amount: r.price || 0,
        status: r.status,
      }));

      res.json({ totalEarnings, weekEarnings, monthEarnings, weeklyChart, transactions });
    } catch (err) {
      console.error('getEarnings error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 6. Get Therapist Portal Profile ────────────────────────────────────────
  // GET /api/v1/therapist-portal/profile
  async getProfile(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;

    try {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id, display_name, username, email, profile_picture_url, fcm_token')
        .eq('id', therapistId)
        .single();

      if (userErr) throw userErr;

      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('user_id', therapistId)
        .single();

      res.json({
        profile: {
          id: user.id,
          displayName: user.display_name || user.username || (user.email ? user.email.split('@')[0] : 'Therapist'),
          email: user.email,
          profilePictureUrl: user.profile_picture_url,
          availabilityJson: profile?.availability_json || {},
          bio: profile?.bio || '',
          specialty: profile?.specialty || '',
          specialtyTags: profile?.specialty_tags || [],
          qualifications: profile?.qualifications || [],
          isVerified: profile?.is_verified || false,
          hourlyRate: profile?.consultation_fee || profile?.hourly_rate || 0,
          yearsExperience: profile?.years_of_experience || profile?.years_experience || 0,
          rating: profile?.rating || 0,
          reviewCount: profile?.total_reviews || profile?.review_count || 0,
        },
      });
    } catch (err) {
      console.error('getProfile error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 7. Update Therapist Portal Profile ─────────────────────────────────────
  // PUT /api/v1/therapist-portal/profile
  async updateProfile(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;
    const { displayName, bio, specialtyTags, hourlyRate, yearsExperience, availabilityJson, profilePictureUrl } = req.body;

    try {
      // Update user record
      const userUpdate = {};
      if (displayName) userUpdate.display_name = displayName;
      if (profilePictureUrl) userUpdate.profile_picture_url = profilePictureUrl;

      if (Object.keys(userUpdate).length > 0) {
        await supabase.from('users').update(userUpdate).eq('id', therapistId);
      }

      // Update therapist_profiles upsert
      const profileUpdate = {};
      if (bio !== undefined) profileUpdate.bio = bio;
      if (specialtyTags !== undefined) profileUpdate.specialty_tags = specialtyTags;
      if (hourlyRate !== undefined) profileUpdate.consultation_fee = hourlyRate;
      if (yearsExperience !== undefined) profileUpdate.years_of_experience = yearsExperience;
      if (availabilityJson !== undefined) profileUpdate.availability_json = availabilityJson;

      if (Object.keys(profileUpdate).length > 0) {
        await supabase
          .from('therapist_profiles')
          .upsert({ user_id: therapistId, ...profileUpdate }, { onConflict: 'user_id' });
      }

      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
      console.error('updateProfile error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 8. Notify Patient of Incoming Call ─────────────────────────────────────
  // POST /api/v1/therapist-portal/call/notify
  // Body: { appointmentId }
  async notifyCall(req, res) {
    if (!requireTherapist(req, res)) return;
    const therapistId = req.user.id;
    const { appointmentId } = req.body;

    if (!appointmentId) return res.status(400).json({ error: 'appointmentId required' });

    try {
      const { data: appt } = await supabase
        .from('appointments')
        .select('*, patient_profile:users!patient_id(id, display_name, fcm_token), therapist:users!therapist_id(display_name)')
        .eq('id', appointmentId)
        .eq('therapist_id', therapistId)
        .single();

      if (!appt) return res.status(404).json({ error: 'Appointment not found' });

      const patientToken = appt.patient_profile?.fcm_token;
      const therapistName = appt.therapist?.display_name || 'Your therapist';

      if (patientToken) {
        await fcmService.sendToToken(
          patientToken,
          `📞 ${therapistName} is calling`,
          'Tap to join your therapy session now.',
          {
            appointmentId,
            roomId: appt.meeting_room_id,
            action: 'INCOMING_CALL',
          }
        );
      }

      // Persist notification for in-app notification center
      if (appt.patient_profile?.id) {
        await NotificationService.create({
          userId: appt.patient_profile.id,
          title: `📞 ${therapistName} is calling`,
          body: 'Tap to join your therapy session now.',
          type: 'incoming_call',
          actionType: 'INCOMING_CALL',
          actionPayload: { appointmentId, roomId: appt.meeting_room_id },
        });
      }

      res.json({ success: true, notified: !!patientToken });
    } catch (err) {
      console.error('notifyCall error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // ── 9. Content CRUD: Tips ───────────────────────────────────────────────────
  async getTips(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const result = await tipsRepo.findAll({});
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async createTip(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const data = {
        ...req.body,
        author: req.user.display_name || 'Therapist',
        createdByUserId: req.user.id,
      };
      const tip = await tipsRepo.create(data);
      res.json({ tip });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async updateTip(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const tip = await tipsRepo.update(req.params.id, req.body);
      res.json({ tip });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async deleteTip(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      await tipsRepo.delete(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ── 10. Content CRUD: Quotes ────────────────────────────────────────────────
  async getQuotes(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const result = await quoteRepo.findAll({});
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async createQuote(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const data = {
        ...req.body,
        author: req.user.display_name || 'Therapist',
        createdByUserId: req.user.id,
      };
      const quote = await quoteRepo.create(data);
      res.json({ quote });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async updateQuote(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const quote = await quoteRepo.update(req.params.id, req.body);
      res.json({ quote });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async deleteQuote(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      await quoteRepo.delete(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ── 11. Content CRUD: Video ─────────────────────────────────────────────────
  async getVideos(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const result = await videoRepo.getVideos({});
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async createVideo(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const data = {
        ...req.body,
        artistName: req.user.display_name || 'Therapist',
        createdByUserId: req.user.id,
      };
      const video = await videoRepo.create(data);
      res.json({ video });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async updateVideo(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const video = await videoRepo.update(req.params.id, req.body);
      res.json({ video });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async deleteVideo(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      await videoRepo.delete(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ── 12. Content CRUD: Audio ─────────────────────────────────────────────────
  async getAudio(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      // Find all audio tracks (just re-using findByCategory with null or default since no global findAll exists)
      // Actually audioRepo.findByCategory doesn't support global nicely. Let's do a direct supabase query to keep it perfectly fast and simple:
      const { data, error } = await supabase.from('audio_tracks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ tracks: data.map(audioRepo._mapToAudioTrack), total: data.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async createAudio(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const data = {
        ...req.body,
        artistName: req.user.display_name || 'Therapist',
        createdByUserId: req.user.id,
      };
      const audio = await audioRepo.create(data);
      res.json({ audio });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async updateAudio(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const audio = await audioRepo.update(req.params.id, req.body);
      res.json({ audio });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  async deleteAudio(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      await audioRepo.delete(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/v1/therapist-portal/patients/:patientId/moods
  // Returns a patient's mood entries ONLY if that patient has shared with the
  // requesting therapist (a mood_shares row exists).
  async getPatientMoods(req, res) {
    if (!requireTherapist(req, res)) return;
    try {
      const therapistId = req.user?.id;
      const { patientId } = req.params;

      const { data: share } = await supabase
        .from('mood_shares')
        .select('id')
        .eq('patient_id', patientId)
        .eq('therapist_id', therapistId)
        .maybeSingle();

      if (!share) {
        return res.status(403).json({ error: 'This patient has not shared their mood logs with you.' });
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', patientId)
        .order('entry_date', { ascending: false })
        .limit(120);
      if (error) throw error;

      res.json({ moods: data || [] });
    } catch (e) {
      console.error('getPatientMoods error:', e);
      res.status(500).json({ error: e.message });
    }
  },
};
