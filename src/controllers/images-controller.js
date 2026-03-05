const { ImagesUseCases } = require('../domain/services/images-usecases');

const imagesUseCases = new ImagesUseCases();

/**
 * Get featured images
 */
const getFeaturedImages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const preferenceIds = req.query.preferenceIds?.split(',') || [];
    const imageType = req.query.imageType;

    const images = await imagesUseCases.getFeaturedImages(limit, preferenceIds, imageType);

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      const imagesProto = images.map(image => ({
        id: image.id,
        title: image.title,
        description: image.description || '',
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || '',
        author: image.author || '',
        authorIconUrl: image.authorIconUrl || '',
        categoryId: image.categoryId ? image.categoryId.toString() : '',
        preferenceIds: Array.isArray(image.preferenceIds) ? image.preferenceIds : [],
        imageType: image.imageType,
        isFeatured: image.isFeatured,
        isPremium: image.isPremium,
        resolutionWidth: image.resolutionWidth || 0,
        resolutionHeight: image.resolutionHeight || 0,
        fileSizeBytes: Number(image.fileSizeBytes) || 0,
        downloadCount: image.downloadCount || 0,
        sortOrder: image.sortOrder || 0,
        metadata: image.metadata,
        createdAt: typeof image.createdAt === 'string' ? image.createdAt : (image.createdAt?.toISOString() || new Date().toISOString()),
        updatedAt: typeof image.updatedAt === 'string' ? image.updatedAt : (image.updatedAt?.toISOString() || new Date().toISOString()),
      }));

      res.proto({ images: imagesProto }, 'resilio.images.GetFeaturedImagesResponse');
      return;
    }

    // Fallback to JSON
    res.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error('GetFeaturedImages error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get image by ID
 */
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await imagesUseCases.getImageById(id);

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      const imageProto = {
        id: image.id,
        title: image.title,
        description: image.description || '',
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || '',
        author: image.author || '',
        authorIconUrl: image.authorIconUrl || '',
        categoryId: image.categoryId ? image.categoryId.toString() : '',
        preferenceIds: Array.isArray(image.preferenceIds) ? image.preferenceIds : [],
        imageType: image.imageType,
        isFeatured: image.isFeatured,
        isPremium: image.isPremium,
        resolutionWidth: image.resolutionWidth || 0,
        resolutionHeight: image.resolutionHeight || 0,
        fileSizeBytes: Number(image.fileSizeBytes) || 0,
        downloadCount: image.downloadCount || 0,
        sortOrder: image.sortOrder || 0,
        metadata: image.metadata,
        createdAt: typeof image.createdAt === 'string' ? image.createdAt : (image.createdAt?.toISOString() || new Date().toISOString()),
        updatedAt: typeof image.updatedAt === 'string' ? image.updatedAt : (image.updatedAt?.toISOString() || new Date().toISOString()),
      };

      res.proto(imageProto, 'resilio.images.Image');
      return;
    }

    // Fallback to JSON
    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('GetImageById error:', error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * List all images
 */
const listImages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const categoryId = req.query.categoryId;
    const isFeatured = req.query.isFeatured === 'true';
    const isPremium = req.query.isPremium === 'true';
    const imageType = req.query.imageType;
    const preferenceIds = req.query.preferenceIds?.split(',') || [];

    const result = await imagesUseCases.listImages({
      limit,
      offset,
      categoryId,
      isFeatured,
      isPremium,
      imageType,
      preferenceIds,
    });

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      const imagesProto = result.images.map(image => ({
        id: image.id,
        title: image.title,
        description: image.description || '',
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || '',
        author: image.author || '',
        authorIconUrl: image.authorIconUrl || '',
        categoryId: image.categoryId ? image.categoryId.toString() : '',
        preferenceIds: Array.isArray(image.preferenceIds) ? image.preferenceIds : [],
        imageType: image.imageType,
        isFeatured: image.isFeatured,
        isPremium: image.isPremium,
        resolutionWidth: image.resolutionWidth || 0,
        resolutionHeight: image.resolutionHeight || 0,
        fileSizeBytes: Number(image.fileSizeBytes) || 0,
        downloadCount: image.downloadCount || 0,
        sortOrder: image.sortOrder || 0,
        metadata: image.metadata,
        createdAt: typeof image.createdAt === 'string' ? image.createdAt : (image.createdAt?.toISOString() || new Date().toISOString()),
        updatedAt: typeof image.updatedAt === 'string' ? image.updatedAt : (image.updatedAt?.toISOString() || new Date().toISOString()),
      }));

      res.proto(
        {
          images: imagesProto,
          pagination: {
            limit: result.pagination.limit,
            offset: result.pagination.offset,
            total: result.pagination.total,
          },
        },
        'resilio.images.ListImagesResponse'
      );
      return;
    }

    // Fallback to JSON
    res.json({
      success: true,
      data: result.images,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('ListImages error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get images by type
 */
const getImagesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    const result = await imagesUseCases.getImagesByType(type, limit, offset);

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      const imagesProto = result.images.map(image => ({
        id: image.id,
        title: image.title,
        description: image.description || '',
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || '',
        author: image.author || '',
        authorIconUrl: image.authorIconUrl || '',
        categoryId: image.categoryId ? image.categoryId.toString() : '',
        preferenceIds: Array.isArray(image.preferenceIds) ? image.preferenceIds : [],
        imageType: image.imageType,
        isFeatured: image.isFeatured,
        isPremium: image.isPremium,
        resolutionWidth: image.resolutionWidth || 0,
        resolutionHeight: image.resolutionHeight || 0,
        fileSizeBytes: Number(image.fileSizeBytes) || 0,
        downloadCount: image.downloadCount || 0,
        sortOrder: image.sortOrder || 0,
        metadata: image.metadata,
        createdAt: typeof image.createdAt === 'string' ? image.createdAt : (image.createdAt?.toISOString() || new Date().toISOString()),
        updatedAt: typeof image.updatedAt === 'string' ? image.updatedAt : (image.updatedAt?.toISOString() || new Date().toISOString()),
      }));

      res.proto(
        { images: imagesProto, totalCount: result.totalCount },
        'resilio.images.GetImagesByTypeResponse'
      );
      return;
    }

    // Fallback to JSON
    res.json({
      success: true,
      data: result.images,
      totalCount: result.totalCount,
    });
  } catch (error) {
    console.error('GetImagesByType error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create a new image (Admin only)
 */
const createImage = async (req, res) => {
  try {
    const imageData = req.body;

    const image = await imagesUseCases.createImage(imageData);

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      const imageProto = {
        id: image.id,
        title: image.title,
        description: image.description || '',
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || '',
        author: image.author || '',
        authorIconUrl: image.authorIconUrl || '',
        categoryId: image.categoryId ? image.categoryId.toString() : '',
        preferenceIds: Array.isArray(image.preferenceIds) ? image.preferenceIds : [],
        imageType: image.imageType,
        isFeatured: image.isFeatured,
        isPremium: image.isPremium,
        resolutionWidth: image.resolutionWidth || 0,
        resolutionHeight: image.resolutionHeight || 0,
        fileSizeBytes: Number(image.fileSizeBytes) || 0,
        downloadCount: image.downloadCount || 0,
        sortOrder: image.sortOrder || 0,
        metadata: image.metadata,
        createdAt: typeof image.createdAt === 'string' ? image.createdAt : (image.createdAt?.toISOString() || new Date().toISOString()),
        updatedAt: typeof image.updatedAt === 'string' ? image.updatedAt : (image.updatedAt?.toISOString() || new Date().toISOString()),
      };

      res.proto(imageProto, 'resilio.images.Image');
      return;
    }

    // Fallback to JSON
    res.status(201).json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('CreateImage error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update an image (Admin only)
 */
const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const imageData = req.body;

    const image = await imagesUseCases.updateImage(id, imageData);

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      const imageProto = {
        id: image.id,
        title: image.title,
        description: image.description || '',
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || '',
        author: image.author || '',
        authorIconUrl: image.authorIconUrl || '',
        categoryId: image.categoryId ? image.categoryId.toString() : '',
        preferenceIds: Array.isArray(image.preferenceIds) ? image.preferenceIds : [],
        imageType: image.imageType,
        isFeatured: image.isFeatured,
        isPremium: image.isPremium,
        resolutionWidth: image.resolutionWidth || 0,
        resolutionHeight: image.resolutionHeight || 0,
        fileSizeBytes: Number(image.fileSizeBytes) || 0,
        downloadCount: image.downloadCount || 0,
        sortOrder: image.sortOrder || 0,
        metadata: image.metadata,
        createdAt: typeof image.createdAt === 'string' ? image.createdAt : (image.createdAt?.toISOString() || new Date().toISOString()),
        updatedAt: typeof image.updatedAt === 'string' ? image.updatedAt : (image.updatedAt?.toISOString() || new Date().toISOString()),
      };

      res.proto(imageProto, 'resilio.images.Image');
      return;
    }

    // Fallback to JSON
    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('UpdateImage error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete an image (Admin only)
 */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    await imagesUseCases.deleteImage(id);

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      res.proto({}, 'resilio.common.Empty');
      return;
    }

    // Fallback to JSON
    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('DeleteImage error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Increment download count
 */
const incrementDownloadCount = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await imagesUseCases.incrementDownloadCount(id);

    // Handle protobuf response
    if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
      const imageProto = {
        id: image.id,
        title: image.title,
        description: image.description || '',
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || '',
        author: image.author || '',
        authorIconUrl: image.authorIconUrl || '',
        categoryId: image.categoryId ? image.categoryId.toString() : '',
        preferenceIds: Array.isArray(image.preferenceIds) ? image.preferenceIds : [],
        imageType: image.imageType,
        isFeatured: image.isFeatured,
        isPremium: image.isPremium,
        resolutionWidth: image.resolutionWidth || 0,
        resolutionHeight: image.resolutionHeight || 0,
        fileSizeBytes: Number(image.fileSizeBytes) || 0,
        downloadCount: image.downloadCount || 0,
        sortOrder: image.sortOrder || 0,
        metadata: image.metadata,
        createdAt: typeof image.createdAt === 'string' ? image.createdAt : (image.createdAt?.toISOString() || new Date().toISOString()),
        updatedAt: typeof image.updatedAt === 'string' ? image.updatedAt : (image.updatedAt?.toISOString() || new Date().toISOString()),
      };

      res.proto(imageProto, 'resilio.images.Image');
      return;
    }

    // Fallback to JSON
    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('IncrementDownloadCount error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getFeaturedImages,
  getImageById,
  listImages,
  getImagesByType,
  createImage,
  updateImage,
  deleteImage,
  incrementDownloadCount,
};
