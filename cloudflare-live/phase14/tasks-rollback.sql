-- Optional isolated rollback: remove only the task quota trigger. Keeps all user tasks.
DROP TRIGGER IF EXISTS trg_candidate_tasks_quota_v1;
