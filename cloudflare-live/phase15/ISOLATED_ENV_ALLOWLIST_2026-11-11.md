# Phase 15 — isolated environment allowlist (2026-11-11)

Scope: development branch only; no Worker/D1 deployment or production mutation.

## Change
The isolated deployment guard now accepts only empty, integration, staging, test, testing, development, or dev for TARGET_ENV, CLOUDFLARE_ENV, and WRANGLER_ENV. Unknown values (including prod, live, main, release, and production-preview) fail closed instead of being accepted. The exact integration Worker and D1 identifiers remain mandatory. Production authorization flags continue to fail closed.

## Verification
Run `node --test cloudflare-live/phase15/assert-integration-target.test.mjs` and inspect the integration-target-guard workflow at the final SHA. Before any staging deployment, verify successful CI, live Worker bindings, current version and backup. Synthetic tests do not certify real Telegram accounts or mobile UX.

## Rollback
Revert commits `5fac9d8027ff15048db83d86d5000e2ef55f1180` and `d712e554034483eb43ab391e5fa2cddc6d8ab064` in reverse order if needed, then rerun the guard tests. This is repository-only: no Cloudflare rollback is required. Do not deploy production or touch the news Worker.
