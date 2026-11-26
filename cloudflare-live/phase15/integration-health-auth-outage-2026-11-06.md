# Integration health/auth smoke: outage classification — 2026-11-06

## Evidence at the beginning of this run
- Branch HEAD: `038ad3540022e97b349c63857b8dced54576e213`.
- Run [42199021891](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42199021891): success at 09:58:14 UTC, including live /health and 10 unauthenticated API routes.
- Run [42199029469](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42199029469): failed at 09:58:22 UTC with `/health HTTP 503`, **before any authentication assertions ran**. Do not report the earlier success as current service availability.
- Independent preview [42199029715](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42199029715) failed `/api/staging/health HTTP 500`; visual check failed too. Root cause not yet proven; earlier Cloudflare D1 API quota error 7500 is a candidate, not a diagnosis.
- Verified via Cloudflare settings/deployments: integration Worker deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`, isolated D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`, secret Telegram binding present. News Worker deployment `3be80a6c-437b-44e3-ba38-bd779538f63c` untouched.

## Change
The integration HTTP auth workflow now classifies `500/503/429` as service unavailable and stops with an explicit **not tested** authentication verdict. Other non-200 health statuses remain failures; non-401 API statuses remain failures. No service outage is ever converted to a green test. No tokens or signed user sessions are logged.

## Next gate
After Cloudflare availability recovers, rerun live health, 10 unauthenticated routes and forged Telegram signature rejection. Confirm two-user signed-session isolation and 320/375/430px browser tests separately. Do not promote production based on the workflow alone.

## Rollback
Revert commit `cce4a8dcf9030981ed12eed2d5f276107bb9d6ef` on the feature branch to restore the previous workflow diagnostics. No Worker, D1, secret, production bot, news channel or payment rollback is necessary.
