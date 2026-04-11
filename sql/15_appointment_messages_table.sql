-- 15_appointment_messages_table.sql
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS appointment_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'therapist')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appt_messages_appointment ON appointment_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appt_messages_sender ON appointment_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_appt_messages_created ON appointment_messages(created_at);

ALTER TABLE appointment_messages ENABLE ROW LEVEL SECURITY;

-- Participants (patient or therapist) can read messages for their appointments
CREATE POLICY "Participants can read messages"
    ON appointment_messages FOR SELECT
    USING (
        appointment_id IN (
            SELECT id FROM appointments
            WHERE patient_id IN (
                SELECT id FROM users
                WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
                   OR supertokens_uid = current_setting('app.current_user_id', TRUE)
            )
            OR therapist_id IN (
                SELECT id FROM users
                WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
                   OR supertokens_uid = current_setting('app.current_user_id', TRUE)
            )
        )
    );

-- Participants can insert messages
CREATE POLICY "Participants can send messages"
    ON appointment_messages FOR INSERT
    WITH CHECK (
        appointment_id IN (
            SELECT id FROM appointments
            WHERE patient_id IN (
                SELECT id FROM users
                WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
                   OR supertokens_uid = current_setting('app.current_user_id', TRUE)
            )
            OR therapist_id IN (
                SELECT id FROM users
                WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
                   OR supertokens_uid = current_setting('app.current_user_id', TRUE)
            )
        )
    );
