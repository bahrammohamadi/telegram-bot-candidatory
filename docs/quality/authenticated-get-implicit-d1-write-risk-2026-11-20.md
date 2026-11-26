# Authenticated GET is not read-only — production safety finding (2026-11-20)

Scope: existing `candidatory-miniapp-api` only; **no deployment authorized**. Branch baseline `62ffc1e6ad2fb3b4a1fb2d920c957739179f08fb`.

## Verified code path
In `miniapp/src/worker.mjs`, after `validateInitData` and before dispatching *any* authenticated `/api/` route, the handler executes:

```sql
INSERT INTO accounts(telegram_id,first_name,last_name,username)
VALUES(?,?,?,?)
ON CONFLICT(telegram_id) DO UPDATE SET
 first_name=excluded.first_name,last_name=excluded.last_name,
 username=excluded.username,updated_at=CURRENT_TIMESTAMP
```

This means even nominally read-only authenticated GETs (`/api/overview`, `/api/courses`, `/api/assessment-v2/history`) can write to Production D1. An authenticated GET smoke test is therefore **not read-only** and is prohibited under the production-only safety policy. The unauthenticated GET `/` and `/health` branches occur before this write in the repository source, but live module parity is not yet established; do not infer current deployed behavior solely from GitHub.

## Required correction and acceptance contract
1. Separate identity validation from account mutation. Only explicitly authorized write actions may create/update account records; read routes must not perform an implicit upsert. Preserve legitimate onboarding behavior and existing data.
2. Add offline behavioral tests with synthetic D1 recording all `prepare/run` calls: valid signed GET `/api/overview`, `/api/courses`, and `/api/assessment-v2/history` must cause zero write statements; unauthorized requests must cause zero DB calls. Test both existing and missing synthetic account cases.
3. Check any required account creation on first use via a separate intentional write flow, ensuring backward-compatible UX, schema, and ownership/RBAC. No live D1 test writes or migrations.
4. Before any release: exact SHA CI success, complete deployed multipart module parity, D1/binding/secret-name contract, rollback evidence, and verified primary URL. No staging/preview/test deployment.

## Release gate
**BLOCKED** until behavioral tests and safe migration-free implementation are reviewed. Do not issue authenticated smoke requests to Production. This finding is about inspected repository source, not a verified live vulnerability.

## Evidence
- GitHub source: `miniapp/src/worker.mjs` at branch head `62ffc1e6` (read 2026-11-20).
- GitHub CI for that SHA: 25 runs returned, all concluded success (does not establish live parity).
- Cloudflare production deployment (read 2026-11-20): `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100%, created 2026-11-11T20:05:53Z.
