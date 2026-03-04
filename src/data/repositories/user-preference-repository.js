const { supabase } = require('../../config/supabase-client');

/**
 * User Preference Repository - Handles user preferences with their details
 */
class UserPreferenceRepository {
  /**
   * Resolve the database UUID for a user.
   * Accepts: Database UUID, SuperTokens UID, or Firebase UID.
   * @private
   */
  async _resolveDbUserId(userId) {
    if (!supabase) return null;

    // Try direct UUID match first (database primary key)
    const { data: byId, error: idError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (byId && !idError) {
      console.log('User resolved by DB id:', byId.id);
      return byId.id;
    }

    // Try SuperTokens UID lookup
    const { data: bySuperTokens, error: stError } = await supabase
      .from('users')
      .select('id')
      .eq('supertokens_uid', userId)
      .single();

    if (bySuperTokens && !stError) {
      console.log('User resolved by SuperTokens UID:', bySuperTokens.id);
      return bySuperTokens.id;
    }

    // Fall back to Firebase UID lookup
    const { data: byFirebase, error: fbError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', userId)
      .single();

    if (byFirebase && !fbError) {
      console.log('User resolved by Firebase UID:', byFirebase.id);
      return byFirebase.id;
    }

    console.log('User not found for ID:', userId);
    return null;
  }

  /**
   * Get user's preferences with details
   * @param {string} userId - DB UUID, SuperTokens UID, or Firebase UID
   * @returns {Promise<Array>}
   */
  async getUserPreferencesWithDetails(userId) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return [];
      }

      const dbUserId = await this._resolveDbUserId(userId);
      if (!dbUserId) {
        console.error('User not found:', userId);
        return [];
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select(`
          *,
          preference:preferences(*)
        `)
        .eq('user_id', dbUserId);

      if (error) throw error;

      return data.map(this._mapToUserPreferenceWithDetails);
    } catch (error) {
      console.error('UserPreferenceRepository.getUserPreferencesWithDetails error:', error);
      throw error;
    }
  }

  /**
   * Save user preferences (replaces all existing preferences)
   * @param {string} userId - User ID (DB UUID, SuperTokens UID, or Firebase UID)
   * @param {string[]} preferenceIds - Array of preference IDs to save
   * @returns {Promise<Array>} Updated user preferences
   */
  async saveUserPreferences(userId, preferenceIds) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return [];
      }

      const dbUserId = await this._resolveDbUserId(userId);
      if (!dbUserId) {
        console.error('User not found:', userId);
        throw new Error('User not found');
      }

      console.log('Saving preferences for DB user:', dbUserId, 'preferences:', preferenceIds);

      // Delete all existing preferences for the user
      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', dbUserId);

      if (deleteError) throw deleteError;

      // If no preferences to save, return empty array
      if (preferenceIds.length === 0) {
        return [];
      }

      // Insert new preferences
      const inserts = preferenceIds.map(preferenceId => ({
        user_id: dbUserId,
        preference_id: preferenceId,
      }));

      const { data, error } = await supabase
        .from('user_preferences')
        .insert(inserts)
        .select(`
          *,
          preference:preferences(*)
        `);

      if (error) throw error;

      console.log('✓ Saved', data.length, 'preferences for user:', dbUserId);

      return data.map(this._mapToUserPreferenceWithDetails);
    } catch (error) {
      console.error('UserPreferenceRepository.saveUserPreferences error:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed preferences
   * @param {string} userId - DB UUID, SuperTokens UID, or Firebase UID
   * @returns {Promise<boolean>}
   */
  async hasUserPreferences(userId) {
    try {
      if (!supabase) return false;

      const dbUserId = await this._resolveDbUserId(userId);
      if (!dbUserId) return false;

      const { count, error } = await supabase
        .from('user_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', dbUserId);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('UserPreferenceRepository.hasUserPreferences error:', error);
      return false;
    }
  }

  /**
   * Map database row to user preference with details
   * @private
   */
  _mapToUserPreferenceWithDetails(dbRow) {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      preferenceId: dbRow.preference_id,
      createdAt: new Date(dbRow.created_at),
      preference: {
        id: dbRow.preference.id,
        preferenceId: dbRow.preference.preference_id,
        preferenceName: dbRow.preference.preference_name,
        preferenceDescription: dbRow.preference.preference_description,
        preferenceIcon: dbRow.preference.preference_icon,
        isSvg: dbRow.preference.is_svg,
        sortOrder: dbRow.preference.sort_order,
        isActive: dbRow.preference.is_active,
      },
    };
  }
}

module.exports = { UserPreferenceRepository };