# Phase 15 — parity probe target safety and D1 quota recovery (2026-11-09)

## Evidence and change
- Baseline branch head before changes: `f62a9fcdf63fa10b06b7e1d9c2ca1959f414e5d1`.
- A bounded, read-only control-plane query against **isolated** D1 `candidatory-integration-test-20261101` succeeded: table `candidate_users` found; 18 rows read, 0 rows written, no error 7500. This verifies quota was available **at that instant**, not that the Worker HTTP /health route is healthy.
- Added seven offline safety regressions for `miniapp-parity-probe.mjs`: missing endpoint, HTTP origin, URL credentials, query, fragment, same origin and malformed URL. These reject inputs before any network call.
- Wired the regression to `Isolated task progress integration` CI.
- Requested a rerun of failed jobs for isolated HTTP auth run [42537273908](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42537273908) after the quota check. **A rerun request is not a passing result.**

## Validation required
1. Inspect phase15 CI for the new seven-case test, signed Telegram synthetic-user integration, owner isolation, health E2E and mobile navigation.
2. Inspect HTTP rerun: /health must be 200, ten unsigned API calls and four malformed/forged initData probes must be 401.
3. If 503 remains, correlate sanitized CF-Ray with Worker traces; do not infer D1 corruption from 503 alone.
4. Before any integration deployment, verify the exact script and bindings, preserve previous integration Worker version and test rollback. No production, news Worker, D1 migration or paid services authorized.

## Rollback
No Worker/D1 deployment or schema mutation occurred. Revert commits `983858bbe34f64ff2f9c9fc8b92ac1aee8504d3f` and `accc267927eb88e68728d19600dd2f98db99d33d` to remove the offline test and CI wiring. Existing isolated Worker deployment remains unchanged unless verified separately.

## Release decision
**NO-GO**: offline target validation is not functional parity, and real Telegram account, stable HTTP, mobile device, security and release evidence remain mandatory.
