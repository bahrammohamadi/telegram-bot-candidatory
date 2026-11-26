# Main-only production release decision — 2026-11-15 16:50 UTC

Scope: existing `candidatory-miniapp-api` ONLY; this document does not authorize deployment. No alternate Worker, bot, staging, preview, test deployment, or production write.

## Verified evidence
- GitHub branch: `feature/cloudflare-parity-audit-2026-10-29`.
- GitHub Actions for security regression commit `e50267378320bc469e3b3e220939f33116a6cd57`: `Mini App checks` succeeded (run 43732445614); `Worker multipart artifact parity` succeeded (43732445613); `Candidate main-only offline auth regression` succeeded (43732445664); `Worker binding parity guard` succeeded (43732445812). These runs establish CI results for THAT commit, not this documentation commit.
- Cloudflare GET deployments on 2026-11-15: latest deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed` created `2026-11-11T20:05:53.015284Z`, serving 100% version `3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Cloudflare GET settings: compatibility date `2026-10-27`; bindings `DB` and `REVIEW_DB` (D1), `AI` (AI), `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` (secret_text; values NOT read). Subdomain enabled, previews disabled.
- The checked-in `miniapp/tests/navigation-real-function-contract.test.mjs` uses synthetic DOM and no production writes.

## Exact release blockers and acceptance evidence
| Item | Classification | Evidence required before ANY release |
| --- | --- | --- |
| Existing Worker deployment identity and binding inventory | سالم (read-only observed) | Recheck immediately before release |
| Offline auth / Mini App CI for e502673 | سالم (for that SHA only) | All required checks for actual release SHA |
| Exact active multipart module inventory and byte/hash parity | ناقص | Read-only inventory; deterministic bundle comparison |
| D1 schema and route parity | ناقص | Read-only schema and route inventory; no migrations |
| Authorization / owner isolation across profile, path and tasks | نیازمند اصلاح | CI security tests using fabricated identities and records |
| Rollback | ناقص | Exact prior complete multipart artifact, metadata, bindings, D1 compatibility and documented revert command/owner; no dry-run deployment |
| Canonical production URL and independent GET health | ناقص | Read-only HTTP status, date and endpoint; no auth probes |
| Verbatim 18-chapter architecture archival | ناقص | Exact original text; existing condensed rewrite must not be represented as verbatim |
| RTL five-tab mobile accessibility acceptance | جدید | Automated checks and review of real shipped HTML/CSS |

## Decision
**NO DEPLOY.** A previous deployment ID is not proof of a recoverable multipart artifact. No production changes, token exposure, payments, AI consumption, D1 writes, bot messaging or permission changes. Keep `candidatory-news-bot` and `@candidatoryiran` untouched.

Next slice: obtain active multipart inventory and compare with GitHub module list; then add a deterministic, offline parity guard to CI. Do not claim live smoke-test or successful rollback until independently verified.
