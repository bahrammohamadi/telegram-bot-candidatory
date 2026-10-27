-- Candidatory user support center migration (2026-10-27).
CREATE TABLE IF NOT EXISTS support_tickets(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),subject TEXT NOT NULL CHECK(length(subject) BETWEEN 3 AND 200),message TEXT NOT NULL CHECK(length(message) BETWEEN 5 AND 3000),status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','closed')),admin_reply TEXT NOT NULL DEFAULT '' CHECK(length(admin_reply)<=3000),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_tickets(telegram_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status,created_at DESC);
