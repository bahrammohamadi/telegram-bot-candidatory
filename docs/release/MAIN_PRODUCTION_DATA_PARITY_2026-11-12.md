# Candidatory — main mini-app production data parity blocker (2026-11-12)

## Live evidence
Cloudflare production Worker candidatory-miniapp-api deployed 100% at version 3c35231f-36f0-4bad-b786-9a4309d8e868 (deployment 860f813c-baf4-4cff-bfc7-bb4120b910ed).
The main Worker entrypoint currently routes / and /review to the preview module with e={DB:env.REVIEW_DB,TELEGRAM_BOT_TOKEN:env.TELEGRAM_BOT_TOKEN,AI_ENABLED:'false'}. Production DB binding is 48b3c86b-45ea-492b-96e1-334dfafa2097, while REVIEW_DB is 2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0.
The active page still contains the phrases «نسخه جدید در حالت بازبینی», «پیش‌نمایش امکانات جدید کاندیداتوری» and links to /review/api/... . Thus a production URL alone does not imply production-data integration.

## Required implementation work
1. Inventory exact schema/table and migrations in both D1 databases using read-only schema queries. Never infer parity from database names.
2. Map user/profile/task/progress/calendar/admin/entitlements records and signed Telegram identity model; identify missing schema and incompatible keys.
3. Implement a production-aware router and client API path strategy with explicit compatibility and safe defaults, not a global blind REVIEW_DB-to-DB substitution.
4. Preserve existing production data; create a verified restore point and a migration plan for any new schema before changes. Do not copy private data into review DB.
5. Verify two-user signed Telegram authorization and ownership, API write/read, mobile UX and failure rollback with real consenting accounts.
6. Keep AI cost, live payments, mass notifications and news Worker unchanged.
7. Only after these checks, switch selected endpoints to production DB and verify post-release behavior; record exact deployment version and rollback.

## Current status
UI-only mobile CSS was deployed on production Worker, but backend parity remains incomplete. This document does not deploy code or alter databases. The next technical step is read-only schema comparison and a production-safe router patch with tests.
