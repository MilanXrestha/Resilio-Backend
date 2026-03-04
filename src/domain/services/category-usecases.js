// Category Use Cases - Business logic for categories
class CategoryUseCases {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
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
}

module.exports = { CategoryUseCases };
