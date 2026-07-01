// Category Controller - handles category business logic
const { CategoryUseCases } = require('../domain/services/category-usecases');
const { CategoryRepository } = require('../data/repositories/category-repository');

// Initialize use cases with repository
const categoryRepository = new CategoryRepository();
const categoryUseCases = new CategoryUseCases(categoryRepository);

module.exports = {
  // GET /api/v1/categories - Get all categories
  async getAllCategories(req, res) {
    try {
      const categories = await categoryUseCases.getAllCategories();

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const categoriesProto = categories.map(category => ({
          ...category,
          id: category.id,
          name: category.name,
          imageUrl: category.imageUrl || '',
          description: category.description || '',
          preferenceIds: Array.isArray(category.preferenceIds) ? category.preferenceIds : [],
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
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
          ...category,
          id: category.id,
          name: category.name,
          imageUrl: category.imageUrl || '',
          description: category.description || '',
          preferenceIds: Array.isArray(category.preferenceIds) ? category.preferenceIds : [],
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
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

  // GET /api/v1/categories/:id/content - All content in a category, grouped by
  // type, in the camelCase shape the Flutter explore repository expects.
  async getCategoryContent(req, res) {
    try {
      const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { supabase } = require('../config/supabase-client');

      if (!supabase) {
        return res.json({ audio: [], shortVideos: [], longVideos: [], quotes: [], tips: [], images: [] });
      }

      // Fetch every content type for this category in parallel.
      const [audioRes, videoRes, quoteRes, tipRes, imageRes] = await Promise.all([
        supabase.from('audio_tracks').select('*').eq('category_id', categoryId).eq('is_active', true),
        supabase.from('video_tracks').select('*').eq('category_id', categoryId).eq('is_active', true),
        supabase.from('quotes').select('*').eq('category_id', categoryId),
        supabase.from('tips').select('*').eq('category_id', categoryId),
        supabase.from('images').select('*').eq('category_id', categoryId),
      ]);

      const audio = (audioRes.data || []).map((a) => ({
        id: a.id,
        title: a.title,
        artistName: a.artist_name,
        description: a.description,
        coverImageUrl: a.cover_image_url,
        thumbnailUrl: a.thumbnail_url,
        audioUrl: a.audio_url,
        moodTags: a.mood_tags || [],
        categoryId: a.category_id || '',
        durationSeconds: a.duration_seconds || 0,
        isFeatured: a.is_featured || false,
        isPremium: a.is_premium || false,
        createdAt: a.created_at,
      }));

      const mapVideo = (v) => ({
        id: v.id,
        title: v.title,
        artistName: v.artist_name,
        description: v.description,
        coverImageUrl: v.cover_image_url,
        thumbnailUrl: v.thumbnail_url,
        videoUrl: v.video_url,
        moodTags: v.mood_tags || [],
        categoryId: v.category_id || '',
        durationSeconds: v.duration_seconds || 0,
        isFeatured: v.is_featured || false,
        isPremium: v.is_premium || false,
        createdAt: v.created_at,
      });
      const videos = videoRes.data || [];
      const shortVideos = videos.filter((v) => v.video_type === 'short').map(mapVideo);
      const longVideos = videos.filter((v) => v.video_type !== 'short').map(mapVideo);

      const quotes = (quoteRes.data || []).map((q) => ({
        id: q.id,
        quoteText: q.quote_text,
        author: q.author,
        authorIconUrl: q.author_icon_url,
        categoryId: q.category_id || '',
        isFeatured: q.is_featured || false,
        isPremium: q.is_premium || false,
        createdAt: q.created_at,
      }));

      const tips = (tipRes.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        tipText: t.tip_text,
        author: t.author,
        authorIconUrl: t.author_icon_url,
        tipType: t.tip_type,
        categoryId: t.category_id || '',
        isFeatured: t.is_featured || false,
        isPremium: t.is_premium || false,
        createdAt: t.created_at,
      }));

      const images = (imageRes.data || []).map((img) => ({
        id: img.id,
        title: img.title,
        author: img.author,
        description: img.description,
        imageUrl: img.image_url,
        thumbnailUrl: img.thumbnail_url,
        categoryId: img.category_id || '',
        isFeatured: img.is_featured || false,
        isPremium: img.is_premium || false,
        createdAt: img.created_at,
      }));

      res.json({ audio, shortVideos, longVideos, quotes, tips, images });
    } catch (error) {
      console.error('Get category content error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
