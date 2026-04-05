const { FavoriteRepository } = require('../../data/repositories/favorite-repository');

/**
 * Favorite Use Cases - Business logic layer
 */
class FavoriteUseCases {
  constructor() {
    this.favoriteRepository = new FavoriteRepository();
  }

  /**
   * Add to favorites
   */
  async addFavorite({ userId, contentId, contentType }) {
    try {
      const result = await this.favoriteRepository.addFavorite({ userId, contentId, contentType });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in addFavorite:', error);
      return {
        success: false,
        error: 'Failed to add favorite'
      };
    }
  }

  /**
   * Remove from favorites
   */
  async removeFavorite({ userId, contentId, contentType }) {
    try {
      const success = await this.favoriteRepository.removeFavorite({ userId, contentId, contentType });
      
      return {
        success: true,
        data: { success }
      };
    } catch (error) {
      console.error('Error in removeFavorite:', error);
      return {
        success: false,
        error: 'Failed to remove favorite'
      };
    }
  }

  /**
   * Get user favorites
   */
  async getFavorites(userId) {
    try {
      const favorites = await this.favoriteRepository.getFavorites(userId);
      
      return {
        success: true,
        data: favorites
      };
    } catch (error) {
      console.error('Error in getFavorites:', error);
      return {
        success: false,
        error: 'Failed to fetch favorites',
        data: []
      };
    }
  }

  /**
   * Check favorite status
   */
  async isFavorited({ userId, contentId, contentType }) {
    try {
      const status = await this.favoriteRepository.isFavorited({ userId, contentId, contentType });
      
      return {
        success: true,
        data: { isFavorited: status }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check favorite status',
        data: { isFavorited: false }
      };
    }
  }
}

module.exports = { FavoriteUseCases };
