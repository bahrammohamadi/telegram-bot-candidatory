# Assessment bank structural integrity guard — 2026-11-09

Scope: test-only on feature/cloudflare-parity-audit-2026-10-29. No Worker upload, D1 write, production changes, secrets, or user data.

The new `miniapp/tests/assessment-bank-integrity.test.mjs` verifies 150 entries, unique nonempty IDs, required textual fields, four distinct nonblank options, integer zero-based answer index within bounds, and finite positive weight. This complements rather than duplicates `assessment-followup-regression.test.mjs`, which checks the 30 follow-up answers specifically. The existing `miniapp-checks.yml` runs all `tests/*.test.mjs` on branch pushes.

Acceptance: obtain a green Mini App checks run for code commit `ab3e3b216fb2e68f59175b18819b7133331f3fc8`; verify staging HTTP signed Telegram authentication, user isolation, D1 health and mobile UX independently before any staging deployment. Structural integrity is not editorial fact-checking.

Rollback: revert code commit `ab3e3b216fb2e68f59175b18819b7133331f3fc8` (and this document if appropriate). No Cloudflare or D1 rollback is required, since this change is test-only. Production release still requires separate explicit approval.