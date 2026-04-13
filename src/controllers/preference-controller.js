// Preference Controller - handles preference business logic
const { PreferenceUseCases } = require('../domain/services/preference-usecases');
const { PreferenceRepository } = require('../data/repositories/preference-repository');
const { UserPreferenceRepository } = require('../data/repositories/user-preference-repository');

// Initialize repositories and use cases
const preferenceRepository = new PreferenceRepository();
const userPreferenceRepository = new UserPreferenceRepository();
const preferenceUseCases = new PreferenceUseCases(preferenceRepository, userPreferenceRepository);

module.exports = {
  // GET /api/v1/preferences - Get all available preferences (public)
  async getAllPreferences(req, res) {
    try {
      const preferences = await preferenceUseCases.getAllPreferences();

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const preferencesProto = preferences.map(pref => ({
          id: pref.id || '',
          preferenceId: pref.preferenceId || '',
          preferenceName: pref.preferenceName || '',
          preferenceDescription: pref.preferenceDescription || '',
          preferenceIcon: pref.preferenceIcon || '',
          isSvg: pref.isSvg || false,
          sortOrder: pref.sortOrder || 0,
          isActive: pref.isActive !== false,
        }));

        res.proto({ preferences: preferencesProto }, 'resilio.user.ListPreferencesResponse');
        return;
      }

      res.json({ preferences });
    } catch (error) {
      console.error('Get all preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/preferences/me - Get current user's preferences (protected)
  async getUserPreferences(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userPrefs = await preferenceUseCases.getUserPreferences(userId);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const preferencesProto = userPrefs.map(userPref => ({
          id: userPref.preference.id || '',
          preferenceId: userPref.preference.preferenceId || '',
          preferenceName: userPref.preference.preferenceName || '',
          preferenceDescription: userPref.preference.preferenceDescription || '',
          preferenceIcon: userPref.preference.preferenceIcon || '',
          isSvg: userPref.preference.isSvg || false,
          sortOrder: userPref.preference.sortOrder || 0,
          isActive: userPref.preference.isActive !== false,
        }));

        res.proto({ preferences: preferencesProto }, 'resilio.user.ListPreferencesResponse');
        return;
      }

      res.json({ preferences: userPrefs.map(up => up.preference) });
    } catch (error) {
      console.error('Get user preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /api/v1/preferences/me - Save user preferences (protected)
  async saveUserPreferences(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { preferenceIds } = req.body;

      if (!Array.isArray(preferenceIds)) {
        return res.status(400).json({ error: 'preferenceIds must be an array' });
      }

      let updatedPrefs;
      try {
        updatedPrefs = await preferenceUseCases.saveUserPreferences(userId, preferenceIds);
      } catch (innerErr) {
        if (innerErr.message === 'User not found') {
          return res.status(404).json({ error: 'User not found — sync user first' });
        }
        throw innerErr;
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const preferencesProto = updatedPrefs.map(userPref => ({
          id: userPref.preference.id || '',
          preferenceId: userPref.preference.preferenceId || '',
          preferenceName: userPref.preference.preferenceName || '',
          preferenceDescription: userPref.preference.preferenceDescription || '',
          preferenceIcon: userPref.preference.preferenceIcon || '',
          isSvg: userPref.preference.isSvg || false,
          sortOrder: userPref.preference.sortOrder || 0,
          isActive: userPref.preference.isActive !== false,
        }));

        res.proto({ preferences: preferencesProto }, 'resilio.user.ListPreferencesResponse');
        return;
      }

      res.json({ preferences: updatedPrefs.map(up => up.preference) });
    } catch (error) {
      console.error('Save user preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/preferences/me/completed - Check if user has completed preferences (protected)
  async hasCompletedPreferences(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const completed = await preferenceUseCases.hasCompletedPreferences(userId);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({ completed }, 'resilio.user.PreferenceCompletionStatus');
        return;
      }

      res.json({ completed });
    } catch (error) {
      console.error('Check preferences completion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
