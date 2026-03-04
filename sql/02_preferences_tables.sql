-- Preferences and User Preferences Tables
-- Run this in Supabase SQL Editor

-- ============================================
-- PREFERENCES TABLE
-- Stores available preference categories/topics
-- ============================================
CREATE TABLE IF NOT EXISTS preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preference_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "0WmqJFuqBeXvXSmTaDMZ"
    preference_name VARCHAR(100) NOT NULL, -- e.g., "Relationships"
    preference_description TEXT NOT NULL, -- e.g., "Explore ways to build stronger..."
    preference_icon VARCHAR(500) NOT NULL, -- URL to icon (Cloudinary)
    is_svg BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE preferences IS 'Stores available content preference categories that users can select';

-- Create index for active preferences
CREATE INDEX IF NOT EXISTS idx_preferences_active ON preferences(is_active, sort_order);

-- ============================================
-- USER PREFERENCES TABLE
-- Stores which preferences each user has selected
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_id UUID NOT NULL REFERENCES preferences(id) ON DELETE CASCADE,
    selected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, preference_id) -- Prevent duplicate preferences per user
);

-- Add comment for documentation
COMMENT ON TABLE user_preferences IS 'Stores user-selected preferences linking users to preference categories';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_preference_id ON user_preferences(preference_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Preferences table policies (readable by all authenticated users)
CREATE POLICY "Preferences are viewable by all authenticated users"
    ON preferences FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Only admins can modify preferences (you'll need to set up admin role)
CREATE POLICY "Only admins can insert preferences"
    ON preferences FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.firebase_uid = auth.uid()::text 
            AND users.user_role = 'admin'
        )
    );

CREATE POLICY "Only admins can update preferences"
    ON preferences FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.firebase_uid = auth.uid()::text 
            AND users.user_role = 'admin'
        )
    );

-- User preferences policies (users can only see/modify their own)
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_preferences.user_id 
            AND users.firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_preferences.user_id 
            AND users.firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_preferences.user_id 
            AND users.firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete their own preferences"
    ON user_preferences FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_preferences.user_id 
            AND users.firebase_uid = auth.uid()::text
        )
    );

-- ============================================
-- TRIGGER TO AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_preferences_updated_at
    BEFORE UPDATE ON preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA - Default Preferences
-- ============================================
INSERT INTO preferences (preference_id, preference_name, preference_description, preference_icon, is_svg, sort_order) VALUES
('pref_relationships', 'Relationships', 'Explore ways to build stronger, healthier relationships.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/tn6edtchkby2gkacq6rr.svg', true, 1),
('pref_anxiety', 'Anxiety Relief', 'Techniques and content to help manage anxiety and stress.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/anxiety.svg', true, 2),
('pref_sleep', 'Better Sleep', 'Improve your sleep quality with guided meditations and tips.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/sleep.svg', true, 3),
('pref_mindfulness', 'Mindfulness', 'Practice being present and mindful in your daily life.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/mindfulness.svg', true, 4),
('pref_focus', 'Focus & Productivity', 'Enhance your concentration and get more done.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/focus.svg', true, 5),
('pref_selfcare', 'Self Care', 'Prioritize your wellbeing with self-care practices.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/selfcare.svg', true, 6),
('pref_confidence', 'Confidence', 'Build self-esteem and confidence in yourself.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/confidence.svg', true, 7),
('pref_happiness', 'Happiness', 'Cultivate joy and happiness in your everyday life.', 'https://res.cloudinary.com/dczb26ev1/image/upload/v1753342498/preferences/happiness.svg', true, 8)
ON CONFLICT (preference_id) DO NOTHING;
