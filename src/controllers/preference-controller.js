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
          ...pref,
          id: pref.id,
          preferenceId: pref.preferenceId,
          preferenceName: pref.preferenceName,
          preferenceDescription: pref.preferenceDescription,
          preferenceIcon: pref.preferenceIcon,
          isSvg: pref.isSvg,
          sortOrder: pref.sortOrder,
          isActive: pref.isActive,
          createdAt: pref.createdAt.toISOString(),
          updatedAt: pref.updatedAt.toISOString(),
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
          ...userPref.preference,
          id: userPref.preference.id,
          preferenceId: userPref.preference.preferenceId,
          preferenceName: userPref.preference.preferenceName,
          preferenceDescription: userPref.preference.preferenceDescription,
          preferenceIcon: userPref.preference.preferenceIcon,
          isSvg: userPref.preference.isSvg,
          sortOrder: userPref.preference.sortOrder,
          isActive: userPref.preference.isActive,
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

      const updatedPrefs = await preferenceUseCases.saveUserPreferences(userId, preferenceIds);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const preferencesProto = updatedPrefs.map(userPref => ({
          ...userPref.preference,
          id: userPref.preference.id,
          preferenceId: userPref.preference.preferenceId,
          preferenceName: userPref.preference.preferenceName,
          preferenceDescription: userPref.preference.preferenceDescription,
          preferenceIcon: userPref.preference.preferenceIcon,
          isSvg: userPref.preference.isSvg,
          sortOrder: userPref.preference.sortOrder,
          isActive: userPref.preference.isActive,
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
