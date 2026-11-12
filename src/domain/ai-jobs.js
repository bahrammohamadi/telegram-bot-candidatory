// src/domain/ai-jobs.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// دامنه‌ی کارهای هوش مصنوعی (AI Jobs) — منطق خالص
// ═══════════════════════════════════════════════════════════════
// مبنا: سند معماری نهایی §۱۰ (معماری هوش مصنوعی و ایجنت‌ها)
// اصل الزام‌آور: «کنترل انسانی — عملیات حساس نیازمند تأیید صریح»
// و «AI اختیاری — کارهای اصلی بدون AI نیز قابل انجام باشند».
// بنابراین هیچ عملیات نوشتنی (ساخت وظیفه از جلسه/فایل، ارسال به شخص
// ثالث، تغییر حساس) بدون وضعیت approved اجرا نمی‌شود.
// هر عملیات AI به درخواست‌کننده، منبع داده، وضعیت و نتیجه‌ی تأیید متصل است (§۸).
// ═══════════════════════════════════════════════════════════════

const AI_JOB_KINDS = Object.freeze([
  "knowledge_answer", // پاسخ مستند به پرسش
  "planning", // پیشنهاد برنامه و وظایف
  "document_extract", // استخراج اطلاعات از فایل
  "meeting_extract", // استخراج تصمیم و اقدام از جلسه
  "learning_coach", // تمرین و بازخورد آموزشی
  "reporting", // توضیح گزارش‌های واقعی
]);

const AI_JOB_STATUSES = Object.freeze([
  "draft", // پیش‌نویس ساخته‌شده توسط AI
  "pending_approval", // در انتظار تأیید انسانی
  "approved", // تأیید شده، آماده‌ی اجرا
  "rejected", // رد شده توسط کاربر
  "executed", // اجرا شده
  "failed", // ناموفق
]);

// عملیات نوشتنی/حساس — نیازمند تأیید صریح انسانی
const WRITE_OPERATIONS = Object.freeze([
  "create_task",
  "create_meeting_action",
  "send_message",
  "delete_data",
  "payment_action",
]);

const TRANSITIONS = Object.freeze({
  draft: Object.freeze(["pending_approval", "failed"]),
  pending_approval: Object.freeze(["approved", "rejected", "failed"]),
  approved: Object.freeze(["executed", "failed"]),
  rejected: Object.freeze([]),
  executed: Object.freeze([]),
  failed: Object.freeze(["draft"]), // تلاش مجدد
});

function isValidStatus(s) {
  return AI_JOB_STATUSES.includes(s);
}

function canTransition(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  if (from === to) return true;
  return (TRANSITIONS[from] || []).includes(to);
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const e = new Error(`گذار نامعتبر AI Job: ${from} → ${to}`);
    e.code = "AI_INVALID_TRANSITION";
    throw e;
  }
}

function requiresApproval(operation) {
  return WRITE_OPERATIONS.includes(operation);
}

/**
 * آیا این Job با وضعیت فعلی مجاز به اجراست؟
 * فقط approved (برای عملیات نوشتنی) یا draft/pending برای خواندنی.
 */
function canExecute(job = {}) {
  if (!job || !job.operation) return false;
  if (requiresApproval(job.operation)) return job.status === "approved";
  return job.status === "draft" || job.status === "pending_approval" || job.status === "approved";
}

function validateNewJob(input = {}) {
  const kind = input.kind || "knowledge_answer";
  if (!AI_JOB_KINDS.includes(kind)) {
    const e = new Error("نوع AI Job نامعتبر است.");
    e.code = "AI_VALIDATION";
    throw e;
  }
  const operation = input.operation || "read_only";
  if (typeof operation !== "string" || operation.length > 64) {
    const e = new Error("عملیات AI نامعتبر است.");
    e.code = "AI_VALIDATION";
    throw e;
  }
  const inputSummary = String(input.inputSummary || "").slice(0, 2000);
  const draftPayload = input.draftPayload && typeof input.draftPayload === "object" ? input.draftPayload : {};
  return { kind, operation, inputSummary, draftPayload };
}

/**
 * سهمیه‌ی AI بر اساس پلن (سند §۱۱: سهمیه‌ها قابل مشاهده و قابل توضیح).
 * usedThisMonth: تعداد Jobهای این ماه. خروجی: { allowed, limit, used }
 */
function checkQuota(planId, usedThisMonth = 0) {
  const limits = { free: 5, none: 5, starter: 50, professional: 200, vip: -1 };
  const limit = limits[planId] ?? 5;
  if (limit === -1) return { allowed: true, limit: -1, used: usedThisMonth };
  return { allowed: usedThisMonth < limit, limit, used: usedThisMonth };
}

module.exports = {
  AI_JOB_KINDS,
  AI_JOB_STATUSES,
  WRITE_OPERATIONS,
  TRANSITIONS,
  isValidStatus,
  canTransition,
  assertTransition,
  requiresApproval,
  canExecute,
  validateNewJob,
  checkQuota,
};
