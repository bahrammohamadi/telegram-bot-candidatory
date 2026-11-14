# Phase 15 — isolated Mini App accessibility CSS change (2026-11-11)

Scope: development branch only. No Cloudflare deployment, D1 mutation, production release, news Worker change, payment or notification.

## Change
Commit `035a7342ddf60a245f79ddc063bcb087d72f6f96` extends `cloudflare-live/phase15/mobile-ui-refresh.css` with visible keyboard focus (including links and tabindex controls), disabled affordance, content wrapping at 200% zoom, 320px single-column modules, reduced-motion suppression, and forced-colors boundaries. This stylesheet is consumed by `build-progress-tasks.mjs` only when assembling the candidate Worker; it is not live until explicitly built and staged.

## Verification gate
1. Build candidate: `node cloudflare-live/phase15/build-progress-tasks.mjs` (run from repo root); run existing phase15 build and task integration CI.
2. Test with keyboard-only tab navigation, 200%/400% zoom, 320px viewport, OS reduced-motion and Windows high-contrast mode. Ensure no clipped text, focus traps, or horizontal scrolling.
3. Check signed Telegram initData, cross-user task/progress isolation and D1 read budget; no production release based on CSS-only evidence.
4. Confirm integration Worker deployment version and D1 bindings before any staging deployment. Real-device checks remain blocked until testers are available.

## Rollback
If no staging deployment occurred, revert only CSS commit `035a7342ddf60a245f79ddc063bcb087d72f6f96` and this document. If a candidate has been deployed to **integration only**, first redeploy the previously verified integration Worker version, then rerun staging smoke checks. Never roll back the news Worker or production in this workflow.
