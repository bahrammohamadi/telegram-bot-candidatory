# Phase 15 — release evidence TEST-NET-1 hardening (2026-11-11)

Scope: isolated development branch only. The production release gate previously rejected TEST-NET-2 (198.51.100.0/24) and TEST-NET-3 (203.0.113.0/24), but mistakenly accepted TEST-NET-1 (192.0.2.0/24) as a public evidence URL. These addresses are documentation-only, not verifiable public evidence.

Change: reject 192.0.2.0/24 in `isNonPublicIpHost` and add negative tests for `https://192.0.2.42/evidence`. This is fail-closed; it changes no production or integration Worker, D1 schema, credentials, Telegram messages, payment or AI settings.

Verification: `node cloudflare-live/phase15/release-evidence-gate.test.mjs` and the existing Phase 15 release-evidence regression workflow. CI must be checked for the final commit; no claim of passing CI until confirmed.

Rollback: revert commits `a0a3a501b8bd2ff86de3a753ec355e7d2cd0cbad` and `be33fdb044c85080996c70584bff6a29b6a46b6e` in reverse order. No Cloudflare or D1 rollback is needed because no deployment or migration occurred. This intentionally restores the previous, weaker gate, so prefer a corrective commit if an unexpected failure is found.

Production approval is still explicitly required for the exact release commit after all 15 evidence gates are satisfied. This change is not production authorization.
