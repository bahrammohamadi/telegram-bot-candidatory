# 2026-11-08 isolated integration canary repair

## Baseline
- Branch before change: 195619aaf65f1464e670fcfaf416111b020ca535.
- Integration Worker: candidatory-miniapp-integration, deployment f1eb351c-c3ee-4e46-bb58-b8cadb6e769b (2026-11-06).
- D1 integration database: candidatory-integration-test-20261101.
- The former CI canary asserted that a preview-specific worker served a legacy home page and /review. That is no longer an appropriate acceptance criterion for the new-main product direction and previously failed HTTP 404.

## Change
Updated .github/workflows/candidatory-main-canary-http.yml to test only the isolated integration Worker. It requires Persian RTL home HTTP 200, and forged Telegram initData to be rejected with HTTP 401 and TELEGRAM_AUTH_REQUIRED for both tasks and assistant APIs. No signed identity, personal data or token is written to logs.

## Deployment and rollback
This is a CI-only change. No Cloudflare Worker, D1 or production deployment occurred. To rollback the CI change, revert commit 31f5433d8504e8cd9f43d86928a247f3530a3683. The integration deployment remains f1eb351c-c3ee-4e46-bb58-b8cadb6e769b; production is not a deployment target.

## Limits
An HTTP 401 negative test does not establish successful signed-user CRUD, mobile UX, D1 quota health, or live Telegram WebView. Those are separate gates. CI outcome must be checked after GitHub schedules the workflow.
