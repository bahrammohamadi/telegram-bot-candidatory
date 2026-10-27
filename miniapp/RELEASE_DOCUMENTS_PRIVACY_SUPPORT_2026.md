# Candidatory — Document, Privacy, Report & Support Release
Date: 2026-10-27
Worker: candidatory-miniapp-api
Cloudflare deployment ID: 4c3b88287c05461281732f8099877106
Branch: feature/telegram-miniapp-supabase (draft/unmerged)

## Implemented and deployed in this release
1. Workspace document registry (HTTPS references, category, visibility members/managers, manager deletion); URLs are external links, **NOT** uploaded storage.
2. Workspace internal notices shown to members, editable only via add by managers.
3. JSON operational report, CSV task/expense export with spreadsheet formula injection escaping; expense access remains manager-only server-side.
4. Personal data export (Telegram profile fields, notes/bookmarks/lesson progress/quiz attempts, limited 500 records each).
5. Privacy requests: export, correction, deletion request registration and status tracking. **Deletion is NOT automatic**; super admin can review/reject. Needs reviewed compliant actual removal flow.
6. Private user support tickets with user-visible status and admin reply queue.
7. Preserved per-workspace roles, signed Telegram auth, protected D1 queries, admin allowlist secret, existing learning modules.
8. Database migrations: migration_documents_privacy.sql and migration_support.sql.

## Verification performed
- Cloudflare Worker deployment PUT success.
- JavaScript syntax validation for source and bundle passed.
- D1 tables workspace_documents, workspace_notifications, privacy_requests, support_tickets found after deployment.
- D1 still reports 12 published lessons, 2 quizzes, 10 questions, 0 workspaces.
- Both ADMIN_TELEGRAM_IDS and TELEGRAM_BOT_TOKEN remain secret_text bindings; DB d1 binding retained.
- Public workers.dev URL unreachable from current execution environment; no real Telegram-authenticated E2E success is claimed.

## Next acceptance tests (human in Telegram)
- Create Workspace from Management; check persistence after reopening.
- Create manager-only link and verify member cannot read it.
- Add an internal notice, open it as member.
- Export tasks and expenses; ensure nonmanager cannot export expenses.
- From Profile submit support ticket; from Admin Support respond; verify reply in user's profile.
- Export user personal data and file opens; file includes ONLY logged-in user data.
- Register privacy correction or deletion request; appears in Super Admin's queue.
- Check Hebrew/Arabic/Persian numerals, iOS Telegram safe areas and file download behavior.
- Confirm Cloudflare Worker error logs show no raw bot tokens, initData, or sensitive content.

## Not completed; cannot be misrepresented as live
- Direct private binary file uploads: requires R2 bucket, signed object access, size/type scanning, retention and authorization.
- Full GDPR/other jurisdiction-specific deletion workflow, backup restore/data purge guarantees, legal retention rules.
- Payment gateway and subscriptions: requires merchant onboarding, payment provider and verified webhook flow; NEVER collect card credentials in Telegram app.
- AI backend: requires provider configuration/budget, model selection, safety and usage limits; no provider key is configured.
- Legacy candidate readiness/SWOT/campaign-specific tools have not been migrated wholesale.
- Automated end-to-end tests with actual Telegram session, multi-tenant security audit, external load test, and recovery drill.
- Real-time push notifications: current workspace notices are read within the mini app, NOT pushed to Telegram.
- No commercial readiness/production security guarantee.

## Admin access
ADMIN_TELEGRAM_IDS is present as Cloudflare Secret. The platform admin UI is still only visible to signed Telegram IDs explicitly allowed in that Secret.
