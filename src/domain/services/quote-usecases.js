// Quote Use Cases - Business logic for quotes
class QuoteUseCases {
  constructor(quoteRepository) {
    this.quoteRepository = quoteRepository;
  }

  async getFeaturedQuotes(options) {
    const { limit, preferenceIds } = options;
    return await this.quoteRepository.findFeatured(limit, preferenceIds);
  }

  async getQuoteById(quoteId) {
    return await this.quoteRepository.findById(quoteId);
  }

  async listQuotes(filters) {
    return await this.quoteRepository.findAll(filters);
  }
}

module.exports = { QuoteUseCases };
