// src/domain/audit.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// دامنه‌ی حسابرسی (Audit) — منطق خالص
// ═══════════════════════════════════════════════════════════════
// مبنا: سند معماری نهایی §۷ (تاریخچه‌ی تغییرات حساس قابل حسابرسی)،
// §۸ (AuditLogs)، §۱۲ (لاگ بدون اطلاعات حساس).
// هیچ توکن، کلید API یا رمز هرگز در رویداد حسابرسی ذخیره نمی‌شود.
// ═══════════════════════════════════════════════════════════════

const AUDIT_ACTIONS = Object.freeze([
  "task.create",
  "task.update",
  "task.delete",
  "meeting.create",
  "ai_job.create",
  "ai_job.approve",
  "ai_job.reject",
  "ai_job.execute",
  "account.export",
  "account.delete",
  "plan.change",
  "admin.action",
  "requirement.update",
]);

const SENSITIVE_KEYS = Object.freeze([
  "token",
  "api_key",
  "apikey",
  "password",
  "secret",
  "authorization",
  "bot_token",
  "appwrite_api_key",
]);

/**
 * پاک‌سازی متادیتا از کلیدهای حساس پیش از ذخیره در لاگ.
 */
function sanitizeMeta(meta = {}) {
  if (!meta || typeof meta !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    const lower = String(k).toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[k] = "[redacted]";
    } else if (typeof v === "string" && v.length > 500) {
      out[k] = v.slice(0, 500);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function validateAuditEvent(input = {}) {
  const action = String(input.action || "");
  if (!AUDIT_ACTIONS.includes(action)) {
    const e = new Error("کنش حسابرسی نامعتبر است.");
    e.code = "AUDIT_VALIDATION";
    throw e;
  }
  return {
    action,
    entityType: String(input.entityType || "").slice(0, 64),
    entityId: String(input.entityId || "").slice(0, 128),
    meta: sanitizeMeta(input.meta || {}),
  };
}

module.exports = {
  AUDIT_ACTIONS,
  SENSITIVE_KEYS,
  sanitizeMeta,
  validateAuditEvent,
};
