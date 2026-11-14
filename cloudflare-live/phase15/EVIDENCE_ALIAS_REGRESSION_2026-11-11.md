# Phase 15 — release evidence URL alias regression (2026-11-11)

Scope: offline release-approval gate only; no Worker, D1, production or news-bot changes.

## Baseline
Development branch at start: `cfe912eaa074f42792efef5a8be767e4d7646fa7`.
All 11 GitHub Actions runs for that SHA were reported successful.
Integration Worker was serving version `7489532d-a4a8-4f4f-8924-e12096e6c548` at 100%.
News Worker was serving `1c080a9a-e7b6-420a-81ae-14821608a1aa` at 100%.
D1 identity matched the designated integration-test database.

## Change
Previously the release gate deduplicated evidence URLs using URL.href, allowing alternate URL spellings (trailing slash or percent-encoding of unreserved characters) to represent the same artifact twice. The check now normalizes these aliases before comparing the 15 independent evidence links. Tests include trailing slash, encoded character, and explicit default HTTPS port. A dedicated GitHub Actions workflow runs the offline regression.

## Verification
Run `node cloudflare-live/phase15/release-evidence-gate.test.mjs` from repository root.
Require the `Phase 15 release evidence regression` GitHub Actions job to be green on the exact final SHA before treating this change as verified.
At authoring time, CI result for the final SHA was not yet verified. Local clone was unavailable due to DNS failure; no local PASS is claimed.

## Rollback
If the regression fails, revert commits `3a5442470369d0f8500b040485d89ff8ccc00063`, `7a34608f1bf6bb7e772a6d5efa8a6cd6dafd338a`, and `c46cb48a3b8d2aa2f5e614187e7b644b1e41e732` in reverse chronological order on the development branch; rerun CI. No Cloudflare rollback or D1 restore is required because no deployment or schema change was made.

Production remains NO-GO until independently verified approval for the exact release commit and all other release gates.
