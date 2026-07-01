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
      const { content_id, content_type } = req.body;
      // User is taken from the verified token, never the request body.
      const user_id = req.user?.id;

      if (!user_id || !content_id || !content_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: content_id, content_type'
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
      const { content_id, content_type } = req.body;
      const user_id = req.user?.id;

      if (!user_id || !content_id || !content_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: content_id, content_type'
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
      // Always the authenticated user — the :userId route param is ignored so
      // a client can't read another user's favorites.
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
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
      const { content_id, content_type } = req.query;
      const user_id = req.user?.id;

      if (!user_id || !content_id || !content_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameters: content_id, content_type'
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
