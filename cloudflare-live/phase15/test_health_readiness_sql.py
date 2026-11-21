#!/usr/bin/env python3
"""Quota-safe health SQL regression for isolated integration D1.

Run locally without secrets or network:
  python3 cloudflare-live/phase15/test_health_readiness_sql.py
"""
import sqlite3
import unittest

# Mirrors the proposed integration-only /health probe.
HEALTH_SQL = "SELECT 1 AS ready FROM candidate_users LIMIT 1"

class HealthReadinessTests(unittest.TestCase):
    def test_existing_table_with_row(self):
        db = sqlite3.connect(":memory:")
        db.execute("CREATE TABLE candidate_users (id INTEGER)")
        db.execute("INSERT INTO candidate_users VALUES (1)")
        self.assertEqual(db.execute(HEALTH_SQL).fetchone(), (1,))
    def test_existing_empty_table_is_not_schema_failure(self):
        db = sqlite3.connect(":memory:")
        db.execute("CREATE TABLE candidate_users (id INTEGER)")
        self.assertIsNone(db.execute(HEALTH_SQL).fetchone())
    def test_missing_table_fails_closed(self):
        db = sqlite3.connect(":memory:")
        with self.assertRaises(sqlite3.OperationalError):
            db.execute(HEALTH_SQL).fetchone()
    def test_read_only(self):
        db = sqlite3.connect(":memory:")
        db.execute("CREATE TABLE candidate_users (id INTEGER)")
        db.execute("PRAGMA query_only=ON")
        db.execute(HEALTH_SQL).fetchone()
        with self.assertRaises(sqlite3.OperationalError):
            db.execute("INSERT INTO candidate_users VALUES (1)")

if __name__ == "__main__":
    unittest.main(verbosity=2)
