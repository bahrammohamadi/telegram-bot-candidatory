# Production release gate — 2026-11-12

Active deployment: 860f813c-baf4-4cff-bfc7-bb4120b910ed, Worker version 104: 3c35231f-36f0-4bad-b786-9a4309d8e868, deployed 2026-11-11T20:05:53Z. Previous deployed version: 32d33109-8e48-4c9e-a38a-4dd91012967b.

Compatibility date: 2026-10-27. Binding names and types: ADMIN_TELEGRAM_IDS secret_text; ADMIN_TELEGRAM_IDS_MAHDI secret_text; AI ai; AVALAI_API_KEY secret_text; DB d1 48b3c86b-45ea-492b-96e1-334dfafa2097; REVIEW_DB d1 2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0; TELEGRAM_BOT_TOKEN secret_text. No secrets read.

NO-GO: exact multipart source/artifact of active Worker has not been independently matched to GitHub, and rollback compatibility not proven. Prior audit shows 21 review-only schema objects, including quota triggers. Do not migrate production D1 or upload partial Worker.

Before release: record branch HEAD and CI; capture active multi-module bundle and route; compare all modules/assets and preserve settings, secrets, bindings and route; hash exact release artifact; run synthetic signed Telegram auth, tenant isolation, task/report, RTL/mobile, private receipt, opt-in notification and AI quota tests as applicable; verify rollback to recorded version without data migration; deploy only small reversible change and smoke-test root and auth endpoints. Record new version and deployment ID.

No production changes were made during this audit.