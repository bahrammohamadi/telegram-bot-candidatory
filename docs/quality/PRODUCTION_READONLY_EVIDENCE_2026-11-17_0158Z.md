# Production-only release evidence — 2026-11-17 01:58 UTC

Scope: existing Telegram bot, existing mini-app and **candidatory-miniapp-api** only. No secondary environments, deployments or destructive data operations permitted.

## Live Cloudflare read-only evidence
- Worker: candidatory-miniapp-api
- Active deployment: 860f813c-baf4-4cff-bfc7-bb4120b910ed (2026-11-11T20:05:53Z)
- Active version: 3c35231f-36f0-4bad-b786-9a4309d8e868 (100% traffic)
- Previous recorded deployment: 3d172eb9-eca1-45e5-9070-760970d1f8c1; previous version: 32d33109-8e48-4c9e-a38a-4dd91012967b. **Not a validated rollback package.**
- Compatibility date: 2026-10-27; flags: none; usage: standard.
- Binding names/types: DB (d1), REVIEW_DB (d1), AI (ai), ADMIN_TELEGRAM_IDS (secret_text), ADMIN_TELEGRAM_IDS_MAHDI (secret_text), AVALAI_API_KEY (secret_text), TELEGRAM_BOT_TOKEN (secret_text).
- Secret values intentionally not accessed. No D1 queries executed.

## Source and CI observations
- Existing branch workflow .github/workflows/candidatory-tasks-validation.yml has offline node tests and Playwright locally; contents inspected.
- GitHub commit search returned older repository commits only, not authoritative branch HEAD; branch SHA and CI success remain **unverified**.
- Worker multipart source/module hashes, routes, URL homepage health and complete architecture text not verified in this run.

## Release gate — CLOSED
1. Recover and version full 18-chapter architecture verbatim; map requirements to actual handlers.
2. Verify branch HEAD and all required CI checks, and ensure no workflow deploys to a second environment.
3. Verify exact multipart module hashes, D1 binding identifiers, metadata and secret *names* against an immutable manifest.
4. Pass offline synthetic RBAC/ownership tests and security/contract/mobile RTL tests.
5. Capture production read-only smoke result, validate recoverable previous multipart artifact and rollback instructions.
6. Only then consider direct deployment to existing worker; never deploy based on this document alone.

## Gap matrix
| Area | Status | Evidence / blocker |
|---|---|---|
| Worker deployment identity | سالم | Cloudflare deployments read |
| Binding/secret-name inventory | سالم | Cloudflare settings and secrets read |
| Offline task workflow definition | سالم | GitHub file read; execution not verified |
| Full architecture verbatim archive | ناقص | Original message not yet retrieved |
| Branch HEAD and CI | ناقص | Not verified |
| Multipart code and hashes | ناقص | Not fetched |
| Case ownership RBAC tests | نیازمند اصلاح | Execution evidence missing |
| Mobile RTL five tabs | نیازمند اصلاح | Acceptance evidence missing |
| Validated rollback package | ناقص | Historical version alone insufficient |
| This read-only release gate evidence | جدید | This file |

Protected: candidatory-news-bot and @candidatoryiran. No production write or new environment performed.
