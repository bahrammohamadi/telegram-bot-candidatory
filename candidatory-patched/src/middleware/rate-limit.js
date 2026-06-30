// src/middleware/rate-limit.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// Rate Limiting per-user (in-memory)
// ═══════════════════════════════════════════════════════════════
// قبلاً این middleware ساخته شده بود اما در main.js نصب نشده بود (dead code).
// همچنین setInterval cleanup هرگز start نمی‌شد → memory leak تدریجی.
//
// رفتار جدید:
//   • سقف پیش‌فرض: ۳۰ پیام در دقیقه per user (قابل تنظیم با ENV)
//   • پیام اخطار فقط یک بار در دوره ارسال می‌شود (نه هر پیام)
//   • cleanup خودکار فعال (با unref برای polling/long-running)
//   • در serverless ایده‌آل نیست (cold start حافظه را پاک می‌کند)
//     اما Appwrite Function quota طبیعی هم محافظت می‌کند.
//
// ENV:
//   RATE_LIMIT_WINDOW_MS         پنجره (پیش‌فرض ۶۰۰۰۰ یعنی ۱ دقیقه)
//   RATE_LIMIT_MAX_REQUESTS      حداکثر در پنجره (پیش‌فرض ۳۰)
// ═══════════════════════════════════════════════════════════════

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30", 10);
const CLEANUP_INTERVAL = 5 * 60_000; // ۵ دقیقه

const _bucket = new Map(); // userId → { count, windowStart, warned }

function rateLimitMiddleware() {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const key = String(userId);
    const now = Date.now();
    let b = _bucket.get(key);

    if (!b || now - b.windowStart >= WINDOW_MS) {
      _bucket.set(key, { count: 1, windowStart: now, warned: false });
      return next();
    }

    b.count += 1;
    if (b.count > MAX_REQUESTS) {
      // فقط بار اول اخطار بفرست تا اسپم نکنیم
      if (!b.warned) {
        b.warned = true;
        try {
          if (ctx.callbackQuery) {
            await ctx.answerCallbackQuery({
              text: "⏳ لطفاً کمی صبر کنید. درخواست‌ها بیش از حد است.",
              show_alert: false,
            });
          } else {
            await ctx.reply("⏳ تعداد درخواست‌های شما زیاد است. لطفاً یک دقیقه صبر کنید.");
          }
        } catch {}
      }
      return; // drop
    }

    return next();
  };
}

let _cleanupHandle = null;
function startCleanup() {
  if (_cleanupHandle) return _cleanupHandle;
  _cleanupHandle = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of _bucket) {
      if (now - v.windowStart > WINDOW_MS * 2) _bucket.delete(k);
    }
  }, CLEANUP_INTERVAL);
  if (_cleanupHandle.unref) _cleanupHandle.unref();
  return _cleanupHandle;
}

function stopCleanup() {
  if (_cleanupHandle) {
    clearInterval(_cleanupHandle);
    _cleanupHandle = null;
  }
}

module.exports = {
  rateLimitMiddleware,
  startCleanup,
  stopCleanup,
};
