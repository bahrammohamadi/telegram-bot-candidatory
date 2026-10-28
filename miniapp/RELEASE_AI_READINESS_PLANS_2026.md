# Candidatory AI, Learning Readiness and Operational Additions — 2026-10-27
Branch: feature/telegram-miniapp-supabase
Worker: candidatory-miniapp-api
Cloudflare deployment: f7018cd9105b4877bbe211a62f5530ff
Database: candidatory-miniapp D1

## Implemented and deployed
- Three manual service entitlement plans (basic/team/organization) with role-restricted admin assignment and limits enforced both at invitations and acceptance; this is not a payment or checkout system.
- Calendaring: client-generated .ics file from workspace events.
- Neutral educational self-assessment: six questions, 4 self-rating choices, server-calculated score and user-scoped historical attempts. Do not use scores to forecast election outcomes or profile voters.
- Workers AI with `AI` binding, model `@cf/meta/llama-3.1-8b-instruct-fp8`: Persian educational study assistant under Progress tab; only Telegram HMAC-authenticated users; no political microtargeting or persuasion; no storing prompts/answers in D1.
- AI hard quotas: max 3 requests/user/day and 40 requests/platform/day through D1 atomic UPSERT counters; model inference subject to Cloudflare Workers AI Free neuron budget (10,000 neurons/day).
- Previous lessons, quizzes, profile, support, privacy, workspaces, documents, reports and admin remain unchanged.

## Cloudflare verification
- Worker upload succeeded and route is enabled.
- Verified bindings: DB (d1), AI (ai), TELEGRAM_BOT_TOKEN (secret_text), ADMIN_TELEGRAM_IDS (secret_text).
- D1 counts at deployment: 6 readiness questions, 3 active plans, 12 published lessons, 2 published quizzes.
- Model inference tested directly through Cloudflare API using short Persian prompt; model returned Persian text successfully using 1.02 neurons for that brief response (measured test only).
- The final authenticated end-to-end Telegram Mini App AI flow has NOT been tested due to external browser access limitations; no simulated user activities were inserted.

## R2 blocker
Attempting to list R2 buckets via Cloudflare API returned HTTP 403, code 10042:
'Please enable R2 through the Cloudflare Dashboard.'
Cloudflare connector already has Workers R2 Read/Write permission; reconnecting won't resolve it. The account owner must enable/onboard R2 in Cloudflare Dashboard first. Thus *direct private file uploads are not yet implemented*. Workspace document links continue to work.

## Still blocked or not complete
1. Private binary uploads: activate R2 and implement Worker binding, authenticated upload/download, strict MIME/magic-byte validation, malware scanning, storage limits, quotas and retention.
2. Real payment gateway: merchant onboarding and signed provider webhooks, refund/reconciliation/receipts. Manual plans are NOT paid subscriptions.
3. Privacy deletion and full account-erasure workflow: requires policy for legal retention, explicit confirmation, testing across all tables, backups and audit approval.
4. Complete legacy campaign domain modules / access policy migration: not done. Avoid sensitive political profiling and targeted manipulation.
5. External security testing, load tests, versioned restore/backup drill and actual Telegram user E2E test.
6. Cron cleanup of old AI/request quota buckets and secure operational logs.
7. Confirm fonts/safe area and app behavior on iOS/Android Telegram browsers.

## Test in Telegram
- Open @candidatoryiran_bot Mini App.
- Progress > Self-assessment, answer six questions and verify score/history after reopening.
- Progress > AI Educational Assistant, ask a benign study question and verify response + remaining quota.
- Management > Workspace creation > Plans and Team; check permission boundaries with second user.
- Management > Calendar > ICS export (iOS may display file share rather than downloading directly).
- See R2 onboarding and payment credential requirements above; they have not been represented as finished.

Official Cloudflare Workers AI pricing (2026-10-20):
https://developers.cloudflare.com/workers-ai/platform/pricing/
