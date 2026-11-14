-- ONLY for isolated testing rollback. Removes quota triggers, retains user data.
DROP TRIGGER IF EXISTS trg_demo_quota_goals_v1;
DROP TRIGGER IF EXISTS trg_demo_quota_calendar_v1;
DROP TRIGGER IF EXISTS trg_demo_quota_practice_v1;
DROP TRIGGER IF EXISTS trg_demo_quota_studio_v1;
DROP TRIGGER IF EXISTS trg_demo_quota_quiz_daily_v1;
