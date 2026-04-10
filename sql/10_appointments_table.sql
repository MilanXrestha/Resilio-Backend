-- 10_appointments_table.sql
-- Appointments table for Resilio
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_transaction_id TEXT,
    meeting_room_id TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_id ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_time);

-- Auto-update updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients view own appointments"
    ON appointments FOR SELECT
    USING (patient_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Therapists can view appointments assigned to them
CREATE POLICY "Therapists view own appointments"
    ON appointments FOR SELECT
    USING (therapist_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (patient_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Therapists and patients can update their appointments (confirm, cancel, etc.)
CREATE POLICY "Therapists and patients can update appointments"
    ON appointments FOR UPDATE
    USING (
        patient_id IN (
            SELECT id FROM users
            WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
               OR supertokens_uid = current_setting('app.current_user_id', TRUE)
        )
        OR
        therapist_id IN (
            SELECT id FROM users
            WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
               OR supertokens_uid = current_setting('app.current_user_id', TRUE)
        )
    );
