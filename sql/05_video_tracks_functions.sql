-- Helper function to increment video play count atomically
CREATE OR REPLACE FUNCTION increment_video_play_count(video_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE video_tracks
  SET play_count = play_count + 1,
      updated_at = NOW()
  WHERE id = video_id
  RETURNING play_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_video_play_count IS 'Atomically increments the play count for a video and returns the new count';
