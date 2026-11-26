#!/usr/bin/env python3
"""Phase 15: executable boundary regression for owner-scoped performance counts.

Run: python3 cloudflare-live/phase15/test_task_performance_due_date_boundaries.py
No external packages, network, credentials, or database writes.
"""
from pathlib import Path
import sqlite3
import unittest

SQL_PATH = Path(__file__).with_name("task-performance-owner-scoped.sql")
# Strip SQL comments before splitting on the statement terminator: comments may contain semicolons.
SQL_TEXT = "\n".join(line for line in SQL_PATH.read_text(encoding="utf-8").splitlines() if not line.lstrip().startswith("--"))
QUERY = SQL_TEXT.split(";")[0].strip()


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

    def test_tehran_calendar_day_cutoff_matches_progress_api(self):
        # Freeze SQLite's now() via a deterministic SQL substitution to check
        # the UTC 20:30 -> Tehran 00:00 boundary without relying on wall time.
        self.assertIn("date('now','+210 minutes')", QUERY)
        utc_day = "2026-11-11"
        before_midnight = QUERY.replace("date('now','+210 minutes')", "date('2026-11-11 20:29:59','+210 minutes')")
        at_midnight = QUERY.replace("date('now','+210 minutes')", "date('2026-11-11 20:30:00','+210 minutes')")
        self.db.execute("INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)", (101, "open", utc_day))
        self.assertEqual(self.db.execute(before_midnight, (101,)).fetchone()[3], 2)
        self.assertEqual(self.db.execute(at_midnight, (101,)).fetchone()[3], 3)

    def test_missing_owner_fails_closed(self):
        with self.assertRaises(sqlite3.ProgrammingError):
            self.db.execute(QUERY).fetchone()

    def test_unknown_owner_returns_zero(self):
        self.assertEqual(tuple(self.db.execute(QUERY, (303,)).fetchone()), (0, 0, 0, 0))


if __name__ == "__main__":
    unittest.main()
