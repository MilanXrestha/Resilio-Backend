const { TherapistRepository } = require('../data/repositories/therapist-repository');

const therapistRepo = new TherapistRepository();

module.exports = {
  async getProfile(req, res) {
    try {
      const { id } = req.params;
      const profile = await therapistRepo.getProfile(id);
      if (!profile) return res.status(404).json({ error: 'Therapist profile not found' });
      
      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto(profile, 'resilio.therapist.TherapistProfile');
        return;
      }
      res.json({ profile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getProfileByUserId(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const profile = await therapistRepo.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Therapist profile not found' });
      
      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto(profile, 'resilio.therapist.TherapistProfile');
        return;
      }
      res.json({ profile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async listProfiles(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      const specialty = req.query.specialty_tag;

      const { therapists, total } = await therapistRepo.listProfiles(specialty, limit, offset);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({ therapists, pagination: { total, limit, offset } }, 'resilio.therapist.ListTherapistsResponse');
        return;
      }
      res.json({ therapists, pagination: { total, limit, offset } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createProfile(req, res) {
    try {
      // Must be a registered user to create a therapist profile
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Usually, user role should be 'therapist'.
      const profile = await therapistRepo.createProfile({
        userId,
        ...req.body
      });

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto(profile, 'resilio.therapist.TherapistProfile');
        return;
      }
      res.status(201).json({ profile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const profile = await therapistRepo.updateProfile(id, req.body);
      
      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto(profile, 'resilio.therapist.TherapistProfile');
        return;
      }
      res.json({ profile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async matchTherapists(req, res) {
    try {
      const {
        specialties = [],          // string[] — multi-select primary concerns
        specialty,                 // string  — legacy single value
        therapeutic_approach = '', // string  — preferred therapy style
        trauma_level = 'none',     // 'none' | 'mild' | 'moderate' | 'severe'
        mood_severity = 0,         // 0-3
        anxiety_severity = 0,      // 0-3
        therapist_preference = 'no_preference',
      } = req.body;

      // Fetch a broader pool to score (up to 50)
      const { therapists: pool } = await therapistRepo.listProfiles(null, 50, 0);

      // Build concern list — merge legacy + new
      const concerns = Array.isArray(specialties) && specialties.length
        ? specialties
        : specialty ? [specialty] : [];

      // Whether client has high trauma needs
      const traumaNeed = trauma_level === 'severe' || trauma_level === 'moderate';
      // Combined severity for urgency-based scoring
      const combinedSeverity = Number(mood_severity) + Number(anxiety_severity);

      const scored = pool.map((t) => {
        let score = 0;

        // ── 1. Specialty match (40 pts) ──────────────────────────────
        // Check specialty field and specialtyTags array
        const specialtyText = (t.specialty || '').toLowerCase();
        const tags = (t.specialtyTags || []).map((s) => s.toLowerCase());
        const matchedConcerns = concerns.filter((c) => {
          const cl = c.toLowerCase();
          return specialtyText.includes(cl) || tags.some((tag) => tag.includes(cl));
        });
        // 40 pts if any match; bonus 5 pts per additional matched concern
        if (matchedConcerns.length > 0) {
          score += 40 + Math.min((matchedConcerns.length - 1) * 5, 15);
        }

        // ── 2. Therapeutic approach match (30 pts) ───────────────────
        if (therapeutic_approach) {
          const approach = therapeutic_approach.toLowerCase();
          if (specialtyText.includes(approach) || tags.some((tag) => tag.includes(approach))) {
            score += 30;
          } else if (approach === 'general counseling') {
            // Any therapist qualifies for general counseling
            score += 15;
          }
        }

        // ── 3. Trauma-informed bonus (10 pts) ────────────────────────
        if (traumaNeed) {
          const isTraumaInformed =
            specialtyText.includes('trauma') ||
            tags.some((tag) => tag.includes('trauma') || tag.includes('ptsd'));
          if (isTraumaInformed) score += 10;
        }

        // ── 4. Experience relevance (10 pts) ─────────────────────────
        // High severity → prefer experienced therapists
        const exp = t.yearsOfExperience || 0;
        if (combinedSeverity >= 4) {
          // Severe cases: reward ≥5 years
          if (exp >= 10) score += 10;
          else if (exp >= 5) score += 7;
          else if (exp >= 2) score += 3;
        } else {
          // Mild/moderate: any experience is fine
          if (exp >= 5) score += 10;
          else if (exp >= 2) score += 6;
          else score += 3;
        }

        // ── 5. Rating & social proof (10 pts) ────────────────────────
        const rating = t.rating || 0;
        const reviews = t.totalReviews || 0;
        if (rating >= 4.5 && reviews >= 5) score += 10;
        else if (rating >= 4.0 && reviews >= 3) score += 7;
        else if (rating >= 3.5) score += 4;

        // ── 6. Verified badge bonus (5 pts) ──────────────────────────
        if (t.isVerified) score += 5;

        return { ...t, _matchScore: score };
      });

      // Sort descending by score, return top 5
      scored.sort((a, b) => b._matchScore - a._matchScore);
      const matches = scored.slice(0, 5).map(({ _matchScore, ...t }) => t);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto(
          { therapists: matches, pagination: { total: matches.length, limit: 5, offset: 0 } },
          'resilio.therapist.ListTherapistsResponse',
        );
        return;
      }
      res.json({ therapists: matches, pagination: { total: matches.length, limit: 5, offset: 0 } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
