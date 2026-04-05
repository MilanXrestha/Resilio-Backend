-- Games Tables for Resilio
-- Run this in Supabase SQL Editor

-- Game Sessions Table (to track when a user plays any game)
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- e.g., 'breathing', 'trivia', 'affirmation'
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    score INTEGER DEFAULT 0,
    metadata JSONB, -- Flexible storage for game-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);

-- Mood Entries Table (for the mood calendar)
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
    mood_label TEXT, -- e.g., 'Happy', 'Sad', 'Anxious'
    note TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entry_date) -- One entry per user per day usually, but can be adjusted
);
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date);

-- Achievements Table (defining all possible badges/achievements)
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'FIRST_BREATH', 'MOOD_STREAK_7'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    requirement_type TEXT NOT NULL, -- e.g., 'count', 'streak', 'score'
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements Table (tracking which user unlocked what)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Affirmations Table
CREATE TABLE affirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    background_color TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_affirmations_user_id ON affirmations(user_id);

-- Add update triggers
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affirmations_updated_at BEFORE UPDATE ON affirmations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;

-- Basic Policies (assuming app.current_user_id setting is used like in users table)
CREATE POLICY "Users view own game sessions" ON game_sessions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users insert own game sessions" ON game_sessions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users update own game sessions" ON game_sessions FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));

CREATE POLICY "Users view own mood entries" ON mood_entries FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users insert own mood entries" ON mood_entries FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users update own mood entries" ON mood_entries FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));

CREATE POLICY "Anyone view achievements" ON achievements FOR SELECT USING (true);

CREATE POLICY "Users view own user achievements" ON user_achievements FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users insert own user achievements" ON user_achievements FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));

CREATE POLICY "Users view own affirmations" ON affirmations FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users insert own affirmations" ON affirmations FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users update own affirmations" ON affirmations FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users delete own affirmations" ON affirmations FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
