const { VideoCommentUseCases } = require('../domain/services/video-comment-usecases');

/**
 * Video Comment Controller - HTTP handlers for /videos/:id/comments
 */
class VideoCommentController {
  constructor() {
    this.useCases = new VideoCommentUseCases();
  }

  async getComments(req, res) {
    try {
      const { id: videoId } = req.params;

      if (!videoId) {
        return res.status(400).json({ success: false, error: 'Video ID is required' });
      }

      const result = await this.useCases.getComments(videoId);
      if (!result.success) return res.status(500).json(result);
      res.json(result);
    } catch (error) {
      console.error('Error in getComments controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async addComment(req, res) {
    try {
      const { id: videoId } = req.params;
      const { content } = req.body;
      // User is derived from the verified token, never trusted from the body.
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (!videoId || !content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: content'
        });
      }

      const result = await this.useCases.addComment({
        videoId,
        userId,
        content: content.trim(),
      });

      if (!result.success) return res.status(500).json(result);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in addComment controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = { VideoCommentController };
