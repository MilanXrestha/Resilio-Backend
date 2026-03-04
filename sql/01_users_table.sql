-- Minimal Users Table for Resilio
-- Run this in Supabase SQL Editor

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    display_name TEXT,
    photo_url TEXT,
    user_role TEXT DEFAULT 'user' CHECK (user_role IN ('user', 'therapist', 'admin')),
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
    preferences_completed BOOLEAN DEFAULT FALSE,
    fcm_token TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (firebase_uid = current_setting('app.current_user_id', TRUE));

-- Create policy: Users can only update their own data
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (firebase_uid = current_setting('app.current_user_id', TRUE));

-- Create policy: Allow insert for new users (during registration)
CREATE POLICY "Allow insert for new users"
    ON users FOR INSERT
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
