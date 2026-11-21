# Staging HTTP failure triage — 2026-11-06

## Verified baseline
- Branch was at `4d9dc0abc4cd8e838ee5efa19f1faf71f9bd8b48` before this diagnostic patch.
- Phase 15 is already deployed to **isolated integration** Worker, deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`; no changes to that Worker in this run.
- Independent preview Worker `candidatory-miniapp-staging` is separate, and `Staging HTTP smoke` run [42184507789](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42184507789) failed at `/api/staging/health` with HTTP 500. Static `/`, `/style.css`, `/app.js` had succeeded.
- Its visual job passed 320px initial checks but timed out waiting for `#staging-dashboard-body .staging-kpis`.
- Read-only D1 inspection of the isolated staging DB was **blocked by Cloudflare API 7500**: account exceeded the daily free-tier D1 row-read limit. Therefore schema and runtime SQL correctness were NOT confirmed, and quota exhaustion is a plausible explanation for HTTP 500, **not proven**.
- Source inspection: preview health queries `staging_test_users` and `staging_test_tasks` directly without a catch around DB errors; quota failure can therefore surface as 500.

## Action in this run
- Updated `.github/workflows/staging-http-smoke.yml` to capture health HTTP status, emit a precise CI annotation, and print only a bounded structured error code (no arbitrary body/credentials). A non-200 health response still **fails closed**.
- No production/news Workers, database records, bindings, secrets, public posts, payments, or AI settings were modified.

## Next acceptance gate
1. Wait for daily D1 row-read quota reset (midnight UTC) or obtain an authorized quota increase. Do not retry DB queries repeatedly while limited.
2. Read-only inspect isolated staging D1 table existence and safe counts; compare to synthetic fixture expectations (2 users, 3 tasks).
3. Run `/api/staging/health`, `dashboard`, `overview` via GitHub CI; only if failures persist after quota reset, reproduce locally and prepare a minimal preview-only fix.
4. Run the existing 320/375/430px Playwright job, and separately validate signed Telegram integration sessions. Do not infer WebView success from preview UI.
5. For any future staging Worker change, preserve exact deployed source and deployment ID, verify bindings and rollback candidate, deploy only to preview, read back exact script and repeat smoke.

## Rollback of this run
Revert the single CI workflow commit that added the diagnostic status capture; no Cloudflare rollback or D1 migration is necessary because this run changed GitHub workflow only.

## Release gate
Production promotion remains prohibited until real Telegram account testing, security and parity checks, backups and explicit per-operation approval.