#!/usr/bin/env python3
"""Verify the *assembled API* task query against synthetic SQLite rows.

Offline only: no credentials, live D1, Telegram, or production writes.
"""
import pathlib
import re
import sqlite3

ROOT = pathlib.Path(__file__).resolve().parent
worker = (ROOT / "dist/integration-progress-tasks-worker.mjs").read_text()
match = re.search(r'db\.prepare\("([^"\n]*?AS overdue FROM candidate_tasks_v1 WHERE telegram_id=\?)"\)\.bind\(id\)\.first\(\)', worker)
assert match, "Assembled API task report must use bound telegram_id owner"
sql = match.group(1).replace("\\'", "'")
assert "date('now','+210 minutes')" in sql, "Tehran date cutoff must remain in API SQL"
assert "WHERE telegram_id=?" in sql
assert "FROM candidate_tasks_v1" in sql
# Fix the clock for deterministic tests, without changing application code.
sql = sql.replace("date('now','+210 minutes')", "date('2026-11-11')")
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE candidate_tasks_v1 (telegram_id INTEGER, status TEXT, due_date TEXT)")
db.executemany("INSERT INTO candidate_tasks_v1 VALUES (?,?,?)", [
    (101, "done", "2026-11-01"), (101, "completed", "2026-11-01"),
    (101, "doing", "2026-11-10"), (101, "todo", "2026-11-11"),
    (101, "todo", "2026-11-12"), (101, None, "2026-11-10"),
    (202, "todo", "2026-11-01"), (202, "doing", "2026-11-10"),
])
def metrics(owner):
    return tuple(db.execute(sql, (owner,)).fetchone())
assert metrics(101) == (6, 2, 1, 2), metrics(101)
assert metrics(202) == (2, 0, 1, 2), metrics(202)
assert metrics(303) == (0, 0, 0, 0), metrics(303)
assert metrics(101) == (6, 2, 1, 2), "Alternating users must not leak metrics"
try:
    db.execute(sql)
except sqlite3.ProgrammingError:
    pass
else:
    raise AssertionError("Unbound owner query must fail")
print("PASS: assembled API SQL owner isolation, status counts, Tehran due dates and missing binding")
