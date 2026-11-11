#!/usr/bin/env python3
"""Phase 15: executable boundary regression for owner-scoped performance counts.

Run: python3 cloudflare-live/phase15/test_task_performance_due_date_boundaries.py
No external packages, network, credentials, or database writes.
"""
from pathlib import Path
import sqlite3
import unittest

SQL_PATH = Path(__file__).with_name("task-performance-owner-scoped.sql")
QUERY = SQL_PATH.read_text(encoding="utf-8").split(";")[0]
# Strip comments only; retain the exact production-candidate SELECT.
QUERY = "\n".join(line for line in QUERY.splitlines() if not line.lstrip().startswith("--")).strip()


class TaskPerformanceDateBoundaries(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER NOT NULL, status TEXT, due_date TEXT)")
        self.db.executemany(
            "INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)",
            [
                (101, "open", "2000-01-01"),      # overdue
                (101, None, "2000-01-02"),        # null status overdue
                (101, "done", "2000-01-01"),      # completed, never overdue
                (101, "completed", "2000-01-01"), # completed alias
                (101, "open", None),              # no due date
                (101, "open", "not-a-date"),      # invalid due date
                (101, "open", "2999-12-31"),      # future
                (202, "open", "2000-01-01"),      # another owner
            ],
        )

    def tearDown(self):
        self.db.close()

    def test_owner_101_status_and_due_date_boundaries(self):
        self.assertEqual(tuple(self.db.execute(QUERY, (101,)).fetchone()), (7, 2, 5, 2))

    def test_other_owner_isolated(self):
        self.assertEqual(tuple(self.db.execute(QUERY, (202,)).fetchone()), (1, 0, 1, 1))

    def test_missing_owner_fails_closed(self):
        with self.assertRaises(sqlite3.ProgrammingError):
            self.db.execute(QUERY).fetchone()

    def test_unknown_owner_returns_zero(self):
        self.assertEqual(tuple(self.db.execute(QUERY, (303,)).fetchone()), (0, 0, 0, 0))


if __name__ == "__main__":
    unittest.main()
