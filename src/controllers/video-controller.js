const { VideoUseCases } = require('../domain/services/video-usecases');

/**
 * Video Controller - HTTP request handlers
 * All endpoints support protobuf responses when Accept: application/x-protobuf
 */
class VideoController {
  constructor() {
    this.videoUseCases = new VideoUseCases();
  }

  _wantsProtobuf(req) {
    const accept = req.headers['accept'] || '';
    return accept.includes('application/x-protobuf');
  }

  _toProtoVideo(video) {
    return {
      id: video.id || '',
      title: video.title || '',
      description: video.description || '',
      artistName: video.artistName || '',
      videoUrl: video.videoUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      coverImageUrl: video.coverImageUrl || '',
      durationSeconds: video.durationSeconds || 0,
      categoryId: video.categoryId || '',
      moodTags: video.moodTags || [],
      videoType: video.videoType || 'long',
      aspectRatio: video.aspectRatio || 1.7778,
      isFeatured: video.isFeatured || false,
      isPremium: video.isPremium || false,
      isActive: video.isActive !== false,
      sortOrder: video.sortOrder || 0,
      playCount: video.playCount || 0,
      likeCount: video.likeCount || 0,
      shareCount: video.shareCount || 0,
      commentCount: video.commentCount || 0,
      createdAt: video.createdAt || '',
      updatedAt: video.updatedAt || '',
    };
  }

  _toProtoComment(comment) {
    return {
      id: comment.id || '',
      videoId: comment.video_id || '',
      userId: comment.user_id || '',
      content: comment.content || '',
      createdAt: comment.created_at || '',
      displayName: comment.users?.display_name || 'User',
      photoUrl: comment.users?.photo_url || '',
    };
  }

  _sendVideosResponse(req, res, videos, totalCount) {
    if (this._wantsProtobuf(req)) {
      console.log('📹 Sending protobuf response with', videos.length, 'videos');
      try {
        const protoPayload = {
          videos: videos.map(v => this._toProtoVideo(v)),
          totalCount: totalCount || 0,
        };
        return res.proto(protoPayload, 'video.GetVideosResponse');
      } catch (e) {
        console.error('📹 Proto encoding error:', e);
        return res.status(500).json({ error: 'Protobuf encoding failed: ' + e.message });
      }
    }

    res.json({
      success: true,
      data: videos,
      totalCount: totalCount,
    });
  }

  _sendVideoResponse(req, res, video) {
    if (this._wantsProtobuf(req)) {
      try {
        const protoPayload = {
          video: this._toProtoVideo(video),
        };
        return res.proto(protoPayload, 'video.VideoResponse');
      } catch (e) {
        console.error('📹 Proto encoding error:', e);
        return res.status(500).json({ error: 'Protobuf encoding failed: ' + e.message });
      }
    }

    res.json({
      success: true,
      data: video,
    });
  }

  _sendPlayCountResponse(req, res, newCount) {
    if (this._wantsProtobuf(req)) {
      try {
        const protoPayload = {
          newCount: newCount || 0,
        };
        return res.proto(protoPayload, 'video.PlayCountResponse');
      } catch (e) {
        console.error('📹 Proto encoding error:', e);
        return res.status(500).json({ error: 'Protobuf encoding failed: ' + e.message });
      }
    }

    res.json({
      success: true,
      data: { playCount: newCount },
    });
  }

  async getVideos(req, res) {
    try {
      const {
        type: videoType,
        category_id: categoryId,
        featured: featuredOnly,
        limit = 20,
        offset = 0,
      } = req.query;

      console.log('📹 Fetching videos with filters:', {
        videoType,
        categoryId,
        featuredOnly,
        limit,
        offset,
      });

      const result = await this.videoUseCases.getVideos({
        videoType: videoType || null,
        categoryId: categoryId || null,
        featuredOnly: featuredOnly === 'true',
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      this._sendVideosResponse(req, res, result.data, result.totalCount);
    } catch (error) {
      console.error('Error in getVideos controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getShortVideos(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;

      console.log('📹 Fetching short videos (reels)');

      const result = await this.videoUseCases.getShortVideos({
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      this._sendVideosResponse(req, res, result.data, result.totalCount);
    } catch (error) {
      console.error('Error in getShortVideos controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getLongVideos(req, res) {
    try {
      const { category_id: categoryId, limit = 20, offset = 0 } = req.query;

      console.log('📹 Fetching long videos (therapy sessions)');

      const result = await this.videoUseCases.getLongVideos({
        categoryId: categoryId || null,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      this._sendVideosResponse(req, res, result.data, result.totalCount);
    } catch (error) {
      console.error('Error in getLongVideos controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getFeaturedVideos(req, res) {
    try {
      const { limit = 10 } = req.query;

      console.log('📹 Fetching featured videos');

      const result = await this.videoUseCases.getFeaturedVideos({
        limit: parseInt(limit),
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      this._sendVideosResponse(req, res, result.data, result.totalCount);
    } catch (error) {
      console.error('Error in getFeaturedVideos controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getVideoById(req, res) {
    try {
      const { id } = req.params;

      console.log('📹 Fetching video by ID:', id);

      const result = await this.videoUseCases.getVideoById(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      this._sendVideoResponse(req, res, result.data);
    } catch (error) {
      console.error('Error in getVideoById controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async incrementPlayCount(req, res) {
    try {
      const { id } = req.params;

      console.log('📹 Incrementing play count for video:', id);

      const result = await this.videoUseCases.incrementPlayCount(id);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      const newCount = result.data.playCount || result.data || 0;
      this._sendPlayCountResponse(req, res, newCount);
    } catch (error) {
      console.error('Error in incrementPlayCount controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getVideoComments(req, res) {
    try {
      const { id: videoId } = req.params;
      const result = await this.videoUseCases.getVideoComments(videoId);

      if (!result.success) {
        return res.status(500).json(result);
      }

      if (this._wantsProtobuf(req)) {
        try {
          const protoPayload = {
            comments: result.data.map(c => this._toProtoComment(c)),
          };
          return res.proto(protoPayload, 'video.GetCommentsResponse');
        } catch (e) {
          console.error('📹 Proto encoding error:', e);
          return res.status(500).json({ error: 'Protobuf encoding failed: ' + e.message });
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getVideoComments controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async addVideoComment(req, res) {
    try {
      const { id: videoId } = req.params;
      const { user_id, content } = req.body;

      if (!user_id || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id, content'
        });
      }

      const result = await this.videoUseCases.addVideoComment(videoId, user_id, content);

      if (!result.success) {
        return res.status(500).json(result);
      }

      if (this._wantsProtobuf(req)) {
        try {
          const protoPayload = {
            comment: this._toProtoComment(result.data),
          };
          return res.proto(protoPayload, 'video.AddCommentResponse');
        } catch (e) {
          console.error('📹 Proto encoding error:', e);
          return res.status(500).json({ error: 'Protobuf encoding failed: ' + e.message });
        }
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in addVideoComment controller:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

module.exports = { VideoController };