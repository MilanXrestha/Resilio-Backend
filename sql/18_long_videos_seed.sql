-- Seed: 3 long-form videos (horizontal 16:9).
-- Replace 'REPLACE_WITH_VIDEO_URL' with the real Cloudinary/CDN link per row.
-- thumbnail/cover left NULL (optional).

INSERT INTO video_tracks
  (title, description, artist_name, video_url, thumbnail_url, cover_image_url,
   duration_seconds, video_type, aspect_ratio, is_featured, is_active, sort_order, mood_tags)
VALUES
(
  'Full Guided Meditation for Anxiety',
  'A complete 20-minute guided meditation to calm anxiety and restore inner peace.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  1200, 'long', 1.7778, TRUE, TRUE, 1,
  ARRAY['meditation', 'anxiety', 'guided', 'calm']
),
(
  'Deep Sleep Relaxation',
  'A 30-minute wind-down session with breathing and body-scan techniques for restful sleep.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  1800, 'long', 1.7778, TRUE, TRUE, 2,
  ARRAY['sleep', 'relaxation', 'insomnia', 'calm']
),
(
  'Managing Stress with CBT',
  'A 25-minute practical session on Cognitive Behavioral Therapy techniques for everyday stress.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  1500, 'long', 1.7778, FALSE, TRUE, 3,
  ARRAY['therapy', 'cbt', 'stress', 'mental-health']
);
