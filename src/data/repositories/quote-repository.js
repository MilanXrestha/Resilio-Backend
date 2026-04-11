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
   * Create a new quote
   */
  async create(quoteData) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert([{
          quote_text: quoteData.quoteText,
          author: quoteData.author,
          author_icon_url: quoteData.authorIconUrl,
          category_id: quoteData.categoryId,
          preference_ids: quoteData.preferenceIds || [],
          is_featured: quoteData.isFeatured || false,
          is_premium: quoteData.isPremium || false,
          quote_type: quoteData.quoteType,
        }])
        .select()
        .single();

      if (error) throw error;
      return this._mapToQuote(data);
    } catch (error) {
      console.error('QuoteRepository.create error:', error);
      throw error;
    }
  }

  /**
   * Update a quote
   */
  async update(quoteId, quoteData) {
    try {
      const mappedData = {};
      if (quoteData.quoteText !== undefined) mappedData.quote_text = quoteData.quoteText;
      if (quoteData.author !== undefined) mappedData.author = quoteData.author;
      if (quoteData.authorIconUrl !== undefined) mappedData.author_icon_url = quoteData.authorIconUrl;
      if (quoteData.categoryId !== undefined) mappedData.category_id = quoteData.categoryId;
      if (quoteData.preferenceIds !== undefined) mappedData.preference_ids = quoteData.preferenceIds;
      if (quoteData.isFeatured !== undefined) mappedData.is_featured = quoteData.isFeatured;
      if (quoteData.isPremium !== undefined) mappedData.is_premium = quoteData.isPremium;
      if (quoteData.quoteType !== undefined) mappedData.quote_type = quoteData.quoteType;

      const { data, error } = await supabase
        .from('quotes')
        .update(mappedData)
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return this._mapToQuote(data);
    } catch (error) {
      console.error('QuoteRepository.update error:', error);
      throw error;
    }
  }

  /**
   * Delete a quote
   */
  async delete(quoteId) {
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', quoteId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('QuoteRepository.delete error:', error);
      throw error;
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
