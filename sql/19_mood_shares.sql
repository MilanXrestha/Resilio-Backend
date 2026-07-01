-- 19_mood_shares.sql
-- Consent link: a patient shares their mood logs with a therapist they have
-- (or had) an appointment with. Therapist read access is gated on a row here.

CREATE TABLE IF NOT EXISTS mood_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, therapist_id)
);

CREATE INDEX IF NOT EXISTS idx_mood_shares_therapist ON mood_shares(therapist_id);
CREATE INDEX IF NOT EXISTS idx_mood_shares_patient ON mood_shares(patient_id);

COMMENT ON TABLE mood_shares IS 'Patient consent to let a therapist view their mood_entries.';
