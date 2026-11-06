# Phase 15 — Independent auth diagnostics under degraded health (2026-11-06)

## Verified baseline
- Branch before change: `06854eb188b1d86581a0b62aa382d024345f9a6f`.
- Cloudflare isolated integration deployment: `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`; production miniapp `173dfdec-d73f-44d5-af2a-e6bde5be3ed9`; news Worker `3be80a6c-437b-44e3-ba38-bd779538f63c`.
- Earlier HTTP auth smoke [42206272541](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42206272541) failed; task-progress CI [42206263710](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42206263710) passed.
- Staging HTTP smoke [42206272671](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42206272671) failed. Cause is not established; D1 quota is a candidate only.

## Change and acceptance criteria
The isolated HTTP authentication workflow now runs ten unsigned API requests and one forged-signature request **even when /health is non-200**. This separates an unavailable health route from the authentication boundary. All API routes must return HTTP 401, forged initData must return HTTP 401, and /health must return HTTP 200 for a green CI. Responses 429, 500 and 503 are reported as unavailable/unverified and **never** count as security passes. Unexpected other statuses are flagged as possible auth regressions. Response bodies, real identities, tokens, secrets and user data are not printed.

Changed commits: `1dc260c5550edb85a7d7721b7e6169cf2e161efc`, `e28d7d39ccf18bd1217ea4fb31815868ab1c9f8f`. No Worker, D1, token, news bot or production deployment was changed.

## Next checks
1. Review the new push-triggered GitHub Actions run for 11 independent auth probes and health. If still failing, inspect Worker availability and Cloudflare quota without classifying the authentication result as passed.
2. Recheck isolated D1 capacity after quota reset; avoid unnecessary read queries during the incident.
3. Run signed Telegram WebView sessions from two designated test accounts and 320/375/430px visual tests when service availability is restored.
4. Do not deploy to production or migrate data without separate approval.

## Rollback
Restore the prior version of `.github/workflows/integration-http-auth-smoke.yml` from commit `06854eb188b1d86581a0b62aa382d024345f9a6f` (for example, `git checkout 06854eb -- .github/workflows/integration-http-auth-smoke.yml` followed by a reviewed commit). This is CI-only; no Cloudflare or database rollback is required.
