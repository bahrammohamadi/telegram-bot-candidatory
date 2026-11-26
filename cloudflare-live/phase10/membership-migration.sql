-- Isolated subscription demonstration ONLY: it does not handle real money or receipt images.
-- Reuse candidate_subscriptions_v2 and manual_payment_requests_v2.
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_pending_subscription
 ON manual_payment_requests_v2(telegram_id)
 WHERE status='pending' AND receipt_file_id='SIMULATED_NO_FILE';
CREATE INDEX IF NOT EXISTS idx_demo_payment_requests_status_date
 ON manual_payment_requests_v2(status,created_at DESC);
