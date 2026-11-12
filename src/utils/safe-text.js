// src/utils/safe-text.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// ابزارهای ایمن‌سازی متن قبل از ارسال به تلگرام
// ═══════════════════════════════════════════════════════════════
// چرا لازم است؟
//   پروژه تقریباً همه‌جا از parse_mode: "Markdown" استفاده می‌کند
//   و در متن، داده‌ی کاربر را تزریق می‌کند (مثلاً نام، شعار، توضیحات).
//   اگر داده‌ی کاربر شامل کاراکترهای markdown مثل *, _, `, [, ] باشد:
//     ۱) parse تلگرام می‌شکند → خطای 400 → پیام ارسال نمی‌شود
//     ۲) در بدترین حالت، کاربر می‌تواند لینک‌های جعلی تزریق کند
//        (مثلاً نام خود را «[Google](https://evil.com)» بگذارد)
//
// راه‌حل: قبل از inline کردن هر داده‌ی کاربر در یک قالب Markdown،
//          آن را با escapeMd پاس بدهید.
// ═══════════════════════════════════════════════════════════════

/**
 * Escape برای parse_mode: "Markdown" (نسخه legacy تلگرام).
 * این نسخه فقط *, _, `, [ را escape می‌کند چون فقط همین‌ها معنی‌دار هستند.
 * (Markdown legacy از ] استفاده نمی‌کند مگر داخل [text](url) که با [ هندل می‌شود.)
 */
function escapeMd(input) {
  if (input === null || input === undefined) return "";
  return String(input).replace(/([_*`\[])/g, "\\$1");
}

/**
 * Escape برای parse_mode: "MarkdownV2" — سختگیرتر است.
 * مطابق https://core.telegram.org/bots/api#markdownv2-style
 */
function escapeMdV2(input) {
  if (input === null || input === undefined) return "";
  return String(input).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

/**
 * Escape برای parse_mode: "HTML".
 */
function escapeHtml(input) {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * نسخه‌ی ساده برای نمایش متن بدون هیچ formatting:
 * حذف یا escape همه‌ی کاراکترهای ریسک‌دار.
 * مناسب برای فیلدهای کوتاه مثل نام، یوزرنیم.
 */
function plain(input, maxLen = 200) {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/[\u0000-\u001F\u007F]/g, "") // control chars
    .replace(/[*_`\[\]]/g, "")              // markdown chars
    .slice(0, maxLen)
    .trim();
}

/**
 * برش امن متن برای نمایش (با ... در انتها).
 */
function truncate(input, maxLen = 100) {
  const s = String(input ?? "");
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + "…";
}

module.exports = {
  escapeMd,
  escapeMdV2,
  escapeHtml,
  plain,
  truncate,
};
