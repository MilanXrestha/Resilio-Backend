// Quote Controller - handles business logic
const { QuoteUseCases } = require('../domain/services/quote-usecases');
const { QuoteRepository } = require('../data/repositories/quote-repository');

// Initialize use cases with repository
const quoteRepository = new QuoteRepository();
const quoteUseCases = new QuoteUseCases(quoteRepository);

module.exports = {
  // GET /api/v1/quotes/featured - Get featured quotes
  async getFeaturedQuotes(req, res) {
    try {
      console.log('QuoteUseCases:', quoteUseCases);
      const limit = parseInt(req.query.limit) || 10;
      const preferenceIds = req.query.preferenceIds?.split(',') || [];

      const quotes = await quoteUseCases.getFeaturedQuotes({
        limit,
        preferenceIds: preferenceIds.length > 0 ? preferenceIds : undefined,
      });

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const quotesProto = quotes.map(quote => ({
          id: quote.id || '',
          quoteText: quote.quoteText || '',
          author: quote.author || '',
          authorIconUrl: quote.authorIconUrl || '',
          categoryId: quote.categoryId ? quote.categoryId.toString() : '',
          preferenceIds: Array.isArray(quote.preferenceIds) ? quote.preferenceIds : [],
          isFeatured: quote.isFeatured || false,
          isPremium: quote.isPremium || false,
          quoteType: quote.quoteType || '',
          createdAt: quote.createdAt?.toISOString() || '',
          updatedAt: quote.updatedAt?.toISOString() || '',
        }));

        res.proto({ quotes: quotesProto }, 'resilio.quote.GetFeaturedQuotesResponse');
        return;
      }

      res.json({ quotes });
    } catch (error) {
      console.error('Get featured quotes error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/quotes/:id - Get quote by ID
  async getQuoteById(req, res) {
    try {
      const quoteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const quote = await quoteUseCases.getQuoteById(quoteId);

      if (!quote) {
        res.status(404).json({ error: 'Quote not found' });
        return;
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const quoteProto = {
          id: quote.id || '',
          quoteText: quote.quoteText || '',
          author: quote.author || '',
          authorIconUrl: quote.authorIconUrl || '',
          categoryId: quote.categoryId ? quote.categoryId.toString() : '',
          preferenceIds: Array.isArray(quote.preferenceIds) ? quote.preferenceIds : [],
          isFeatured: quote.isFeatured || false,
          isPremium: quote.isPremium || false,
          quoteType: quote.quoteType || '',
          createdAt: quote.createdAt?.toISOString() || '',
          updatedAt: quote.updatedAt?.toISOString() || '',
        };

        res.proto(quoteProto, 'resilio.quote.Quote');
        return;
      }

      res.json({ quote });
    } catch (error) {
      console.error('Get quote by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/quotes - List quotes with filters
  async listQuotes(req, res) {
    try {
      const filters = {
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };

      if (req.query.categoryId) filters.categoryId = req.query.categoryId;
      if (req.query.isFeatured) filters.isFeatured = req.query.isFeatured === 'true';
      if (req.query.isPremium) filters.isPremium = req.query.isPremium === 'true';
      if (req.query.quoteType) filters.quoteType = req.query.quoteType;

      const preferenceIds = req.query.preferenceIds?.split(',');
      if (preferenceIds && preferenceIds.length > 0) {
        filters.preferenceIds = preferenceIds;
      }

      const result = await quoteUseCases.listQuotes(filters);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const quotesProto = result.quotes.map(quote => ({
          id: quote.id || '',
          quoteText: quote.quoteText || '',
          author: quote.author || '',
          authorIconUrl: quote.authorIconUrl || '',
          categoryId: quote.categoryId ? quote.categoryId.toString() : '',
          preferenceIds: Array.isArray(quote.preferenceIds) ? quote.preferenceIds : [],
          isFeatured: quote.isFeatured || false,
          isPremium: quote.isPremium || false,
          quoteType: quote.quoteType || '',
          createdAt: quote.createdAt?.toISOString() || '',
          updatedAt: quote.updatedAt?.toISOString() || '',
        }));

        const response = {
          quotes: quotesProto,
          pagination: {
            page: Math.floor(filters.offset / filters.limit) + 1,
            limit: filters.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / filters.limit),
            hasNext: filters.offset + filters.limit < result.total,
            hasPrevious: filters.offset > 0,
          },
        };

        res.proto(response, 'resilio.quote.ListQuotesResponse');
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('List quotes error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
