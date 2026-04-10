-- 13_notifications_table.sql
-- In-app Notifications table for Resilio
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'new_booking',
        'booking_confirmed',
        'booking_cancelled',
        'payment_confirmed',
        'payment_failed',
        'appointment_reminder',
        'system',
        'general'
    )),
    is_read BOOLEAN DEFAULT FALSE,
    action_type TEXT,       -- e.g. 'OPEN_APPOINTMENT', 'OPEN_SUBSCRIPTION'
    action_payload JSONB,   -- e.g. {"appointmentId": "uuid"}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users view own notifications"
    ON notifications FOR SELECT
    USING (user_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Users can mark their own notifications as read (update)
CREATE POLICY "Users update own notifications"
    ON notifications FOR UPDATE
    USING (user_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));

-- Only the backend/service role inserts notifications (no user insert policy)
-- This prevents users from creating fake notifications
-- If you need to allow insert from client: add a permissive INSERT policy

-- Users can delete their own notifications
CREATE POLICY "Users delete own notifications"
    ON notifications FOR DELETE
    USING (user_id IN (
        SELECT id FROM users
        WHERE firebase_uid = current_setting('app.current_user_id', TRUE)
           OR supertokens_uid = current_setting('app.current_user_id', TRUE)
    ));
