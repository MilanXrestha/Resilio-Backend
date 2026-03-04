// Preference Use Cases - Business logic for preferences
class PreferenceUseCases {
  constructor(preferenceRepository, userPreferenceRepository) {
    this.preferenceRepository = preferenceRepository;
    this.userPreferenceRepository = userPreferenceRepository;
  }

  /**
   * Get all available preferences
   * @returns {Promise<Array>} Array of preference objects
   */
  async getAllPreferences() {
    return await this.preferenceRepository.getAllPreferences();
  }

  /**
   * Get user's selected preferences
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user preferences with details
   */
  async getUserPreferences(userId) {
    return await this.userPreferenceRepository.getUserPreferencesWithDetails(userId);
  }

  /**
   * Save user preferences (replaces all existing)
   * @param {string} userId - User ID
   * @param {string[]} preferenceIds - Array of preference IDs
   * @returns {Promise<Array>} Updated user preferences
   */
  async saveUserPreferences(userId, preferenceIds) {
    return await this.userPreferenceRepository.saveUserPreferences(userId, preferenceIds);
  }

  /**
   * Check if user has completed preferences
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if user has preferences
   */
  async hasCompletedPreferences(userId) {
    return await this.userPreferenceRepository.hasUserPreferences(userId);
  }
}

module.exports = { PreferenceUseCases };
