-- Migration: Add missing user profile fields
-- Run in Supabase SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_number  TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth TEXT,   -- stored as 'YYYY-MM-DD' string
  ADD COLUMN IF NOT EXISTS gender        TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  ADD COLUMN IF NOT EXISTS timezone      TEXT;

-- Optional: backfill timezone for existing rows to a sensible default
UPDATE users SET timezone = 'Asia/Kathmandu' WHERE timezone IS NULL;
