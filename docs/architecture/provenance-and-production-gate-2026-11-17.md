# Architecture provenance and release gate — 2026-11-17 16:50 UTC

Target: existing production Worker `candidatory-miniapp-api` ONLY. Repository branch: `feature/cloudflare-parity-audit-2026-10-29`.

## Canonical source provenance

The user supplied the canonical Persian document titled «سند جامع معماری نهایی کاندیداتوری، نسخه ۱.۰، ۲۱ آبان ۱۴۰۵» in a message dated 2026-11-12. It has 18 chapters and phases 0–8. A previous repository file `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` was described as a **compressed structured rewrite**, NOT a verbatim transcript. Do not label it canonical verbatim or reconstruct missing paragraphs from memory. Verbatim archival remains BLOCKED until the full original message bytes can be recovered and compared.

## Verified Cloudflare snapshot (read-only, 2026-11-17)

- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (2026-11-11T20:05:53Z).
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (100%).
- Compatibility date: `2026-10-27`.
- D1 bindings: `DB` and `REVIEW_DB`; metadata only; no SQL executed.
- AI binding: `AI`; no inference executed.
- Secret bindings (names only): `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. Values not requested.
- Historical deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1` is NOT a validated rollback artifact.

## Release decision: NO-GO

No production deployment until all conditions are evidenced for the **same candidate SHA**:

1. Complete, reproducible multipart module manifest with module names, sizes, hashes and metadata.
2. Exact Cloudflare routes, bindings, secrets **names/types**, D1 schema compatibility and deployment settings compared to candidate.
3. Static, unit, contract and RBAC/ownership regression checks with synthetic fixtures pass in GitHub CI without deploying any environment.
4. Safe read-only public entrypoint smoke test and documented expected output.
5. Immutable rollback package verified to restore full multipart bundle and bindings without modifying D1.
6. Explicit verification that no workflow creates or calls secondary Workers, previews, staging or test deployments.
7. No real payments, paid AI, bulk messages, destructive migration, admin-permission changes, or access to secrets.

## Gap matrix

| Scope | State | Evidence/next action |
| --- | --- | --- |
| Active Worker identity and binding inventory | سالم | Cloudflare read-only API |
| Source provenance warning and no-go gate | جدید | This file |
| Verbatim 18-chapter archive | ناقص | Recover exact 2026-11-12 message |
| Multipart module hashes, routes, D1 schema | ناقص | Read-only comparison |
| CI for exact SHA | ناقص | Verify run and result |
| Candidate ownership and RBAC tests | نیازمند اصلاح | Fixture-based regression |
| Mobile RTL five-tab experience | نیازمند اصلاح | Testable UI acceptance criteria |
| Immutable rollback package | ناقص | Artifact and procedure |

The news Worker `candidatory-news-bot` and channel `@candidatoryiran` are excluded from all writes.
