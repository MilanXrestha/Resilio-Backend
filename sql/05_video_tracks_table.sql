-- Video tracks table for meditation/therapy videos
-- Supports both short reels (vertical format) and long-form content (horizontal format)

CREATE TABLE IF NOT EXISTS video_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  artist_name VARCHAR(255), -- Creator/therapist name
  
  -- Video file URLs
  video_url VARCHAR(500) NOT NULL, -- Main video URL
  thumbnail_url VARCHAR(500), -- Thumbnail for preview
  cover_image_url VARCHAR(500), -- Cover for horizontal player
  
  -- Metadata
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  mood_tags TEXT[], -- Array of mood tags: ['relaxing', 'anxiety', 'sleep']
  
  -- Video type: 'short' (reels) or 'long' (therapy sessions)
  video_type VARCHAR(20) NOT NULL DEFAULT 'long' CHECK (video_type IN ('short', 'long')),
  
  -- For shorts: aspect ratio (9:16 = 0.5625, etc.)
  aspect_ratio NUMERIC(5,4) DEFAULT 0.5625, -- Default 9:16 for shorts
  
  -- Categorization
  is_featured BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  -- Stats
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_tracks_featured ON video_tracks(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_video_tracks_active ON video_tracks(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_video_tracks_category ON video_tracks(category_id);
CREATE INDEX idx_video_tracks_type ON video_tracks(video_type);
CREATE INDEX idx_video_tracks_sort ON video_tracks(sort_order, created_at DESC);
CREATE INDEX idx_video_tracks_mood ON video_tracks USING GIN(mood_tags);

-- Sample data for testing
INSERT INTO video_tracks (title, description, artist_name, video_url, thumbnail_url, cover_image_url, duration_seconds, video_type, aspect_ratio, is_featured, mood_tags) VALUES
-- Short Reels (vertical format)
(
  'Quick Breathing Exercise',
  'A 30-second breathing technique to calm anxiety instantly',
  'Dr. Sarah Chen',
  'https://sample-videos.com/video1.mp4',
  'https://sample-images.com/breathing-thumb.jpg',
  'https://sample-images.com/breathing-cover.jpg',
  30,
  'short',
  0.5625, -- 9:16 aspect ratio
  TRUE,
  ARRAY['calm', 'breathing', 'anxiety', 'quick']
),
(
  'Mindful Moment',
  'Take a mindful pause in your busy day',
  'Mindfulness Center',
  'https://sample-videos.com/video2.mp4',
  'https://sample-images.com/mindful-thumb.jpg',
  'https://sample-images.com/mindful-cover.jpg',
  45,
  'short',
  0.5625,
  FALSE,
  ARRAY['mindfulness', 'peace', 'quick']
),
(
  'Gratitude Boost',
  'Quick gratitude practice to shift your mindset',
  'Wellness Team',
  'https://sample-videos.com/video3.mp4',
  'https://sample-images.com/gratitude-thumb.jpg',
  'https://sample-images.com/gratitude-cover.jpg',
  60,
  'short',
  0.5625,
  TRUE,
  ARRAY['gratitude', 'happy', 'positive']
),

-- Long-form Videos (therapy sessions, horizontal format)
(
  'Full Guided Meditation for Anxiety',
  'Complete 20-minute guided meditation session to reduce anxiety and promote inner peace',
  'Dr. Michael Torres',
  'https://sample-videos.com/meditation-long.mp4',
  'https://sample-images.com/meditation-long-thumb.jpg',
  'https://sample-images.com/meditation-long-cover.jpg',
  1200, -- 20 minutes
  'long',
  1.7778, -- 16:9 aspect ratio
  TRUE,
  ARRAY['meditation', 'anxiety', 'guided', 'therapy']
),
(
  'CBT Techniques for Depression',
  'Learn practical Cognitive Behavioral Therapy techniques to manage depression',
  'Dr. Emily Watson',
  'https://sample-videos.com/cbt-therapy.mp4',
  'https://sample-images.com/cbt-thumb.jpg',
  'https://sample-images.com/cbt-cover.jpg',
  2700, -- 45 minutes
  'long',
  1.7778,
  TRUE,
  ARRAY['therapy', 'cbt', 'depression', 'mental-health']
),
(
  'Sleep Hypnosis Session',
  'Deep relaxation hypnosis for better sleep quality',
  'Hypnotherapist James Miller',
  'https://sample-videos.com/sleep-hypnosis.mp4',
  'https://sample-images.com/sleep-hypnosis-thumb.jpg',
  'https://sample-images.com/sleep-hypnosis-cover.jpg',
  3600, -- 60 minutes
  'long',
  1.7778,
  FALSE,
  ARRAY['sleep', 'hypnosis', 'relaxation', 'insomnia']
);

COMMENT ON TABLE video_tracks IS 'Stores both short-form (reels) and long-form (therapy) video content';
COMMENT ON COLUMN video_tracks.video_type IS 'Type of video: short (reels/TikTok style) or long (therapy sessions/YouTube style)';
COMMENT ON COLUMN video_tracks.aspect_ratio IS 'Video aspect ratio: 0.5625 (9:16) for shorts, 1.7778 (16:9) for long videos';
