-- Video comments table for Reels and long videos
-- associating comments with users and video tracks

CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES video_tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_comments_video ON video_comments(video_id);
CREATE INDEX idx_video_comments_user ON video_comments(user_id);
CREATE INDEX idx_video_comments_created_at ON video_comments(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_video_comments_updated_at 
    BEFORE UPDATE ON video_comments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE video_comments IS 'Stores user comments for both short reels and long videos';
