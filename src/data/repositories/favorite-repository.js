const { supabase } = require('../../config/supabase-client');

/**
 * Favorite Repository - Data access layer for user favorites
 */
class FavoriteRepository {
  /**
   * Add an item to favorites
   */
  async addFavorite({ userId, contentId, contentType }) {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          content_id: contentId,
          content_type: contentType
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { alreadyExists: true };
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  /**
   * Remove an item from favorites
   */
  async removeFavorite({ userId, contentId, contentType }) {
    try {
      if (!supabase) return false;

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * Get all favorites for a user
   */
  async getFavorites(userId) {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  /**
   * Check if an item is favorited by a user
   */
  async isFavorited({ userId, contentId, contentType }) {
    try {
      if (!supabase) return false;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }
}

module.exports = { FavoriteRepository };
