# Follow-up assessment regression guard — 2026-11-09

Scope: test-only; no Worker upload, D1 migration, production change, or secrets.

The prior 30 follow-up answers were corrected from invalid index 4 to index 0 in commit 3493356871a594e72c618200908a51117da430d2. The new `miniapp/tests/assessment-followup-regression.test.mjs` asserts exactly 30 follow-up items, the zero-based answer index, evidence-review answer wording, and four distinct options. Existing `miniapp-checks.yml` runs `node --test tests/*.test.mjs`, so this file is included automatically on push/PR.

Acceptance: the Mini App checks workflow must pass at this branch head, followed by isolated HTTP signed-Telegram authentication, owner isolation, staging D1 health, and mobile checks before any staging deployment. This test checks answer-key consistency, **not** the independent editorial validity of the questions.

Rollback: revert test commit 4810ff04c13dc02066656bf4feaec1b55e1e807a; no Cloudflare/D1 rollback is needed because no runtime was deployed. Production remains separately approval-gated.
