#!/usr/bin/env python3
"""Phase 15: ensure the owner-scoped report SQL is read-only (synthetic SQLite)."""
import sqlite3
import unittest
from pathlib import Path

SQL = Path(__file__).with_name("task-performance-owner-scoped.sql")


class ReadOnlyReportTests(unittest.TestCase):
    def test_query_is_read_only_at_sqlite_authorizer_boundary(self):
        source = SQL.read_text(encoding="utf-8")
        statement = source.split("SELECT", 1)[1].split(";", 1)[0]
        statement = "SELECT" + statement
        db = sqlite3.connect(":memory:")
        try:
            db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
            db.execute("INSERT INTO candidate_tasks_v1 VALUES (101, 'open', '2020-01-01')")
            allowed = {sqlite3.SQLITE_SELECT, sqlite3.SQLITE_READ, sqlite3.SQLITE_FUNCTION}
            seen = []
            def authorize(action, arg1, arg2, database, trigger):
                seen.append((action, arg1))
                if action not in allowed:
                    return sqlite3.SQLITE_DENY
                if action == sqlite3.SQLITE_READ and arg1 != "candidate_tasks_v1":
                    return sqlite3.SQLITE_DENY
                return sqlite3.SQLITE_OK
            db.set_authorizer(authorize)
            row = db.execute(statement, (101,)).fetchone()
            self.assertEqual(row, (1, 0, 1, 1))
            self.assertTrue(any(a == sqlite3.SQLITE_READ for a, _ in seen))
        finally:
            db.close()

    def test_authorizer_denies_mutating_sql(self):
        db = sqlite3.connect(":memory:")
        try:
            db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER)")
            allowed = {sqlite3.SQLITE_SELECT, sqlite3.SQLITE_READ, sqlite3.SQLITE_FUNCTION}
            db.set_authorizer(lambda action, *_: sqlite3.SQLITE_OK if action in allowed else sqlite3.SQLITE_DENY)
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("DELETE FROM candidate_tasks_v1")
        finally:
            db.close()


    def test_missing_owner_binding_fails_closed(self):
        """The report must not run without the authenticated owner parameter."""
        source = SQL.read_text(encoding="utf-8")
        statement = "SELECT" + source.split("SELECT", 1)[1].split(";", 1)[0]
        db = sqlite3.connect(":memory:")
        try:
            db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
            db.execute("INSERT INTO candidate_tasks_v1 VALUES (101, 'done', NULL)")
            with self.assertRaises(sqlite3.ProgrammingError):
                db.execute(statement).fetchone()
            self.assertEqual(db.execute("SELECT COUNT(*) FROM candidate_tasks_v1").fetchone(), (1,))
        finally:
            db.close()

    def test_other_owner_is_excluded_from_report(self):
        """Synthetic owner 202 must not influence owner 101 totals."""
        source = SQL.read_text(encoding="utf-8")
        statement = "SELECT" + source.split("SELECT", 1)[1].split(";", 1)[0]
        db = sqlite3.connect(":memory:")
        try:
            db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
            db.executemany(
                "INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)",
                [(101, "done", None), (202, "open", "2020-01-01"), (202, "done", None)],
            )
            self.assertEqual(db.execute(statement, (101,)).fetchone(), (1, 1, 0, 0))
            self.assertEqual(db.execute(statement, (202,)).fetchone(), (2, 1, 1, 1))
        finally:
            db.close()

    def test_empty_owner_and_null_status_are_scoped(self):
        """Empty owners stay zero; NULL status counts open only for its owner."""
        source = SQL.read_text(encoding="utf-8")
        statement = "SELECT" + source.split("SELECT", 1)[1].split(";", 1)[0]
        db = sqlite3.connect(":memory:")
        try:
            db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
            db.executemany(
                "INSERT INTO candidate_tasks_v1 VALUES (?, ?, ?)",
                [(101, None, "2020-01-01"), (202, "completed", None)],
            )
            self.assertEqual(db.execute(statement, (303,)).fetchone(), (0, 0, 0, 0))
            self.assertEqual(db.execute(statement, (101,)).fetchone(), (1, 0, 1, 1))
            self.assertEqual(db.execute(statement, (202,)).fetchone(), (1, 1, 0, 0))
        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
