# Cloudflare live source boundary

This directory is reserved for the exact, secret-scanned export of the deployed `candidatory-miniapp-api` Worker. The historical Appwrite code elsewhere in this repository is **not** a valid source for redeploying this Worker.

**Release gate:** No GitHub-to-Cloudflare automatic deployment may be enabled until the exported live Worker and its critical bindings have been compared, syntax checked and verified in staging. Never commit tokens, credentials, Telegram initData, or user database contents. Deployment must use Cloudflare environment bindings.

Current status: **source export not yet committed**. This is intentional; this directory does not imply source parity.

See `docs/LIVE-CLOUDFLARE-RELEASE-GATE.md` and `design-system/candidatory/MASTER.md`.
