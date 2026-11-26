# Production parity checkpoint — 2026-11-23 13:54 UTC

Reference: 18-chapter architecture v1, 21 Aban 1405. Existing `CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` is an **abridged reconstruction**, not the verbatim user text. Do not claim archival completeness.

## Verified production
- Worker: `candidatory-miniapp-api` (only authorized deployment target).
- Deployment: `cbf1de3e-30a7-47a4-9a34-85655a2a4131`; 100% version `18b32aa2-d296-43d2-a1fd-47f8aa2d4a70` (v109), created `2026-11-23T13:54:43Z`.
- Bindings (names/types only): ADMIN_TELEGRAM_IDS(secret_text), ADMIN_TELEGRAM_IDS_MAHDI(secret_text), AI(ai), AVALAI_API_KEY(secret_text), DB(d1), REVIEW_DB(d1), TELEGRAM_BOT_TOKEN(secret_text). Values never retrieved.
- Script routes endpoint returned empty array; this does **not** prove the absence of workers.dev/custom domain endpoints.
- UI v109 includes mobile dashboard greeting and compact clay-style cards, but no verified end-to-end WebView smoke test.
- Rollback candidate: prior v108, but deployment/version compatibility must be rechecked immediately before any rollback.

## Gap matrix (evidence-limited)
| Chapter / area | Status | Evidence / next check |
|---|---|---|
| 1-2 Product principles | ناقص | Reference exists in abridged form; verbatim original not archived |
| 3 RBAC | نیازمند اصلاح | Server-side workspace permission matrix not fully verified |
| 4 Journey | ناقص | Onboarding exists; full 11-step lifecycle unverified |
| 5 Mobile RTL UX | نیازمند اصلاح | Production v109 UI changed; real WebView verification pending |
| 6 Modular Monolith | ناقص | Three-module Worker bundle observed earlier; full domain boundaries unverified |
| 7-8 Data/API | ناقص | D1 bindings exist; migrations, schema, API contracts not audited in this checkpoint |
| 9 AI controls | ناقص | AI binding exists; cost/approval/safety enforcement unverified |
| 10 Subscription | ناقص | Experimental quotas observed, billing not validated |
| 11-12 Security/Privacy | نیازمند اصلاح | Secrets masked; full authorization and deletion tests pending |
| 13 DevOps | نیازمند اصلاح | Production-only constraint; static CI required before release |
| 14-18 Quality, phases 0-8 | ناقص | Traceability and acceptance evidence incomplete |

## Safe next action
Retrieve exact original 18 chapters without replacing abridged text; inspect branch HEAD and GitHub Actions check-runs, metadata/route and D1 schema **read-only**. Add offline contract checks using synthetic data; do not deploy until CI green and safe rollback validated. Never create a second Worker or preview environment. No writes to production D1, billing, AI, or news Worker.
