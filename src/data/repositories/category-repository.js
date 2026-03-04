const { supabase } = require('../../config/supabase-client');

/**
 * Category Repository - Handles database operations for categories
 */
class CategoryRepository {
  /**
   * Find all categories
   * @returns {Promise<Array>} Array of category objects
   */
  async findAll() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this._mapToCategory);
    } catch (error) {
      console.error('CategoryRepository.findAll error:', error);
      throw error;
    }
  }

  /**
   * Find category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null
   */
  async findById(categoryId) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error || !data) return null;

      return this._mapToCategory(data);
    } catch (error) {
      console.error('CategoryRepository.findById error:', error);
      return null;
    }
  }

  /**
   * Map database row to category object
   * @private
   */
  _mapToCategory(dbCategory) {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      imageUrl: dbCategory.image_url,
      description: dbCategory.description,
      preferenceIds: dbCategory.preference_ids || [],
      createdAt: new Date(dbCategory.created_at),
      updatedAt: new Date(dbCategory.updated_at),
    };
  }
}

module.exports = { CategoryRepository };
