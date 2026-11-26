# Five-tab RTL navigation — acceptance contract v1
Date: 2026-11-14. Scope: **source-only contract**, not evidence of production readiness.
Reference: Candidatory final architecture v1.0, 1405/08/21. Exact original 18-chapter text remains unverified.

## User-visible behavior
- Mobile navigation has exactly five logical tabs in this RTL order: امروز، مسیر من، کارها، یادگیری، حساب.
- Each tab has a stable, unique identifier: today, journey, tasks, learning, account.
- The selected tab is visually and programmatically indicated; reselecting it is idempotent.
- Switching tabs never changes the authenticated Telegram identity or RBAC permissions.
- A tab may show an empty/error/loading state; it must never substitute another user's data.
- Keyboard focus, accessible labels, minimum touch-target sizing and viewport overflow are checked.
- The route or state of an unauthorized tab must not reveal protected records or privileged actions.
- No navigation action invokes payments, paid AI, bulk notifications or D1 migrations.

## Synthetic-only verification matrix
| ID | Input/fixture | Expected result |
| --- | --- | --- |
| NAV-01 | RTL 360px viewport, 5 tabs | Five labels visible in prescribed order, no horizontal overflow |
| NAV-02 | RTL 320px viewport, long Persian labels | No clipped interactive target; scroll/compact behavior intentional |
| NAV-03 | Switch today -> tasks -> journey | Correct active state and accessible announcement |
| NAV-04 | Empty tasks for synthetic user A | Empty state; no user B tasks |
| NAV-05 | Anonymous/invalid synthetic auth context | Protected content denied without network writes |
| NAV-06 | Synthetic user role vs admin-only task | Server denies admin operation regardless of client UI |
| NAV-07 | Back/forward or Telegram WebView resume | Selected tab restored consistently without privileged state leak |
| NAV-08 | Mock API failure and slow response | Retry/error UI, no duplicate write |
| NAV-09 | Persian text at 200% scaling | Focus and actions remain usable |
| NAV-10 | No AI, payment, notification, or migration mocks | Tab navigation produces zero such calls |

## Mandatory evidence before production release
1. Commit diff identifying all changed modules; independent proposed bundle manifest and SHA-256 for every part.
2. Fresh production multipart code, deployment ID, metadata, routes, bindings (names/types only), D1 schema read-only mapping.
3. Static/unit/contract CI with synthetic data passing on exact commit; RBAC negative cases covered.
4. Read-only GET smoke test of the **existing** production URL and response evidence.
5. A complete rollback artifact matching prior deployment; rollback procedure validated without writing to real D1.
6. Explicit release decision with UTC timestamp, version/deployment and post-release read-only smoke evidence.

**Stop condition:** If any evidence is missing or production-only release cannot be made safe, do not deploy. Never create staging, preview, test Worker, second bot, or environment.
