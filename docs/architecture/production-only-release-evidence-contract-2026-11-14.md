# Production-only release evidence contract — 2026-11-14

Status: BLOCKED until all mandatory evidence is attached. This is a release gate, **not** proof of readiness.

## Scope
- Existing Telegram bot and Mini App only; only Cloudflare Worker `candidatory-miniapp-api`.
- No staging, preview, secondary Worker, shadow deployment, new bot, or temporary environment.
- Never touch `candidatory-news-bot` or `@candidatoryiran`.
- Never execute write/auth probes, destructive D1 changes, or real payment/paid-AI/bulk notification against Production.

## Evidence required for every production release
| Gate | Required artifact | Blocking condition |
|---|---|---|
| Current Git SHA | Branch ref and exact full SHA read immediately before release | Missing/stale SHA |
| CI | Successful runs for **the exact candidate SHA**, including static/unit/contract/RBAC tests with synthetic fixtures | Pending/failing/mismatched SHA |
| Active Worker | Fresh version/deployment ID, multi-module names + hashes, metadata, routes | Unknown active state |
| Bindings | Names/types of all bindings, D1 database IDs, secret **names only**, compatibility settings | Missing or unexpected difference |
| Candidate bundle | Reproducible multi-module artifact and independently generated manifest/hashes | Self-comparison or absent artifact |
| Parity/diff | File-by-file and module-by-module comparison of active code vs candidate | Unreviewed code difference |
| D1 | Read-only schema inspection and verified backward compatibility; no migration without separate approval | Schema uncertainty |
| Security | Offline synthetic tenant-isolation, RBAC, auth contract and injection regressions | Any failing test |
| UI | Five-tab RTL mobile acceptance checks and keyboard/accessibility tests | Missing or failing |
| Rollback | Previous known-good full bundle, binding compatibility, recovery steps and responsible operator | Unverified recovery |
| Smoke | Read-only GET of **actual canonical production URL** before/after, with timestamp/status | Unreachable or unknown URL |

## Release record template
- Timestamp (UTC):
- Git candidate SHA:
- CI links and conclusions:
- Production Worker version/deployment **before**:
- Module manifest and diff artifact:
- Bindings/D1/secret-name verification:
- Offline RBAC/security/RTL test links:
- Rollback artifact identifier and compatibility:
- Approval for any separately restricted operation: N/A (none allowed by default)
- Production Worker version/deployment **after**:
- Canonical URL read-only smoke GET: HTTP status, timestamp, URL:
- Decision: **NO RELEASE** unless every gate passes.

## Current evidence status
Last Git branch SHA observed on 2026-11-14: `8628e4805b18895ae9ac413d90f72e17d6518c22`. This is a historical observation, **not** a deployment claim. Live Cloudflare metadata, current production URL, full architecture source text and rollback readiness are not established by this document. Do not infer them from prior reports.

## Next concrete engineering slice
Implement and test one small RTL navigation improvement against the existing Mini App code, preserving its five-tab information architecture. Keep candidate changes on the specified Git branch; deploy only after every gate above is independently verified.