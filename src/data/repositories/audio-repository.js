const { supabase } = require('../../config/supabase-client');

/**
 * Audio Track Repository - Handles database operations for audio tracks
 */
class AudioRepository {
  /**
   * Find featured audio tracks
   */
  async findFeatured(limit = 10, moodFilters = []) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return [];
      }

      let query = supabase
        .from('audio_tracks')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by mood tags if provided
      if (moodFilters && moodFilters.length > 0) {
        query = query.contains('mood_tags', moodFilters);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(this._mapToAudioTrack);
    } catch (error) {
      console.error('AudioRepository.findFeatured error:', error);
      throw error;
    }
  }

  /**
   * Find audio tracks by category ID
   */
  async findByCategory(categoryId, limit = 20, offset = 0) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return { tracks: [], total: 0 };
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('audio_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (countError) throw countError;

      // Get paginated tracks
      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        tracks: data.map(this._mapToAudioTrack),
        total: count || 0,
      };
    } catch (error) {
      console.error('AudioRepository.findByCategory error:', error);
      throw error;
    }
  }

  /**
   * Find audio track by ID
   */
  async findById(audioId) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
      }

      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('id', audioId)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      return this._mapToAudioTrack(data);
    } catch (error) {
      console.error('AudioRepository.findById error:', error);
      throw error;
    }
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(audioId) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return { success: false, newCount: 0 };
      }

      const { data, error } = await supabase.rpc('increment_play_count', {
        audio_id: audioId,
      });

      if (error) {
        // Fallback: manual increment
        const { data: track } = await supabase
          .from('audio_tracks')
          .select('play_count')
          .eq('id', audioId)
          .single();

        if (track) {
          const newCount = (track.play_count || 0) + 1;
          await supabase
            .from('audio_tracks')
            .update({ play_count: newCount })
            .eq('id', audioId);
          
          return { success: true, newCount };
        }
        
        throw error;
      }

      return { success: true, newCount: data };
    } catch (error) {
      console.error('AudioRepository.incrementPlayCount error:', error);
      return { success: false, newCount: 0 };
    }
  }

  /**
   * Map database row to audio track object
   * @private
   */
  _mapToAudioTrack(dbTrack) {
    return {
      id: dbTrack.id,
      title: dbTrack.title,
      description: dbTrack.description,
      artistName: dbTrack.artist_name,
      audioUrl: dbTrack.audio_url,
      coverImageUrl: dbTrack.cover_image_url,
      thumbnailUrl: dbTrack.thumbnail_url,
      durationSeconds: dbTrack.duration_seconds,
      categoryId: dbTrack.category_id,
      moodTags: dbTrack.mood_tags || [],
      isFeatured: dbTrack.is_featured,
      isPremium: dbTrack.is_premium,
      sortOrder: dbTrack.sort_order,
      playCount: dbTrack.play_count,
      likeCount: dbTrack.like_count,
      isActive: dbTrack.is_active,
      createdAt: new Date(dbTrack.created_at),
      updatedAt: new Date(dbTrack.updated_at),
    };
  }
}

module.exports = { AudioRepository };
