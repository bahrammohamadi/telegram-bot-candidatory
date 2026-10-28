# Candidatory — Functional Tool Screens & Real Meeting RSVP
Date: 2026-10-27
Cloudflare Worker: candidatory-miniapp-api
Latest deployed version: 2b650658ae0f49e3a03d9689aabfb7c9
Source branch: feature/telegram-miniapp-supabase

## Real implementation in this release
1. 16-icon launcher retains self-contained dimensionally styled SVG icons and staggered motion.
2. Workspace deep links now open a **focused tool view** with a back button, rather than merely scrolling across the entire admin dashboard.
3. New workspace onboarding explicitly explains the creation workflow. If workspace contains no tasks/events/docs, presents shortcuts for first task/event/document. No fake live data seeded.
4. Commitment status selector in workspace can now call existing authenticated `commitmentStatus` endpoint; server-side roles still restrict publishing to manager/admin.
5. Meeting RSVP: workspace members may answer `going`/ `unable`; response stored per signed Telegram ID + event; manager sees counts, ordinary members see only their own answers. Not a proof of physical attendance.
6. D1 migration `migration_event_rsvps.sql` applied and versioned in GitHub. Every query scoped by workspace and membership; no paid services enabled.

## Verification
- GitHub Actions free build & syntax test successful: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/40521540782
- Cloudflare deploy API reported success.
- Post-deploy D1 table `event_rsvps` exists.
- 12 published lessons, 2 quizzes, 10 quiz questions preserved.
- D1, Workers AI, TELEGRAM_BOT_TOKEN and ADMIN_TELEGRAM_IDS bindings present; latter two are secret_text.
- Existing workspace count is 0; actual authenticated write/read flow cannot be verified before a legitimate Telegram user creates the first workspace.

## Test in Telegram
1. Fully close and reopen @candidatoryiran_bot Mini App.
2. Tap Management or Tasks. If no workspace exists, onboarding and New Workspace form appear; create your own workspace.
3. From Home, tap Tasks. Only tasks tool section should be in focus; add a task and verify it remains after reopening.
4. Tap Programs. Create a commitment and move it through draft > review; manager can publish, normal member cannot.
5. Tap Meetings. Create a session and respond `going`; after refreshing, response should persist.
6. Invite a team member with Telegram ID; they must accept. Ensure they cannot see another workspace or manager-only expenses.
7. If functionality fails, capture screen + error message without revealing secrets.

## Still not completed
- No direct R2 private file upload; R2 not enabled and user insists on zero cost.
- No external payment provider, no SMS, no paid AI provider. Existing free Workers AI limits apply.
- Further old-bot analysis modules, full actual account deletion, backups/restore drills, and high-assurance E2E access testing remain.
- Do not call this a fully validated production multi-tenant release before authenticated cross-account tests.
