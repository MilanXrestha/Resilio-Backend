const { VideoRepository } = require('../../data/repositories/video-repository');

/**
 * Video Use Cases - Business logic layer
 */
class VideoUseCases {
  constructor() {
    this.videoRepository = new VideoRepository();
  }

  /**
   * Get all videos with optional filters
   */
  async getVideos({ 
    videoType = null, 
    categoryId = null, 
    featuredOnly = false,
    limit = 20, 
    offset = 0 
  }) {
    try {
      const result = await this.videoRepository.getVideos({
        videoType,
        categoryId,
        featuredOnly,
        limit,
        offset
      });

      return {
        success: true,
        data: result.videos,
        totalCount: result.totalCount
      };
    } catch (error) {
      console.error('Error in getVideos:', error);
      return {
        success: false,
        error: 'Failed to fetch videos',
        data: [],
        totalCount: 0
      };
    }
  }

  /**
   * Get short videos (reels)
   */
  async getShortVideos({ limit = 20, offset = 0 } = {}) {
    try {
      const videos = await this.videoRepository.getShortVideos({ limit, offset });
      
      return {
        success: true,
        data: videos,
        totalCount: videos.length
      };
    } catch (error) {
      console.error('Error in getShortVideos:', error);
      return {
        success: false,
        error: 'Failed to fetch short videos',
        data: [],
        totalCount: 0
      };
    }
  }

  /**
   * Get long videos (therapy sessions)
   */
  async getLongVideos({ categoryId = null, limit = 20, offset = 0 } = {}) {
    try {
      const videos = await this.videoRepository.getLongVideos({ 
        categoryId, 
        limit, 
        offset 
      });
      
      return {
        success: true,
        data: videos,
        totalCount: videos.length
      };
    } catch (error) {
      console.error('Error in getLongVideos:', error);
      return {
        success: false,
        error: 'Failed to fetch long videos',
        data: [],
        totalCount: 0
      };
    }
  }

  /**
   * Get featured videos
   */
  async getFeaturedVideos({ limit = 10 } = {}) {
    try {
      const videos = await this.videoRepository.getFeaturedVideos({ limit });
      
      return {
        success: true,
        data: videos,
        totalCount: videos.length
      };
    } catch (error) {
      console.error('Error in getFeaturedVideos:', error);
      return {
        success: false,
        error: 'Failed to fetch featured videos',
        data: [],
        totalCount: 0
      };
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(videoId) {
    try {
      const video = await this.videoRepository.getVideoById(videoId);
      
      if (!video) {
        return {
          success: false,
          error: 'Video not found',
          data: null
        };
      }

      return {
        success: true,
        data: video
      };
    } catch (error) {
      console.error('Error in getVideoById:', error);
      return {
        success: false,
        error: 'Failed to fetch video',
        data: null
      };
    }
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(videoId) {
    try {
      const newCount = await this.videoRepository.incrementPlayCount(videoId);
      
      if (newCount !== null) {
        return {
          success: true,
          data: { playCount: newCount }
        };
      }

      return {
        success: false,
        error: 'Failed to increment play count',
        data: null
      };
    } catch (error) {
      console.error('Error in incrementPlayCount:', error);
      return {
        success: false,
        error: 'Failed to increment play count',
        data: null
      };
    }
  }
}

module.exports = { VideoUseCases };
