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
      const { primary_concern, preferred_activities } = req.body;
      // In a real app, logic would use embeddings or complex matching.
      // Here, we just filter by the primary concern as a 'specialty_tag'
      const { therapists, total } = await therapistRepo.listProfiles(primary_concern, 3, 0);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({ therapists, pagination: { total, limit: 3, offset: 0 } }, 'resilio.therapist.ListTherapistsResponse');
        return;
      }
      res.json({ therapists, pagination: { total, limit: 3, offset: 0 } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
