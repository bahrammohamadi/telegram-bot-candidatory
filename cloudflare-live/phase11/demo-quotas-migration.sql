-- ISOLATED TEST D1 ONLY. Atomic database-backed subscription quota checks.
-- Roll back with demo-quotas-rollback.sql if needed.
CREATE TRIGGER IF NOT EXISTS trg_demo_quota_goals_v1
BEFORE INSERT ON personal_goals_v2
WHEN (SELECT COUNT(*) FROM personal_goals_v2 WHERE telegram_id=NEW.telegram_id) >= CASE WHEN EXISTS(SELECT 1 FROM candidate_subscriptions_v2 WHERE telegram_id=NEW.telegram_id AND plan_id='professional' AND status='active' AND expires_at>datetime('now')) THEN 100 ELSE 5 END
BEGIN SELECT RAISE(ABORT,'DEMO_QUOTA_GOALS'); END;

CREATE TRIGGER IF NOT EXISTS trg_demo_quota_calendar_v1
BEFORE INSERT ON personal_calendar_v1
WHEN (SELECT COUNT(*) FROM personal_calendar_v1 WHERE telegram_id=NEW.telegram_id) >= CASE WHEN EXISTS(SELECT 1 FROM candidate_subscriptions_v2 WHERE telegram_id=NEW.telegram_id AND plan_id='professional' AND status='active' AND expires_at>datetime('now')) THEN 100 ELSE 10 END
BEGIN SELECT RAISE(ABORT,'DEMO_QUOTA_CALENDAR'); END;

CREATE TRIGGER IF NOT EXISTS trg_demo_quota_practice_v1
BEFORE INSERT ON practice_sessions_v1
WHEN (SELECT COUNT(*) FROM practice_sessions_v1 WHERE telegram_id=NEW.telegram_id) >= CASE WHEN EXISTS(SELECT 1 FROM candidate_subscriptions_v2 WHERE telegram_id=NEW.telegram_id AND plan_id='professional' AND status='active' AND expires_at>datetime('now')) THEN 200 ELSE 10 END
BEGIN SELECT RAISE(ABORT,'DEMO_QUOTA_PRACTICE'); END;

CREATE TRIGGER IF NOT EXISTS trg_demo_quota_studio_v1
BEFORE INSERT ON public_content_drafts_v1
WHEN (SELECT COUNT(*) FROM public_content_drafts_v1 WHERE telegram_id=NEW.telegram_id) >= CASE WHEN EXISTS(SELECT 1 FROM candidate_subscriptions_v2 WHERE telegram_id=NEW.telegram_id AND plan_id='professional' AND status='active' AND expires_at>datetime('now')) THEN 100 ELSE 3 END
BEGIN SELECT RAISE(ABORT,'DEMO_QUOTA_STUDIO'); END;

CREATE TRIGGER IF NOT EXISTS trg_demo_quota_quiz_daily_v1
BEFORE INSERT ON quiz_attempts
WHEN (SELECT COUNT(*) FROM quiz_attempts WHERE telegram_id=NEW.telegram_id AND submitted_at>=datetime('now','-1 day')) >= CASE WHEN EXISTS(SELECT 1 FROM candidate_subscriptions_v2 WHERE telegram_id=NEW.telegram_id AND plan_id='professional' AND status='active' AND expires_at>datetime('now')) THEN 20 ELSE 2 END
BEGIN SELECT RAISE(ABORT,'DEMO_QUOTA_QUIZ_DAILY'); END;
