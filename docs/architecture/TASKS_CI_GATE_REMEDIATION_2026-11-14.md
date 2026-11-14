# Tasks runtime CI remediation — 2026-11-14

Scope: existing `candidatory-miniapp-api` only. **NO PRODUCTION DEPLOY authorized by this document.**

## Source evidence inspected on the target branch

- `.github/workflows/candidate-task-static-gate.yml`: runs Node 22 static markers, source-only SQL checks, SQLite `:memory:` checks, and migration provenance guard; its final step fails if `cloudflare-live/phase14/dist/integration-tasks-worker.mjs` is absent. It does not build this artifact.
- `package.json`: only `start` script (`node src/main.js`), no deterministic Cloudflare multi-module build.
- `docs/architecture/TASKS_RUNTIME_BUILD_BLOCKER_2026-11-13.md`: earlier production metadata is historical and must not be treated as a current deployment observation.

## Concrete remediation acceptance criteria

1. Read the exact production Worker module manifest and repository entrypoint/import graph **read-only**, and record filenames, compatibility date/flags, bindings, routes, and D1 schema compatibility. Do not guess an entrypoint.
2. Pin a local/offline bundler and lockfile; produce `cloudflare-live/phase14/dist/integration-tasks-worker.mjs` deterministically **inside the GitHub Actions job**, without publishing any Worker, preview, staging or other environment.
3. Ensure the generated artifact imports no live-only modules in synthetic mode and contains no credentials. Save artifact SHA-256 and a module manifest as CI evidence.
4. Run `tasks-e2e.mjs` with synthetic identities and in-memory SQLite; require forged identity rejection, cross-user isolation, ownership enforcement, quotas and expiry behavior. Fail closed if artifact absent or test fails.
5. Keep migration provenance check before runtime test. Never apply `tasks-migration.sql` to production D1: its header says isolated-only.
6. Before a production change: verify all CI checks on the exact commit SHA, read-only live HTTP health, current Cloudflare deployment/version, metadata/secrets names only, D1 schema, route and binding parity, and a specific prior-version rollback command and version ID. No live write test.

## Gap matrix (evidence-limited)

| Area | Classification | Basis |
|---|---|---|
| Synthetic SQLite source checks | سالم (definition only) | Workflow steps exist; latest run result not established here |
| Runtime E2E artifact build | ناقص | Missing build command/step |
| Production module and binding parity | نیازمند اصلاح/تأیید | Historical evidence only; current state unverified |
| Runtime CI artifact hash + manifest | جدید | No verified reproducible artifact |
| Read-only live URL smoke and rollback proof | جدید | No verified evidence |

This is a documentation-only change. No D1 writes, secrets, bot changes, paid AI, mass messages or production deployment.