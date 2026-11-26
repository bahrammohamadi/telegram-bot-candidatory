#!/usr/bin/env python3
"""Phase 15: regression for the exact live task-count SQL semantics.

Run: python3 cloudflare-live/phase15/test_live_task_count_edge_cases.py
No Cloudflare access, credentials, schema changes, or production writes.
"""
import sqlite3
import unittest

# Exact query text embedded in the current phase15 build-progress-tasks.mjs.
LIVE_QUERY = """SELECT COUNT(*) AS total,
COALESCE(SUM(CASE WHEN status IN ('done','completed') THEN 1 ELSE 0 END),0) AS completed,
COALESCE(SUM(CASE WHEN status='doing' THEN 1 ELSE 0 END),0) AS doing,
COALESCE(SUM(CASE WHEN (status IS NULL OR status NOT IN ('done','completed')) AND due_date IS NOT NULL AND date(due_date)<date('now','+210 minutes') THEN 1 ELSE 0 END),0) AS overdue
FROM candidate_tasks_v1 WHERE telegram_id=?"""

class TaskCountEdgeCases(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
        self.db.executemany("INSERT INTO candidate_tasks_v1 VALUES (?,?,?)", [
            (101,"done","2000-01-01"), (101,"doing","2099-01-01"),
            (101,"todo","2000-01-01"), (202,"todo","2000-01-01"),
            (303,"done","2000-01-01")])
        self.db.execute("PRAGMA query_only=ON")
    def count(self, owner):
        return tuple(self.db.execute(LIVE_QUERY,(owner,)).fetchone())
    def test_owner_101(self):
        self.assertEqual(self.count(101),(3,1,1,1))
    def test_owner_202_isolation(self):
        self.assertEqual(self.count(202),(1,0,0,1))
    def test_completed_alias_is_not_overdue(self):
        self.db.execute("PRAGMA query_only=OFF")
        self.db.execute("INSERT INTO candidate_tasks_v1 VALUES (101,'completed','2000-01-01')")
        self.db.execute("PRAGMA query_only=ON")
        self.assertEqual(self.count(101),(4,2,1,1))

    def test_unknown_owner(self):
        self.assertEqual(self.count(404),(0,0,0,0))
    def test_sql_injection_owner(self):
        self.assertEqual(self.count("101 OR 1=1"),(0,0,0,0))
    def test_missing_bound_owner_fails(self):
        with self.assertRaises(sqlite3.ProgrammingError):
            self.db.execute(LIVE_QUERY)
    def test_null_status_overdue_counted(self):
        # A task with no status is open and can be overdue.
        self.db.execute("PRAGMA query_only=OFF")
        self.db.execute("INSERT INTO candidate_tasks_v1 VALUES (101,NULL,'2000-01-01')")
        self.db.execute("PRAGMA query_only=ON")
        self.assertEqual(self.count(101),(4,1,1,2))
    def test_timestamp_due_date_normalized(self):
        # Normalize timestamp due dates before comparison.
        self.db.execute("PRAGMA query_only=OFF")
        self.db.execute("INSERT INTO candidate_tasks_v1 VALUES (101,'todo','2000-01-01T12:00:00Z')")
        self.db.execute("PRAGMA query_only=ON")
        self.assertEqual(self.count(101),(4,1,1,2))

if __name__ == "__main__":
    unittest.main(verbosity=2)
