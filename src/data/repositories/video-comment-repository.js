const { supabase } = require('../../config/supabase-client');

/**
 * Video Comment Repository - data access for comments on videos.
 * Selects join the users table so the client gets display_name / photo_url.
 */
class VideoCommentRepository {
  async getByVideo(videoId) {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('video_comments')
      .select('*, users(display_name, photo_url)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async add({ videoId, userId, content }) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('video_comments')
      .insert({ video_id: videoId, user_id: userId, content })
      .select('*, users(display_name, photo_url)')
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = { VideoCommentRepository };
