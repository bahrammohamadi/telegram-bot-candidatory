# Production-only release gate — Candidatory v1.0
Date: 2026-11-12 UTC. Scope: existing Telegram miniapp and ONLY `candidatory-miniapp-api`. No staging, preview, test worker or second runtime.

## Hard stop gates (all required)
- [ ] Exact GitHub branch SHA and successful Actions checks **for that SHA** (artifact, binding guard, Mini App, accessibility, initData, owner-scoped tests).
- [ ] Download/read-only inventory of live multipart Worker modules; compare each path and SHA-256 with repository artifact manifest, verify main module and imports. No replacement of a multi-module script by a single file.
- [ ] Read-only verification of live script settings, route(s), compatibility date, binding names/types and D1 identifiers/schema. Never fetch secret values.
- [ ] Contract/security tests on synthetic fixtures: reject invalid signed initData, unauthorized cross-owner access, and privilege escalation; no real-user login or write test.
- [ ] Canonical production URL identified from actual routes and read-only GET/HEAD response checked; no invented URL.
- [ ] Save exact pre-release module bundle, metadata and version/deployment IDs; document rollback commands and verify restore inputs offline. Historical version presence alone is not rollback validation.
- [ ] Change is scoped to a small RTL mobile/profile/path/tasks slice and independently reviewed; no D1 migration, real payment, paid AI, bulk notifications, or admin privilege edits.
- [ ] After approved direct production deployment: record UTC time, exact GitHub SHA, new Cloudflare version/deployment, read-only smoke response and rollback status. Stop and report on any mismatch.

## Current baseline evidence (read-only 2026-11-12)
Branch SHA verified by compare API: `c600bd034afe163e4ef3e7a57e9fa2ca7dcd8f62`. CI for this exact SHA **not independently confirmed**.
Production deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`; version `3c35231f-36f0-4bad-b786-9a4309d8e868`; 100% traffic; created 2026-11-11T20:05:53Z. Compatibility date `2026-10-27`. Binding names/types: ADMIN_TELEGRAM_IDS(secret_text), ADMIN_TELEGRAM_IDS_MAHDI(secret_text), AI(ai), AVALAI_API_KEY(secret_text), DB(d1), REVIEW_DB(d1), TELEGRAM_BOT_TOKEN(secret_text). Secret values were not read.

## Decision
**BLOCKED** pending module parity, exact-head CI, canonical URL read-only smoke, RBAC matrix and verified rollback inputs. Do not deploy. Preserve `candidatory-news-bot` and `@candidatoryiran`.
