# Cloudflare live Worker snapshot

This directory holds a complete, hash-verified export of the deployed `candidatory-miniapp-api` Worker, captured October 29, 2026.

- **Canonical export:** `snapshot-parts/part-000.txt` … `part-030.txt` (31 sequential UTF-8 slices).
- **Reconstruction:** `node cloudflare-live/reconstruct.mjs` recreates `cloudflare-live/worker.js`. The checked-in `worker.js` is deliberately a fail-closed placeholder; it is not deployable until reconstructed.
- **Verification:** `node --check cloudflare-live/worker.js` and `node cloudflare-live/verify-snapshot.mjs`.
- **Snapshot SHA-256:** `79d3c4780bb58637b7c9a9202ca19da1ff50e12608c486378cf187ebe3acd543` — confirmed equal to the Cloudflare live source on 2026-10-29.
- **GitHub Actions:** Run `Cloudflare live source parity`, workflow run `40831027726` completed successfully with six passing checks and matching SHA-256.

The historical Appwrite code elsewhere in this repository is not the deployed Worker. This snapshot must not be deployed via GitHub without staging verification, environment-binding comparison, authenticated Telegram WebView tests and human review. Keep secrets in Cloudflare bindings; never commit user data or credentials.

See `docs/LIVE-CLOUDFLARE-RELEASE-GATE.md` and `design-system/candidatory/MASTER.md`.
