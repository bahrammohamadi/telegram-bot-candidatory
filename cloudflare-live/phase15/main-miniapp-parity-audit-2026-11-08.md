# Main Mini App parity boundary — 2026-11-08

## Verified state
The phase-14 pinned integration snapshot embeds a **test-only** HTML page titled «پرونده آزمایشی کاندیداتوری». Phase-15 patches this exact embedded page and adds owner-scoped task counts to the progress API and UI. It is **not** proof that the original production Telegram Mini App navigation, database, existing modules, or user data are integrated. The branch's isolated integration Worker deployment was last recorded as `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`; this audit makes no deployment.

## Read-only audit
Run `node cloudflare-live/phase15/main-miniapp-parity-audit.mjs` against the pinned snapshot. It checks shared task/progress page and route presence, and prints an explicit NO-GO for promotion. The check is an inventory guard, not real Telegram WebView QA or source parity with the production Mini App.

## Next integration tasks
1. Identify the actual active Mini App source and exact production deployment hash **read-only**, without touching the news Worker.
2. Diff its navigation and API contract against phase-15 integration; produce a route-by-route preservation matrix for profile, quizzes, learning, tasks, progress, archive, team, expenses, settings, and admin permissions.
3. Implement the missing modules inside **one** main Mini App candidate on the development branch; test in isolated Worker and D1 only.
4. Verify two real signed Telegram accounts, user isolation, mobile widths 320/375/430, receipts privacy, backup/restore, and rollback before any promotion.

## Rollback and authorization
This commit adds only audit files, no migrations, secrets, bindings, or deployments. Roll back by reverting the audit commit. For integration Worker rollback use the pinned phase-14 snapshot and documented prior deployment; do not touch production or real D1. Production deployment requires separate explicit user approval for an exact tested commit.

## CI enforcement (2026-11-08)
The isolated task progress GitHub Actions workflow now runs `node cloudflare-live/phase15/main-miniapp-parity-audit.mjs` on every relevant push. Its PASS confirms **only** internal isolated task/progress page consistency; the printed `NO-GO` remains a production release block. Do not interpret a green workflow as evidence of parity with the live main Telegram Mini App.

**Evidence before this change:** development HEAD `102ab17855474e43ae6f673d7e86f0c6c26c497e`; phase15 CI passed (`42512519153`), isolated HTTP auth failed (`42512523895`), staging HTTP smoke failed (`42512524026`), source parity passed (`42512523857`). Cloudflare read-only deployment list confirmed the latest isolated deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06T07:58:50Z). No Worker or D1 changes were made.

**Rollback:** revert the workflow-only commit to remove the parity CI step, and revert this documentation commit if necessary. Neither revert changes the isolated Worker, D1, production bot, or Telegram channel. Do not deploy phase15 until HTTP health failures and live Mini App parity are independently resolved.
