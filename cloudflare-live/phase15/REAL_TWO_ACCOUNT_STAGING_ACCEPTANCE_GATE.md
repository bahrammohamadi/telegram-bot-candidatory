# Phase 15 — Two-account signed Telegram acceptance gate (staging only)

Status: **BLOCKED — not executed**. This is an executable manual acceptance protocol, not evidence that real accounts were tested.

## Preconditions
- Confirm branch `feature/cloudflare-parity-audit-2026-10-29`, exact SHA, successful CI for that SHA, and active version of `candidatory-miniapp-integration`.
- Confirm the D1 binding points **only** to `candidatory-integration-test-20261101`. Do not touch production data.
- Two consenting human testers (A and B) launch the **staging** Mini App from their own Telegram accounts. Never paste initData, bot tokens, identifiers, receipts or private URLs into issues, CI, screenshots or logs.
- Take a restorable staging D1 backup/bookmark and record only the non-sensitive evidence reference in the private release ledger. If any prerequisite is absent, STOP.

## Procedure and pass criteria
1. On mobile, A creates a uniquely named synthetic task; B creates a different synthetic task. Refresh and reopen each Mini App. Each account sees only its own task (no cross-account list, counts, progress report, or cached response).
2. A completes its task. Its progress overview and report update once; B's progress and report remain unchanged. Reload both accounts and verify persistence.
3. Using a local test harness with a **synthetic** token, send valid signed initData for A and B concurrently; assert owner-bound D1 reads and no cross-user task/report output. Never use real bot tokens in fixtures.
4. Submit absent initData, missing hash, altered user, invalid HMAC and expired auth_date. Each must fail closed with 401 before any D1 read. If expired-auth behavior is not implemented, mark FAIL and open a blocking security issue; do not weaken the gate.
5. Repeat on a narrow mobile viewport and Telegram's in-app browser: navigation, text scaling, keyboard, loading, empty and error states must remain usable. Record device/browser versions without personal details.
6. Verify no unrequested notification, payment, AI request or production news publication occurs. Check the staging Worker and D1 logs for errors with sensitive payloads redacted.

## Evidence and decision
Record: UTC timestamp; commit SHA; CI run URLs; staging deployment version; D1 backup reference; test case PASS/FAIL; redacted screenshots; tester approval. Store evidence privately, never commit signed initData or personal identifiers.

**Release gate:** any failed case, missing evidence, missing backup or inability to verify two independent real accounts means **BLOCKED**. Do not infer a PASS from synthetic CI alone.

## Rollback
For test-only changes, revert the specific Git commit on the development branch. For staging application changes, restore the previously verified Worker version using a staging-only deployment and re-run smoke tests. For staging data changes, restore only the staging D1 backup after confirming scope and data-loss impact. Never roll back or deploy production as part of this protocol.

## Scope
This file is documentation only. No Worker, D1, payment, AI, news channel or production deployment is authorized by it.
