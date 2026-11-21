# Production-only release gate — 2026-11-16 00:57 UTC

Scope: candidatory-miniapp-api ONLY. This is a read-only checkpoint, NOT approval to deploy.

## Verified current GitHub baseline
- Repository: bahrammohamadi/telegram-bot-candidatory
- Branch: feature/cloudflare-parity-audit-2026-10-29
- Branch HEAD: d555c97582bb50cbef470547ae9593354afe6f48 (compare endpoint: identical to named branch).
- GitHub workflow results for this SHA: Worker binding parity guard run 43777768532 SUCCESS; Worker multipart artifact parity run 43777768539 SUCCESS; signed initData regression run 43777768561 SUCCESS.
- These CI successes are NOT evidence of byte-for-byte identity with deployed Cloudflare source.

## Verified Cloudflare production baseline (read-only)
- Worker: candidatory-miniapp-api.
- Active deployment: 860f813c-baf4-4cff-bfc7-bb4120b910ed, created 2026-11-11T20:05:53Z.
- Active version: 3c35231f-36f0-4bad-b786-9a4309d8e868, 100% traffic.
- Compatibility date: 2026-10-27.
- Binding inventory (names/types only): ADMIN_TELEGRAM_IDS(secret_text), ADMIN_TELEGRAM_IDS_MAHDI(secret_text), AVALAI_API_KEY(secret_text), TELEGRAM_BOT_TOKEN(secret_text), AI(ai), DB(d1), REVIEW_DB(d1).
- Script code retrieval GET /content/v2 succeeded, but no per-module SHA comparison or rollback package was produced in this checkpoint.
- No D1 mutations or authentication writes were performed.

## Release blockers
1. Produce byte-for-byte module inventory and per-module hashes for active source and candidate bundle; verify main module, all module names, and MIME types.
2. Verify routes and public URL by independent read-only request; compare script metadata and D1 schemas read-only.
3. Demonstrate offline RBAC/authorization tests and verify deployment artifact references the exact CI-passed SHA.
4. Preserve full rollback artifact (code, metadata, binding names and IDs, deployment version) without storing secrets in GitHub; document restore procedure and operator verification.
5. Recover the exact 18-chapter architecture document before claiming requirements traceability.
6. No production deployment unless every gate passes. No staging, preview, extra Worker, or test deployment.

## Gap matrix
| Item | Classification | Evidence / next gate |
|---|---|---|
| Branch SHA and CI baseline | سالم | Verified SHA and three named runs |
| Production deployment metadata and binding names | سالم | Read-only Cloudflare APIs |
| Exact active/candidate module parity | ناقص | Missing per-module hashes |
| Full 18-chapter source text | ناقص | Must recover verbatim |
| RBAC and D1 compatibility proof | نیازمند اصلاح | Static/offline tests and read-only schema |
| Production URL smoke check | جدید | Read-only HTTP request required |
| Verified rollback artifact | ناقص | Capture exact multipart package and recovery plan |

No release authorization is implied by this checkpoint. The news Worker and @candidatoryiran are out of scope.
