# Production release baseline — 2026-11-17 (read-only snapshot)

Scope: **existing** Telegram bot/mini-app, Cloudflare Worker `candidatory-miniapp-api` only. Do not create staging, preview, test deployments or a second Worker. Never modify `candidatory-news-bot` or `@candidatoryiran`.

## Cloudflare API observations (2026-11-17)
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, created `2026-11-11T20:05:53.015284Z`.
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868`, traffic 100%.
- Previous listed deployment: `3d172eb9-eca1-45e5-9070-760970d1f8c1`, version `32d33109-8e48-4c9e-a38a-4dd91012967b`. **Historical reference only; not a verified rollback bundle.**
- Worker compatibility date: `2026-10-27`.
- Binding names and types only (no values): `DB:d1`, `REVIEW_DB:d1`, `AI:ai`, `ADMIN_TELEGRAM_IDS:secret_text`, `ADMIN_TELEGRAM_IDS_MAHDI:secret_text`, `AVALAI_API_KEY:secret_text`, `TELEGRAM_BOT_TOKEN:secret_text`.

## Release gates (fail closed)
1. Retrieve and archive full **multipart** production source and module digests, current metadata, routes, binding types and D1 schema (read-only).
2. Retrieve the complete 18-chapter architecture document dated 1405/08/21; version it without paraphrasing unseen chapters.
3. Confirm branch SHA, passing CI including RBAC/ownership and static/contract/unit tests using synthetic fixtures; no live authentication or writes.
4. Match the exact production metadata/bindings/routes/D1 to the intended multipart release bundle; preserve secrets without reading or replacing their values.
5. Build a verified, checksum-identified rollback artifact and documented restoration procedure before any production upload.
6. Run only safe read-only homepage checks; do not infer endpoint health from deployment metadata.
7. Deploy **only** to existing `candidatory-miniapp-api` if all gates are independently evidenced; record new version, deployment, time, read-only smoke result, and rollback artifact.

## Gap matrix (evidence-limited)
| Area | State | Evidence / remaining requirement |
|---|---|---|
| Worker deployment identification | سالم | Cloudflare deployments API read on 2026-11-17 |
| Binding name/type inventory | سالم | Cloudflare settings API read; values intentionally excluded |
| Full 18-chapter canonical source | ناقص | Full original user-authored text not yet verified in repo |
| Multipart production code/hash inventory | ناقص | Not independently retrieved and matched |
| CI for current branch SHA | ناقص | Must verify run/check conclusion for exact SHA |
| RBAC and case ownership | نیازمند اصلاح | End-to-end synthetic contract evidence missing |
| Five-tab mobile RTL UI | نیازمند اصلاح | No verified implementation parity |
| Rollback artifact | ناقص | Historical deployment is not proof of recoverability |
| Release baseline document | جدید | This snapshot; not authorization to deploy |

**Production release status: BLOCKED.** No deployment, D1 mutation, paid AI request, payment, mass notification, or permission change is authorized by this document.
