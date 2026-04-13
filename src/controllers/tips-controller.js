// Tips Controller - handles business logic
const { TipsUseCases } = require('../domain/services/tips-usecases');
const { TipsRepository } = require('../data/repositories/tips-repository');

// Initialize use cases with repository
const tipsRepository = new TipsRepository();
const tipsUseCases = new TipsUseCases(tipsRepository);

module.exports = {
  // GET /api/v1/tips/featured - Get featured tips
  async getFeaturedTips(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const preferenceIds = req.query.preferenceIds?.split(',') || [];
      const tipType = req.query.tipType || null;

      const tips = await tipsUseCases.getFeaturedTips({
        limit,
        preferenceIds: preferenceIds.length > 0 ? preferenceIds : undefined,
        tipType,
      });

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const tipsProto = tips.map(tip => ({
          id: tip.id || '',
          title: tip.title || '',
          tipText: tip.tipText || '',
          author: tip.author || '',
          authorIconUrl: tip.authorIconUrl || '',
          categoryId: tip.categoryId ? tip.categoryId.toString() : '',
          preferenceIds: Array.isArray(tip.preferenceIds) ? tip.preferenceIds : [],
          tipType: tip.tipType || '',
          isFeatured: tip.isFeatured || false,
          isPremium: tip.isPremium || false,
          sortOrder: tip.sortOrder || 0,
          metadata: tip.metadata || '',
          createdAt: tip.createdAt?.toISOString() || '',
          updatedAt: tip.updatedAt?.toISOString() || '',
        }));

        res.proto({ tips: tipsProto }, 'resilio.tips.GetFeaturedTipsResponse');
        return;
      }

      res.json({ tips });
    } catch (error) {
      console.error('Get featured tips error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/tips/:id - Get tip by ID
  async getTipById(req, res) {
    try {
      const tipId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const tip = await tipsUseCases.getTipById(tipId);

      if (!tip) {
        res.status(404).json({ error: 'Tip not found' });
        return;
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const tipProto = {
          id: tip.id || '',
          title: tip.title || '',
          tip_text: tip.tipText || '',
          author: tip.author || '',
          author_icon_url: tip.authorIconUrl || '',
          category_id: tip.categoryId ? tip.categoryId.toString() : '',
          preference_ids: Array.isArray(tip.preferenceIds) ? tip.preferenceIds : [],
          tip_type: tip.tipType || '',
          is_featured: tip.isFeatured || false,
          is_premium: tip.isPremium || false,
          sort_order: tip.sortOrder || 0,
          metadata: tip.metadata || '',
          created_at: tip.createdAt?.toISOString() || '',
          updated_at: tip.updatedAt?.toISOString() || '',
        };

        res.proto(tipProto, 'resilio.tips.Tip');
        return;
      }

      res.json({ tip });
    } catch (error) {
      console.error('Get tip by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/tips - List tips with filters
  async listTips(req, res) {
    try {
      const filters = {
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };

      if (req.query.categoryId) filters.categoryId = req.query.categoryId;
      if (req.query.isFeatured) filters.isFeatured = req.query.isFeatured === 'true';
      if (req.query.isPremium) filters.isPremium = req.query.isPremium === 'true';
      if (req.query.tipType) filters.tipType = req.query.tipType;
      if (req.query.sortOrder) filters.sortOrder = parseInt(req.query.sortOrder);

      const preferenceIds = req.query.preferenceIds?.split(',');
      if (preferenceIds && preferenceIds.length > 0) {
        filters.preferenceIds = preferenceIds;
      }

      const result = await tipsUseCases.listTips(filters);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const tipsProto = result.tips.map(tip => ({
          id: tip.id || '',
          title: tip.title || '',
          tip_text: tip.tipText || '',
          author: tip.author || '',
          author_icon_url: tip.authorIconUrl || '',
          category_id: tip.categoryId ? tip.categoryId.toString() : '',
          preference_ids: Array.isArray(tip.preferenceIds) ? tip.preferenceIds : [],
          tip_type: tip.tipType || '',
          is_featured: tip.isFeatured || false,
          is_premium: tip.isPremium || false,
          sort_order: tip.sortOrder || 0,
          metadata: tip.metadata || '',
          created_at: tip.createdAt?.toISOString() || '',
          updated_at: tip.updatedAt?.toISOString() || '',
        }));

        const response = {
          tips: tipsProto,
          pagination: {
            page: Math.floor(filters.offset / filters.limit) + 1,
            limit: filters.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / filters.limit),
          },
        };

        res.proto(response, 'resilio.tips.ListTipsResponse');
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('List tips error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/tips/type/:type - Get tips by type
  async getTipsByType(req, res) {
    try {
      const tipType = req.params.type;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const result = await tipsUseCases.getTipsByType(tipType, limit, offset);

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const tipsProto = result.tips.map(tip => ({
          ...tip,
          id: tip.id,
          title: tip.title,
          tipText: tip.tipText,
          author: tip.author || '',
          authorIconUrl: tip.authorIconUrl || '',
          categoryId: tip.categoryId ? tip.categoryId.toString() : '',
          preferenceIds: tip.preferenceIds,
          tipType: tip.tipType,
          isFeatured: tip.isFeatured,
          isPremium: tip.isPremium,
          sortOrder: tip.sortOrder,
          metadata: tip.metadata,
          createdAt: tip.createdAt.toISOString(),
          updatedAt: tip.updatedAt.toISOString(),
        }));

        res.proto({
          tips: tipsProto,
          totalCount: result.total,
        }, 'resilio.tips.GetTipsByTypeResponse');
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get tips by type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
