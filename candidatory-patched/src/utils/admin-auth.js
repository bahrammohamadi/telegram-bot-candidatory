// src/utils/admin-auth.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// احراز هویت و دسترسی ادمین
// ═══════════════════════════════════════════════════════════════
// مسئولیت‌ها:
//   ۱) تشخیص اینکه آیا کاربر «ادمین» است یا نه
//        منبع حقیقت:
//          • role === "admin" در دیتابیس (تعریف‌شده در پنل Appwrite)
//          • یا حضور userId در ADMIN_IDS (env) — برای bootstrap اولیه
//   ۲) مدیریت «رمز ورود» پنل ادمین (ADMIN_PASSWORD از env)
//   ۳) مدیریت «جلسه‌ی باز» ادمین (تا چند دقیقه پس از زدن رمز،
//        دوباره رمز نخواهد — مقدار پیش‌فرض ۳۰ دقیقه)
//
// نکته: state رمز در حافظه‌ی فرایند نگه‌داری می‌شود (in-memory).
//       در محیط serverless هر فراخوانی ممکن است فرایند جدید باشد،
//       بنابراین یک fallback پایدار هم روی فیلد کاربر (adminUnlockedUntil)
//       در دیتابیس ذخیره می‌کنیم تا جلسه بین فراخوانی‌ها حفظ شود.
// ═══════════════════════════════════════════════════════════════

const crypto = require("crypto");
const { getOrCreateUser, updateUser } = require("./db.js");

// مدت اعتبار جلسه‌ی ادمین پس از زدن رمز (به دقیقه)
const SESSION_MINUTES = parseInt(process.env.ADMIN_SESSION_MINUTES || "30", 10);

// ───────────────────────────────────────────────────────────────
// Brute-force protection
// ───────────────────────────────────────────────────────────────
// تعداد تلاش‌های مجاز قبل از قفل شدن موقت (پیش‌فرض ۵)
const MAX_PIN_ATTEMPTS = parseInt(process.env.ADMIN_MAX_ATTEMPTS || "5", 10);
// مدت قفل پس از رسیدن به سقف (پیش‌فرض ۱۵ دقیقه)
const LOCKOUT_MINUTES = parseInt(process.env.ADMIN_LOCKOUT_MINUTES || "15", 10);

// شمارنده‌ی in-memory برای تلاش‌های ناموفق per-user.
// (در serverless ایده‌آل نیست، اما warm instance ها مزاحم می‌شوند.
// در turn بعدی می‌توان به Appwrite منتقل کرد.)
const _failedAttempts = new Map(); // userId → { count, lockedUntil }

// State موقت برای فلوی «در انتظار دریافت رمز»
// از همان بازه‌ی state ادمین استفاده می‌کنیم تا با بقیه تداخل نکند.
const ADMIN_AWAITING_PASSWORD = 1099;

// ───────────────────────────────────────────────────────────────
// خواندن لیست ADMIN_IDS از env (با , یا فاصله جدا شده)
// ───────────────────────────────────────────────────────────────
function getAdminIdsFromEnv() {
  const raw = process.env.ADMIN_IDS || process.env.ADMIN_USER_IDS || "";
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ───────────────────────────────────────────────────────────────
// آیا این کاربر ادمین است؟ (role در دیتابیس یا ADMIN_IDS در env)
// userOrId می‌تواند آبجکت کاربر یا رشته‌ی userId باشد.
// ───────────────────────────────────────────────────────────────
async function isAdminUser(userOrId) {
  let user = null;
  let uid = null;

  if (userOrId && typeof userOrId === "object") {
    user = userOrId;
    uid = String(user.userId || user.$id || "");
  } else {
    uid = String(userOrId || "");
  }

  // ۱) ADMIN_IDS از env (سریع‌ترین مسیر، بدون نیاز به DB)
  const envAdmins = getAdminIdsFromEnv();
  if (uid && envAdmins.includes(uid)) return true;

  // ۲) role در دیتابیس
  if (!user && uid) {
    try {
      user = await getOrCreateUser(uid, {});
    } catch {
      user = null;
    }
  }
  return !!(user && user.role === "admin");
}

// نسخه‌ی سنکرون فقط برای زمانی که آبجکت کاربر را داریم (مثلاً در ساخت کیبورد)
function isAdminUserSync(user) {
  if (!user || typeof user !== "object") return false;
  const uid = String(user.userId || user.$id || "");
  const envAdmins = getAdminIdsFromEnv();
  if (uid && envAdmins.includes(uid)) return true;
  return user.role === "admin";
}

// ───────────────────────────────────────────────────────────────
// آیا رمز ادمین اصلاً تنظیم شده؟
// اگر ADMIN_PASSWORD تعریف نشده باشد، رمز غیرفعال است
// (یعنی ادمین بدون رمز وارد می‌شود — رفتار قبلی).
// ───────────────────────────────────────────────────────────────
function isPasswordEnabled() {
  return !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
}

// مقایسه‌ی امن در برابر timing attack
// قبلاً از === استفاده می‌شد که بر اساس اولین کاراکتر متفاوت زمان متفاوتی می‌گیرد
// و در تئوری امکان حدس کاراکتر-به-کاراکتر را می‌دهد. crypto.timingSafeEqual
// همیشه زمان ثابت برای buffers هم‌سایز برمی‌گرداند.
function _safeEqual(a, b) {
  const ba = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ba.length !== bb.length) {
    // برای جلوگیری از leak طول، یک مقایسه‌ی dummy انجام بده
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function checkPassword(input) {
  if (!isPasswordEnabled()) return true;
  return _safeEqual(String(input || "").trim(), String(process.env.ADMIN_PASSWORD));
}

// ───────────────────────────────────────────────────────────────
// Brute-force protection helpers
// خروجی attemptLogin:
//   { ok: true } — اجازه عبور
//   { ok: false, reason: "locked", remainingMinutes } — قفل
//   { ok: false, reason: "bad", attemptsLeft } — رمز اشتباه
// ───────────────────────────────────────────────────────────────
function attemptLogin(userId, input) {
  const key = String(userId);
  const now = Date.now();
  const state = _failedAttempts.get(key) || { count: 0, lockedUntil: 0 };

  // اگر هنوز در قفل است
  if (state.lockedUntil > now) {
    return {
      ok: false,
      reason: "locked",
      remainingMinutes: Math.ceil((state.lockedUntil - now) / 60_000),
    };
  }

  if (checkPassword(input)) {
    _failedAttempts.delete(key); // reset
    return { ok: true };
  }

  state.count += 1;
  if (state.count >= MAX_PIN_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_MINUTES * 60_000;
    state.count = 0;
    _failedAttempts.set(key, state);
    return { ok: false, reason: "locked", remainingMinutes: LOCKOUT_MINUTES };
  }

  _failedAttempts.set(key, state);
  return { ok: false, reason: "bad", attemptsLeft: MAX_PIN_ATTEMPTS - state.count };
}

// پاکسازی periodic از حافظه (برای محیط‌های long-running)
function _cleanupAttempts() {
  const now = Date.now();
  for (const [k, v] of _failedAttempts) {
    if (v.lockedUntil < now && v.count === 0) _failedAttempts.delete(k);
  }
}
if (typeof setInterval === "function") {
  const t = setInterval(_cleanupAttempts, 5 * 60_000);
  if (t.unref) t.unref();
}

// ───────────────────────────────────────────────────────────────
// مدیریت جلسه‌ی باز (پس از زدن رمز)
// ───────────────────────────────────────────────────────────────
async function isSessionUnlocked(userId) {
  // اگر رمز غیرفعال است، همیشه باز است
  if (!isPasswordEnabled()) return true;

  try {
    const user = await getOrCreateUser(String(userId), {});
    const until = user.adminUnlockedUntil ? new Date(user.adminUnlockedUntil).getTime() : 0;
    return Date.now() < until;
  } catch {
    return false;
  }
}

async function unlockSession(userId) {
  const until = new Date(Date.now() + SESSION_MINUTES * 60 * 1000).toISOString();
  try {
    await updateUser(String(userId), { adminUnlockedUntil: until });
  } catch (e) {
    // اگر فیلد adminUnlockedUntil در دیتابیس وجود نداشته باشد، خطا می‌دهد
    // اما نباید کل فلو را بشکند؛ فقط لاگ می‌کنیم.
    console.warn("[admin-auth] unlockSession warn:", e?.message || e);
  }
  return until;
}

async function lockSession(userId) {
  try {
    await updateUser(String(userId), { adminUnlockedUntil: null });
  } catch (e) {
    console.warn("[admin-auth] lockSession warn:", e?.message || e);
  }
}

module.exports = {
  ADMIN_AWAITING_PASSWORD,
  SESSION_MINUTES,
  MAX_PIN_ATTEMPTS,
  LOCKOUT_MINUTES,
  getAdminIdsFromEnv,
  isAdminUser,
  isAdminUserSync,
  isPasswordEnabled,
  checkPassword,
  attemptLogin,
  isSessionUnlocked,
  unlockSession,
  lockSession,
};
