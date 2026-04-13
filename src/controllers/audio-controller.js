// Audio Controller - handles audio track requests
const { AudioRepository } = require('../data/repositories/audio-repository');
const { AudioUseCases } = require('../domain/services/audio-usecases');

// Initialize use cases
const audioRepository = new AudioRepository();
const audioUseCases = new AudioUseCases(audioRepository);

module.exports = {
  // GET /api/v1/audio - Get all audio tracks (public)
  async getAllAudio(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const result = await audioUseCases.getAllAudio(limit, offset);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const responseProto = {
          tracks: result.tracks.map(track => ({
            id: track.id,
            title: track.title,
            description: track.description || '',
            artist_name: track.artistName || '',
            audio_url: track.audioUrl,
            cover_image_url: track.coverImageUrl || '',
            thumbnail_url: track.thumbnailUrl || '',
            duration_seconds: track.durationSeconds,
            category_id: track.categoryId || '',
            mood_tags: track.moodTags || [],
            is_featured: track.isFeatured,
            is_premium: track.isPremium,
            sort_order: track.sortOrder,
            play_count: track.playCount || 0,
            like_count: track.likeCount || 0,
            is_active: track.isActive,
            created_at: track.createdAt?.toISOString() || '',
            updated_at: track.updatedAt?.toISOString() || '',
          })),
          total: result.total,
        };

        res.proto(responseProto, 'resilio.audio.GetAudioTracksResponse');
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get all audio error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/audio/featured - Get featured audio tracks (public)
  async getFeaturedAudio(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const moodFilters = req.query.mood_filters ? req.query.mood_filters.split(',') : [];

      console.log('GetFeaturedAudio - limit:', limit, 'moodFilters:', moodFilters);

      const tracks = await audioUseCases.getFeaturedAudio(limit, moodFilters);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const responseProto = {
          tracks: tracks.map(track => ({
            id: track.id,
            title: track.title,
            description: track.description || '',
            artist_name: track.artistName || '',
            audio_url: track.audioUrl,
            cover_image_url: track.coverImageUrl || '',
            thumbnail_url: track.thumbnailUrl || '',
            duration_seconds: track.durationSeconds,
            category_id: track.categoryId || '',
            mood_tags: track.moodTags || [],
            is_featured: track.isFeatured,
            is_premium: track.isPremium,
            sort_order: track.sortOrder,
            play_count: track.playCount || 0,
            like_count: track.likeCount || 0,
            is_active: track.isActive,
            created_at: track.createdAt?.toISOString() || '',
            updated_at: track.updatedAt?.toISOString() || '',
          })),
        };

        res.proto(responseProto, 'resilio.audio.GetFeaturedAudioResponse');
        return;
      }

      res.json({ tracks });
    } catch (error) {
      console.error('Get featured audio error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/audio/category/:categoryId - Get audio by category (public)
  async getAudioByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      if (!categoryId) {
        return res.status(400).json({ error: 'Category ID is required' });
      }

      const result = await audioUseCases.getAudioByCategory(categoryId, limit, offset);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const responseProto = {
          tracks: result.tracks.map(track => ({
            id: track.id,
            title: track.title,
            description: track.description || '',
            artist_name: track.artistName || '',
            audio_url: track.audioUrl,
            cover_image_url: track.coverImageUrl || '',
            thumbnail_url: track.thumbnailUrl || '',
            duration_seconds: track.durationSeconds,
            category_id: track.categoryId || '',
            mood_tags: track.moodTags || [],
            is_featured: track.isFeatured,
            is_premium: track.isPremium,
            sort_order: track.sortOrder,
            play_count: track.playCount || 0,
            like_count: track.likeCount || 0,
            is_active: track.isActive,
            created_at: track.createdAt?.toISOString() || '',
            updated_at: track.updatedAt?.toISOString() || '',
          })),
          total: result.total,
        };

        res.proto(responseProto, 'resilio.audio.GetAudioTracksResponse');
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get audio by category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/audio/:audioId - Get single audio track (public)
  async getAudioTrack(req, res) {
    try {
      const { audioId } = req.params;

      if (!audioId) {
        return res.status(400).json({ error: 'Audio ID is required' });
      }

      const track = await audioUseCases.getAudioTrackById(audioId);

      if (!track) {
        return res.status(404).json({ error: 'Audio track not found' });
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const responseProto = {
          track: {
            id: track.id,
            title: track.title,
            description: track.description || '',
            artist_name: track.artistName || '',
            audio_url: track.audioUrl,
            cover_image_url: track.coverImageUrl || '',
            thumbnail_url: track.thumbnailUrl || '',
            duration_seconds: track.durationSeconds,
            category_id: track.categoryId || '',
            mood_tags: track.moodTags || [],
            is_featured: track.isFeatured,
            is_premium: track.isPremium,
            sort_order: track.sortOrder,
            play_count: track.playCount || 0,
            like_count: track.likeCount || 0,
            is_active: track.isActive,
            created_at: track.createdAt?.toISOString() || '',
            updated_at: track.updatedAt?.toISOString() || '',
          },
        };

        res.proto(responseProto, 'resilio.audio.GetAudioTrackResponse');
        return;
      }

      res.json({ track });
    } catch (error) {
      console.error('Get audio track error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /api/v1/audio/:audioId/play - Increment play count (public)
  async incrementPlayCount(req, res) {
    try {
      const { audioId } = req.params;

      if (!audioId) {
        return res.status(400).json({ error: 'Audio ID is required' });
      }

      const result = await audioUseCases.incrementPlayCount(audioId);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const responseProto = {
          success: result.success,
          newCount: result.newCount || 0,
        };

        res.proto(responseProto, 'resilio.audio.IncrementPlayCountResponse');
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Increment play count error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
