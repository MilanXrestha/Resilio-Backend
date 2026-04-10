-- 11_therapist_profiles_table.sql
-- Therapist Profiles table for Resilio
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS therapist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialty TEXT,                        -- e.g. 'Anxiety, Depression, Trauma'
    qualifications TEXT[] DEFAULT '{}',    -- e.g. ['PhD Psychology', 'LMFT']
    years_of_experience INTEGER DEFAULT 0,
    consultation_fee NUMERIC(10,2),        -- in NPR
    is_verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    profile_image_url TEXT,
    availability_json JSONB,               -- Flexible schedule storage
    languages TEXT[] DEFAULT ARRAY['en'],  -- ['en', 'ne'] etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_specialty ON therapist_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verified ON therapist_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_rating ON therapist_profiles(rating DESC);

-- Auto-update updated_at
CREATE TRIGGER update_therapist_profiles_updated_at
    BEFORE UPDATE ON therapist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified therapist profiles (for public listing)
CREATE POLICY "Public read of verified therapist profiles"
    ON therapist_profiles FOR SELECT
    USING (is_verified = TRUE);

-- Therapists can read their own profile even if not verified yet
CREATE POLICY "Therapist can read own profile"
    ON therapist_profiles FOR SELECT
    USING (user_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Therapists can insert their own profile
CREATE POLICY "Therapist can create own profile"
    ON therapist_profiles FOR INSERT
    WITH CHECK (user_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Therapists can update their own profile
CREATE POLICY "Therapist can update own profile"
    ON therapist_profiles FOR UPDATE
    USING (user_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Admins can update any therapist profile (for verification)
CREATE POLICY "Admins can update any therapist profile"
    ON therapist_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE (firebase_uid = current_setting('app.current_user_id', TRUE)
               OR supertokens_uid = current_setting('app.current_user_id', TRUE))
            AND user_role = 'admin'
        )
    );
