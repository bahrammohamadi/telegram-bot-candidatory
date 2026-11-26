# Production release gate — executable checklist (2026-11-21)

This is a **blocking release gate**, not evidence of passing tests. No alternate Worker, deployment, staging, preview, or production write tests are permitted.

## Current read-only evidence (2026-11-21)
- Production Worker: `candidatory-miniapp-api`.
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`; version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic; deployed 2026-11-11 20:05:53 UTC.
- Compatibility date: `2026-10-27`.
- Binding names/types: `DB` (D1), `REVIEW_DB` (D1), `AI` (AI), `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` (four secret_text). Values not read.
- Exact original 18-chapter architecture text remains **unverified**; `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` identifies itself as a condensed rewrite.
- No new production deployment authorized by this document.

## Mandatory release gates (all must be evidenced before direct production upload)
- [ ] Fetch the target branch head SHA and exact CI runs for **that** SHA; all required checks pass.
- [ ] Retrieve current production multi-module bundle and compare module names, imports, routes, compatibility metadata, bindings, and D1 identifiers with the candidate bundle; document differences without disclosing secrets.
- [ ] Unit/contract tests with synthetic users cover invalid Telegram initData, expired/replayed data, cross-workspace read/write, ownership changes, role escalation, unauthenticated D1 access, and fail-closed errors.
- [ ] No production writes, login probes, destructive D1 migrations, paid AI, payments, bulk messages, or administrator access changes.
- [ ] Establish the official production URL from current route/worker metadata and perform read-only GET smoke check; record HTTP status and UTC timestamp.
- [ ] Capture a verified rollback package for the **complete** prior multi-module Worker including metadata/bindings; validate restore steps statically, without deploying.
- [ ] Security review approves the specific diff; if any gate remains unresolved, **DO NOT DEPLOY**.

## Gap matrix
| Area | State | Next evidence |
|---|---|---|
| Worker identity and binding names | سالم | Fresh read-only snapshot before release |
| Full verbatim 18-chapter reference | ناقص | Recover original user message, not paraphrase |
| Cross-workspace authorization | نیازمند اصلاح | Executable tests against actual handlers |
| Complete multi-module parity | ناقص | Compare fetched production bundle |
| Release gate record | جدید | This file |
| Production URL smoke check | ناقص | Verified canonical route and GET |
| Safe rollback | ناقص | Full bundle and static restore validation |

## Scope guard
Only `bahrammohamadi/telegram-bot-candidatory` branch `feature/cloudflare-parity-audit-2026-10-29` and the existing `candidatory-miniapp-api` production Worker are in scope. Do not modify `candidatory-news-bot` or `@candidatoryiran`.
