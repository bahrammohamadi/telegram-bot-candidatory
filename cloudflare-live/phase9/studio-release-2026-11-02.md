# Phase 9 — factual public-information content studio, isolated test release
Date: 2026-11-02

## Scope and deployment
- Only `candidatory-miniapp-integration` Worker changed; no production miniapp or Telegram news channel changes.
- Verified Cloudflare deployment: `e8a68b11-9a57-46b6-b574-a8dff12536b6`.
- D1 binding: isolated `candidatory-integration-test-20261101` (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`).
- Telegram token remains a secret Cloudflare binding; its value is not exposed.
- Full source snapshot: `phase9/integration-deployed-snapshot-2026-11-02.mjs` (86,513 characters) for recovery and parity.
- Prior routes preserved: profile, calendar, goals, speech/Q&A practice, quiz, progress report and print/PDF.

## Functional scope
- In test Mini App: Dashboard → **استودیوی محتوا**.
- Four neutral, generic formats: public service update, public meeting notice, fact correction, civic education.
- User enters title, verified facts, optional HTTPS source; deterministic (not AI-generated) template adds explicit fields requiring verification.
- User edits body (max 4,000 chars), saves drafts, revises, copies text and deletes drafts.
- Owner-only D1 storage with status `draft` or `reviewed` (manual self-review only).
- API: authenticated `POST /api/studio` actions `list`, `create`, `update`, `delete`; all ownership enforced by verified Telegram WebApp initData.
- Max 100 drafts per test account, list last 100.
- No automatic Telegram, Instagram, or other social publishing. No AI inference, no personalized electoral persuasion or targeting.
- All saved contents are TEST data; never enter sensitive real data in this environment.

## Validation
- GitHub Action: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41397644163 — three jobs PASS: studio-e2e, studio-mobile, studio-live-security.
- Real Worker handler against SQLite using two independently signed synthetic Telegram identities: validated input limits, HTTPS-only optional source, cross-account denial, create/update/delete and cleanup.
- Mobile Playwright 320/375/430px on built and retrieved live HTML: entered an informational template, saved, reopened, reviewed, edited and deleted.
- Live /health, studio UI and all prior module anchors verified; invalid and forged auth rejected with 401.
- Direct isolated D1 synthetic fixture: created, read, reviewed, cross-account exclusion, deleted; cleanup verified.
- Actual Telegram user manual create/close/reopen/retrieve not yet performed.

## Follow-up gate
- Verify in `@Iranfashion_bot`: Open → dashboard → استودیوی محتوا, save a synthetic factual draft and retrieve after reopening.
- Before production: maintain user-only access and backup; ensure appropriate moderation and provenance checks for any auto-publishing workflow, review GDPR/privacy if applicable, obtain explicit approval.
- AI assistant, subscription workflows, admin panel and production migration remain separate phases.
