# Production release gate snapshot — 2026-11-21 (read-only evidence)

Scope: ONLY existing `candidatory-miniapp-api` production Worker. No new Worker, bot, environment, or deployment permitted. This document is evidence, NOT approval to deploy.

## Verified Cloudflare API evidence (2026-11-21)
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, 100% traffic.
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Deployed at: `2026-11-11T20:05:53.015284Z`.
- Compatibility date: `2026-10-27`.
- Bindings by NAME/type only: `DB` (D1), `REVIEW_DB` (D1), `AI` (AI), `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` (secret_text). No secret values collected.
- Previous deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1` version `32d33109-8e48-4c9e-a38a-4dd91012967b` is historical evidence, NOT a validated rollback.
- Routes, public URL, deployed multi-module source, D1 schema and read-only homepage probe NOT verified this run.

## GitHub CI evidence
For commit `ba5e697b260c921a0c9b9b307ace86d4777d0ba4`:
- [Mini App checks — success](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44887147075)
- [Worker binding parity guard — success](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44887147185)
- [Production release evidence gate — success](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44887147077)
- [Telegram signed initData regression — success](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44887147260)
These are historical commit-associated runs, not CI approval for a subsequent commit.

## Release decision: BLOCKED
1. Obtain exact 18-chapter source from the user's 2026-11-12 message; do not present summaries as a verbatim original.
2. Compare GitHub commit and actual deployed multipart Worker modules byte-for-byte / by hashes, and verify metadata, routes, bindings and D1 schema without mutation.
3. Implement and pass offline RBAC ownership/auth tests using synthetic fixtures, including negative cases and no unauthorized writes.
4. Identify verified public production URL and perform safe read-only smoke checks.
5. Produce a validated rollback artifact and instructions (including compatibility and binding parity) BEFORE any production upload.
6. Require successful CI for the exact candidate SHA. Do not run production write tests, auth tests, paid AI, migrations, or create any second environment.

## Gap matrix
| Item | Classification | Evidence |
|---|---|---|
| Worker deployment and binding-name inventory | سالم | Cloudflare read-only API |
| Existing CI on ba5e697 | سالم | linked Actions runs |
| 18-chapter verbatim source | ناقص | not recovered |
| RBAC executable negative-case coverage | نیازمند اصلاح | no complete proof |
| Deployed multipart parity and rollback validation | ناقص | not verified |
| This dated release gate evidence | جدید | this file |

No production changes authorized by this record.
