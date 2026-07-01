-- Seed: 11 motivation short reels (vertical 9:16).
-- video_url is a placeholder — replace 'REPLACE_WITH_VIDEO_URL' with the real
-- Cloudinary/CDN link for each row. thumbnail/cover left NULL (optional).

INSERT INTO video_tracks
  (title, description, artist_name, video_url, thumbnail_url, cover_image_url,
   duration_seconds, video_type, aspect_ratio, is_featured, is_active, sort_order, mood_tags)
VALUES
(
  'Start Before You Are Ready',
  'You will never feel 100% ready. Take the first step today.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  40, 'short', 0.5625, TRUE, TRUE, 1,
  ARRAY['motivation', 'growth', 'action']
),
(
  'Discipline Over Motivation',
  'Motivation fades. Discipline is what carries you through.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  35, 'short', 0.5625, TRUE, TRUE, 2,
  ARRAY['motivation', 'discipline', 'focus']
),
(
  'Small Wins Compound',
  'One percent better every day adds up to something huge.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  45, 'short', 0.5625, FALSE, TRUE, 3,
  ARRAY['motivation', 'growth', 'habits']
),
(
  'Your Only Competition Is You',
  'Stop comparing. Beat who you were yesterday.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  38, 'short', 0.5625, FALSE, TRUE, 4,
  ARRAY['motivation', 'mindset', 'confidence']
),
(
  'Fall Down Seven, Rise Eight',
  'Resilience is not never failing — it is always getting back up.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  42, 'short', 0.5625, TRUE, TRUE, 5,
  ARRAY['motivation', 'resilience', 'strength']
),
(
  'Do It Scared',
  'Courage is feeling the fear and doing it anyway.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  33, 'short', 0.5625, FALSE, TRUE, 6,
  ARRAY['motivation', 'courage', 'action']
),
(
  'Consistency Is the Key',
  'Show up every day, even when no one is watching.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  47, 'short', 0.5625, FALSE, TRUE, 7,
  ARRAY['motivation', 'consistency', 'habits']
),
(
  'You Are Stronger Than You Think',
  'You have survived 100% of your hardest days. Keep going.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  36, 'short', 0.5625, TRUE, TRUE, 8,
  ARRAY['motivation', 'strength', 'hope']
),
(
  'Progress Not Perfection',
  'Done is better than perfect. Just keep moving forward.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  41, 'short', 0.5625, FALSE, TRUE, 9,
  ARRAY['motivation', 'growth', 'mindset']
),
(
  'Dream Big, Work Hard',
  'Big dreams need bigger effort. Put in the work.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  39, 'short', 0.5625, FALSE, TRUE, 10,
  ARRAY['motivation', 'success', 'ambition']
),
(
  'This Too Shall Pass',
  'Hard times are temporary. Better days are coming.',
  'Resilio',
  'REPLACE_WITH_VIDEO_URL',
  NULL, NULL,
  44, 'short', 0.5625, TRUE, TRUE, 11,
  ARRAY['motivation', 'hope', 'resilience']
);
