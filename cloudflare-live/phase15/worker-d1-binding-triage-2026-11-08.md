# Phase 15 — Worker/D1 incident triage (2026-11-08)

## Verified read-only evidence
- Development branch baseline: ccd94c1572c32d3cdcfdb2921030e2a4850a0b2d (checked via GitHub compare, identical).
- Cloudflare GET Worker settings: integration Worker `candidatory-miniapp-integration` has D1 binding **name `DB`**, database UUID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`. Other binding names only; secret values not inspected or recorded.
- Cloudflare GET D1 metadata: database `candidatory-integration-test-20261101`, same UUID. This rules out a *missing or wrong database UUID* in the deployed Worker settings at inspection time. It does **not** establish correct application binding-name usage, query behavior, quota, or health.
- Last integration Worker deployment: `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06 07:58:50 UTC). No deployment performed during this triage.
- Existing GitHub Actions gates: integration auth smoke run 42423130196 **failure** (HTTP 503 DB_UNAVAILABLE); staging smoke/mobile run 42423130215 **failure**; source parity run 42423130202 **success**. Staging and integration are distinct targets.

## Next safe diagnostics (integration only)
1. Inspect the deployed integration Worker source for `env.DB` usage in the health handler; compare schema/query with D1 migrations. Do not infer from the binding metadata alone.
2. Read Cloudflare integration Worker runtime exception logs and D1 quota/usage at the timestamp of a *single* health probe. Redact tokens, user IDs, request bodies, and receipt data; do not log Telegram initData.
3. Run one unauthenticated health probe against the **integration** endpoint and record only status, sanitized error code and UTC timestamp. Never probe or alter `candidatory-news-bot`.
4. If the runtime exception indicates schema drift, back up **integration D1** first, then propose a migration with a tested down/restore plan. No real-data migrations.
5. Re-run integration HTTP auth smoke and mobile QA after a reviewed fix. Require all mandatory gates green before considering an integration redeploy.

## Rollback / safety
This document is read-only diagnosis; no database writes, code execution in Worker, or deployment. Revert this commit to remove the runbook. If a later integration deployment fails, roll back to known deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` **only after verifying it is an appropriate working target**; this version currently fails health and must not be called healthy. Do not change production or news Worker. Production release: **NO-GO**.
