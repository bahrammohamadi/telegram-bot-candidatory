#!/usr/bin/env python3
"""Fail CI when the actual assembled Worker task SQL drifts from tested SQL.

Run after: node cloudflare-live/phase15/build-progress-tasks.mjs
No credentials, network, database writes, or production operations.
"""
from pathlib import Path
import importlib.util
import re
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parent
WORKER = ROOT / "dist/integration-progress-tasks-worker.mjs"
FIXTURE = ROOT / "test_live_task_count_edge_cases.py"

def sql_from_worker():
    source = WORKER.read_text(encoding="utf-8")
    # The assembled worker contains the executable SQL as a JS double-quoted string.
    matches = re.findall(
        r'db\.prepare\("(SELECT COUNT\(\*\) AS total,[^"\n]*?FROM candidate_tasks_v1 WHERE telegram_id=\?)"\)',
        source,
    )
    if len(matches) != 1:
        raise AssertionError(f"Expected exactly one owner-scoped task SQL, got {len(matches)}")
    return matches[0]

def sql_from_fixture():
    spec = importlib.util.spec_from_file_location("task_fixture", FIXTURE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.LIVE_QUERY

def normalize(sql):
    return re.sub(r"\s+", " ", sql.strip())

class AssembledTaskSqlParity(unittest.TestCase):
    def test_exact_query_matches_regression_fixture(self):
        self.assertEqual(normalize(sql_from_worker()), normalize(sql_from_fixture()))
    def test_owner_binding_is_mandatory(self):
        sql = sql_from_worker()
        self.assertIn("WHERE telegram_id=?", sql)
        self.assertEqual(sql.count("?"), 1)
        db = sqlite3.connect(":memory:")
        db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
        with self.assertRaises(sqlite3.ProgrammingError):
            db.execute(sql)
        self.assertEqual(tuple(db.execute(sql, (123,)).fetchone()), (0, 0, 0, 0))

if __name__ == "__main__":
    unittest.main(verbosity=2)
