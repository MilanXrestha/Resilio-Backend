// Category Controller - handles category business logic
const { CategoryUseCases } = require('../domain/services/category-usecases');
const { CategoryRepository } = require('../data/repositories/category-repository');
const { AudioRepository } = require('../data/repositories/audio-repository');
const { VideoRepository } = require('../data/repositories/video-repository');
const { QuoteRepository } = require('../data/repositories/quote-repository');
const { TipsRepository } = require('../data/repositories/tips-repository');
const { ImagesRepository } = require('../data/repositories/images-repository');

// Initialize use cases with all repositories
const categoryRepository = new CategoryRepository();
const audioRepository = new AudioRepository();
const videoRepository = new VideoRepository();
const quoteRepository = new QuoteRepository();
const tipsRepository = new TipsRepository();
const imagesRepository = new ImagesRepository();

const categoryUseCases = new CategoryUseCases(
  categoryRepository,
  audioRepository,
  videoRepository,
  quoteRepository,
  tipsRepository,
  imagesRepository,
);

module.exports = {
  // GET /api/v1/categories - Get all categories
  async getAllCategories(req, res) {
    try {
      const categories = await categoryUseCases.getAllCategories();

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const categoriesProto = categories.map(category => ({
          id: category.id || '',
          name: category.name || '',
          imageUrl: category.imageUrl || '',
          description: category.description || '',
          preferenceIds: Array.isArray(category.preferenceIds) ? category.preferenceIds : [],
          createdAt: category.createdAt?.toISOString() || '',
          updatedAt: category.updatedAt?.toISOString() || '',
        }));

        res.proto({ categories: categoriesProto }, 'resilio.category.ListCategoriesResponse');
        return;
      }

      res.json({ categories });
    } catch (error) {
      console.error('Get all categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/categories/:id - Get category by ID
  async getCategoryById(req, res) {
    try {
      const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const category = await categoryUseCases.getCategoryById(categoryId);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const categoryProto = {
          id: category.id || '',
          name: category.name || '',
          imageUrl: category.imageUrl || '',
          description: category.description || '',
          preferenceIds: Array.isArray(category.preferenceIds) ? category.preferenceIds : [],
          createdAt: category.createdAt?.toISOString() || '',
          updatedAt: category.updatedAt?.toISOString() || '',
        };

        res.proto(categoryProto, 'resilio.category.Category');
        return;
      }

      res.json({ category });
    } catch (error) {
      console.error('Get category by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/categories/:id/content - Get category with all its content
  async getCategoryContent(req, res) {
    try {
      const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const limit = parseInt(req.query.limit) || 50;

      const result = await categoryUseCases.getCategoryWithContent(categoryId, limit);

      if (!result) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get category content error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
