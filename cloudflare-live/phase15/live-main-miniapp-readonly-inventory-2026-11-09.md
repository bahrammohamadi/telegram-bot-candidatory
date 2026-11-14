# Read-only main Mini App inventory — 2026-11-09

## Verified sources (Cloudflare API, read only)
- Production-named Worker `candidatory-miniapp-api`: retrieved source response length **450295 characters**.
- Isolated Worker `candidatory-miniapp-integration`: retrieved source response length **147362 characters**.
- Both returned source strings containing `/api/tasks`, `/api/progress`, `/api/studio`, `/api/admin-console` and the phrase `پرونده آزمایشی کاندیداتوری`.
- Neither retrieved response contained the literal string `Telegram.WebApp`. This is **not** proof of missing Telegram integration: code may use a different integration method or include external frontend assets.
- These are **string-presence observations only**, not a source diff, proof of equivalent route behavior, or authorization to promote.
- The isolated deployment list still reported latest deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` at `2026-11-06T07:58:50Z`.
- GitHub development HEAD at inspection: `19f2e92239801e2134e7e70c9dbf5356b3ae91cb`. Phase15 integration CI `42527999591` passed; isolated HTTP auth CI `42528005877` failed; staging HTTP `42528005791` failed; live source parity `42528005787` passed.
- The HTTP auth job logged public shell HTTP 200, D1-backed health HTTP 503 with `DB_UNAVAILABLE`, and **0 unexpected / 0 unavailable auth probes** across 14 checks. It does not demonstrate readiness.
- No Worker, D1, production, channel or bot changes were made during this inspection. No secrets or source content were copied into this document.

## Critical finding
The production-named Worker source response is substantially larger than the isolated Worker response. Do **not** replace the active main Mini App with the 147k isolated candidate. The existing phase15 build is derived from a pinned test snapshot, not from a verified current main-app source baseline.

## Next safe implementation
1. Identify and snapshot the exact active main Mini App frontend, Worker version and route contract **without publishing source or secrets**.
2. Build a sanitized preservation matrix for every production route, navigation entry, account permission and storage table. Require an explicit inventory diff before assembling a unified test candidate.
3. Port the phase15 task-progress change into a candidate based on that main-app baseline; deploy **only** to `candidatory-miniapp-integration` after health, signed-owner isolation, mobile and rollback checks pass.
4. Fix intermittent D1-backed HTTP 503; investigate quota/binding/runtime logs, avoiding repeated heavy queries.
5. Obtain separately scoped approval for any production promotion.

## Rollback
This file is documentation-only. Revert its GitHub commit to remove it; no Cloudflare rollback is necessary. For a future test-only deployment, record the previous deployment ID, version, bindings, migration state and the exact reverse action before deployment. Production rollback is **not** authorized by this inventory.
