# RBAC offline execution plan — 2026-11-21

Status: NOT a production release authorization. Source architecture is a condensed transcription, not the complete verbatim 18-chapter owner document.

## Test cases to implement in existing CI (synthetic fixtures only)

| ID | Subject | Resource | Operation | Expected |
|---|---|---|---|---|
| RBAC-01 | owner A | workspace A candidate record | read | allow |
| RBAC-02 | owner A | workspace B candidate record | read | deny, no record leak |
| RBAC-03 | team member A | workspace A task assigned to another member | update | deny unless explicit permission |
| RBAC-04 | team member A | workspace B task | update | deny, zero D1 writes |
| RBAC-05 | consultant with expired grant | workspace A document | read | deny |
| RBAC-06 | unauthenticated | private workspace task | read | deny |
| RBAC-07 | signed Telegram identity with tampered hash | own record | read | deny |
| RBAC-08 | support user without explicit grant | private document | read | deny |
| RBAC-09 | system admin without workspace membership | private document | read | deny by default |
| RBAC-10 | workspace owner | revoke team member | revoke | only with explicit approved authorization; not exercised against production |
| RBAC-11 | member A | workspace A task | malformed JSON update | 4xx, zero D1 writes |

Fixture contract: two synthetic workspaces, distinct Telegram IDs and ownership; mock D1 that counts prepare/bind/run/batch; signed initData generated with test-only key; deterministic time for grant expiry. Verify status, response body redaction, and zero writes on denied requests. CI must not contain Cloudflare deploy credentials or run wrangler publish/deploy, and must never connect to production D1.

## Production read-only evidence at 2026-11-21

Worker: candidatory-miniapp-api. Active deployment: 860f813c-baf4-4cff-bfc7-bb4120b910ed, version: 3c35231f-36f0-4bad-b786-9a4309d8e868 (100%), deployed 2026-11-11T20:05:53Z. Settings: compatibility_date 2026-10-27; bindings: DB and REVIEW_DB (D1), AI, and four secret_text bindings. Preview disabled. Values of secrets not recorded. This is read-only configuration evidence, not verified code parity or D1 schema parity.

GitHub SHA 2fdc054f106df1d9b70911e727afc0b5edffa07a has successful offline workflow runs 44882683110 (structural gate), 44882683108 (multipart parity), 44882683188 (Mini App checks), and 44882683105 (production evidence gate). These are historical SHA-specific results, not proof of CI at the head after this document.

## Release decision

BLOCKED: verbatim architecture unavailable; production multipart code equivalence, current branch-head CI, D1 schema parity, route and homepage health, RBAC execution, and verified rollback still require evidence. No staging/preview/test worker allowed. No write/auth smoke test on live data. Do not deploy.
