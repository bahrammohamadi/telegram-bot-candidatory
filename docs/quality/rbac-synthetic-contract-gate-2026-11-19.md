# RBAC synthetic contract gate — 2026-11-19 (no deployment)

Scope: existing `candidatory-miniapp-api` only. This is a **test specification**, not evidence that tests passed. No Production writes or auth probes.

## Preconditions
1. Obtain canonical 18-chapter architecture verbatim; do not treat condensed summaries as equivalent.
2. Identify actual handler entrypoints and role/permission implementation in current multipart Production bundle and GitHub source. Do not invent endpoints.
3. Run test cases with entirely synthetic fixtures and mocked D1/AI/Telegram, within GitHub CI only; no Worker, preview, staging or external deployment.
4. Fail closed on missing actor, missing role, malformed Telegram initData, expired timestamp, invalid signature, tenant mismatch, or denied action.

## Contract cases (implement against actual handlers, not a parallel mock implementation)
| Case | Synthetic actor/context | Expected assertion |
|---|---|---|
| A01 | no authenticated actor | 401, no state mutation |
| A02 | invalid/expired Telegram initData | 401, no mutation |
| A03 | normal user reads own case | allowed only with matching ownership |
| A04 | normal user reads another user's case | 403/404, no data leak |
| A05 | normal user updates another user's task | denied, no mutation |
| A06 | normal user calls administrator-only handler | 403, no mutation |
| A07 | valid role but cross-tenant record | denied, no data leak |
| A08 | unknown/unmapped role | denied by default |
| A09 | task mutation rejected by authorization | mock DB write count = 0 |
| A10 | AI action requiring permission without permission | no AI invocation; no paid usage |

## Release evidence requirements
- GitHub SHA, exact workflow run URL and conclusion for **same SHA**.
- SHA256 for each real multipart module, expected module list and main module; compare with retrieved Production bytes.
- Read-only route mapping, binding types, D1 database IDs and schema; secret names/types only.
- Canonical URL GET with status and UTC time, no auth/login submission.
- Restore artifact with hashes and explicit rollback procedure validated offline.
- If any requirement missing: **NO DEPLOY**.

## Gap matrix
| Area | Status |
|---|---|
| Active deployment and seven binding names/types (read 2026-11-19) | سالم |
| This RBAC contract test specification | جدید |
| Full verbatim architecture and source parity | ناقص |
| Actual handler-backed CI execution | نیازمند اصلاح |
| Verified rollback package and canonical URL GET | ناقص |

## Cloudflare read-only observation, 2026-11-19
Deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`; active version `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100%, created 2026-11-11T20:05:53Z. Settings: compatibility_date 2026-10-27; bindings ADMIN_TELEGRAM_IDS, ADMIN_TELEGRAM_IDS_MAHDI, AI, AVALAI_API_KEY, DB, REVIEW_DB, TELEGRAM_BOT_TOKEN. No secrets read. No production changes made.
