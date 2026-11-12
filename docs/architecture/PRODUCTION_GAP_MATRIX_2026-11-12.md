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
