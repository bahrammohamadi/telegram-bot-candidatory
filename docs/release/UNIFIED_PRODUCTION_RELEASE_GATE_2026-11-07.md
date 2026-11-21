# Unified production release gate — Candidatory
Date: 2026-11-07
Branch: feature/cloudflare-parity-audit-2026-10-29
Decision: develop and test in isolated staging; prepare one consolidated release. **No production deployment without a new, explicit user approval after the final evidence package is reviewed.**

## Isolation
- Staging Worker: candidatory-miniapp-integration
- Staging D1: candidatory-integration-test-20261101
- Do not modify candidatory-news-bot, live bot/webhook, production D1, Telegram channel, live payment providers, or paid AI.
- Never include tokens, personal receipts, real Telegram initData, private admin IDs, or secrets in commits/logs.

## Mandatory release evidence
1. Record current development and production commit hashes, deployment versions, bindings and environment names without secret values.
2. Confirm CI green for the exact release SHA; API/health smoke must pass from outside Cloudflare.
3. Validate genuine signed Telegram initData and negative tests (expired, malformed, forged); prove cross-user data isolation.
4. Verify task-to-performance-report UX, mobile widths 320/375/430, accessibility, and navigation with real consenting test accounts.
5. Verify secure two-admin permissions only after authorized IDs are supplied through secure secrets; least privilege.
6. Verify private receipt storage, trial subscription logic, payment ledger audit, opt-in notifications; no real charges.
7. Keep AI off unless explicit opt-in, cost ceilings, and budget controls are validated.
8. Resolve D1 quota / DB_UNAVAILABLE / HTTP 503 instability; verify backups and a tested restore on isolated staging.
9. Produce release diff, deployment commands, migration plan, rollback commit/version, database restore procedure, and go/no-go matrix.
10. Ask user for **separate explicit approval for the exact production release**; never infer approval from this document.

## Release blockers and next independent task
Previous reports indicate intermittent staging /health HTTP 503 and D1 quota error 7500. A direct D1 read reportedly recovered, but end-to-end Worker-to-D1 health is not yet proven. Prioritize validating that end-to-end path and diagnosing root cause before promoting any release.

## Rollback policy
For staging-only code/document changes: revert the specific commit on the development branch after checking concurrent changes. For future production release: preserve previous deployment ID, immutable release SHA, environment configuration and pre-migration database backup; rehearse restoration on staging first. Never assume code rollback reverses database migrations.

## Current status
This document is a release-policy checkpoint, **not** a passed QA gate, production authorization, or proof of deployment. CI and staging results must be independently checked at the exact target commit.
