# Phase 15 — narrow-screen and text-zoom accessibility hardening (2026-11-11)

Scope: CSS candidate in `cloudflare-live/phase15/mobile-ui-refresh.css` only. The development branch was at `357dee7eb13b3032a5bc44ab34d00731b010b657` before these changes. This is NOT deployed to any Worker.

Changes: guard narrow grids from overflowing, retain 16px minimum form text, allow word wrapping at 200% zoom, remove pressed-button transform under reduced-motion preferences. No identity, payment, database, or API changes.

Checks: `node --test cloudflare-live/phase15/mobile-accessibility-css.test.mjs` and `node cloudflare-live/phase15/patch-main-miniapp-ui.test.mjs`. CI workflow `.github/workflows/phase15-mobile-accessibility.yml` runs both. Automated CSS source checks are not equivalent to real-device accessibility acceptance.

Deployment gate: first verify all new CI checks and existing signed-initData, user isolation and staging HTTP checks; inspect the staged source and make a backup. Deploy ONLY to `candidatory-miniapp-integration` after a safe review, then test 320px, 400px, 200% text zoom, keyboard navigation and reduced motion in Telegram. Do not deploy to main or touch `candidatory-news-bot`.

Rollback before deployment: revert commits `05f7a546`, `5dd3c7a9`, `de2c64cf` in reverse order on the development branch. No Worker or D1 rollback is necessary. After any future staging deployment, restore the previous recorded staging Worker version and rerun isolated health and auth tests.

Known limitations: CSS source assertions do not prove actual computed layout or assistive technology behavior; real mobile and two real Telegram accounts remain pending.
