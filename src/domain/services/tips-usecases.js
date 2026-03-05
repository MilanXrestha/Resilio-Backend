/**
 * Tips Use Cases - Business logic for tips
 */
class TipsUseCases {
  constructor(tipsRepository) {
    this.tipsRepository = tipsRepository;
  }

  /**
   * Get featured tips
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of featured tips
   */
  async getFeaturedTips(options) {
    const { limit, preferenceIds, tipType } = options;
    return await this.tipsRepository.findFeatured(limit, preferenceIds, tipType);
  }

  /**
   * Get tip by ID
   * @param {string} tipId - Tip ID
   * @returns {Promise<Object|null>} Tip object or null
   */
  async getTipById(tipId) {
    return await this.tipsRepository.findById(tipId);
  }

  /**
   * List tips with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Object with tips array and total count
   */
  async listTips(filters) {
    return await this.tipsRepository.findAll(filters);
  }

  /**
   * Get tips by type
   * @param {string} tipType - Type of tips to retrieve
   * @param {number} limit - Number of tips to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} Object with tips array and total count
   */
  async getTipsByType(tipType, limit = 20, offset = 0) {
    return await this.tipsRepository.findByType(tipType, limit, offset);
  }

  /**
   * Create a new tip
   * @param {Object} tipData - Tip data
   * @returns {Promise<Object>} Created tip
   */
  async createTip(tipData) {
    return await this.tipsRepository.create(tipData);
  }

  /**
   * Update an existing tip
   * @param {string} tipId - Tip ID
   * @param {Object} tipData - Updated tip data
   * @returns {Promise<Object>} Updated tip
   */
  async updateTip(tipId, tipData) {
    return await this.tipsRepository.update(tipId, tipData);
  }

  /**
   * Delete a tip
   * @param {string} tipId - Tip ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteTip(tipId) {
    return await this.tipsRepository.delete(tipId);
  }
}

module.exports = { TipsUseCases };
