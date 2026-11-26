# RBAC and ownership acceptance contract — 2026-11-16

Status: **specification only; NOT a passing test or release approval**.
Scope: existing `candidatory-miniapp-api` production worker and existing Telegram mini-app. No new deployment or environment authorized.

## Required negative tests (offline, synthetic identities and records)

| Case | Synthetic setup | Required outcome |
|---|---|---|
| Unauthenticated case read | missing identity, case A | deny; no case fields leaked |
| Cross-user case read | user B requests case owned by A | deny; no record leaked |
| Cross-user case update | user B changes case A | deny; no write |
| Cross-user task read | user B requests task of case A | deny; no task fields leaked |
| Cross-user task mutation | user B updates task owned by A | deny; no write |
| Forged owner field | user B submits `owner_id=A` | server-derived ownership only; deny override |
| Invalid role | unrecognized role requests privileged operation | deny by default |
| Revoked membership | removed collaborator attempts old case access | deny |
| Missing parent | task references nonexistent/inaccessible case | deny without existence disclosure |
| Concurrent ownership change | ownership changes between read and write | write conditional on current authorized ownership |

## Implementation evidence required before production release

1. Inventory actual route-to-handler-to-query mapping from the repository and live multipart bundle; cite exact paths and line ranges in a follow-up artifact.
2. Tests must invoke **real authorization/handler functions** with stubbed D1 and synthetic Telegram identities, not a duplicate toy policy implementation.
3. Check denial at the data access layer and ensure no sensitive information is returned in error bodies or logs.
4. CI on the exact release commit must pass; preserve its run URL and commit SHA.
5. Compare complete multipart module hashes, metadata, routes, D1 bindings and secret **names/types only** with current production.
6. Preserve known-good production version and verify a rollback path **without exercising it on live users**.
7. Only then consider a small direct production release with read-only HTTP smoke checks.

## Gap classification

- **Healthy:** explicit deny-by-default acceptance criteria now documented.
- **Incomplete:** real route/handler mapping, CI-backed executable tests, production module hash parity, verified rollback package.
- **Needs correction:** any authorization implemented solely in client UI or trusting request-supplied owner IDs.
- **New:** this case/task ownership acceptance matrix.

No D1 migration, authentication probe against real users, secret value access, deployment, or change to `candidatory-news-bot` is permitted by this document.
