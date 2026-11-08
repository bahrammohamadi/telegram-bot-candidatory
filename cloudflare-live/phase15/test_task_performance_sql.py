#!/usr/bin/env python3
"""Phase 15 read-only report SQL regression checks. No network or D1 writes."""
from pathlib import Path
import sqlite3
import unittest

SQL_PATH = Path(__file__).with_name("task-performance-owner-scoped.sql")
SQL_TEXT = SQL_PATH.read_text(encoding="utf-8")
# SQL file starts with comments containing semicolons; splitting before locating
# SELECT silently turned the test into a comment-only statement.
import re
match = re.search(r"(?im)^SELECT\b", SQL_TEXT)
if match is None:
    raise RuntimeError("Task performance SQL SELECT statement missing")
SQL = SQL_TEXT[match.start():].split(";", 1)[0].strip() + ";"

class OwnerScopedPerformanceTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
        self.db.executemany(
            "INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)",
            [(101, "done", "2020-01-01"), (101, None, "2020-01-01T12:00:00Z"),
             (101, "open", "2099-01-01"), (202, "done", "2020-01-01"),
             (202, "open", "2020-01-01"), (303, None, None)]
        )

    def counts(self, owner):
        return tuple(self.db.execute(SQL, (owner,)).fetchone())

    def test_owner_101(self):
        self.assertEqual(self.counts(101), (3, 1, 2, 1))

    def test_owner_202_isolated(self):
        self.assertEqual(self.counts(202), (2, 1, 1, 1))

    def test_null_due_date_not_overdue(self):
        self.assertEqual(self.counts(303), (1, 0, 1, 0))

    def test_missing_owner_no_leak(self):
        self.assertEqual(self.counts(404), (0, 0, 0, 0))

    def test_owner_parameter_required(self):
        with self.assertRaises(sqlite3.ProgrammingError):
            self.db.execute(SQL)

    def test_sql_injection_like_owner_cannot_escape_scope(self):
        # Parameter binding must not interpret this as SQL or return other owners.
        self.assertEqual(self.counts("101 OR 1=1"), (0, 0, 0, 0))
        self.assertEqual(self.counts("101' UNION SELECT 1,1,1,1 --"), (0, 0, 0, 0))

    def test_owner_is_required_even_with_null_parameter(self):
        # A missing verified Telegram identity must never aggregate all tasks.
        self.assertEqual(self.counts(None), (0, 0, 0, 0))

    def test_read_only_with_sqlite_query_only(self):
        # Row counts alone cannot detect UPDATE side effects.
        self.db.execute("PRAGMA query_only = ON")
        self.assertEqual(self.counts(101), (3, 1, 2, 1))
        with self.assertRaises(sqlite3.OperationalError):
            self.db.execute("UPDATE candidate_tasks_v1 SET status = 'done' WHERE telegram_id = 101")

    def test_completed_timestamp_is_not_overdue(self):
        self.db.execute(
            "INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)",
            (101, "completed", "2000-01-01T00:00:00Z"),
        )
        self.assertEqual(self.counts(101), (4, 2, 2, 1))

if __name__ == "__main__":
    unittest.main(verbosity=2)
