const { VideoCommentRepository } = require('../../data/repositories/video-comment-repository');

/**
 * Video Comment Use Cases - business logic layer.
 */
class VideoCommentUseCases {
  constructor() {
    this.repository = new VideoCommentRepository();
  }

  async getComments(videoId) {
    try {
      const comments = await this.repository.getByVideo(videoId);
      return { success: true, data: comments };
    } catch (error) {
      console.error('Error fetching video comments:', error);
      return { success: false, error: 'Failed to fetch comments', data: [] };
    }
  }

  async addComment({ videoId, userId, content }) {
    try {
      const comment = await this.repository.add({ videoId, userId, content });
      return { success: true, data: comment };
    } catch (error) {
      console.error('Error adding video comment:', error);
      return { success: false, error: 'Failed to add comment' };
    }
  }
}

module.exports = { VideoCommentUseCases };
