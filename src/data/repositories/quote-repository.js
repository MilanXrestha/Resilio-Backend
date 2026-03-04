const { supabase } = require('../../config/supabase-client');

/**
 * Quote Repository - Handles database operations for quotes
 */
class QuoteRepository {
  /**
   * Find featured quotes
   * @param {number} limit - Number of quotes to return
   * @param {string[]} preferenceIds - Filter by preference IDs
   * @returns {Promise<Array>} Array of quote objects
   */
  async findFeatured(limit = 10, preferenceIds = []) {
    try {
      let query = supabase
        .from('quotes')
        .select(`
          *,
          categories (id, name)
        `)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by preference IDs if provided
      if (preferenceIds && preferenceIds.length > 0) {
        query = query.contains('preference_ids', preferenceIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this._mapToQuote);
    } catch (error) {
      console.error('QuoteRepository.findFeatured error:', error);
      throw error;
    }
  }

  /**
   * Find quote by ID
   * @param {string} quoteId - Quote ID
   * @returns {Promise<Object|null>} Quote object or null
   */
  async findById(quoteId) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          categories (id, name)
        `)
        .eq('id', quoteId)
        .single();

      if (error || !data) return null;

      return this._mapToQuote(data);
    } catch (error) {
      console.error('QuoteRepository.findById error:', error);
      return null;
    }
  }

  /**
   * Find all quotes with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Object with quotes array and total count
   */
  async findAll(filters) {
    try {
      const { 
        categoryId, 
        isFeatured, 
        isPremium, 
        quoteType, 
        preferenceIds,
        limit = 20, 
        offset = 0 
      } = filters;

      // Build query
      let query = supabase
        .from('quotes')
        .select(`
          *,
          categories (id, name),
          count
        `, { count: 'exact' });

      // Apply filters
      if (categoryId) query = query.eq('category_id', categoryId);
      if (isFeatured !== undefined) query = query.eq('is_featured', isFeatured);
      if (isPremium !== undefined) query = query.eq('is_premium', isPremium);
      if (quoteType) query = query.eq('quote_type', quoteType);
      if (preferenceIds && preferenceIds.length > 0) {
        query = query.contains('preference_ids', preferenceIds);
      }

      // Pagination
      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        quotes: data.map(this._mapToQuote),
        total: count || 0,
      };
    } catch (error) {
      console.error('QuoteRepository.findAll error:', error);
      return { quotes: [], total: 0 };
    }
  }

  /**
   * Map database row to quote object
   * @private
   */
  _mapToQuote(dbQuote) {
    return {
      id: dbQuote.id,
      quoteText: dbQuote.quote_text,
      author: dbQuote.author,
      authorIconUrl: dbQuote.author_icon_url,
      categoryId: dbQuote.category_id,
      preferenceIds: dbQuote.preference_ids || [],
      isFeatured: dbQuote.is_featured,
      isPremium: dbQuote.is_premium,
      quoteType: dbQuote.quote_type,
      createdAt: new Date(dbQuote.created_at),
      updatedAt: new Date(dbQuote.updated_at),
    };
  }
}

module.exports = { QuoteRepository };
