# Five-tab production release acceptance contract — 2026-11-15

Scope: existing Telegram bot, existing miniapp, existing Cloudflare Worker `candidatory-miniapp-api` ONLY. No second environment, no test deployment, no D1 writes.

## Navigation acceptance (synthetic/offline)
1. Exactly five visible bottom-navigation entries in RTL order: امروز, مسیر من, کارها, یادگیری, حساب.
2. Each button references one unique existing panel; all five panels exist and have accessible labels.
3. One active panel at a time. Invalid tab names, missing panels and non-panel targets preserve the previous active tab.
4. Navigation works at 320px and 390px viewport widths without horizontal scrolling, obscured labels or inaccessible controls.
5. Keyboard focus is visible; active state has programmatic indication. Back/forward navigation must not strand the user.
6. Loading, empty and API-failure states preserve navigation; task mutations are not attempted in UI tests.

## Data/security contract
- `overview`/task/profile/academy payloads use synthetic identities and data only in CI.
- Auth must reject missing/invalid Telegram initData in offline tests; no live auth probes.
- Every task/profile API must enforce server-side owner scoping and role permissions; UI hiding alone is not RBAC.
- No D1 migration, write smoke, real payment, paid AI, mass notification, administrator role change or token disclosure.

## Release decision
**BLOCKED** until all items are evidenced against current branch HEAD and active Worker multipart code:
- All applicable CI jobs green for the exact SHA (not merely earlier commits).
- Reproducible multipart bundle with exact module hashes, entrypoint, compatibility metadata and routes.
- Read-only parity check for both D1 bindings, AI binding and four secret *names* (never values).
- Read-only production homepage smoke; verify URL and HTTP response without login or writes.
- RBAC/security checks on synthetic fixtures.
- Verified previous-version rollback package and restoration steps; no live rollback exercise on production.
- Single direct deployment to existing production Worker only, followed by read-only smoke and recorded deployment/version/time.

## Observed baseline (must be revalidated immediately before release)
GitHub CI for earlier SHA `9838bc688238e81abb69271f94a342eeb2be88a8` includes successful Mini App checks run 43696916045 and multipart parity run 43696916099. These results are historical, not approval for a new commit.
Cloudflare read on 2026-11-15: active deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`; version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic. Bindings: DB, REVIEW_DB, AI and four secret names. No source hash parity or rollback verification yet.

## Gap classification
| Area | Status | Required evidence |
|---|---|---|
| Existing Worker and bindings presence | سالم | Recheck immediately before deployment |
| Exact five-tab RTL behavior | نیازمند اصلاح | DOM and mobile offline tests |
| Exact live multipart parity and routes | ناقص | Hashes and route inventory |
| Full verbatim 18-chapter architecture archive | ناقص | Recover original and version it |
| Safe rollback package | ناقص | Versioned artifact and verified restore procedure |
| Synthetic accessibility regression | جدید | CI test coverage |

No deployment authorized by this document.
