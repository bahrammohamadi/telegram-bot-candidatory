# Cloudflare live Worker snapshot

This directory holds a complete, hash-verified export of the deployed `candidatory-miniapp-api` Worker, captured October 29, 2026.

- **Canonical export:** `snapshot-parts/part-000.txt` … `part-030.txt` (31 sequential UTF-8 slices).
- **Reconstruction:** `node cloudflare-live/reconstruct.mjs` recreates `cloudflare-live/worker.js`. The checked-in `worker.js` is deliberately a fail-closed placeholder; it is not deployable until reconstructed.
- **Verification:** `node --check cloudflare-live/worker.js` and `node cloudflare-live/verify-snapshot.mjs`.
- **Snapshot SHA-256:** `79d3c4780bb58637b7c9a9202ca19da1ff50e12608c486378cf187ebe3acd543` — confirmed equal to the Cloudflare live source on 2026-10-29.
- **GitHub Actions:** Run `Cloudflare live source parity`, workflow run `40831027726` completed successfully with six passing checks and matching SHA-256.

The historical Appwrite code elsewhere in this repository is not the deployed Worker. This snapshot must not be deployed via GitHub without staging verification, environment-binding comparison, authenticated Telegram WebView tests and human review. Keep secrets in Cloudflare bindings; never commit user data or credentials.

See `docs/LIVE-CLOUDFLARE-RELEASE-GATE.md` and `design-system/candidatory/MASTER.md`.

## Phase 2 navigation release — 2026-10-31

The current Staging release is recorded in `phase2-release.json`. `environment-manifest.json` continues to pin the unchanged Phase 1 source snapshots for reconstruction and rollback; its Staging version is the baseline, not the current deployment.

Run `node cloudflare-live/build-staging.mjs` to reproduce the deployed Phase 2 bundle from `staging-worker.js` plus the reviewed `phase2/` navigation files. Only bundled client JavaScript/CSS are changed; the API and read-only preview guard remain intact.

All six home cards now open consistent submenus. Available links open sample lists, the sample report or the restartable guide. Private features have explicit unavailable labels. Previous dashboards and admin previews remain reachable inside the collapsed supplementary section. SVG icons, larger labels, dark-mode styling and keyboard focus/escape handling are included. Telegram authentication and live integration remain separate prerequisites.

## Phase 1 baseline — 2026-10-31

The live Production source was downloaded and hashed again: it still matches the canonical snapshot above. The exact current Staging source is now preserved in `staging-worker.js`. `environment-manifest.json` records both source hashes, distinct database IDs and Cloudflare deployment/version IDs for rollback identification.

The development baseline is `feature/cloudflare-parity-audit-2026-10-29` (PR #4). `main` remains historical Appwrite code and must not replace either Worker. No automatic Production deployment is enabled here.

Run after reconstruction:

```sh
node cloudflare-live/verify-environments.mjs
node cloudflare-live/auth-check.mjs
node cloudflare-live/integration-check.mjs
node cloudflare-live/staging-visual-check.cjs
```

The first two checks validate pinned snapshots and local authentication boundaries. The browser check targets the public synthetic Staging UI. None certifies authenticated Telegram use.

`integration-schema.sql` contains schema only (50 application tables plus indexes), exported without user records. `integration-check.mjs` loads it into temporary in-memory SQLite and invokes the reconstructed Worker with locally signed synthetic identities. It checks profile save/read, partial details updates, invalid-input rejection, two-user profile/checklist isolation and both admin ID lists. These local integration checks passed; they do not replace live D1 or Telegram WebView verification. The corrected public mobile suite also passed at 320, 375 and 430 pixels in run `41164445612`.

### Remaining integration prerequisite

Staging has only `staging_profiles`, `staging_quiz_results`, `staging_test_tasks` and `staging_test_users`, plus Cloudflare's internal table. Its sole binding is the separate D1 database; it has no Telegram signing key or AI binding. Private actions deliberately return `STAGING_PREVIEW_ONLY`.

Before real account testing, provision a dedicated test bot/signing key, migrate a reviewed schema into an isolated integration database, seed synthetic accounts, and exercise profile save/read and two-user isolation. Do not reuse the Production bot token or copy personal records into the public preview. The schema and account integration work remains open; the six-card preview must not be described as a completed functional staging release.

## Phase 3 backend candidate — 2026-10-31 (not deployed)

The captured Worker could persist a changed profile and details while returning HTTP 500 if a later checklist write failed. A regression test reproduces this with a SQLite trigger: the original snapshot fails the rollback assertion; the candidate passes.

`phase3/profile-save.block.js` groups profile, details and six checklist writes in one D1 batch. Details merge inside SQL with `json_patch`, avoiding a separate read/merge/write window. String-only validation remains in place, and an empty string explicitly clears a field. No migration is required. D1 batch rollback semantics: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch

```sh
node cloudflare-live/reconstruct.mjs
node cloudflare-live/build-integration.mjs
node --check cloudflare-live/dist/integration-worker.mjs
node cloudflare-live/integration-check.mjs ./dist/integration-worker.mjs --phase3
```

The build requires the pinned production hash and changes only the profile action. It produces an **integration candidate**, not the six-card preview bundle; do not deploy it over the public staging preview. Production snapshot files and the Phase 2 deployment remain unchanged.

Expanded local tests cover workspace task status, cross-workspace mutation denial, manager-only document visibility, HTTPS document links, personal calendar and action-plan ownership. Document storage currently holds external HTTPS links, not uploaded file bytes. The transactional SQLite adapter tests rollback for both existing and first-time profiles, successful retry, partial details preservation and explicit clearing. These tests do not certify real D1, concurrent requests or authenticated Telegram WebViews.

Still pending for Phase 3: isolated authenticated integration deployment, connecting the new navigation to real forms, user-facing error/retry states and live end-to-end tests. A dedicated test bot/signing key is required before exposing authenticated test routes; no production token or user records have been copied.
