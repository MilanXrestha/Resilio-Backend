const { supabase } = require('../config/supabase-client');

module.exports = {
  // POST /api/v1/games/session
  async saveGameSession(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      let payload = Buffer.isBuffer(req.body) ? req.body : req.body;
      const gameType = payload.gameType || payload.game_type;
      const durationSeconds = payload.durationSeconds || payload.duration_seconds || 0;
      const score = payload.score || 0;
      const metadataStr = payload.metadata;
      
      let metadataObj = null;
      if (metadataStr) {
        try { metadataObj = JSON.parse(metadataStr); } catch (e) { }
      }

      if (!gameType) return res.status(400).json({ error: 'gameType required' });

      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert([{
          user_id: userId,
          game_type: gameType,
          duration_seconds: durationSeconds,
          score: score,
          metadata: metadataObj
        }])
        .select()
        .single();

      if (error) throw error;

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({
          id: session.id,
          userId: session.user_id,
          gameType: session.game_type,
          startTime: session.start_time,
          endTime: session.end_time || '',
          durationSeconds: session.duration_seconds,
          score: session.score,
          metadata: session.metadata ? JSON.stringify(session.metadata) : '',
          createdAt: session.created_at
        }, 'resilio.games.GameSession');
        return;
      }
      res.json({ session });
    } catch (error) {
      console.error('Save game session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /api/v1/games/mood
  async saveMoodEntry(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      let payload = req.body;
      const moodScore = payload.moodScore || payload.mood_score;
      const moodLabel = payload.moodLabel || payload.mood_label || '';
      const note = payload.note || '';
      
      // Use provided date or today local date YYYY-MM-DD
      const entryDate = payload.entryDate || payload.entry_date || new Date().toISOString().split('T')[0];

      if (!moodScore) return res.status(400).json({ error: 'moodScore required' });

      // Upsert logic for mood: one per day
      const { data: existing } = await supabase
        .from('mood_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('entry_date', entryDate)
        .single();

      let entry;
      if (existing) {
        const { data, error } = await supabase
          .from('mood_entries')
          .update({
            mood_score: moodScore,
            mood_label: moodLabel,
            note: note,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        entry = data;
      } else {
        const { data, error } = await supabase
          .from('mood_entries')
          .insert([{
            user_id: userId,
            mood_score: moodScore,
            mood_label: moodLabel,
            note: note,
            entry_date: entryDate
          }])
          .select()
          .single();
        if (error) throw error;
        entry = data;
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({
          id: entry.id,
          userId: entry.user_id,
          moodScore: entry.mood_score,
          moodLabel: entry.mood_label || '',
          note: entry.note || '',
          entryDate: entry.entry_date,
          createdAt: entry.created_at
        }, 'resilio.games.MoodEntry');
        return;
      }
      res.json({ entry });

    } catch (error) {
      console.error('Save mood error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/games/mood
  async listMoodEntries(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const fromDate = req.query.from_date || req.query.fromDate;
      const toDate = req.query.to_date || req.query.toDate;

      let query = supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId);

      if (fromDate) query = query.gte('entry_date', fromDate);
      if (toDate) query = query.lte('entry_date', toDate);

      const { data: entries, error } = await query;
      if (error) throw error;

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const protoEntries = (entries || []).map(e => ({
          id: e.id,
          userId: e.user_id,
          moodScore: e.mood_score,
          moodLabel: e.mood_label || '',
          note: e.note || '',
          entryDate: e.entry_date,
          createdAt: e.created_at
        }));
        res.proto({ entries: protoEntries }, 'resilio.games.ListMoodEntriesResponse');
        return;
      }
      res.json({ entries });
    } catch (error) {
      console.error('List mood entries error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/games/achievements
  async listUserAchievements(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { data: uas, error } = await supabase
        .from('user_achievements')
        .select(`
          id,
          user_id,
          achievement_id,
          unlocked_at,
          achievements (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const protos = (uas || []).map(ua => ({
          id: ua.id,
          userId: ua.user_id,
          achievementId: ua.achievement_id,
          unlockedAt: ua.unlocked_at,
          achievement: ua.achievements ? {
            id: ua.achievements.id,
            code: ua.achievements.code,
            name: ua.achievements.name,
            description: ua.achievements.description,
            iconUrl: ua.achievements.icon_url || '',
            requirementType: ua.achievements.requirement_type,
            requirementValue: ua.achievements.requirement_value,
          } : null
        }));
        res.proto({ achievements: protos }, 'resilio.games.ListUserAchievementsResponse');
        return;
      }
      res.json({ achievements: uas });
    } catch (error) {
       console.error('List achievements error:', error);
       res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/games/achievements/all — every achievement definition, wrapped
  // as UserAchievement entries (so the client can render locked + unlocked).
  async listAllAchievements(req, res) {
    try {
      const { data: achs, error } = await supabase
        .from('achievements')
        .select('*');
      if (error) throw error;

      const protos = (achs || []).map(a => ({
        id: '',
        userId: '',
        achievementId: a.id,
        unlockedAt: '',
        achievement: {
          id: a.id,
          code: a.code,
          name: a.name,
          description: a.description,
          iconUrl: a.icon_url || '',
          requirementType: a.requirement_type,
          requirementValue: a.requirement_value,
        },
      }));

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({ achievements: protos }, 'resilio.games.ListUserAchievementsResponse');
        return;
      }
      res.json({ achievements: protos });
    } catch (error) {
      console.error('List all achievements error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /api/v1/games/affirmations
  async saveAffirmation(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      let payload = req.body;
      const text = payload.text;
      const bgColor = payload.backgroundColor || payload.background_color || '';
      const iconName = payload.iconName || payload.icon_name || '';

      if (!text) return res.status(400).json({ error: 'text required' });

      const { data: aff, error } = await supabase
        .from('affirmations')
        .insert([{
          user_id: userId,
          text: text,
          background_color: bgColor,
          icon_name: iconName
        }])
        .select()
        .single();
      
      if (error) throw error;

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({
          id: aff.id,
          userId: aff.user_id,
          text: aff.text,
          backgroundColor: aff.background_color || '',
          iconName: aff.icon_name || '',
          createdAt: aff.created_at
        }, 'resilio.games.Affirmation');
        return;
      }
      res.json({ affirmation: aff });
    } catch (error) {
      console.error('Save affirmation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/games/affirmations
  async listAffirmations(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { data: affs, error } = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const protos = (affs || []).map(aff => ({
           id: aff.id,
           userId: aff.user_id,
           text: aff.text,
           backgroundColor: aff.background_color || '',
           iconName: aff.icon_name || '',
           createdAt: aff.created_at
        }));
        res.proto({ affirmations: protos }, 'resilio.games.ListAffirmationsResponse');
        return;
      }
      res.json({ affirmations: affs });
    } catch(err) {
      console.error('List affirmations error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // DELETE /api/v1/games/affirmations/:id
  async deleteAffirmation(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      const affId = req.params.id;
      if (!affId) return res.status(400).json({ error: 'id required' });
      
      const { error } = await supabase
        .from('affirmations')
        .delete()
        .eq('id', affId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({}, 'resilio.common.Empty');
        return;
      }
      res.json({ success: true });
    } catch(err) {
      console.error('Delete affirmation error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/games/quiz-questions
  async listQuizQuestions(req, res) {
    try {
      if (!supabase) return res.json({ questions: [] });
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      const questions = (data || []).map(q => ({
        id: q.id,
        question: q.question,
        options: q.options || [],
        correct_option_index: q.correct_option_index ?? 0,
        explanation: q.explanation || '',
        category: q.category || 'general',
        difficulty: q.difficulty ?? 1,
      }));
      res.json({ questions });
    } catch (err) {
      console.error('List quiz questions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/games/affirmation-puzzles
  async listAffirmationPuzzles(req, res) {
    try {
      if (!supabase) return res.json({ puzzles: [] });
      const { data, error } = await supabase
        .from('affirmation_puzzles')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      const puzzles = (data || []).map(p => ({
        id: p.id,
        text: p.text,
        words: p.words || [],
        background_color: p.background_color || '0xFF6A5ACD',
        icon_name: p.icon_name || 'favorite',
        category: p.category || 'general',
        difficulty: p.difficulty ?? 1,
        created_at: p.created_at,
      }));
      res.json({ puzzles });
    } catch (err) {
      console.error('List affirmation puzzles error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
