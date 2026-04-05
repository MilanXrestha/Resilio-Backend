const { FavoriteUseCases } = require('../domain/services/favorite-usecases');

/**
 * Favorite Controller - HTTP request handlers
 */
class FavoriteController {
  constructor() {
    this.favoriteUseCases = new FavoriteUseCases();
  }

  async addFavorite(req, res) {
    try {
      const { user_id, content_id, content_type } = req.body;

      if (!user_id || !content_id || !content_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id, content_id, content_type'
        });
      }

      const result = await this.favoriteUseCases.addFavorite({
        userId: user_id,
        contentId: content_id,
        contentType: content_type
      });

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in addFavorite controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async removeFavorite(req, res) {
    try {
      const { user_id, content_id, content_type } = req.body;

      if (!user_id || !content_id || !content_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id, content_id, content_type'
        });
      }

      const result = await this.favoriteUseCases.removeFavorite({
        userId: user_id,
        contentId: content_id,
        contentType: content_type
      });

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in removeFavorite controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async getFavorites(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = await this.favoriteUseCases.getFavorites(userId);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getFavorites controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async checkFavoriteStatus(req, res) {
    try {
      const { user_id, content_id, content_type } = req.query;

      if (!user_id || !content_id || !content_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameters'
        });
      }

      const result = await this.favoriteUseCases.isFavorited({
        userId: user_id,
        contentId: content_id,
        contentType: content_type
      });

      res.json(result);
    } catch (error) {
      console.error('Error in checkFavoriteStatus controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = { FavoriteController };
