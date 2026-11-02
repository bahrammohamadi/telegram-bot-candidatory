-- ISOLATED TEST D1 ONLY. Generic factual public-information drafts, not campaign persuasion.
CREATE TABLE IF NOT EXISTS public_content_drafts_v1(
 id TEXT PRIMARY KEY,
 telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('service_update','meeting_notice','fact_correction','civic_education')),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 160),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 4000),
 source_url TEXT NOT NULL DEFAULT '' CHECK(length(source_url)<=800),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_public_drafts_owner_date ON public_content_drafts_v1(telegram_id,updated_at DESC);
