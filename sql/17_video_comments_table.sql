-- 17_video_comments_table.sql
-- Comments on video reels/shorts. user_id references users(id) (Supabase UUID).

CREATE TABLE IF NOT EXISTS video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES video_tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newest-first fetch per video
CREATE INDEX IF NOT EXISTS idx_video_comments_video
    ON video_comments(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_comments_user
    ON video_comments(user_id);

COMMENT ON TABLE video_comments IS 'User comments on video_tracks (reels/shorts and long-form).';
