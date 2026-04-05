-- 07_favorites_table.sql
-- Create favorites table to store user-specific liked content

-- Ensure we have a way to identify content types
-- Types: 'audio', 'video', 'quote', 'tip', 'image'

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL, -- The ID of the item being favorited
    content_type VARCHAR(50) NOT NULL, -- 'audio', 'video', 'quote', 'tip', 'image'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a user can only favorite the same item once
    UNIQUE(user_id, content_id, content_type)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_content ON favorites(content_id, content_type);

-- Comment for clarity
COMMENT ON TABLE favorites IS 'Stores user-favorited content across all categories.';
