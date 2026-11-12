// src/domain/tasks.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// دامنه‌ی وظایف (Tasks) — منطق خالص، بدون وابستگی به DB/Telegram
// ═══════════════════════════════════════════════════════════════
// مبنا: سند معماری نهایی §۴ (اجرای کار)، §۷ (قواعد دامنه)، §۸ (مدل داده)
// هر وظیفه می‌تواند از ثبت دستی، جلسه، الزام، برنامه یا پیش‌نویس AI
// ایجاد شده باشد. عملیات حساس AI فقط پس از تأیید انسانی اجرا می‌شود
// (این قاعده در ai-jobs.js اعمال می‌شود، نه اینجا).
// ═══════════════════════════════════════════════════════════════

const crypto = require("crypto");

const TASK_STATUSES = Object.freeze(["open", "in_progress", "done", "postponed", "cancelled"]);

const TASK_SOURCES = Object.freeze([
  "manual", // ثبت دستی / ثبت سریع
  "meeting", // اقدام جلسه
  "requirement", // الزام رسمی
  "journey", // نقشه راه
  "ai_draft", // پیش‌نویس AI (پس از تأیید)
]);

const TASK_PRIORITIES = Object.freeze(["low", "normal", "high", "urgent"]);

// گذارهای مجاز وضعیت — جلوگیری از وضعیت‌های نامعتبر
const TRANSITIONS = Object.freeze({
  open: Object.freeze(["in_progress", "done", "postponed", "cancelled"]),
  in_progress: Object.freeze(["done", "postponed", "cancelled", "open"]),
  postponed: Object.freeze(["open", "in_progress", "cancelled"]),
  done: Object.freeze([]), // نهایی — فقط با حذف داده (حساب) تغییر می‌کند
  cancelled: Object.freeze(["open"]), // بازفعال‌سازی
});

function isValidStatus(s) {
  return TASK_STATUSES.includes(s);
}

function canTransition(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  if (from === to) return true;
  return (TRANSITIONS[from] || []).includes(to);
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(`گذار نامعتبر وظیفه: ${from} → ${to}`);
    err.code = "TASK_INVALID_TRANSITION";
    throw err;
  }
}

/**
 * اعتبارسنجی ورودی ساخت وظیفه.
 * خروجی: { title, priority, source, dueAt, idempotencyKey } نرمال‌شده
 * خطا: Error با code = TASK_VALIDATION
 */
function validateNewTask(input = {}) {
  const title = String(input.title || "").trim().replace(/\s+/g, " ");
  if (title.length < 3) {
    const e = new Error("عنوان وظیفه باید حداقل ۳ کاراکتر باشد.");
    e.code = "TASK_VALIDATION";
    throw e;
  }
  if (title.length > 200) {
    const e = new Error("عنوان وظیفه حداکثر ۲۰۰ کاراکتر.");
    e.code = "TASK_VALIDATION";
    throw e;
  }
  const priority = input.priority || "normal";
  if (!TASK_PRIORITIES.includes(priority)) {
    const e = new Error("اولویت نامعتبر است.");
    e.code = "TASK_VALIDATION";
    throw e;
  }
  const source = input.source || "manual";
  if (!TASK_SOURCES.includes(source)) {
    const e = new Error("منبع وظیفه نامعتبر است.");
    e.code = "TASK_VALIDATION";
    throw e;
  }
  let dueAt = input.dueAt || null;
  if (dueAt) {
    const d = new Date(dueAt);
    if (Number.isNaN(d.getTime())) {
      const e = new Error("مهلت نامعتبر است. تاریخ ISO یا خالی بدهید.");
      e.code = "TASK_VALIDATION";
      throw e;
    }
    dueAt = d.toISOString();
  }
  const meetingId = input.meetingId ? String(input.meetingId).slice(0, 64) : null;
  const requirementId = input.requirementId ? String(input.requirementId).slice(0, 64) : null;
  const idempotencyKey = input.idempotencyKey
    ? String(input.idempotencyKey).slice(0, 128)
    : null;
  return { title, priority, source, dueAt, meetingId, requirementId, idempotencyKey };
}

/**
 * کلید idempotency قطعی برای جلوگیری از ثبت تکراری ناشی از Retry
 * (سند §۷ و §۱۴: «ثبت تکراری ناشی از Retry = صفر»).
 * اگر کاربر همان عنوان+مهلت+منبع را در همان روز دوباره بفرستد،
 * همان کلید تولید می‌شود و لایه‌ی ذخیره‌سازی از ساخت دوباره جلوگیری می‌کند.
 */
function makeIdempotencyKey(userId, { title, dueAt, source }) {
  const raw = [String(userId), String(title || "").trim().toLowerCase(), dueAt || "", source || "manual"].join("|");
  return "idem_" + crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

function isOpen(task) {
  return task && (task.status === "open" || task.status === "in_progress" || task.status === "postponed");
}

function isOverdue(task, now = new Date()) {
  if (!task || !task.dueAt || !isOpen(task)) return false;
  return new Date(task.dueAt).getTime() < now.getTime();
}

function isDueToday(task, now = new Date()) {
  if (!task || !task.dueAt || !isOpen(task)) return false;
  const d = new Date(task.dueAt);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

const PRIORITY_WEIGHT = { urgent: 0, high: 1, normal: 2, low: 3 };

/**
 * مرتب‌سازی «اولویت امروز» (سند §۵):
 * ۱) عقب‌افتاده‌ها ۲) مهلت امروز ۳) اولویت بالاتر ۴) مهلت زودتر
 */
function sortForToday(tasks = [], now = new Date()) {
  return [...tasks]
    .filter(isOpen)
    .sort((a, b) => {
      const ao = isOverdue(a, now) ? 0 : 1;
      const bo = isOverdue(b, now) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      const at = isDueToday(a, now) ? 0 : 1;
      const bt = isDueToday(b, now) ? 0 : 1;
      if (at !== bt) return at - bt;
      const ap = PRIORITY_WEIGHT[a.priority] ?? 2;
      const bp = PRIORITY_WEIGHT[b.priority] ?? 2;
      if (ap !== bp) return ap - bp;
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });
}

function summarize(tasks = [], now = new Date()) {
  const open = tasks.filter(isOpen);
  return {
    total: tasks.length,
    open: open.length,
    overdue: open.filter((t) => isOverdue(t, now)).length,
    dueToday: open.filter((t) => isDueToday(t, now)).length,
    done: tasks.filter((t) => t.status === "done").length,
  };
}

module.exports = {
  TASK_STATUSES,
  TASK_SOURCES,
  TASK_PRIORITIES,
  TRANSITIONS,
  isValidStatus,
  canTransition,
  assertTransition,
  validateNewTask,
  makeIdempotencyKey,
  isOpen,
  isOverdue,
  isDueToday,
  sortForToday,
  summarize,
};
