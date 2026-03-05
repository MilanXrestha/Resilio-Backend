-- Audio Tracks Table for Meditation/Calming Music
-- Stores audio content for wellness sessions

CREATE TABLE IF NOT EXISTS audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  artist_name VARCHAR(255),
  
  -- Audio file URLs
  audio_url VARCHAR(500) NOT NULL,
  cover_image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  
  -- Metadata
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  mood_tags TEXT[], -- Array of mood tags: ['relaxing', 'focus', 'sleep']
  
  -- Categorization
  is_featured BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Stats
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_audio_tracks_featured ON audio_tracks(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_audio_tracks_active ON audio_tracks(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_audio_tracks_category ON audio_tracks(category_id);
CREATE INDEX idx_audio_tracks_sort ON audio_tracks(sort_order, created_at DESC);
CREATE INDEX idx_audio_tracks_mood ON audio_tracks USING GIN(mood_tags);

-- Sample Data - Calming Audio Tracks
INSERT INTO audio_tracks (title, description, artist_name, audio_url, cover_image_url, duration_seconds, mood_tags, is_featured, sort_order) VALUES
('Morning Meditation', 'Start your day with peaceful mindfulness', 'Resilio', 'https://example.com/audio/morning.mp3', 'https://example.com/covers/morning.jpg', 300, ARRAY['morning', 'meditation', 'peaceful'], TRUE, 1),
('Deep Sleep Relaxation', 'Drift into deep restorative sleep', 'Resilio', 'https://example.com/audio/sleep.mp3', 'https://example.com/covers/sleep.jpg', 600, ARRAY['sleep', 'relaxation', 'night'], TRUE, 2),
('Focus & Concentration', 'Enhance mental clarity and focus', 'Resilio', 'https://example.com/audio/focus.mp3', 'https://example.com/covers/focus.jpg', 450, ARRAY['focus', 'study', 'work'], TRUE, 3),
('Stress Relief', 'Release tension and find calm', 'Resilio', 'https://example.com/audio/stress-relief.mp3', 'https://example.com/covers/stress.jpg', 360, ARRAY['stress', 'anxiety', 'calm'], TRUE, 4),
('Breathing Exercise', 'Guided breathing for relaxation', 'Resilio', 'https://example.com/audio/breathing.mp3', '180', ARRAY['breathing', 'meditation', 'quick'], FALSE, 5),
('Nature Sounds', 'Peaceful forest ambience', 'Resilio', 'https://example.com/audio/nature.mp3', 'https://example.com/covers/nature.jpg', 900, ARRAY['nature', 'ambient', 'peaceful'], FALSE, 6);

-- User Audio Progress Tracking (optional feature)
CREATE TABLE IF NOT EXISTS user_audio_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  audio_track_id UUID REFERENCES audio_tracks(id) ON DELETE CASCADE,
  
  -- Progress
  last_played_position INTEGER DEFAULT 0, -- Seconds
  completed_percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Interaction
  is_favorite BOOLEAN DEFAULT FALSE,
  times_played INTEGER DEFAULT 0,
  
  -- Timestamps
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, audio_track_id)
);

CREATE INDEX idx_user_audio_progress_user ON user_audio_progress(user_id);
CREATE INDEX idx_user_audio_progress_track ON user_audio_progress(audio_track_id);
CREATE INDEX idx_user_audio_progress_favorites ON user_audio_progress(is_favorite) WHERE is_favorite = TRUE;
