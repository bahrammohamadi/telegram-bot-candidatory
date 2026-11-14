# Phase 15 — RTL mobile UI refresh (2026-11-09)

Scope: **integration candidate only**. Screenshot-led visual improvement for the existing Telegram WebApp, not a new app. The production Worker, news Worker, real users, payments and D1 remain untouched.

## Implementation

- `mobile-ui-refresh.css` adds a light editorial surface, dark teal primary action, soft card hierarchy, consistent focus rings, compact RTL two-column modules, mobile spacing, safe-area padding and reduced-motion support.
- `build-progress-tasks.mjs` injects this stylesheet into the existing `TEST_PAGE` style block before writing the phase15 candidate. All existing HTML element IDs, API routes, event handlers and Telegram signed-auth flows are preserved.
- **No Cloudflare deployment is implied by these commits.** This is source-level integration candidate only.

## Acceptance before staging deployment

1. Run `node cloudflare-live/phase15/build-progress-tasks.mjs`, then `node --check cloudflare-live/phase15/dist/integration-progress-tasks-worker.mjs`.
2. Run phase15 signed-user E2E, owner-isolation, HTTP auth, staging smoke and mobile-navigation checks via GitHub Actions. Require successful results for the current SHA.
3. Open the test WebApp on 320px, 375px and 430px viewports and in Telegram Android/iOS WebView. Confirm keyboard and long Persian labels do not overflow, contrast and focus are visible, and every module opens correctly.
4. Only after staging verification, consider a **test-only** Worker deploy with a recorded previous deployment ID and unchanged D1 binding. Production requires separate explicit authorization.

## Rollback

Revert the two UI commits (`mobile-ui-refresh.css` and the builder injection), rebuild and rerun tests. If a test-only Worker deploy was performed, restore its recorded previous test deployment; never roll back production as part of this change.

## Open limitations

This is a visual CSS pass, not a complete navigation redesign. No real-device validation, screenshots of the rebuilt candidate or new Worker deployment have yet been verified. The main production miniapp is **not** updated.
