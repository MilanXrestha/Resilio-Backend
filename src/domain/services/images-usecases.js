const { ImagesRepository } = require('../../data/repositories/images-repository');

class ImagesUseCases {
  constructor() {
    this.imagesRepository = new ImagesRepository();
  }

  /**
   * Get featured images
   */
  async getFeaturedImages(limit = 10, preferenceIds = [], imageType = null) {
    return await this.imagesRepository.findFeatured(limit, preferenceIds, imageType);
  }

  /**
   * Get image by ID
   */
  async getImageById(id) {
    const image = await this.imagesRepository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }
    return image;
  }

  /**
   * List all images with filters
   */
  async listImages(options) {
    const result = await this.imagesRepository.findAll(options);
    return {
      images: result.images,
      pagination: {
        limit: options.limit || 20,
        offset: options.offset || 0,
        total: result.total,
      },
    };
  }

  /**
   * Get images by type
   */
  async getImagesByType(imageType, limit = 20, offset = 0) {
    const result = await this.imagesRepository.findByType(imageType, limit, offset);
    return {
      images: result.images,
      totalCount: result.total,
    };
  }

  /**
   * Create a new image
   */
  async createImage(imageData) {
    return await this.imagesRepository.create(imageData);
  }

  /**
   * Update an existing image
   */
  async updateImage(id, imageData) {
    const existing = await this.imagesRepository.findById(id);
    if (!existing) {
      throw new Error('Image not found');
    }
    return await this.imagesRepository.update(id, imageData);
  }

  /**
   * Delete an image
   */
  async deleteImage(id) {
    const existing = await this.imagesRepository.findById(id);
    if (!existing) {
      throw new Error('Image not found');
    }
    await this.imagesRepository.delete(id);
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id) {
    const existing = await this.imagesRepository.findById(id);
    if (!existing) {
      throw new Error('Image not found');
    }
    return await this.imagesRepository.incrementDownloadCount(id);
  }
}

module.exports = { ImagesUseCases };
