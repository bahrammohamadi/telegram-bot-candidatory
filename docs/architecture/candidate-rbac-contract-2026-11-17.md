# Candidate case/task RBAC contract — offline acceptance gate (2026-11-17)

Status: proposed contract, NOT a claim of implemented behavior. Scope: canonical architecture v1, phases 0–8, candidate case, journey and tasks. Production target ONLY: existing `candidatory-miniapp-api`. No deployments or database writes from this document.

## Deny-by-default authorization matrix

| Actor | Own case read | Other candidate case read | Own task update | Other candidate task update | Admin change |
|---|---|---|---|---|---|
| Unauthenticated | DENY | DENY | DENY | DENY | DENY |
| Candidate A | ALLOW (verified ownership) | DENY | ALLOW (verified ownership + allowed transition) | DENY | DENY |
| Candidate B | ALLOW (verified ownership) | DENY | ALLOW (verified ownership + allowed transition) | DENY | DENY |
| Admin | Only explicitly documented scope | Only explicitly documented scope | Only explicitly documented scope | Only explicitly documented scope | DENY absent separate authorization |

## Required synthetic contract cases

1. A token/session for candidate A cannot read or mutate case B even if the URL/body contains B's ID.
2. Candidate B cannot update task A via forged `candidate_id`, `owner_id`, or nested payload fields.
3. Missing, expired, malformed, or unverified Telegram initData fails closed; never trust client-supplied user ID.
4. Request method and content type validation precedes mutation; unsupported transitions and replayed mutations must fail safely.
5. Server-side ownership is resolved from authenticated principal and D1 relationships, not from the request body.
6. Response and logs must not leak tokens, secrets, private case fields or other users' existence beyond the authorized policy.
7. UI five tabs (امروز / مسیر من / کارها / یادگیری / حساب) must render RTL on 360px and 390px widths, keep keyboard focus visible, and never reveal protected data in initial HTML or client cache.
8. Public read-only root smoke check must not invoke login, create data, trigger AI, or send Telegram messages.

## Release evidence checklist

- [ ] Link each requirement to actual source handler/module and test file at one candidate SHA.
- [ ] Run static/unit/contract tests with synthetic identities and fixtures in existing GitHub CI; record run URL and conclusion.
- [ ] Compare complete multipart Worker bundle hashes, routes, metadata, D1 binding names/types, and secret names/types (never values).
- [ ] Verify immutable rollback artifact and restoration procedure without D1 migration.
- [ ] Confirm no staging, preview, test Worker or second bot is created or called.
- [ ] Only then consider a direct deployment to existing production Worker; record version, deployment ID, timestamp and read-only smoke result.

No production authorization or UI implementation is asserted by this document. Worker `candidatory-news-bot` and channel `@candidatoryiran` remain out of scope.
