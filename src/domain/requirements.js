// src/domain/requirements.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// دامنه‌ی الزامات رسمی (Requirements) — منطق خالص + کاتالوگ بذر
// ═══════════════════════════════════════════════════════════════
// مبنا: سند معماری نهایی §۲ (منابع معتبر)، §۴ (راهنمای الزامات)، §۱۰
// ⚠️ هشدار مهم: این کاتالوگ «پیش‌نویس ساختاری» است، نه مشاوره‌ی حقوقی.
// هیچ مهلت، تاریخ یا حکم قانونیِ قطعی در اینجا ساخته نشده است.
// هر مورد باید پیش از انتشار عمومی با منبع رسمی (نام، لینک، نسخه،
// تاریخ اجرا) تکمیل و توسط کارشناس حقوقی بازبینی شود.
// تا آن زمان، وضعیت همه‌ی موارد: needs_legal_review
// و پاسخ AI درباره‌ی آن‌ها هرگز نباید قطعی ارائه شود.
// ═══════════════════════════════════════════════════════════════

const REQUIREMENT_STATUSES = Object.freeze(["needs_legal_review", "draft", "published", "deprecated"]);
const REQUIREMENT_PROGRESS = Object.freeze(["not_started", "in_progress", "needs_review", "done"]);

// کاتالوگ بذر — فقط دسته‌بندی و ساختار؛ بدون ادعای حقوقی قطعی
const REQUIREMENT_SEED = Object.freeze([
  {
    id: "req_registration",
    title: "ثبت‌نام و احراز شرایط کاندیداتوری",
    category: "ثبت‌نام",
    description: "بررسی شرایط قانونی ثبت‌نام در انتخابات موردنظر و مهلت‌های رسمی آن.",
    source: { name: "منبع رسمی — نیازمند درج", url: null, version: "draft-0.1", effectiveDate: null },
    status: "needs_legal_review",
  },
  {
    id: "req_documents",
    title: "مدارک لازم برای ثبت‌نام",
    category: "مدارک",
    description: "فهرست مدارک هویتی و اداری موردنیاز برای ثبت‌نام، بر اساس اطلاعیه‌ی رسمی.",
    source: { name: "منبع رسمی — نیازمند درج", url: null, version: "draft-0.1", effectiveDate: null },
    status: "needs_legal_review",
  },
  {
    id: "req_campaign_period",
    title: "دوره‌ی تبلیغات انتخاباتی",
    category: "تبلیغات",
    description: "قواعد دوره‌ی تبلیغات، محل‌ها و شیوه‌های مجاز و ممنوعه، بر اساس مقررات رسمی.",
    source: { name: "منبع رسمی — نیازمند درج", url: null, version: "draft-0.1", effectiveDate: null },
    status: "needs_legal_review",
  },
  {
    id: "req_finance",
    title: "مقررات مالی و هزینه‌های کمپین",
    category: "مالی",
    description: "سقف و نحوه‌ی گزارش‌دهی هزینه‌های انتخاباتی، بر اساس مقررات رسمی مالی.",
    source: { name: "منبع رسمی — نیازمند درج", url: null, version: "draft-0.1", effectiveDate: null },
    status: "needs_legal_review",
  },
  {
    id: "req_election_day",
    title: "روز انتخابات و فرایند رأی‌گیری",
    category: "روز انتخابات",
    description: "رویه‌های روز انتخابات، حضور ناظران و نحوه‌ی اعلام نتایج، بر اساس مقررات رسمی.",
    source: { name: "منبع رسمی — نیازمند درج", url: null, version: "draft-0.1", effectiveDate: null },
    status: "needs_legal_review",
  },
  {
    id: "req_post_election",
    title: "پس از انتخابات و اعتبارنامه",
    category: "پس از انتخابات",
    description: "مراحل پس از اعلام نتایج، اعتبارنامه و شروع دوره‌ی فعالیت، بر اساس مقررات رسمی.",
    source: { name: "منبع رسمی — نیازمند درج", url: null, version: "draft-0.1", effectiveDate: null },
    status: "needs_legal_review",
  },
]);

function getRequirement(id) {
  return REQUIREMENT_SEED.find((r) => r.id === id) || null;
}

function listRequirements() {
  return [...REQUIREMENT_SEED];
}

function isPublishable(req) {
  if (!req) return false;
  return (
    req.status === "published" &&
    req.source &&
    req.source.name &&
    req.source.name !== "منبع رسمی — نیازمند درج" &&
    req.source.version &&
    req.source.effectiveDate
  );
}

/**
 * اعتبارسنجی درج منبع رسمی (سند §۲: اطلاعات حقوقی دارای منبع، تاریخ و وضعیت اعتبار)
 */
function validateSource(source = {}) {
  const errors = [];
  if (!source.name || String(source.name).trim().length < 3) errors.push("نام منبع رسمی الزامی است.");
  if (!source.version || String(source.version).trim().length < 2) errors.push("نسخه‌ی منبع الزامی است.");
  if (!source.effectiveDate || Number.isNaN(new Date(source.effectiveDate).getTime())) {
    errors.push("تاریخ اجرای منبع (ISO) الزامی است.");
  }
  if (source.url && !/^https?:\/\//.test(String(source.url))) errors.push("لینک منبع باید http(s) باشد.");
  return { ok: errors.length === 0, errors };
}

function progressLabel(p) {
  const map = {
    not_started: "⚪ انجام‌نشده",
    in_progress: "🔵 در حال انجام",
    needs_review: "🟡 نیازمند بررسی",
    done: "✅ انجام‌شده (اعلام کاربر)",
  };
  return map[p] || p;
}

module.exports = {
  REQUIREMENT_STATUSES,
  REQUIREMENT_PROGRESS,
  REQUIREMENT_SEED,
  getRequirement,
  listRequirements,
  isPublishable,
  validateSource,
  progressLabel,
};
