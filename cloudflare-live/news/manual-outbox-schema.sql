-- One-shot manual posting; runs only in candidatory-news-bot NEWS_DB.
-- Separates explicit channel notices from automatically ingested news.
CREATE TABLE IF NOT EXISTS manual_publish_outbox (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK(channel='@candidatoryiran'),
  content TEXT NOT NULL CHECK(length(content) BETWEEN 20 AND 3500),
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','sending','published','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 1),
  message_id INTEGER,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TEXT,
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_manual_publish_queue ON manual_publish_outbox(status,created_at);
