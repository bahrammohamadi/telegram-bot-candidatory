# Production-only execution policy — 2026-11-12

Reference: user-provided «سند جامع معماری نهایی پروژه کاندیداتوری», v1.0 (1405/08/21), chapters 1–18. This file records the latest deployment constraint; it does not claim that the complete architecture has been transcribed or audited.

## Binding decision
- **Only deployed product:** existing Telegram bot and existing Cloudflare Worker `candidatory-miniapp-api`.
- **No second runtime:** do not create or deploy a staging, preview, test, isolated Worker, bot, Mini App, or database.
- **Protected unrelated systems:** never modify `candidatory-news-bot` or `@candidatoryiran`.
- **Code workflow:** use the existing GitHub repository and branch. Read live version, routes, full multipart source, metadata, binding identities, D1 identities, CI and prior docs before preparing any release.
- **Testing without a second runtime:** static analysis, unit and contract tests with synthetic fixtures in GitHub CI are permitted. Never run destructive/write tests against production user records.
- **Production release gate:** require verifiable CI on the exact commit, verified complete multipart artifact, binding and route parity, data compatibility, secure auth/authorization, verified rollback plan, and post-release smoke test. If a requirement cannot be demonstrated safely without a separate runtime, **do not deploy**; report the blocker. Do not bypass gates just to satisfy the production-only request.
- **No separate authorization:** real payments, paid AI usage, bulk messages, destructive D1 changes, admin-permission changes and disclosure of secrets/user data remain prohibited.
- **Product direction:** implement the 18-chapter architecture incrementally on the existing system; retain functioning features and user data; five tabs Today / My Journey / Tasks / Learning / Account; modular monolith and workspace-scoped authorization.
- **Reporting:** each run must state exact commit, CI links/results, production release yes/no with verified version/deployment, homepage smoke, rollback readiness, blocker and next action. Do not claim success without evidence.

## First execution observations
- GitHub file `scripts/verify-worker-bindings.mjs` was read from the specified feature branch.
- The proposed master-architecture Markdown file at `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` was not found on that branch during this check.
- Combined commit statuses for prior commit `bd6aa93a7b5314d351b28ce15f9dd67c9792cd97` returned an empty list; this is **not** evidence that GitHub Actions passed.
- Current Cloudflare production version, bindings, homepage and rollback were **not yet verified in this execution**. This policy file is not a production deployment.

## Next concrete step
Transcribe the full user-supplied 18-chapter master architecture into versioned repository documentation and build a chapter-to-code/test/status gap matrix. Then compare the existing Worker artifact against the source tree and CI results before proposing any production release.
