-- 12_supertokens_migration.sql
-- Adds supertokens_uid column to existing users table
-- Run this in Supabase SQL Editor AFTER 01_users_table.sql

-- Add supertokens_uid column if it does not already exist
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS supertokens_uid TEXT UNIQUE;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_supertokens_uid ON users(supertokens_uid);

-- Optional: make firebase_uid nullable so purely SuperTokens users can exist
-- (Only run this line if you want to support users without Firebase)
-- ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;

COMMENT ON COLUMN users.supertokens_uid IS 'SuperTokens user ID for passwordless login users';
