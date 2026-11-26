# Production D1 task-index evidence — 2026-11-13 04:59 UTC

Scope: ONLY existing `candidatory-miniapp-api`, read-only schema inspection. No data rows, migrations, deployment, staging, preview, or second environment.

## Fresh verification
- GitHub branch HEAD before this commit: `1c334de6fedecc7f5668e546d7c8355743d9d8c8` (GitHub commit-by-ref).
- GitHub Actions for that SHA: 13 completed/success runs including [multipart artifact guard](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43361818405), [binding parity](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43361818215), [Mini App](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43361818107), [signed initData](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43361818173). These are checks on the pre-documentation SHA, not this new commit.
- Cloudflare production deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, created `2026-11-11T20:05:53Z`.
- Worker compatibility date: `2026-10-27`; binding names/types: `ADMIN_TELEGRAM_IDS` (secret_text), `ADMIN_TELEGRAM_IDS_MAHDI` (secret_text), `AI` (ai), `AVALAI_API_KEY` (secret_text), `DB` (d1), `REVIEW_DB` (d1), `TELEGRAM_BOT_TOKEN` (secret_text). No secret values accessed.

## Verified task index columns
Cloudflare D1 read-only query on **existing REVIEW_DB**:
```sql
PRAGMA index_info('idx_candidate_tasks_owner_due');
```

| seqno | cid | column |
|---|---:|---|
| 0 | 1 | `telegram_id` |
| 1 | 5 | `status` |
| 2 | 6 | `due_date` |

The index column order is `telegram_id, status, due_date`. Query metadata: `rows_read=0`, `rows_written=0`, `changes=0`, `changed_db=false`. This validates index column metadata only; no workload performance or row-level authorization claim.

## Classification / release gate
- `candidate_tasks_v1`: **نیازمند اصلاح**: previous schema evidence found it in REVIEW_DB but absent in DB; current index check confirms the REVIEW_DB index definition. Do not switch D1 binding.
- Production metadata and index-column inventory: **سالم (metadata only)**.
- Module hash parity, route-level RBAC, canonical HTTP smoke, and tested rollback: **ناقص**.
- **Deployment: BLOCKED.** Historical deployment is not proof of rollback. No deployment or D1 writes performed.

Next: inspect repository code references to `candidate_tasks_v1` and the effective read/write route mapping, then verify canonical URL and rollback before preparing a minimal UI/UX patch. Avoid any real-data write tests.
