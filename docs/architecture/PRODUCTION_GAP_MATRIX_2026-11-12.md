# Candidatory production gap matrix — 2026-11-12

Scope: existing Telegram bot/miniapp and ONLY production Worker `candidatory-miniapp-api`. No second environment or deployment is authorized. News Worker and channel are excluded.

## Evidence and classification

- **سالم**: verified against current production and repository with relevant passing checks.
- **ناقص**: partially implemented or evidence incomplete.
- **نیازمند اصلاح**: observed mismatch or failed check.
- **جدید**: absent and confirmed by inventory; never infer absence from missing documentation.

| Domain | Status | Evidence / gap | Next acceptance gate |
|---|---|---|---|
| Architecture 18-chapter source | ناقص | Prior summarized document exists by reported commit d4dc29e; verbatim 18-chapter source has not been independently verified in this run | Compare original user message against versioned document line by line |
| Worker production deployment | سالم (metadata only) | Cloudflare GET deployments on 2026-11-12: deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, deployed 2026-11-11T20:05:53Z | Confirm module hashes and HTTP read-only health |
| Worker module parity | ناقص | Offline manifest builder present; production multipart module hashes not verified | Compare full inventory, entrypoint, SHA-256 and metadata |
| Binding parity, D1 and secrets | ناقص | Guard workflow success for earlier commit; full current binding/secret-name inventory and D1 schema parity not attested | Read-only metadata comparison, never secret values |
| Mobile RTL and five-tab navigation | ناقص | Prior Mini App CI passed; current production UI has not been visually verified | Mobile layout and accessibility checks with synthetic fixtures |
| Candidate profile, pathway and tasks | ناقص | Prior task-related CI passed; no full end-to-end acceptance evidence | Contract tests for ownership, persistence, state transitions |
| RBAC and tenant isolation | ناقص | Prior signed initData and owner-scoped CI passed; complete route-level permission matrix unverified | Negative authorization unit/contract tests on synthetic data |
| Modular Monolith and APIs | ناقص | Existing modules and API contract not fully mapped to architecture | Inventory modules/routes and contract compatibility |
| Controlled AI, subscriptions and payments | ناقص | No production safety/billing acceptance audit | Explicit authorization and policy review; no paid calls or charges |
| Security, CI, rollback | ناقص | GitHub workflow checks succeeded for historical commit 620c3682; rollback execution and current head CI unverified | Green checks on exact head, rollback plan, read-only smoke test |
| Production URL health | ناقص | No successful direct HTTP response verified this run | Read-only GET/HEAD of canonical URL |

## Release block
No production deployment until current SHA CI, module/binding parity, RBAC/security tests, read-only health and rollback readiness all pass. Never run write tests, login attempts, destructive D1 migrations, or real billing against production. A prior deployment identifier is not proof of rollback success.

## Source evidence
- Repository branch: `feature/cloudflare-parity-audit-2026-10-29`
- GitHub workflow runs for commit `620c3682caddc60fbb24e107caef4752bc759b5c`: artifact parity run 43253044620 and binding guard run 43253044657, both success; these are not a substitute for current-head CI.
- Cloudflare deployments API, read-only check 2026-11-12.

## Read-only verification — 2026-11-12, automation follow-up

Cloudflare deployments API was queried again for the **existing** production script `candidatory-miniapp-api`: current deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic; deployment creation `2026-11-11T20:05:53.015284Z`. This is metadata evidence, **not** proof of HTTP health or module parity.

Cloudflare script settings read-only response: compatibility date `2026-10-27`, compatibility flags empty; bindings `ADMIN_TELEGRAM_IDS` (secret_text), `ADMIN_TELEGRAM_IDS_MAHDI` (secret_text), `AI` (ai), `AVALAI_API_KEY` (secret_text), `DB` (d1; `48b3c86b-45ea-492b-96e1-334dfafa2097`), `REVIEW_DB` (d1; `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`), `TELEGRAM_BOT_TOKEN` (secret_text). No secret values accessed. Script-settings endpoint did not supply module inventory; its empty binding array is **not** evidence that script bindings are absent.

GitHub branch `feature/cloudflare-parity-audit-2026-10-29` was found and the architecture and gap documents were read. Combined commit status endpoint for `30c57bd86b69c4519f65f2f2000591e726dcc33b` returned an empty status array: **not evidence of passing or failing GitHub Actions checks**. Exact current branch HEAD and its Actions checks require separate verification. Public repository commit search returned older commits and must not be used as a branch HEAD assertion.

**Classification changes:** binding-name inventory = سالم (metadata only); production module parity = ناقص; exact-head CI = ناقص; HTTP smoke test = ناقص; rollback execution = ناقص. Release remains blocked. No deployment, D1 mutation, secret change, news Worker action, or second runtime was performed during this verification.

## Verification update — 2026-11-12 18:58 UTC

- Read-only Cloudflare deployment lookup: active deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, deployed 2026-11-11T20:05:53Z. This confirms metadata only.
- Read-only script settings: compatibility date `2026-10-27`; seven bindings: `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AI`, `AVALAI_API_KEY`, `DB`, `REVIEW_DB`, `TELEGRAM_BOT_TOKEN`. D1 IDs match earlier evidence. No secret values read.
- GitHub Actions for commit `cb74ae170fef9f49b875ea994d0c619f3a8371ae`: Worker multipart artifact parity run [43273997004](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43273997004), binding guard [43273996733](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43273996733), Mini App checks [43273996917](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43273996917), and live source parity [43273996854](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43273996854) all report completed/success. These checks are tied to that historical SHA, **not** independently established as current branch HEAD.
- Existing Actions list includes a workflow titled `Staging HTTP smoke` (run 43273996727). Its successful run does **not** authorize any staging deployment or prove no secondary environment exists. Audit and disable any forbidden staging deployment behavior before further changes; do not create or deploy to a second environment.
- Combined commit status returned no legacy statuses; this does not override successful Actions workflow results.
- Remaining release blockers: exact branch HEAD verification, production multipart source/hash parity, read-only HTTP health, complete route/RBAC audit, and a documented validated rollback path. No deployment or D1 mutation authorized.

## Verified exact-HEAD gate — 2026-11-12 20:56 UTC

- GitHub compare API verified branch HEAD **eba15c8124c031f86156b514c032ad1dc45edb33** (comparison with same SHA: identical, 0 ahead/behind).
- GitHub Actions runs associated with that exact SHA report **completed/success**: Worker multipart artifact parity [43294386843](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43294386843), binding guard [43294387611](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43294387611), Mini App checks [43294386920](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43294386920), Cloudflare live source parity [43294386828](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43294386828), mobile accessibility [43294386813](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43294386813), signed initData [43294386958](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43294386958), owner-scoped SQLite [43294387183](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43294387183). These results validate CI at the *pre-documentation-change* SHA only; the new HEAD needs fresh verification.
- Existing retired `.github/workflows/staging-http-smoke.yml` was read and contains manual-only informational echo; no deployment or network probe commands. Other workflows have **not** been exhaustively checked for forbidden external deployments.
- Cloudflare deployments API confirms production deployment **860f813c-baf4-4cff-bfc7-bb4120b910ed**, version **3c35231f-36f0-4bad-b786-9a4309d8e868**, 100% traffic, creation 2026-11-11T20:05:53Z. Read-only settings list seven binding names/types including D1 DB and REVIEW_DB, without exposing secrets.
- Canonical URL read-only probe through the available web fetcher was **inaccessible**; this is not evidence of outage. Full multipart module hashes, routes, D1 schema parity and rollback rehearsal remain unverified.
- **Release decision: BLOCKED**. No production deployment or mutation. Next: inspect complete production multipart source, compare hashes/entrypoint to versioned manifest; independently establish HTTP health and rollback plan before any release.
