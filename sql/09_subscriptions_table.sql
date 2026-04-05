-- Subscriptions Table for Resilio
-- Run this in Supabase SQL Editor

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,           -- e.g., 'GOLD', 'PLATINUM', 'DIAMOND'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    payment_method TEXT DEFAULT 'esewa',
    last_transaction_id TEXT,
    is_auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- Assuming one active subscription per user at a time
);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_provider TEXT NOT NULL,
    payment_provider_transaction_id TEXT,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'NPR',
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'pending', 'refunded')),
    plan_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_subscription_id ON transactions(subscription_id);

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Users view own subscriptions" ON subscriptions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('app.current_user_id', TRUE)));
