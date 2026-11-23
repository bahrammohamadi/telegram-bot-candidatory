# Tasks authorization contract fixtures — v0.2 (2026-11-23)

Status: **not executable and not a proof of production security**. This file defines test inputs and expected invariants for adapting to the real exported Tasks handlers after route discovery. It must not be used to mark the release gate green.

## Fabricated fixture set

- User A: `user-a`, member of `workspace-one`, role `editor`.
- User B: `user-b`, member of `workspace-one`, role `viewer`.
- User C: `user-c`, member of `workspace-two`, role `editor`.
- Task T1: `task-one`, owner `user-a`, workspace `workspace-one`, title `Synthetic task one`.
- Task T2: `task-two`, owner `user-c`, workspace `workspace-two`, title `Synthetic task two`.
- Mock repository spies: `readCalls`, `writeCalls`; mock auth context must be injected server-side, never taken from the request body.

## Adapter acceptance scenarios

| ID | Operation | Actor/input | Expected invariant |
|---|---|---|---|
| T01 | read T1 | unauthenticated | denied; no repository mutation |
| T02 | read T1 | A, workspace-one | allowed if actual role grants read |
| T03 | read/update/delete T1 | B, known task ID | denied when owner-only; no contents exposed and no writes |
| T04 | read T2 | A, path workspace-two | denied; no cross-workspace data |
| T05 | update T1 | B, viewer role | denied; zero writes |
| T06 | update T1 | A, empty task ID | rejected before storage access |
| T07 | update T1 | A, body owner=user-c or workspace=workspace-two | immutable ownership/workspace; cannot bypass server-side scope |
| T08 | update T2 | A, body role=admin | denied; client role ignored; zero writes |
| T09 | update T1 | A, title changed plus owner changed | allowlisted title only, immutable fields unchanged |
| T10 | list tasks | A, filter workspace-two and pagination | never returns T2 or any out-of-scope item |

## Wiring checklist

1. Locate actual handler entrypoints, auth context construction, role matrix, repository abstraction, route names, and D1 schema in the **existing** branch; record exact paths and line references.
2. Map each case to the real request/response contract and status codes. Do not invent HTTP paths or status codes.
3. Implement an in-memory mock repository with assertions on calls and persisted records; run under GitHub CI with fabricated identities only.
4. Assert the handler's real authorization behavior, **not** a duplicated test-only policy function. Negative cases must verify zero writes and no cross-scope data.
5. Confirm exact SHA CI, multi-module bundle, Cloudflare production binding names/types, routes, metadata, D1 schema, secret presence (never values), and a verified rollback artifact before any deployment.

No production authentication/write tests, D1 migrations, staging, preview, second Worker, bot or Mini App are permitted. `candidatory-news-bot` and `@candidatoryiran` are excluded from all changes.
