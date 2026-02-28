// src/utils/keyboard.js
// ─── تمام InlineKeyboard های پروژه — CommonJS ───
// نسخه اصلاح‌شده: ۱۴۰۴/۱۲/۰۸ — اضافه شدن دکمه تاریخچه + بهبود خوانایی

const { InlineKeyboard } = require("grammy");
const { STEPS, TOTAL_STEPS, STEP_EMOJIS } = require("../constants/questions.js");

/**
 * منوی اصلی (با دکمه تاریخچه اضافه‌شده)
 */
function mainMenuKB() {
  return new InlineKeyboard()
    .text("🚀 شروع تحلیل آمادگی", "start_consultation").row()
    .text("📂 تاریخچه تحلیل‌های من", "show_history").row()           // دکمه جدید — تاریخچه
    .text("📚 آموزش‌های تخصصی", "edu_list").row()
    .text("💼 خدمات و بسته‌ها", "show_plans").row()
    .text("📞 ارتباط با ما", "contact_us").row()
    .text("📄 نمونه تحلیل‌ها", "sample_reports").row()
    .text("ℹ️ درباره ما", "about_us").row();
}

/**
 * کیبورد گزینه‌ای برای یک مرحله (choice)
 * گزینه پیش‌فرض (isDefault) اول می‌آید
 */
function stepChoiceKB(stepIndex) {
  const step = STEPS[stepIndex];
  if (!step || step.type !== "choice") return new InlineKeyboard();

  const kb = new InlineKeyboard();

  // مرتب‌سازی: گزینه پیش‌فرض اول
  const sorted = [...step.options].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return 0;
  });

  for (const opt of sorted) {
    kb.text(opt.label, `ans:${stepIndex}:${opt.value}`).row();
  }

  // ناوبری
  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  }
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

/**
 * کیبورد برای مراحل متنی (text)
 */
function stepTextKB(stepIndex) {
  const kb = new InlineKeyboard();

  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  }
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

/**
 * کیبورد خلاصه پاسخ‌ها (قبل از تایید نهایی)
 * هر مرحله با آیکون پر/خالی
 */
function summaryKB(answers) {
  const kb = new InlineKeyboard();

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const step = STEPS[i];
    const emoji = STEP_EMOJIS[i] || "📝";
    const filled = answers[step.id] !== undefined && answers[step.id] !== "";
    const icon = filled ? "✏️" : "⚠️"; // پر یا خالی

    kb.text(`${emoji} ${icon} ${step.title}`, `edit:${i}`).row();
  }

  kb.text("✅ تایید نهایی و دریافت گزارش", "confirm").row();
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

/**
 * کیبورد بعد از نمایش گزارش
 * شامل آموزش، بسته‌ها، شروع مجدد و منو
 */
function afterReportKB() {
  return new InlineKeyboard()
    .text("📚 آموزش‌های تخصصی", "edu_list").row()
    .text("💼 بسته‌ها و خدمات", "show_plans").row()
    .text("🔄 شروع مجدد تحلیل", "start_consultation").row()
    .text("🔙 بازگشت به منو", "menu").row();
}

/**
 * کیبورد صفحه "درباره ما"
 */
function aboutUsKB() {
  return new InlineKeyboard()
    .text("📞 ارتباط با ما", "contact_us").row()
    .text("🔙 بازگشت به منو", "menu").row();
}

/**
 * کیبورد صفحه "ارتباط با ما"
 */
function contactUsKB() {
  return new InlineKeyboard()
    .text("💼 مشاهده بسته‌ها", "show_plans").row()
    .text("🔙 بازگشت به منو", "menu").row();
}

/**
 * نوار پیشرفت بصری (برای نمایش در مراحل)
 */
function progressText(currentStep) {
  let t = "📊 پیشرفت: ";
  for (let i = 0; i < TOTAL_STEPS; i++) {
    if (i < currentStep) t += "🟢";       // تکمیل‌شده
    else if (i === currentStep) t += "🔵"; // فعلی
    else t += "⚪";                        // باقی‌مانده
  }
  t += ` (${currentStep + 1}/${TOTAL_STEPS})`;
  return t;
}

// ═══════════════════════════════════════════
// Export تمام کیبوردها
// ═══════════════════════════════════════════
module.exports = {
  mainMenuKB,
  stepChoiceKB,
  stepTextKB,
  summaryKB,
  afterReportKB,
  aboutUsKB,
  contactUsKB,
  progressText,
};
