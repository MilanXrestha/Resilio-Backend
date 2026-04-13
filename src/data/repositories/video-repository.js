const { supabase } = require('../../config/supabase-client');

/**
 * Video Repository - Data access layer for video tracks
 * Handles both short-form (reels) and long-form (therapy) videos
 */
class VideoRepository {
  /**
   * Get videos with optional filters
   */
  async getVideos({ 
    videoType = null, 
    categoryId = null, 
    featuredOnly = false,
    limit = 20, 
    offset = 0 
  }) {
    try {
      if (!supabase) {
        console.error('❌ Supabase client not initialized');
        return { videos: [], totalCount: 0 };
      }

      let query = supabase
        .from('video_tracks')
        .select('*', { count: 'exact' });

      // Apply filters
      if (videoType) {
        query = query.eq('video_type', videoType);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }

      // Only active videos
      query = query.eq('is_active', true);

      // Order by sort_order and created_at
      query = query.order('sort_order', { ascending: true })
                   .order('created_at', { ascending: false });

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data: videos, count: totalCount } = await query;

      if (videos) {
        return {
          videos: videos.map(this._mapToEntity),
          totalCount: totalCount || 0
        };
      }

      return { videos: [], totalCount: 0 };
    } catch (error) {
      console.error('Error fetching videos:', error);
      return { videos: [], totalCount: 0 };
    }
  }

  /**
   * Get featured videos (mixed types for homepage)
   */
  async getFeaturedVideos({ limit = 10 } = {}) {
    try {
      if (!supabase) return [];

      const { data } = await supabase
        .from('video_tracks')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit);

      return data ? data.map(this._mapToEntity) : [];
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      return [];
    }
  }

  /**
   * Get short videos (reels/TikTok style)
   */
  async getShortVideos({ categoryId = null, limit = 20, offset = 0 } = {}) {
    try {
      const result = await this.getVideos({
        videoType: 'short',
        categoryId,
        limit,
        offset
      });
      return result.videos;
    } catch (error) {
      console.error('Error fetching short videos:', error);
      return [];
    }
  }

  /**
   * Get long videos (therapy sessions/YouTube style)
   */
  async getLongVideos({ categoryId = null, limit = 20, offset = 0 } = {}) {
    try {
      const result = await this.getVideos({
        videoType: 'long',
        categoryId,
        limit,
        offset
      });
      return result.videos;
    } catch (error) {
      console.error('Error fetching long videos:', error);
      return [];
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(id) {
    try {
      if (!supabase) return null;

      const { data } = await supabase
        .from('video_tracks')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      return data ? this._mapToEntity(data) : null;
    } catch (error) {
      console.error('Error fetching video by ID:', error);
      return null;
    }
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(videoId) {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase.rpc('increment_video_play_count', {
        video_id: videoId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error incrementing play count:', error);
      
      // Fallback: manual increment
      try {
        const { data: video } = await supabase
          .from('video_tracks')
          .select('play_count')
          .eq('id', videoId)
          .single();

        if (video) {
          const newCount = (video.play_count || 0) + 1;
          
          await supabase
            .from('video_tracks')
            .update({ play_count: newCount })
            .eq('id', videoId);

          return newCount;
        }
      } catch (fallbackError) {
        console.error('Fallback increment failed:', fallbackError);
      }
      
      return null;
    }
  }

  /**
   * Create a new video
   */
  async create(videoData) {
    try {
      const { data, error } = await supabase
        .from('video_tracks')
        .insert([{
          title: videoData.title,
          description: videoData.description,
          artist_name: videoData.artistName,
          video_url: videoData.videoUrl,
          thumbnail_url: videoData.thumbnailUrl,
          category_id: videoData.categoryId,
          video_type: videoData.videoType || 'long',
          is_featured: videoData.isFeatured || false,
          is_premium: videoData.isPremium || false,
          is_active: videoData.isActive !== false,
        }])
        .select()
        .single();

      if (error) throw error;
      return this._mapToEntity(data);
    } catch (error) {
      console.error('VideoRepository.create error:', error);
      throw error;
    }
  }

  /**
   * Update a video
   */
  async update(videoId, videoData) {
    try {
      const mappedData = {};
      if (videoData.title !== undefined) mappedData.title = videoData.title;
      if (videoData.description !== undefined) mappedData.description = videoData.description;
      if (videoData.artistName !== undefined) mappedData.artist_name = videoData.artistName;
      if (videoData.videoUrl !== undefined) mappedData.video_url = videoData.videoUrl;
      if (videoData.thumbnailUrl !== undefined) mappedData.thumbnail_url = videoData.thumbnailUrl;
      if (videoData.categoryId !== undefined) mappedData.category_id = videoData.categoryId;
      if (videoData.videoType !== undefined) mappedData.video_type = videoData.videoType;
      if (videoData.isFeatured !== undefined) mappedData.is_featured = videoData.isFeatured;
      if (videoData.isPremium !== undefined) mappedData.is_premium = videoData.isPremium;
      if (videoData.isActive !== undefined) mappedData.is_active = videoData.isActive;

      const { data, error } = await supabase
        .from('video_tracks')
        .update(mappedData)
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;
      return this._mapToEntity(data);
    } catch (error) {
      console.error('VideoRepository.update error:', error);
      throw error;
    }
  }

  /**
   * Delete a video
   */
  async delete(videoId) {
    try {
      const { error } = await supabase.from('video_tracks').delete().eq('id', videoId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('VideoRepository.delete error:', error);
      throw error;
    }
  }

  /**
   * Get comments for a video
   */
  async getComments(videoId) {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('video_comments')
        .select(`
          *,
          users (
            id,
            display_name,
            photo_url
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('VideoRepository.getComments error:', error);
      return [];
    }
  }

  /**
   * Add a comment to a video
   */
  async addComment(videoId, userId, content) {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('video_comments')
        .insert([{
          video_id: videoId,
          user_id: userId,
          content: content
        }])
        .select(`
          *,
          users (
            id,
            display_name,
            photo_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('VideoRepository.addComment error:', error);
      return null;
    }
  }

  /**
   * Map database row to entity object
   */
  _mapToEntity(row) {
    return {
      id: row.id,
      title: row.title || '',
      description: row.description || '',
      artistName: row.artist_name || '',
      videoUrl: row.video_url || '',
      thumbnailUrl: row.thumbnail_url || '',
      coverImageUrl: row.cover_image_url || '',
      durationSeconds: row.duration_seconds || 0,
      categoryId: row.category_id,
      moodTags: row.mood_tags || [],
      videoType: row.video_type || 'long',
      aspectRatio: row.aspect_ratio || 1.7778,
      isFeatured: row.is_featured || false,
      isPremium: row.is_premium || false,
      isActive: row.is_active !== false,
      sortOrder: row.sort_order || 0,
      playCount: row.play_count || 0,
      likeCount: row.like_count || 0,
      shareCount: row.share_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = { VideoRepository };
