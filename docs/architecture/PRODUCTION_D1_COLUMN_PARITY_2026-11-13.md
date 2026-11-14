# Read-only D1 column parity evidence — 2026-11-13

Scope: existing production Worker `candidatory-miniapp-api`; no new environment, no writes, no data rows.

Source: Cloudflare D1 query API, `PRAGMA table_info` on existing `DB` and `REVIEW_DB` bindings (both successful).

| Table | DB | REVIEW_DB | Assessment |
|---|---|---|---|
| `candidate_profiles` | 7 columns | same 7 columns | **سالم**: column names, declared types, NOT NULL and PK flags match |
| `workspace_tasks` | 11 columns | same 11 columns | **سالم**: column names, declared types, NOT NULL and PK flags match |
| `candidate_tasks_v1` | absent (zero columns) | 10 columns | **نیازمند اصلاح**: code must not assume this table exists in DB |

`candidate_tasks_v1` REVIEW_DB columns: `id TEXT PK`, `telegram_id INTEGER NOT NULL`, `title TEXT NOT NULL`, `details TEXT NOT NULL`, `priority TEXT NOT NULL`, `status TEXT NOT NULL`, `due_date TEXT`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, `done_at TEXT`.

**ناقص**: indexes, foreign keys, default values, migrations, repository SQL compatibility, data ownership, HTTP smoke, exact multipart module parity, and rollback validation remain unverified. Column equality does not imply row equality or safe rebinding.

**Release gate: BLOCKED.** Preserve both databases. Do not switch `DB` / `REVIEW_DB`, run auth/write tests, migrate, or deploy until the complete production release gate passes. Next read-only task: compare index and foreign-key metadata and inspect code references to `candidate_tasks_v1`.

Production settings read in this run: seven binding names/types, compatibility date `2026-10-27`; no secret values retrieved. This is evidence for architecture phase zero, not a release authorization.
