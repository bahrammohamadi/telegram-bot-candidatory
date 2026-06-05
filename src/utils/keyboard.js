// src/utils/keyboard.js — CommonJS
// ─── تمام InlineKeyboard های پروژه ───
// بازنویسی کامل با منوی جدید و معماری مدولار

const { InlineKeyboard } = require("grammy");
const { STEPS, TOTAL_STEPS, STEP_EMOJIS } = require("../constants/questions.js");

// ═══════════════════════════════════════════
// منوی اصلی
// ═══════════════════════════════════════════
function mainMenuKB(userPlan = "free") {
  return new InlineKeyboard()
    .text("🚀 ارزیابی آمادگی", "start_consultation").row()
    .text("📊 داشبورد کمپین", "dashboard").row()
    .text("🗂️ مدیریت کمپین", "campaign_menu").row()
    .text("📚 آموزش‌های تخصصی", "edu_list").row()
    .text("📂 تاریخچه تحلیل‌ها", "show_history").row()
    .text("💼 بسته‌ها و خدمات", "show_plans").row()
    .text("📞 ارتباط با ما", "contact_us").row();
}

// ═══════════════════════════════════════════
// منوی مدیریت کمپین
// ═══════════════════════════════════════════
function campaignMenuKB() {
  return new InlineKeyboard()
    .text("👤 پروفایل کاندیدا", "candidate_profile").row()
    .text("📊 تحلیل SWOT", "swot_analysis").row()
    .text("⚔️ تحلیل رقبا", "rivals_menu").row()
    .text("📋 وعده‌های انتخاباتی", "promises_menu").row()
    .text("👥 مدیریت تیم", "team_menu").row()
    .text("🛡️ مدیریت بحران", "crisis_menu").row()
    .text("✍️ تولید محتوا", "content_menu").row()
    .text("🔙 منوی اصلی", "menu").row();
}

// ═══════════════════════════════════════════
// کیبوردهای ارزیابی آمادگی
// ═══════════════════════════════════════════

function stepChoiceKB(stepIndex) {
  const step = STEPS[stepIndex];
  if (!step || step.type !== "choice") return new InlineKeyboard();

  const kb = new InlineKeyboard();

  const sorted = [...step.options].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return 0;
  });

  for (const opt of sorted) {
    kb.text(opt.label, `ans:${stepIndex}:${opt.value}`).row();
  }

  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  }
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

function stepTextKB(stepIndex) {
  const kb = new InlineKeyboard();
  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  }
  kb.text("❌ انصراف", "cancel").row();
  return kb;
}

function summaryKB(answers) {
  const kb = new InlineKeyboard();

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const step = STEPS[i];
    const emoji = STEP_EMOJIS[i] || "📝";
    const filled = answers[step.id] !== undefined && answers[step.id] !== "";
    const icon = filled ? "✏️" : "⚠️";
    kb.text(`${emoji} ${icon} ${step.title}`, `edit:${i}`).row();
  }

  kb.text("✅ تایید نهایی و دریافت گزارش", "confirm").row();
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

function afterReportKB() {
  return new InlineKeyboard()
    .text("📊 داشبورد کمپین", "dashboard").row()
    .text("🗂️ مدیریت کمپین", "campaign_menu").row()
    .text("📚 آموزش‌های تخصصی", "edu_list").row()
    .text("💼 بسته‌ها و خدمات", "show_plans").row()
    .text("🔙 منوی اصلی", "menu").row();
}

// ═══════════════════════════════════════════
// کیبوردهای پروفایل کاندیدا
// ═══════════════════════════════════════════

function profileMenuKB(hasProfile = false) {
  const kb = new InlineKeyboard();
  if (hasProfile) {
    kb.text("👁️ مشاهده پروفایل", "profile_view").row();
    kb.text("✏️ ویرایش پروفایل", "profile_edit").row();
  } else {
    kb.text("➕ ایجاد پروفایل", "profile_create").row();
  }
  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();
  return kb;
}

// ═══════════════════════════════════════════
// کیبوردهای رقبا
// ═══════════════════════════════════════════

function rivalsMenuKB(rivals = []) {
  const kb = new InlineKeyboard();
  kb.text("➕ افزودن رقیب", "rival_add").row();

  for (const r of rivals.slice(0, 5)) {
    kb.text(`⚔️ ${r.name}`, `rival_view:${r.id}`).row();
  }

  kb.text("📊 تحلیل مقایسه‌ای", "rivals_compare").row();
  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();
  return kb;
}

function rivalDetailKB(rivalId) {
  return new InlineKeyboard()
    .text("✏️ ویرایش", `rival_edit:${rivalId}`).row()
    .text("🗑️ حذف", `rival_delete:${rivalId}`).row()
    .text("🔙 لیست رقبا", "rivals_menu").row();
}

// ═══════════════════════════════════════════
// کیبوردهای وعده‌ها
// ═══════════════════════════════════════════

function promisesMenuKB(promises = []) {
  const kb = new InlineKeyboard();
  kb.text("➕ ثبت وعده جدید", "promise_add").row();

  for (const p of promises.slice(0, 5)) {
    const statusEmoji = p.status === "done" ? "✅" : p.status === "inprogress" ? "🔄" : "📋";
    kb.text(`${statusEmoji} ${p.title.substring(0, 25)}`, `promise_view:${p.id}`).row();
  }

  if (promises.length > 5) {
    kb.text(`📋 مشاهده همه (${promises.length})`, "promises_all").row();
  }

  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();
  return kb;
}

// ═══════════════════════════════════════════
// کیبوردهای تیم
// ═══════════════════════════════════════════

function teamMenuKB(members = []) {
  const kb = new InlineKeyboard();
  kb.text("➕ افزودن عضو", "team_add").row();

  for (const m of members.slice(0, 5)) {
    kb.text(`👤 ${m.name} — ${m.role}`, `team_view:${m.id}`).row();
  }

  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();
  return kb;
}

// ═══════════════════════════════════════════
// کیبوردهای بحران
// ═══════════════════════════════════════════

function crisisMenuKB(crises = []) {
  const kb = new InlineKeyboard();
  kb.text("🚨 ثبت بحران جدید", "crisis_add").row();

  for (const c of crises.slice(0, 3)) {
    const urgencyEmoji = c.urgency === "high" ? "🔴" : c.urgency === "medium" ? "🟡" : "🟢";
    kb.text(`${urgencyEmoji} ${c.title.substring(0, 25)}`, `crisis_view:${c.id}`).row();
  }

  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();
  return kb;
}

// ═══════════════════════════════════════════
// کیبوردهای تولید محتوا
// ═══════════════════════════════════════════

function contentMenuKB() {
  return new InlineKeyboard()
    .text("📱 پست شبکه اجتماعی", "content_post").row()
    .text("📢 بیانیه / اطلاعیه", "content_statement").row()
    .text("🎤 متن سخنرانی", "content_speech").row()
    .text("💬 پاسخ به انتقاد", "content_response").row()
    .text("🛡️ پاسخ به شایعه", "content_rumor").row()
    .text("🔙 مدیریت کمپین", "campaign_menu").row();
}

// ═══════════════════════════════════════════
// کیبوردهای داشبورد
// ═══════════════════════════════════════════

function dashboardKB() {
  return new InlineKeyboard()
    .text("🔄 بروزرسانی", "dashboard").row()
    .text("📊 تحلیل SWOT", "swot_analysis").row()
    .text("🚀 ارزیابی آمادگی", "start_consultation").row()
    .text("🗂️ مدیریت کمپین", "campaign_menu").row()
    .text("🔙 منوی اصلی", "menu").row();
}

// ═══════════════════════════════════════════
// کیبوردهای پلن‌ها
// ═══════════════════════════════════════════

function plansListKB() {
  return new InlineKeyboard()
    .text("🆓 رایگان — مشاهده امکانات", "plan:free").row()
    .text("🌱 راه‌اندازی — ۲,۸۰۰,۰۰۰ تومان", "plan:starter").row()
    .text("🔥 ⭐ حرفه‌ای — ۸,۵۰۰,۰۰۰ تومان", "plan:professional").row()
    .text("💎 VIP — ۲۸,۰۰۰,۰۰۰ تومان", "plan:vip").row()
    .text("🔙 منوی اصلی", "menu").row();
}

function planDetailKB(planId) {
  return new InlineKeyboard()
    .text(`📞 ثبت درخواست این بسته`, `plan_request:${planId}`).row()
    .text("📋 مشاهده همه بسته‌ها", "show_plans").row()
    .text("🔙 منوی اصلی", "menu").row();
}

// ═══════════════════════════════════════════
// کیبوردهای عمومی
// ═══════════════════════════════════════════

function aboutUsKB() {
  return new InlineKeyboard()
    .text("📞 ارتباط با ما", "contact_us").row()
    .text("🔙 منوی اصلی", "menu").row();
}

function contactUsKB() {
  return new InlineKeyboard()
    .text("💼 مشاهده بسته‌ها", "show_plans").row()
    .text("🔙 منوی اصلی", "menu").row();
}

function backToMenuKB() {
  return new InlineKeyboard()
    .text("🔙 منوی اصلی", "menu").row();
}

function backToCampaignKB() {
  return new InlineKeyboard()
    .text("🔙 مدیریت کمپین", "campaign_menu").row()
    .text("🏠 منوی اصلی", "menu").row();
}

function confirmCancelKB(confirmData) {
  return new InlineKeyboard()
    .text("✅ تأیید", confirmData).row()
    .text("❌ انصراف", "cancel").row();
}

// ═══════════════════════════════════════════
// نوار پیشرفت ارزیابی
// ═══════════════════════════════════════════

function progressText(currentStep) {
  let t = "📊 پیشرفت: ";
  for (let i = 0; i < TOTAL_STEPS; i++) {
    if (i < currentStep)      t += "🟢";
    else if (i === currentStep) t += "🔵";
    else                      t += "⚪";
  }
  t += ` (${currentStep + 1}/${TOTAL_STEPS})`;
  return t;
}

// ═══════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════
module.exports = {
  // منوها
  mainMenuKB,
  campaignMenuKB,
  dashboardKB,

  // ارزیابی
  stepChoiceKB,
  stepTextKB,
  summaryKB,
  afterReportKB,
  progressText,

  // پروفایل
  profileMenuKB,

  // رقبا
  rivalsMenuKB,
  rivalDetailKB,

  // وعده‌ها
  promisesMenuKB,

  // تیم
  teamMenuKB,

  // بحران
  crisisMenuKB,

  // محتوا
  contentMenuKB,

  // پلن‌ها
  plansListKB,
  planDetailKB,

  // عمومی
  aboutUsKB,
  contactUsKB,
  backToMenuKB,
  backToCampaignKB,
  confirmCancelKB,
};
