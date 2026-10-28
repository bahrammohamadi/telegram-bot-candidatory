-- Optional meeting attendance intentions; this is RSVP, not proof of physical attendance.
CREATE TABLE IF NOT EXISTS event_rsvps(
 workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 event_id TEXT NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,
 telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),
 response TEXT NOT NULL CHECK(response IN ('going','unable')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(event_id,telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_workspace ON event_rsvps(workspace_id,event_id);
