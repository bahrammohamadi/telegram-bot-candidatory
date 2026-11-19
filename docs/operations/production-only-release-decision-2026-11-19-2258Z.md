# Production-only release decision — 2026-11-19 22:58 UTC

## Scope and authority
Owner's 18-chapter architecture (1405-08-21) governs. The existing `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` explicitly identifies itself as a **condensed rewrite**, not the verbatim owner message. Do not misrepresent or replace it with invented text. Only `candidatory-miniapp-api` may receive a deployment. Never create staging, preview, test Worker, second bot, or second Mini App. News Worker and channel are out of scope.

## Verified read-only evidence this run
- GitHub previous SHA: `1005f58bf6874f820067c52bd8584e0ee6f58221` (verified by commit API).
- Exact-SHA GitHub Actions: Mini App checks **success** [run 44622852579](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44622852579); offline auth regression **success** [run 44622852445](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44622852445); Worker multipart artifact parity **success** [run 44622852553](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44622852553); production release evidence gate **success** [run 44622852573](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44622852573). These are *offline checks*, not live source parity or authorization to deploy.
- Cloudflare GET deployments: active `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, deployed 2026-11-11 20:05:53 UTC. Settings GET compatibility date 2026-10-27, binding names/types inspected without secret values.
- Historical version and ETag are not module-level SHA-256 manifests or restorable artifacts.

## Critical quality discrepancy
Several CI workflow names include **“isolated”** (for example isolated D1 budget regression and isolated health probe). A workflow title does **not** prove a deployed isolated environment was created; nevertheless audit the YAML and job steps before treating them as compliant with the strict production-only rule. Pure in-process synthetic fixtures are allowed; deploying an isolated Worker/D1 or running writes against live D1 is not.

## Release gates (all mandatory)
1. Verify latest branch SHA and all required CI conclusions against that exact SHA.
2. Retrieve *complete active multi-module source* and compute per-part hashes; compare with reproducible GitHub build.
3. Read routes, metadata, binding names/types, D1 schema **read-only**; do not query sensitive rows or secrets.
4. Offline contract/security tests for Telegram signed initData, workspace-scoped RBAC, task ownership, idempotency and mobile RTL; synthetic fixtures only.
5. Identify public production homepage URL and perform non-mutating GET/HEAD smoke with recorded HTTP status.
6. Preserve complete versioned recovery artifact and independently validate rollback procedure **without actually rolling back**.
7. Only then consider a small, directly-to-main deployment. No live auth/write tests, migrations, payments, bulk notifications or paid AI calls.

## Gap matrix
| Area | Status | Next evidence |
|---|---|---|
| Existing exact-SHA offline CI (previous SHA) | سالم | Recheck after new commit |
| Production deployment identity and binding types | سالم | Confirm at release time |
| This release decision and isolated-workflow review gate | جدید | Review CI YAML |
| Verbatim owner 18 chapters | ناقص | Recover original message exactly |
| Full live multi-module parity, routes, D1 schema, homepage smoke | ناقص | Read-only inventory |
| Handler-level workspace RBAC | نیازمند اصلاح | Synthetic contract coverage |
| Validated rollback bundle | ناقص | Recoverable multi-module artifact |

**Decision: NO DEPLOY.** No Production mutations or D1 writes were performed during this run.
