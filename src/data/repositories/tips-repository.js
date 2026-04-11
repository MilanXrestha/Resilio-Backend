const { supabase } = require('../../config/supabase-client');

/**
 * Tips Repository - Handles database operations for tips
 */
class TipsRepository {
  /**
   * Find featured tips
   * @param {number} limit - Number of tips to return
   * @param {string[]} preferenceIds - Filter by preference IDs
   * @param {string} tipType - Optional filter by tip type
   * @returns {Promise<Array>} Array of tip objects
   */
  async findFeatured(limit = 10, preferenceIds = [], tipType = null) {
    try {
      let query = supabase
        .from('tips')
        .select(`
          *,
          categories (id, name)
        `)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by preference IDs if provided
      if (preferenceIds && preferenceIds.length > 0) {
        query = query.contains('preference_ids', preferenceIds);
      }

      // Filter by tip type if provided
      if (tipType) {
        query = query.eq('tip_type', tipType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this._mapToTip);
    } catch (error) {
      console.error('TipsRepository.findFeatured error:', error);
      throw error;
    }
  }

  /**
   * Find tip by ID
   * @param {string} tipId - Tip ID
   * @returns {Promise<Object|null>} Tip object or null
   */
  async findById(tipId) {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select(`
          *,
          categories (id, name)
        `)
        .eq('id', tipId)
        .single();

      if (error || !data) return null;

      return this._mapToTip(data);
    } catch (error) {
      console.error('TipsRepository.findById error:', error);
      return null;
    }
  }

  /**
   * Find all tips with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Object with tips array and total count
   */
  async findAll(filters) {
    try {
      const { 
        categoryId, 
        isFeatured, 
        isPremium, 
        tipType, 
        preferenceIds,
        sortOrder,
        limit = 20, 
        offset = 0 
      } = filters;

      // Build query
      let query = supabase
        .from('tips')
        .select(`
          *,
          categories (id, name)
        `, { count: 'exact' });

      // Apply filters
      if (categoryId) query = query.eq('category_id', categoryId);
      if (isFeatured !== undefined) query = query.eq('is_featured', isFeatured);
      if (isPremium !== undefined) query = query.eq('is_premium', isPremium);
      if (tipType) query = query.eq('tip_type', tipType);
      if (preferenceIds && preferenceIds.length > 0) {
        query = query.contains('preference_ids', preferenceIds);
      }

      // Sorting
      if (sortOrder !== undefined) {
        query = query.order('sort_order', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        tips: data.map(this._mapToTip),
        total: count || 0,
      };
    } catch (error) {
      console.error('TipsRepository.findAll error:', error);
      return { tips: [], total: 0 };
    }
  }

  /**
   * Find tips by type
   * @param {string} tipType - Type of tips to find
   * @param {number} limit - Number of tips to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} Object with tips array and total count
   */
  async findByType(tipType, limit = 20, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('tips')
        .select(`
          *,
          categories (id, name)
        `, { count: 'exact' })
        .eq('tip_type', tipType)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        tips: data.map(this._mapToTip),
        total: count || 0,
      };
    } catch (error) {
      console.error('TipsRepository.findByType error:', error);
      return { tips: [], total: 0 };
    }
  }

  /**
   * Create a new tip
   * @param {Object} tipData - Tip data
   * @returns {Promise<Object|null>} Created tip or null
   */
  async create(tipData) {
    try {
      const { data, error } = await supabase
        .from('tips')
        .insert([{
          title: tipData.title,
          tip_text: tipData.tipText,
          author: tipData.author,
          author_icon_url: tipData.authorIconUrl,
          category_id: tipData.categoryId,
          preference_ids: tipData.preferenceIds || [],
          tip_type: tipData.tipType,
          is_featured: tipData.isFeatured || false,
          is_premium: tipData.isPremium || false,
          sort_order: tipData.sortOrder || 0,
          metadata: tipData.metadata || '{}',
        }])
        .select()
        .single();

      if (error) throw error;

      return this._mapToTip(data);
    } catch (error) {
      console.error('TipsRepository.create error:', error);
      throw error;
    }
  }

  /**
   * Update an existing tip
   * @param {string} tipId - Tip ID
   * @param {Object} tipData - Updated tip data
   * @returns {Promise<Object|null>} Updated tip or null
   */
  async update(tipId, tipData) {
    try {
      const updateData = { ...tipData };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Map camelCase to snake_case
      const mappedData = {};
      if (updateData.title !== undefined) mappedData.title = updateData.title;
      if (updateData.tipText !== undefined) mappedData.tip_text = updateData.tipText;
      if (updateData.author !== undefined) mappedData.author = updateData.author;
      if (updateData.authorIconUrl !== undefined) mappedData.author_icon_url = updateData.authorIconUrl;
      if (updateData.categoryId !== undefined) mappedData.category_id = updateData.categoryId;
      if (updateData.preferenceIds !== undefined) mappedData.preference_ids = updateData.preferenceIds;
      if (updateData.tipType !== undefined) mappedData.tip_type = updateData.tipType;
      if (updateData.isFeatured !== undefined) mappedData.is_featured = updateData.isFeatured;
      if (updateData.isPremium !== undefined) mappedData.is_premium = updateData.isPremium;
      if (updateData.sortOrder !== undefined) mappedData.sort_order = updateData.sortOrder;
      if (updateData.metadata !== undefined) mappedData.metadata = updateData.metadata;

      const { data, error } = await supabase
        .from('tips')
        .update(mappedData)
        .eq('id', tipId)
        .select()
        .single();

      if (error) throw error;

      return this._mapToTip(data);
    } catch (error) {
      console.error('TipsRepository.update error:', error);
      throw error;
    }
  }

  /**
   * Delete a tip
   * @param {string} tipId - Tip ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(tipId) {
    try {
      const { error } = await supabase
        .from('tips')
        .delete()
        .eq('id', tipId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('TipsRepository.delete error:', error);
      throw error;
    }
  }

  /**
   * Map database row to tip object
   * @private
   */
  _mapToTip(dbTip) {
    return {
      id: dbTip.id,
      title: dbTip.title,
      tipText: dbTip.tip_text,
      author: dbTip.author,
      authorIconUrl: dbTip.author_icon_url,
      categoryId: dbTip.category_id,
      preferenceIds: dbTip.preference_ids || [],
      tipType: dbTip.tip_type,
      isFeatured: dbTip.is_featured,
      isPremium: dbTip.is_premium,
      sortOrder: dbTip.sort_order,
      metadata: typeof dbTip.metadata === 'string' ? dbTip.metadata : JSON.stringify(dbTip.metadata || {}),
      createdAt: new Date(dbTip.created_at),
      updatedAt: new Date(dbTip.updated_at),
    };
  }
}

module.exports = { TipsRepository };
