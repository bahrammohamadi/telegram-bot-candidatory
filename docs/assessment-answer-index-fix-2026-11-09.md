# Assessment answer-index repair — 2026-11-09

## Evidence and scope
Mini App checks run 42564047256 on prior HEAD 4893570e failed assessment-bank.test.mjs because 30 follow-up questions had `correct: 4` with four options (valid indices 0–3). Auth boundary tests in that run passed. This is a source data correction, not an authentication change.

## Change
Commit 3493356871a594e72c618200908a51117da430d2 changes only those 30 out-of-range indices to 0, matching the first option's evidence-review/follow-up wording. No question prompts or other options were changed. No database writes or deployments.

## Acceptance
Require passing Mini App checks (all assessment/auth tests), HTTP signed Telegram auth smoke, staging smoke, Cloudflare source parity, user isolation and mobile tests before isolated deployment. Verify results against the new commit, not previous green runs. Recheck editorial quality of answer keys separately before public release.

## Rollback
Revert 3493356871a594e72c618200908a51117da430d2 on the development branch and re-run CI. No Worker/D1 rollback required for this change because nothing was deployed. For any later staging deployment, retain the previous verified Worker version and D1 backup; production remains gated by explicit approval.
