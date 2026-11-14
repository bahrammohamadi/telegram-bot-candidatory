# Phase 8 — private RTL print / PDF export for integrated progress report
Date: 2026-11-02

## Release isolation
- Worker: `candidatory-miniapp-integration` only.
- Verified deployment: `73c779b5-ec8e-4bad-93b3-d0762f29b4fe`.
- D1 binding: `candidatory-integration-test-20261101` (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`).
- Existing Telegram bot token binding kept secret; no secret exported or added to GitHub.
- Exact complete deployed script snapshot: `phase8/integration-deployed-snapshot-2026-11-02.mjs` (73,748 characters).
- No production deployment, no changes to production D1 or the news bot.

## User-facing operation
1. Open test bot WebApp and authenticate normally.
2. Dashboard → گزارش عملکرد → مشاهده گزارش یکپارچه پیشرفت.
3. **چاپ / ذخیره به صورت PDF** uses the device/browser print dialog and A4 RTL print stylesheet. PDF is saved via **Save as PDF**, subject to the mobile Telegram WebView offering print.
4. **دریافت نسخه HTML قابل چاپ** downloads a standalone self-contained local HTML report. Open it in a browser and use Print → Save as PDF if printing within Telegram is unsupported.
5. The offline report is generated only from the already authenticated owner's progress response. It contains eight aggregated metrics and explanation text, but **no Telegram initData, auth token, user identifier, source profile details, external network requests, or scripts**.
6. All PDF/HTML files may contain private aggregate data; store privately and do not share indiscriminately. Files are not encrypted.

## Validation
- GitHub workflow: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41396762708 — successful.
- On 320/375/430 px: mobile WebApp flow, report rendering, printable DOM, media print visibility, A4 PDF generation (nonempty), HTML download, no script/token injection and no horizontal overflow passed.
- Same browser tests run with built Worker HTML and actual fetched Worker HTML.
- Live /health shows isolated DB/secret readiness. Invalid signed identity `/api/progress` rejected with HTTP 401.
- Existing quiz, practice, calendar, goals and progress UI markers remain on live Worker.
- Actual device/browser **Save as PDF** with a real Telegram account is not yet independently validated.
- PDF output is initiated by print dialog; this is *not* direct generation of a PDF file by the Cloudflare Worker.

## Next release gates
- User acceptance test from Telegram on a real phone, including PDF/HTML opening with Persian characters, print margins and privacy.
- If print is unavailable in Telegram WebView, evaluate a client-side PDF generator with secure bundling or allow exporting HTML with the browser flow.
- Recheck content and full-data handling before any production release, obtain backup and explicit production approval.
