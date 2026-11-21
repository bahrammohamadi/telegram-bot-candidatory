# Production release gate — 2026-11-21 04:59 UTC

Scope: existing Telegram mini-app and Cloudflare Worker `candidatory-miniapp-api` only. No new environment, worker, preview or deployment is authorized.

## Verified read-only evidence
- Cloudflare deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed` at 2026-11-11T20:05:53Z, serving 100% version `3c35231f-36f0-4bad-b786-9a4309d8e868` (read from Worker deployments endpoint on 2026-11-21).
- Worker settings: compatibility_date 2026-10-27; bindings `DB` and `REVIEW_DB` (D1), `AI`, and four secret_text bindings. Secret values were not accessed. Subdomain enabled, previews disabled.
- CI for previous SHA `7ca8d88ae16187d4105514dfdef60f7ace0e3ac9`: GitHub Actions runs 44863753243, 44863753222, 44863753213, 44863753276, 44863753189 and 44863753336 returned completed/success on read. This is **not** proof of successful CI for this documentation commit or complete release readiness.

## Blocking release conditions
1. Full verbatim 18-chapter architecture document (2026-11-12 source) not yet recovered and versioned; summary is not an equivalent source.
2. Current branch HEAD and complete current CI checks must be revalidated immediately before release.
3. Downloaded multi-module Worker artifact must be compared with GitHub sources and deployed metadata, routes, D1 bindings, secret names, and role guards; never read secret values.
4. Run static, contract and offline behavioral tests with synthetic identities and fake D1, including RBAC, malformed JSON, D1 errors, and GET no-write.
5. Capture and validate an executable rollback procedure for the existing Worker before any production deployment.
6. Confirm the actual public URL, then perform read-only smoke checks. No production auth/write tests.

## Gap classification
| Area | Status | Evidence / next step |
| --- | --- | --- |
| Worker identity and deployment | سالم | Read-only Cloudflare deployment list |
| Binding names and secret count | سالم | Worker settings/secrets metadata |
| Production-only deployment guard | سالم | Existing CI run 44863753276 passed on previous SHA |
| Complete 18-chapter source | ناقص | Recover original user text, preserve verbatim |
| Current multi-module parity and routes | ناقص | Compare actual module package and routes |
| Comprehensive RBAC | نیازمند اصلاح | Prove offline authorization tests |
| Validated rollback and public URL smoke | ناقص | Capture verified procedures and URL |
| This dated release gate | جدید | Documentation only, no runtime change |

No production release is approved by this document. Do not modify `candidatory-news-bot` or `@candidatoryiran`.
