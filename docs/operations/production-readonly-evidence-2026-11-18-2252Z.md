# Production release evidence — 2026-11-18 22:52 UTC

Scope: candidatory-miniapp-api ONLY. Read-only verification; no deployments or D1 writes.

## Live Cloudflare evidence
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (100% traffic)
- Created: `2026-11-11T20:05:53.015284Z`
- Compatibility date: `2026-10-27`
- Binding names/types: ADMIN_TELEGRAM_IDS (secret_text), ADMIN_TELEGRAM_IDS_MAHDI (secret_text), AI (ai), AVALAI_API_KEY (secret_text), DB (d1), REVIEW_DB (d1), TELEGRAM_BOT_TOKEN (secret_text). Secret values were not read.
- Routes, production multipart source hashes, D1 schema, primary URL health, rollback execution: NOT VERIFIED.

## Architecture source
`docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` explicitly says it is a compressed structured rewrite, NOT the verbatim 18-chapter original. Do not claim full source archival. The original November 12 user message still needs exact recovery and byte-for-byte preservation.

## Release gate: BLOCKED
No successful CI check was verified for the previously reported `ed12c56d7036f959b0a6fcd6bb9f02205bb14057` (combined statuses empty; this alone does not prove Actions status). No verified multipart parity, RBAC test coverage or executable rollback package. Do not deploy.

## Gap matrix
| Item | State | Evidence |
|---|---|---|
| Production deployment identity | سالم | Live Cloudflare GET |
| Binding inventory (names/types) | سالم | Live Cloudflare GET |
| Original 18-chapter verbatim archival | ناقص | Existing doc labels itself summary |
| Current branch HEAD and Actions conclusions | ناقص | Not established |
| Source-module hash parity and D1 schema | ناقص | Not established |
| RBAC real handler unit tests | نیازمند اصلاح | Not established |
| Five-tab RTL implementation | نیازمند اصلاح | Not established |
| Verifiable rollback package | جدید | Must build without secondary environment |

Next: inspect current branch HEAD and Actions, retrieve original source, then build offline parity and rollback evidence. Keep candidatory-news-bot and @candidatoryiran unchanged.