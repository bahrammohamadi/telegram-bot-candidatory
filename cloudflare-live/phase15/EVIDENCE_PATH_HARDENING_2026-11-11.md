# Phase 15 — evidence path hardening (2026-11-11)

Scope: offline production release evidence validator only. No Worker, D1, payments, AI, production or news changes.

## Baseline
Branch head at start: `df151d921bad2c678b81044a2aec16db404875b1`. Nine pull-request workflow runs associated with that commit were successful, including release evidence regression, signed Telegram initData, isolated HTTP auth and task progress integration. Integration Worker was `7489532d-a4a8-4f4f-8924-e12096e6c548` (100%); news Worker `1c080a9a-e7b6-420a-81ae-14821608a1aa` (100%). Integration D1 identity matched the requested staging database.

## Change and threat model
Evidence URLs containing percent-encoded slash (`%2F`), backslash (`%5C`), NUL (`%00`), raw backslash, or repeated path separators (`//`) are now rejected. Reverse proxies and upstream URL parsers can disagree about such path spellings; fail-closed handling avoids accepting potentially aliased release evidence as independent artifacts. Negative regression tests cover the new cases.

## Verification
From repository root: `node cloudflare-live/phase15/release-evidence-gate.test.mjs`. Check the **Phase 15 release evidence regression** workflow on the exact final commit SHA. No CI success is asserted for the new commit until independently observed. This is an offline validator test, not a Telegram two-account or live Worker test.

## Rollback
If tests fail, revert the test commit `37c731084dc3ede7a126ee4a777d5fe820ea39b1` then the implementation commit `af678fe25c5d1db7c637b79efb5fbb90c9d7315e` on the development branch, and rerun CI. No Cloudflare deployment or D1 restore is needed. Production remains NO-GO pending independent release evidence and explicit exact-release approval.
