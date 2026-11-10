#!/usr/bin/env python3
"""Regression: owner-scoped report query must use owner index (synthetic SQLite only)."""
import re
import sqlite3
import unittest
from pathlib import Path

SQL_PATH = Path(__file__).with_name("task-performance-owner-scoped.sql")


def report_query():
    source = SQL_PATH.read_text(encoding="utf-8")
    match = re.search(r"(?im)^SELECT\b", source)
    if not match:
        raise AssertionError("Missing SELECT in report query")
    sql = source[match.start():].split(";", 1)[0].strip()
    if not re.search(r"(?i)\bWHERE\s+telegram_id\s*=\s*\?1\b", sql):
        raise AssertionError("Report query must bind the verified owner")
    return sql


class TaskReportPlanTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER NOT NULL, status TEXT, due_date TEXT)")
        self.db.execute("CREATE INDEX idx_candidate_tasks_owner_due ON candidate_tasks_v1 (telegram_id, due_date)")
        self.db.executemany("INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)", [
            (101, "done", "2020-01-01"), (101, "open", "2020-01-01"),
            (202, "done", "2020-01-01"), (202, "open", "2099-01-01"),
        ])

    def test_owner_index_used_by_report(self):
        details = [row[3] for row in self.db.execute("EXPLAIN QUERY PLAN " + report_query(), (101,))]
        self.assertTrue(any("idx_candidate_tasks_owner_due" in d and "SEARCH" in d for d in details), details)
        self.assertFalse(any("SCAN candidate_tasks_v1" in d for d in details), details)

    def test_owner_isolation_and_count_invariants(self):
        for owner, expected in [(101, (2, 1, 1, 1)), (202, (2, 1, 1, 0)), (303, (0, 0, 0, 0))]:
            total, done, opened, overdue = self.db.execute(report_query(), (owner,)).fetchone()
            self.assertEqual((total, done, opened, overdue), expected)
            self.assertEqual(total, done + opened)
            self.assertLessEqual(overdue, opened)

    def test_missing_owner_fails_closed(self):
        with self.assertRaises(sqlite3.ProgrammingError):
            self.db.execute(report_query()).fetchone()
        self.assertEqual(self.db.execute(report_query(), (None,)).fetchone(), (0, 0, 0, 0))


if __name__ == "__main__":
    unittest.main()
