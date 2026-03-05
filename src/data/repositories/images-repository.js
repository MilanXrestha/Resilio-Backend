const { supabase } = require('../../config/supabase-client');

class ImagesRepository {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Map database row to Image object
   */
  _mapToImage(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url || '',
      author: row.author || '',
      authorIconUrl: row.author_icon_url || '',
      categoryId: row.category_id,
      preferenceIds: row.preference_ids || [],
      imageType: row.image_type || 'general',
      isFeatured: row.is_featured || false,
      isPremium: row.is_premium || false,
      resolutionWidth: row.resolution_width,
      resolutionHeight: row.resolution_height,
      fileSizeBytes: row.file_size_bytes?.toString() || '0',
      downloadCount: row.download_count || 0,
      sortOrder: row.sort_order || 0,
      metadata: typeof row.metadata === 'object' ? JSON.stringify(row.metadata) : row.metadata || '{}',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Find featured images
   */
  async findFeatured(limit = 10, preferenceIds = [], imageType = null) {
    let query = supabase
      .from('images')
      .select(`
        *,
        categories (id, name)
      `)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (preferenceIds && preferenceIds.length > 0) {
      query = query.contains('preference_ids', preferenceIds);
    }

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(this._mapToImage);
  }

  /**
   * Find image by ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('images')
      .select(`
        *,
        categories (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this._mapToImage(data);
  }

  /**
   * List all images with pagination and filters
   */
  async findAll({
    limit = 20,
    offset = 0,
    categoryId = null,
    isFeatured = null,
    isPremium = null,
    imageType = null,
    preferenceIds = [],
  }) {
    let query = supabase
      .from('images')
      .select(`
        *,
        categories (id, name),
        count=images.count
      `, { count: 'exact', head: false });

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (isFeatured !== null) {
      query = query.eq('is_featured', isFeatured);
    }

    if (isPremium !== null) {
      query = query.eq('is_premium', isPremium);
    }

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    if (preferenceIds && preferenceIds.length > 0) {
      query = query.contains('preference_ids', preferenceIds);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      images: data.map(this._mapToImage),
      total: parseInt(data[0]?.count || '0', 10),
    };
  }

  /**
   * Find images by type
   */
  async findByType(imageType, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('images')
      .select(`
        *,
        categories (id, name),
        count=images.count
      `, { count: 'exact' })
      .eq('image_type', imageType)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      images: data.map(this._mapToImage),
      total: parseInt(data[0]?.count || '0', 10),
    };
  }

  /**
   * Create a new image
   */
  async create(imageData) {
    const { data, error } = await supabase
      .from('images')
      .insert({
        title: imageData.title,
        description: imageData.description,
        image_url: imageData.imageUrl,
        thumbnail_url: imageData.thumbnailUrl,
        author: imageData.author,
        author_icon_url: imageData.authorIconUrl,
        category_id: imageData.categoryId,
        preference_ids: imageData.preferenceIds || [],
        image_type: imageData.imageType || 'general',
        is_featured: imageData.isFeatured || false,
        is_premium: imageData.isPremium || false,
        resolution_width: imageData.resolutionWidth,
        resolution_height: imageData.resolutionHeight,
        file_size_bytes: imageData.fileSizeBytes,
        sort_order: imageData.sortOrder || 0,
        metadata: imageData.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return this._mapToImage(data);
  }

  /**
   * Update an existing image
   */
  async update(id, imageData) {
    const { data, error } = await supabase
      .from('images')
      .update({
        title: imageData.title,
        description: imageData.description,
        image_url: imageData.imageUrl,
        thumbnail_url: imageData.thumbnailUrl,
        author: imageData.author,
        author_icon_url: imageData.authorIconUrl,
        category_id: imageData.categoryId,
        preference_ids: imageData.preferenceIds || [],
        image_type: imageData.imageType || 'general',
        is_featured: imageData.isFeatured ?? false,
        is_premium: imageData.isPremium ?? false,
        resolution_width: imageData.resolutionWidth,
        resolution_height: imageData.resolutionHeight,
        file_size_bytes: imageData.fileSizeBytes,
        sort_order: imageData.sortOrder,
        metadata: imageData.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this._mapToImage(data);
  }

  /**
   * Delete an image
   */
  async delete(id) {
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id) {
    const { data, error } = await supabase.rpc('increment_image_download', {
      image_id: id,
    });

    // If RPC doesn't exist, fallback to direct update
    if (error && error.code === '42883') {
      const { data: updatedData, error: updateError } = await supabase
        .from('images')
        .update({ download_count: supabase.raw('download_count + 1') })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return this._mapToImage(updatedData);
    }

    if (error) throw error;
    return this.findById(id);
  }
}

module.exports = { ImagesRepository };
