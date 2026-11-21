#!/usr/bin/env python3
"""Phase 15: owner binding and indexed report query regression (synthetic SQLite).

Run: python -m unittest discover -s cloudflare-live/phase15 -p 'test_task_report_owner_binding_and_index.py' -v
"""
import sqlite3
import unittest
from pathlib import Path

SQL_PATH = Path(__file__).with_name("task-performance-owner-scoped.sql")


def report_statement():
    # The SQL file includes comments before and after the single SELECT.
    statements = [line for line in SQL_PATH.read_text(encoding="utf-8").splitlines()
                  if not line.lstrip().startswith("--")]
    return "\n".join(statements).strip()


class OwnerBindingAndIndexTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER NOT NULL, status TEXT, due_date TEXT)")
        self.db.execute("CREATE INDEX idx_tasks_owner ON candidate_tasks_v1(telegram_id)")
        self.db.executemany(
            "INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)",
            [(101, "done", "2020-01-01"), (101, "open", "2020-01-01"),
             (202, "completed", None), (202, None, "2020-01-01")],
        )

    def tearDown(self):
        self.db.close()

    def test_parameterized_owner_cannot_inject_or_expand_scope(self):
        statement = report_statement()
        self.assertEqual(self.db.execute(statement, (101,)).fetchone(), (2, 1, 1, 1))
        self.assertEqual(self.db.execute(statement, (202,)).fetchone(), (2, 1, 1, 1))
        for invalid_owner in ("101 OR 1=1", "101' OR '1'='1", "101; DROP TABLE candidate_tasks_v1;--"):
            self.assertEqual(self.db.execute(statement, (invalid_owner,)).fetchone(), (0, 0, 0, 0))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM candidate_tasks_v1").fetchone(), (4,))

    def test_query_plan_uses_owner_index(self):
        plan = self.db.execute("EXPLAIN QUERY PLAN " + report_statement(), (101,)).fetchall()
        details = " ".join(str(row[3]).upper() for row in plan)
        self.assertIn("IDX_TASKS_OWNER", details)
        self.assertNotIn("SCAN CANDIDATE_TASKS_V1", details)


if __name__ == "__main__":
    unittest.main()
