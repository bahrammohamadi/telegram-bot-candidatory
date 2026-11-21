# Production-only architecture gap and release gate — 2026-11-20

Scope: existing Telegram bot and Mini App, only Cloudflare Worker `candidatory-miniapp-api`. No staging, preview, new Worker, or test deployment. Do not touch `candidatory-news-bot` or @candidatoryiran.

## Source integrity
The existing `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` explicitly identifies itself as a **condensed structured rewrite**, not the verbatim 18-chapter original dated 1405-08-21. Do not represent it as a complete transcript. Full original remains **incomplete** pending verifiable recovery.

## Gap matrix (evidence as of 2026-11-20)
| Area | State | Evidence / release consequence |
|---|---|---|
| Original single Worker identity | سالم | Cloudflare deployment API: `candidatory-miniapp-api` |
| Production deployment identification | سالم | deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, 2026-11-11T20:05:53Z |
| Current GitHub Mini App auth source | سالم | `miniapp/src/worker.mjs` uses `env.TELEGRAM_BOT_TOKEN || env.BOT_TOKEN`; Telegram initData verification before API handlers |
| Binding contract | نیازمند اصلاح | Cloudflare names: `DB`, `REVIEW_DB` (D1); `AI`; `TELEGRAM_BOT_TOKEN`, `AVALAI_API_KEY`, `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI` (secrets). Verify *all* module dependencies before release |
| Full 18-chapter verbatim architecture | ناقص | Existing architecture document explicitly says non-verbatim condensed rewrite |
| Five-tab mobile RTL, journey, tasks, team, learning | نیازمند اصلاح | Compare actual UI and handlers against each requirement, not just filenames |
| Workspace-scoped RBAC and IDOR behavioral tests | ناقص | Static ownership assertions are insufficient; run offline behavioral tests with synthetic DB fixtures |
| Production multipart module parity | ناقص | Reconstruct and hash all modules/assets/metadata; compare against GitHub build and deployment before any upload |
| CI on release SHA | ناقص | Must record actual successful checks on exact proposed release commit, not historical successes |
| Rollback | ناقص | Need verified existing-version restoration procedure and binding/metadata compatibility; no live rollback rehearsal |
| Production smoke-test | ناقص | Read-only GET of verified primary URL only; no auth or write probes |
| Release evidence gate | جدید | This file documents mandatory blockers; it does not authorize deployment |

## Release hard stop
Never deploy unless (1) complete multipart module/asset manifest and parity, (2) secrets names/types and D1 bindings verified without exposing values, (3) successful CI for exact SHA, (4) synthetic auth/RBAC/security contract tests, (5) rollback target and procedure validated offline, (6) verified main URL and safe read-only smoke plan. No production D1 writes for tests, migrations, paid AI, bulk notifications, role changes or payments without separate authorization.

## Next executable work
Implement an offline behavioral regression for task ownership and candidate records against a synthetic D1 adapter, wired into existing CI. Review the CI result on the exact SHA before further edits. Preserve prior data and code.
