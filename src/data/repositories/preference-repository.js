const { supabase } = require('../../config/supabase-client');

/**
 * Preference Repository - Handles database operations for preferences
 */
class PreferenceRepository {
  /**
   * Get all active preferences
   * @returns {Promise<Array>} Array of preference objects
   */
  async getAllPreferences() {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        throw new Error('Database not configured');
      }

      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      return data.map(this._mapToPreference) || [];
    } catch (error) {
      console.error('PreferenceRepository.getAllPreferences error:', error);
      throw error;
    }
  }

  /**
   * Get preference by ID
   * @param {string} id - Preference ID
   * @returns {Promise<Object|null>} Preference object or null
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return this._mapToPreference(data);
    } catch (error) {
      console.error('PreferenceRepository.getById error:', error);
      return null;
    }
  }

  /**
   * Map database row to preference object
   * @private
   */
  _mapToPreference(dbPref) {
    return {
      id: dbPref.id,
      preferenceId: dbPref.preference_id,
      preferenceName: dbPref.preference_name,
      preferenceDescription: dbPref.preference_description,
      preferenceIcon: dbPref.preference_icon,
      isSvg: dbPref.is_svg,
      sortOrder: dbPref.sort_order,
      isActive: dbPref.is_active,
      createdAt: new Date(dbPref.created_at),
      updatedAt: new Date(dbPref.updated_at),
    };
  }
}

module.exports = { PreferenceRepository };
