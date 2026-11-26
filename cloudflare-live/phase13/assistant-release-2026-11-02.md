# Phase 13 — Neutral civic-management guide and optional AI provider integration
Date: 2026-11-02

## Deployment and isolation
- Only `candidatory-miniapp-integration` TEST Worker was deployed.
- Deployment: `9a8ad303-d189-4e2f-8f5f-c589f9fb3a9a`.
- Isolated D1: `candidatory-integration-test-20261101`, UUID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`.
- Worker source exact deployed snapshot: `phase13/integration-deployed-snapshot-2026-11-02.mjs`, 131,042 characters.
- Token `TELEGRAM_BOT_TOKEN` remains secret; 11 prior API routes preserved. No production worker, news bot or production D1 change.
- No Cloudflare AI binding and no AI_ENABLED flag configured. **AI inference is OFF, and no model API costs were incurred or AI text answers actually generated**.

## User-facing guide
- Dashboard → `دستیار هوشمند` opens a real working, no-cost, non-LLM civic administration guide.
- Five educational templates: public-service meeting agenda, project progress report, claim/source verification checklist, study/practice plan, tracking generic public service requests.
- User may enter a public topic for a locally assembled copyable checklist. No personalized election persuasion, voter targeting, fabricated electoral claims or legal deadlines.
- UI clearly labels the non-AI template mode and disabled AI option. User can copy the answer.

## Optional future Workers AI integration
- Authenticated `POST /api/assistant` actions: `status`, `guide`, `ask`.
- `ask` is reachable only if **both** Cloudflare `AI` binding is present and `AI_ENABLED='true'`; otherwise HTTP 503 AI_NOT_ENABLED without cost.
- Model prepared: `@cf/meta/llama-3.1-8b-instruct-fp8-fast`; when available, server applies a short neutral civic-education instruction, limits prompt length, blocks common contact info and returns a fact-check caveat.
- Proposed guardrail: Free 2 calls/day, simulated Pro 6/day; global hard cap 20 calls UTC/day; SQLite BEFORE INSERT triggers prevent direct/concurrent quota bypass. Charges may still apply depending on account plan; **do not enable without explicit budget and privacy review**.
- D1 `assistant_usage_v1` stores request ID, Telegram user ID, UTC date and mode only. **No prompts, AI answers or personal profile are persisted in this table.** The user’s question is sent to Cloudflare's AI service if and only if enabled. No other external AI provider is used.
- No live legal/election facts are sourced from the model; require official verified sources for precise electoral rules and dates.

## Validation
- GitHub Actions: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41416729901
- All three CI jobs passed: Worker handler + SQLite synthetic Telegram HMAC auth, optional AI mock response, no-AI default, privacy/contact-input checks, daily plan quotas, expired plan, SQL trigger bypass, mobile 320/375/430 px using built and fetched live page, and live unsigned/forged request denial.
- Verified Cloudflare settings: AI binding absent, AI_ENABLED absent, secret token preserved, isolated D1 binding unchanged. D1 table + both quota triggers exist.
- **Real Telegram account signed in to the published miniapp has not yet been independently smoke-tested; all browser API responses were mocked.**

## Official Telegram channel publishing
- Requested `@candidatoryiran`. Composio current Telegram account is `@Hirka_Bot` and attempting `sendMessage` failed with `403 Forbidden: bot is not a member of the channel chat`.
- No channel message was published. Do not misreport public launch or send a post via an unrelated bot.
- A separate connection flow was initiated for an authorized Candidatory Telegram bot via Composio. Once the user completes it, verify the account is ACTIVE and bot has `can_post_messages` channel permission, then publish the prepared test-stage update with a real message ID and permalink.
- No production app promotion performed; do not advertise the isolated development Worker as a public paid service.

## Further work
- Verify app in user's real Telegram account, configure actual two admins and secure receipt storage, complete budget gating and opt-in inference, then a staged production security review and explicit launch approval.
