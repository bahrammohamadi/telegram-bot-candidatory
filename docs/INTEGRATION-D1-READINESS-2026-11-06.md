# Integration D1 readiness diagnostic — 2026-11-06

Scope: GitHub Actions only. No Cloudflare Worker, D1 schema, production data, news Worker, or Telegram publishing changes.

## Observed before change
- Branch head: c84447541dfe48170d670015a1193e2f69426c0e.
- CI run 42237859255 failed: three /health samples HTTP 503, while all ten unsigned API requests and one forged Telegram signature returned the expected 401 (0 auth failures, 0 unverified).
- The deployed integration Worker /health handler queries sqlite_master for candidate_users and responds with 503 and a fixed DB_UNAVAILABLE error if that D1 query throws.
- A direct read-only Cloudflare D1 API query of the isolated integration database returned candidate_users count = 1. This does not establish Worker-binding runtime availability or quota health.

## Change
The HTTP auth smoke workflow now separately probes the public / shell (network/runtime reachability) and safely classifies the fixed /health DB_UNAVAILABLE error code. It never prints arbitrary bodies, tokens, identities, or secrets. All existing release-gate checks remain strict: a 503 health still fails.

## Validation and next action
Check the workflow run triggered by commit 2424ccd8 and its logs. If / returns 200 but /health returns DB_UNAVAILABLE, investigate D1 Worker binding/quota/runtime; do not treat successful unsigned 401s as D1 readiness. If both / and /health fail, investigate routing and Worker runtime first. Do not promote production until authenticated real-user and mobile tests pass.

## Rollback
Revert commit 2424ccd8 on the feature branch using a normal reviewed Git revert. This changes only the workflow, not the deployed Worker or any database. Keep production and news Worker untouched.
