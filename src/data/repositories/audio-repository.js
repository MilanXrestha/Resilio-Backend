const { supabase } = require('../../config/supabase-client');

/**
 * Audio Track Repository - Handles database operations for audio tracks
 */
class AudioRepository {
  /**
   * Find all audio tracks
   */
  async findAll(limit = 100, offset = 0) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return { tracks: [], total: 0 };
      }

      const { count, error: countError } = await supabase
        .from('audio_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) throw countError;

      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        tracks: data.map(this._mapToAudioTrack),
        total: count || 0,
      };
    } catch (error) {
      console.error('AudioRepository.findAll error:', error);
      throw error;
    }
  }

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
   * Create a new audio track
   */
  async create(audioData) {
    try {
      const { data, error } = await supabase
        .from('audio_tracks')
        .insert([{
          title: audioData.title,
          description: audioData.description,
          artist_name: audioData.artistName,
          audio_url: audioData.audioUrl,
          cover_image_url: audioData.coverImageUrl,
          category_id: audioData.categoryId,
          is_featured: audioData.isFeatured || false,
          is_premium: audioData.isPremium || false,
          is_active: audioData.isActive !== false,
        }])
        .select()
        .single();

      if (error) throw error;
      return this._mapToAudioTrack(data);
    } catch (error) {
      console.error('AudioRepository.create error:', error);
      throw error;
    }
  }

  /**
   * Update an audio track
   */
  async update(audioId, audioData) {
    try {
      const mappedData = {};
      if (audioData.title !== undefined) mappedData.title = audioData.title;
      if (audioData.description !== undefined) mappedData.description = audioData.description;
      if (audioData.artistName !== undefined) mappedData.artist_name = audioData.artistName;
      if (audioData.audioUrl !== undefined) mappedData.audio_url = audioData.audioUrl;
      if (audioData.coverImageUrl !== undefined) mappedData.cover_image_url = audioData.coverImageUrl;
      if (audioData.categoryId !== undefined) mappedData.category_id = audioData.categoryId;
      if (audioData.isFeatured !== undefined) mappedData.is_featured = audioData.isFeatured;
      if (audioData.isPremium !== undefined) mappedData.is_premium = audioData.isPremium;
      if (audioData.isActive !== undefined) mappedData.is_active = audioData.isActive;

      const { data, error } = await supabase
        .from('audio_tracks')
        .update(mappedData)
        .eq('id', audioId)
        .select()
        .single();

      if (error) throw error;
      return this._mapToAudioTrack(data);
    } catch (error) {
      console.error('AudioRepository.update error:', error);
      throw error;
    }
  }

  /**
   * Delete an audio track
   */
  async delete(audioId) {
    try {
      const { error } = await supabase.from('audio_tracks').delete().eq('id', audioId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('AudioRepository.delete error:', error);
      throw error;
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
