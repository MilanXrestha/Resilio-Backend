-- 14_appointments_price_and_fixes.sql
-- Add price column to appointments + therapist_profiles column aliases
-- Run this in Supabase SQL Editor

-- ── Appointments: add price column ──────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;

-- ── Therapist profiles: add specialty_tags + hourly_rate aliases ─────────────
-- The portal controller now uses consultation_fee and years_of_experience (already exist).
-- Add specialty_tags as a text[] alias if not present (some columns may differ by migration order)
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS specialty_tags TEXT[] DEFAULT '{}';

-- ── Content: track which therapist created each content item ─────────────────
-- So customer Explore can show therapist-created content
ALTER TABLE tips
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE video_tracks
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE audio_tracks
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for explore queries filtering by therapist content
CREATE INDEX IF NOT EXISTS idx_tips_created_by ON tips(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_video_tracks_created_by ON video_tracks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_audio_tracks_created_by ON audio_tracks(created_by_user_id);

-- ── Appointments: sync price from therapist consultation_fee on insert ────────
-- Trigger to auto-populate price from therapist profile when appointment is created
CREATE OR REPLACE FUNCTION populate_appointment_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS NULL OR NEW.price = 0 THEN
    SELECT consultation_fee INTO NEW.price
    FROM therapist_profiles
    WHERE user_id = NEW.therapist_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_populate_appointment_price ON appointments;
CREATE TRIGGER trg_populate_appointment_price
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION populate_appointment_price();
