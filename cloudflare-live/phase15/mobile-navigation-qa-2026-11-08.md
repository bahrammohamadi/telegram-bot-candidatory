# Phase 15 — isolated Mini App mobile/navigation QA (2026-11-08)

## Change
- Added `cloudflare-live/phase15/miniapp-mobile-navigation-regression.mjs` and wired it into `.github/workflows/candidatory-task-progress-validation.yml`.
- The regression parses the actual assembled Worker embedded HTML (not a separate mockup). It checks Persian RTL and mobile viewport/safe-area, visible keyboard focus, 46px touch controls, unique DOM IDs, task/progress/goals navigation elements, owner-scoped task summary in progress and export, and same-origin API calls.
- This is **static synthetic QA**, not real Telegram WebView/mobile device certification or proof of parity with the production Mini App. Do not mark production release ready from this result alone.

## Verification and release boundary
- Run `node cloudflare-live/phase15/build-progress-tasks.mjs && node cloudflare-live/phase15/miniapp-mobile-navigation-regression.mjs` on Node 22.
- CI workflow: `Isolated task progress integration` on the development branch. Record the exact green run before considering any test deployment.
- Independent live integration HTTP auth gate was failing with `/health` HTTP 503 (`DB_UNAVAILABLE`) as of run 42522358968, despite 14 negative auth checks passing. Do not conflate a static QA pass with D1 readiness.
- No Cloudflare deployment, database migration, production Mini App update, payment activation or user notification is part of this change.

## Rollback
- Revert the two commits that added the regression and its CI step, or remove the single `Isolated mobile navigation and same-origin UX regression` step from the workflow. No Worker or D1 rollback is necessary because neither was changed.
- Before any future test Worker deploy, pin the existing integration deployment ID and bindings; run signed synthetic auth and owner-isolation tests, HTTP readiness and mobile QA, then compare the candidate against the real main Mini App. Production promotion remains separately approval-gated.
