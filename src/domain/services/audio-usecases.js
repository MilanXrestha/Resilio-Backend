const { AudioRepository } = require('../../data/repositories/audio-repository');

/**
 * Audio Use Cases - Business logic for audio tracks
 */
class AudioUseCases {
  constructor(audioRepository) {
    this.audioRepository = audioRepository;
  }

  /**
   * Get featured audio tracks
   */
  async getFeaturedAudio(limit = 10, moodFilters = []) {
    return await this.audioRepository.findFeatured(limit, moodFilters);
  }

  /**
   * Get audio tracks by category
   */
  async getAudioByCategory(categoryId, limit = 20, offset = 0) {
    return await this.audioRepository.findByCategory(categoryId, limit, offset);
  }

  /**
   * Get single audio track by ID
   */
  async getAudioTrackById(audioId) {
    return await this.audioRepository.findById(audioId);
  }

  /**
   * Increment play count when user starts playing
   */
  async incrementPlayCount(audioId) {
    return await this.audioRepository.incrementPlayCount(audioId);
  }
}

module.exports = { AudioUseCases };
