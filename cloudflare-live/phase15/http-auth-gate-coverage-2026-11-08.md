# Isolated HTTP auth gate — trigger coverage and release block (2026-11-08)

## Verified baseline
Development HEAD before this change: `52f427abd9028544a33f197ad821ca215d87cb7d`.
Phase15 workflow run 42517602314 passed. Source parity run 42517605713 passed.
Isolated HTTP auth run 42517605565 failed: public shell HTTP 200, D1-backed `/health` HTTP 503 with minimal `DB_UNAVAILABLE`; all 14 synthetic unsigned/forged/malformed identity probes rejected as HTTP 401. This does **not** prove signed real-account persistence or D1 availability.
Staging HTTP run 42517605570 failed independently.
Read-only Cloudflare deployment inventory: integration Worker deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`, created 2026-11-06T07:58:50Z. No deployment performed in this change.

## Change
`.github/workflows/integration-http-auth-smoke.yml` now triggers on development-branch pushes touching `cloudflare-live/phase15/**` or the pinned phase14 snapshot, as well as its own workflow file. Previously only workflow-file pushes triggered this HTTP gate, allowing feature changes to show green phase15 CI without automatically running the live availability gate. The job-summary denominator now correctly reports 14 auth probes: ten unsigned routes, one forged hash and three malformed initData variants.

## Verification
Inspect the new workflow run for the workflow-file commit and future phase15 pushes. HTTP 503 remains a **hard fail**; do not replace readiness with shell reachability, remove auth checks, or claim production readiness based on a green isolated build. Real signed Telegram WebView two-account, mobile and main Mini App parity checks remain pending.

## Rollback
Revert the workflow commit on the development branch to restore the old trigger scope. This change has no Worker/D1 code, schema, secrets, payments or production side effects. For an integration Worker rollback, follow `cloudflare-live/phase15/progress-tasks-release-2026-11-06.md` and redeploy the pinned phase14 snapshot **only after verifying the live deployment and bindings**. Production rollout requires separately recorded explicit approval for the exact tested commit.
