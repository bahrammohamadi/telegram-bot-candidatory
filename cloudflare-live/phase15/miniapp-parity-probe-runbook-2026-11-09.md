# Mini App read-only parity probe — 2026-11-09

Run: `node cloudflare-live/phase15/scripts/miniapp-parity-probe.mjs https://<main-host> https://<isolated-host>` with **verified** credential-free HTTPS origins. The tool issues four unauthenticated GET requests per origin and records only status and content type, never response bodies, tokens, IDs or receipts. It follows no redirects, enforces an 8-second timeout, and exits 1 on mismatches, 2 on invalid inputs. It must not be interpreted as a test of signed Telegram identity, user isolation, mobile UX or production parity. A matching 401 response only means both endpoints rejected anonymous traffic.

Before running, verify the actual two hostnames from Cloudflare route configuration; do not infer them from Worker names. No automatic deployment or D1 mutation is part of this change. Latest independently checked isolated deployment: `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06 07:58:50 UTC); D1 database exists with 55 tables. The previously observed D1-backed health HTTP 503 remains unresolved. Do not promote to production on this evidence.

Rollback: revert the script and this runbook commits on the development branch. There are no Worker or D1 changes to reverse. For any later test deployment, separately capture deployment/version IDs, bindings, schema changes, smoke-test evidence and a tested rollback before release.
