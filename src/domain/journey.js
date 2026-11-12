// src/domain/journey.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// دامنه‌ی مسیر کاندیدا (Journey) — منطق خالص
// ═══════════════════════════════════════════════════════════════
// مبنا: سند معماری نهایی §۴ (معماری فرایند کامل کاندیدا — ۱۱ مرحله)
// هر مرحله چهار وضعیت دارد: not_started | in_progress | needs_review | completed
// برای مراحل رسمی، «اعلام‌شده توسط کاربر» از «تأییدشده توسط مرجع رسمی»
// جدا نگه داشته می‌شود (فیلد verification).
// وضعیت‌ها از داده‌های واقعی موجود (پروفایل، مشاوره‌ها، وظایف، جلسات)
// مشتق می‌شوند — هیچ داده‌ای از قبل ساخته نمی‌شود.
// ═══════════════════════════════════════════════════════════════

const STAGE_STATUSES = Object.freeze(["not_started", "in_progress", "needs_review", "completed"]);

// user_declared = کاربر خودش اعلام کرده | officially_verified = مرجع رسمی تأیید کرده
// | not_applicable = هنوز موضوعیت ندارد
const VERIFICATIONS = Object.freeze(["user_declared", "officially_verified", "not_applicable"]);

const JOURNEY_STAGES = Object.freeze([
  { id: "entry_auth", title: "ورود و احراز هویت", official: false },
  { id: "status_discovery", title: "شناخت وضعیت", official: false },
  { id: "needs_assessment", title: "نیازسنجی", official: false },
  { id: "profile_building", title: "تشکیل پرونده", official: false },
  { id: "requirements_guide", title: "راهنمای الزامات", official: true },
  { id: "roadmap", title: "نقشه راه", official: false },
  { id: "execution", title: "اجرای کار", official: false },
  { id: "collaboration", title: "همکاری تیمی", official: false },
  { id: "learning", title: "یادگیری و تمرین", official: false },
  { id: "monitoring", title: "پایش و گزارش", official: false },
  { id: "period_end", title: "پایان دوره و بایگانی", official: false },
]);

const PROFILE_FIELDS_FOR_COMPLETENESS = Object.freeze([
  "fullName",
  "age",
  "education",
  "occupation",
  "electionType",
  "constituency",
  "residencyYears",
  "pastPositions",
  "electionExperience",
  "budget",
  "slogan",
  "mainStrength",
  "mainWeakness",
  "topPriorities",
]);

function profileCompleteness(profile = {}) {
  if (!profile || typeof profile !== "object") return 0;
  const filled = PROFILE_FIELDS_FOR_COMPLETENESS.filter((f) => {
    const v = profile[f];
    return v !== null && v !== undefined && String(v).trim() !== "" && String(v) !== "هنوز تعیین نشده";
  }).length;
  return Math.round((filled / PROFILE_FIELDS_FOR_COMPLETENESS.length) * 100);
}

function hasProfile(profile = {}) {
  return profileCompleteness(profile) > 0;
}

function hasElectionContext(profile = {}) {
  return !!(profile && profile.electionType && profile.constituency);
}

/**
 * مشتق‌سازی وضعیت مسیر از داده‌های واقعی.
 * ورودی: { profile, consultations=[], tasks=[], meetings=[], requirementsProgress={} }
 * خروجی: { stages: [{id,title,status,verification,nextAction}], completedCount, nextStage }
 */
function deriveJourney(input = {}) {
  const profile = input.profile || {};
  const consultations = Array.isArray(input.consultations) ? input.consultations : [];
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  const meetings = Array.isArray(input.meetings) ? input.meetings : [];
  const reqProgress = input.requirementsProgress || {};

  const completeness = profileCompleteness(profile);
  const hasReadiness = consultations.some((c) => c.type === "readiness" || c.type === "basic");
  const hasSwot = consultations.some((c) => c.type === "swot");
  const openTasks = tasks.filter((t) => t.status === "open" || t.status === "in_progress" || t.status === "postponed");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const reqDone = Object.values(reqProgress).filter((v) => v === "done").length;
  const reqTotal = Object.keys(reqProgress).length;

  const byId = {
    entry_auth: {
      status: "completed", // کاربر تا اینجا رسیده یعنی احراز هویت تلگرام انجام شده
      verification: "user_declared",
      nextAction: null,
    },
    status_discovery: hasElectionContext(profile)
      ? { status: "completed", verification: "user_declared", nextAction: null }
      : hasProfile(profile)
        ? { status: "in_progress", verification: "user_declared", nextAction: { label: "تکمیل نوع انتخابات و حوزه", callback: "candidate_profile" } }
        : { status: "not_started", verification: "not_applicable", nextAction: { label: "ساخت پرونده کاندیدا", callback: "candidate_profile" } },
    needs_assessment: hasReadiness
      ? { status: "completed", verification: "user_declared", nextAction: null }
      : { status: "not_started", verification: "not_applicable", nextAction: { label: "انجام ارزیابی آمادگی", callback: "start_consultation" } },
    profile_building:
      completeness >= 80
        ? { status: "completed", verification: "user_declared", nextAction: null }
        : completeness > 0
          ? { status: "in_progress", verification: "user_declared", nextAction: { label: "تکمیل پرونده", callback: "candidate_profile" } }
          : { status: "not_started", verification: "not_applicable", nextAction: { label: "ساخت پرونده کاندیدا", callback: "candidate_profile" } },
    requirements_guide:
      reqTotal > 0 && reqDone >= reqTotal
        ? { status: "completed", verification: "user_declared", nextAction: null }
        : reqDone > 0
          ? { status: "in_progress", verification: "user_declared", nextAction: { label: "ادامه بررسی الزامات", callback: "ops:requirements" } }
          : { status: "needs_review", verification: "not_applicable", nextAction: { label: "مشاهده الزامات و منابع", callback: "ops:requirements" } },
    roadmap:
      tasks.length > 0
        ? { status: "completed", verification: "user_declared", nextAction: null }
        : hasProfile(profile)
          ? { status: "in_progress", verification: "user_declared", nextAction: { label: "ثبت اولین وظیفه", callback: "ops:task_new" } }
          : { status: "not_started", verification: "not_applicable", nextAction: { label: "ثبت اولین وظیفه", callback: "ops:task_new" } },
    execution:
      openTasks.length > 0
        ? { status: "in_progress", verification: "user_declared", nextAction: { label: "مشاهده کارهای امروز", callback: "ops:today" } }
        : doneTasks.length > 0
          ? { status: "completed", verification: "user_declared", nextAction: null }
          : { status: "not_started", verification: "not_applicable", nextAction: { label: "ثبت وظیفه", callback: "ops:task_new" } },
    collaboration: {
      // تیم چندنفره واقعی هنوز پیاده نشده (سند §۳/§۱۵ فاز ۴) — صادقانه «نیازمند بررسی»
      status: meetings.length > 0 ? "in_progress" : "needs_review",
      verification: "not_applicable",
      nextAction: { label: "ثبت جلسه و اقدام", callback: "ops:meeting_new" },
    },
    learning:
      hasSwot || consultations.length >= 2
        ? { status: "completed", verification: "user_declared", nextAction: null }
        : consultations.length > 0
          ? { status: "in_progress", verification: "user_declared", nextAction: { label: "ادامه آموزش", callback: "edu_list" } }
          : { status: "not_started", verification: "not_applicable", nextAction: { label: "شروع آموزش", callback: "edu_list" } },
    monitoring:
      consultations.length > 0
        ? { status: "in_progress", verification: "user_declared", nextAction: { label: "مشاهده داشبورد", callback: "dashboard" } }
        : { status: "not_started", verification: "not_applicable", nextAction: { label: "انجام اولین تحلیل", callback: "start_consultation" } },
    period_end: {
      status: "not_started",
      verification: "not_applicable",
      nextAction: { label: "خروجی اطلاعات", callback: "ops:account" },
    },
  };

  const stages = JOURNEY_STAGES.map((s) => ({
    ...s,
    ...(byId[s.id] || { status: "not_started", verification: "not_applicable", nextAction: null }),
  }));

  const completedCount = stages.filter((s) => s.status === "completed").length;
  const nextStage = stages.find((s) => s.status !== "completed") || null;

  return { stages, completedCount, total: stages.length, nextStage, profileCompleteness: completeness };
}

function statusLabel(status) {
  const map = {
    not_started: "⚪ انجام‌نشده",
    in_progress: "🔵 در حال انجام",
    needs_review: "🟡 نیازمند بررسی",
    completed: "✅ تکمیل‌شده",
  };
  return map[status] || status;
}

module.exports = {
  STAGE_STATUSES,
  VERIFICATIONS,
  JOURNEY_STAGES,
  PROFILE_FIELDS_FOR_COMPLETENESS,
  profileCompleteness,
  hasProfile,
  hasElectionContext,
  deriveJourney,
  statusLabel,
};
