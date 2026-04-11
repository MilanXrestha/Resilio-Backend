// Category Use Cases - Business logic for categories
class CategoryUseCases {
  constructor(categoryRepository, audioRepository, videoRepository, quoteRepository, tipsRepository, imagesRepository) {
    this.categoryRepository = categoryRepository;
    this.audioRepository = audioRepository;
    this.videoRepository = videoRepository;
    this.quoteRepository = quoteRepository;
    this.tipsRepository = tipsRepository;
    this.imagesRepository = imagesRepository;
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Array of category objects
   */
  async getAllCategories() {
    return await this.categoryRepository.findAll();
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null
   */
  async getCategoryById(categoryId) {
    return await this.categoryRepository.findById(categoryId);
  }

  /**
   * Get a category and all its content in one call
   * @param {string} categoryId - Category ID
   * @param {number} limit - Max items per content type
   * @returns {Promise<Object>} Category with audio, videos, quotes, tips, images
   */
  async getCategoryWithContent(categoryId, limit = 50) {
    const [category, audioResult, shortVideos, longVideos, quotesResult, tipsResult, imagesResult] =
      await Promise.all([
        this.categoryRepository.findById(categoryId),
        this.audioRepository.findByCategory(categoryId, limit, 0)
          .catch(e => { console.error('audio error:', e); return { tracks: [] }; }),
        this.videoRepository.getVideos({ videoType: 'short', categoryId, limit, offset: 0 })
          .catch(e => { console.error('shortVideo error:', e); return { videos: [] }; }),
        this.videoRepository.getVideos({ videoType: 'long', categoryId, limit, offset: 0 })
          .catch(e => { console.error('longVideo error:', e); return { videos: [] }; }),
        this.quoteRepository.findAll({ categoryId, limit, offset: 0 })
          .catch(e => { console.error('quotes error:', e); return { quotes: [] }; }),
        this.tipsRepository.findAll({ categoryId, limit, offset: 0 })
          .catch(e => { console.error('tips error:', e); return { tips: [] }; }),
        this.imagesRepository.findAll({ categoryId, limit, offset: 0 })
          .catch(e => { console.error('images error:', e); return { images: [] }; }),
      ]);

    console.log(`getCategoryWithContent(${categoryId}):`, {
      audio: audioResult.tracks?.length ?? 0,
      shortVideos: shortVideos.videos?.length ?? 0,
      longVideos: longVideos.videos?.length ?? 0,
      quotes: quotesResult.quotes?.length ?? 0,
      tips: tipsResult.tips?.length ?? 0,
      images: imagesResult.images?.length ?? 0,
    });

    if (!category) return null;

    return {
      category,
      audio: audioResult.tracks || [],
      shortVideos: shortVideos.videos || [],
      longVideos: longVideos.videos || [],
      quotes: quotesResult.quotes || [],
      tips: tipsResult.tips || [],
      images: imagesResult.images || [],
    };
  }
}

module.exports = { CategoryUseCases };
