# Live Cloudflare Worker release gate — Candidatory
Updated: 2026-10-29

## Critical separation
The live Cloudflare Worker `candidatory-miniapp-api` and the historical GitHub implementation are **not synchronized**. The GitHub feature branch contains legacy Appwrite architecture; never deploy it over the live Worker by default.

## Authoritative state
- Live Worker: `candidatory-miniapp-api`, account's workers.dev subdomain `lasvaram-candidatory`.
- D1 database: `candidatory-miniapp`.
- Main source currently bundled in Worker script as `SITE_HTML`, `SITE_CSS`, `SITE_APP`, `SITE_OPS`, and API implementation.
- Last verified deployment: `117dbec8e994491b90201d3c8ee862d3`.
- GitHub branch `feature/p0-hardening-2026-10-28` remains review-only; PR #3 is not a live release.

## Minimum production release gate
1. Export exact live Worker script and preserve deployment reference for rollback.
2. Reconstruct a local source tree from the export; do not substitute old GitHub code.
3. Apply edits on a separate branch, review diff, run JavaScript syntax checks on both module and extracted app scripts.
4. Check every client API action maps to a server endpoint and authentication requirements.
5. Verify D1 schema, question option bounds, and score ranges with read-only queries.
6. Run automated unauthenticated HTTP checks for sensitive API actions, plus authenticated tests using designated non-production test accounts.
7. Render at 320/375/430px; check RTL, keyboard focus, safe areas, dark mode, 200% text scale, and reduced motion.
8. Validate personal profile create/edit/read/export and two-user data isolation.
9. Deploy to staging first; then promote only the validated artifact. Inspect runtime errors immediately after publish.
10. Document the deployment ID and use it for rollback.

## Known validated facts from 2026-10-29
- 61 client API actions have matching server action branches (static code scan).
- 195 questions distributed across six exams.
- Profile details export added to `myDataExport` on live Worker.
- The Cloudflare API accepted that deployment; the source was re-read and checked.
- Full Telegram WebView E2E, account-isolation penetration test, and real production user profile round-trip are **not yet certified**.

## Do not misreport
A code scan, HTTP 200 response for a Worker source request, or successful deployment is not an end-to-end functional test. Never mark E2E or visual QA as passed without real execution evidence.

## Integration roadmap
First export and version-control the current deployed Worker **in a new dedicated cloudflare-live directory**. Keep secrets out of commits; inspect for embedded credentials before pushing. Only after parity is demonstrated should the deployment workflow shift from manual API PUT to GitHub Actions/Wrangler.
