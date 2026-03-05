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
  async getShortVideos({ limit = 20, offset = 0 } = {}) {
    try {
      const result = await this.getVideos({
        videoType: 'short',
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
