# Candidatory v1.0 — architecture-to-production traceability
Source: user-provided 18-chapter master architecture (1405/08/21). **This is an initial traceability register, not a transcription of the full source document.**
Target: existing Telegram bot and `candidatory-miniapp-api` production Worker ONLY. No secondary runtime is authorized.

Status vocabulary: **verified**, **partial**, **needs-review**, **new**, **blocked**. Never infer implementation from the architecture proposal.

| Chapter | Requirement / acceptance focus | Evidence available | Current status | Next verification |
|---|---|---|---|---|
| 01 | Operational candidate workspace, not just chat | Product definition supplied | needs-review | Inventory current features |
| 02 | Fast value, human approval, AI optional | Product rules supplied | needs-review | First-use workflow test |
| 03 | Workspace-scoped RBAC | No live authorization test in this review | needs-review | Read auth handlers and negative tests |
| 04 | 11-step candidate journey, official verification separated | Proposed journey only | needs-review | Map current flows |
| 05 | Five-tab RTL mobile UI, quick capture, draft retention | Production UI not inspected in this review | needs-review | Read active UI module and run accessibility audit |
| 06 | Modular monolith on existing Cloudflare stack | Active Worker known to be multipart historically | partial | Compare full active modules with repository |
| 07 | Modular repository boundaries | Existing release validation scripts verified previously | partial | Inventory directories, avoid unnecessary rewrite |
| 08 | Workspace-owned relational entities and versioned migrations | D1 bindings present historically, schema unverified | needs-review | Read schema read-only; compare actual migrations |
| 09 | Versioned API and consistent errors | No current route inventory | needs-review | Generate route map and contract tests |
| 10 | Permissioned AI orchestrator, citations, quotas | No live AI evidence | needs-review | Inspect adapters and approval gates |
| 11 | Entitlement-based plans and payment verification | Pricing remains a hypothesis | needs-review | Read-only subscription audit |
| 12 | Signed Telegram initData, isolation, privacy | No verified negative tests in this run | needs-review | Static auth tests using synthetic fixtures |
| 13 | Exact artifact, bindings, rollback, observability | Worker deployments and settings inspected; production version 3c35231f-36f0-4bad-b786-9a4309d8e868 | partial | Validate exact multipart artifact and binding parity |
| 14 | QA, idempotency, WCAG 2.2 AA, recovery | CI not yet verified for current head | needs-review | Collect CI evidence and test matrix |
| 15 | ADRs, runbooks, definition of done | docs/decisions/ADR-0002-production-only-execution.md committed | partial | Expand DoD and runbooks |
| 16 | Phases 0–8 driven by observed gaps | This matrix begins phase 0 | partial | Rank verified gaps |
| 17 | Evidence-based scorecard | No numerical evidence sufficient | blocked | Define denominator and measure |
| 18 | One production product, incremental safe releases | Production-only policy committed | partial | Confirm exact production release gate |

## Observed baseline (read-only, 2026-11-12)
- Worker: `candidatory-miniapp-api`; deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100%.
- Historical prior deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1`, version `32d33109-8e48-4c9e-a38a-4dd91012967b`. Its presence in history does not prove rollback execution.
- GitHub `scripts/verify-worker-bindings.mjs` exists; passing CI has not been established in this register.
- No change to production Worker, D1 data, news bot, or channel from this documentation commit.

## Release decision
**NO DEPLOY** until the exact active multipart source, candidate artifact, bindings, routes, CI, auth and rollback are checked. No staging/preview/test Worker or database may be created. Use non-deployed static/unit tests with synthetic data. Never use production user records for write tests.

## Next actionable slice
1. Read production `entrypoint.mjs`, `legacy.mjs`, `preview.mjs` and metadata without revealing secrets; compare to GitHub.
2. Read current CI results for exact HEAD; resolve failures.
3. Choose one small accessible RTL UI fix, build a complete artifact, prove rollback and only then publish to existing Worker.

## Evidence update — 2026-11-22 (read-only)

- Retrieved this traceability document and the structured 18-chapter architecture from the specified branch. The architecture file explicitly states that it is a **compressed structural rewrite**, not the original verbatim user document. **Original full text remains missing**; do not present the summary as a recovered transcription.
- Queried Cloudflare's actual deployment API for the **existing** `candidatory-miniapp-api` Worker. Latest returned deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (2026-11-11T20:05:53.015284Z), active version `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100%. This is fresh read evidence, **not** a new deployment.
- Previous deployment in API response: `3d172eb9-eca1-45e5-9070-760970d1f8c1`; prior version `32d33109-8e48-4c9e-a38a-4dd91012967b`. Prior presence is **not** a proven rollback procedure or artifact.
- Status mapping for requested vocabulary: **سالم** = verified with reproducible evidence; **ناقص** = partial or missing evidence; **نیازمند اصلاح** = observed defect requiring correction (not merely unverified); **جدید** = confirmed absent and required. Do not mark missing evidence as a confirmed defect or absent feature.
- Chapter 13 remains **ناقص**: live deployment identity verified, but active multipart code, metadata, bindings, routes, D1 schema, secrets names, artifact parity and executable rollback not verified in this update. Chapters 3, 8, 9, 12, 14 remain **ناقص** until source/CI/contract checks; no unsupported **سالم** classification.
- Release gate: **NO DEPLOY** until exact candidate SHA and CI, all modules and bindings, authorization tests, public URL read-only smoke check and rollback proof pass. No second runtime, production write-test, D1 migration, payment, paid AI or mass messaging authorized.
- Next safe code slice: static tests with synthetic fixtures for task ownership/workspace isolation and mobile RTL states; preserve existing code and data. This entry is documentation-only.
