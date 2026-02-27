// src/utils/keyboard.js — CommonJS

const { InlineKeyboard } = require("grammy");
const { STEPS, TOTAL_STEPS, STEP_EMOJIS } = require("../constants/questions.js");

function mainMenuKB() {
  return new InlineKeyboard()
    .text("🚀 شروع تحلیل آمادگی", "start_consultation").row()
    .text("📚 آموزش‌های تخصصی", "edu_list").row()
    .text("💼 خدمات و بسته‌ها", "show_plans").row()
    .text("📞 ارتباط با ما", "contact_us").row()
    .text("📄 نمونه تحلیل‌ها", "sample_reports").row()
    .text("ℹ️ درباره ما", "about_us").row();
}

function stepChoiceKB(stepIndex) {
  const step = STEPS[stepIndex];
  if (!step || step.type !== "choice") return new InlineKeyboard();
  const kb = new InlineKeyboard();
  const sorted = [...step.options].sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0));
  for (const opt of sorted) kb.text(opt.label, `ans:${stepIndex}:${opt.value}`).row();
  if (stepIndex > 0) kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  kb.text("❌ انصراف", "cancel").row();
  return kb;
}

function stepTextKB(stepIndex) {
  const kb = new InlineKeyboard();
  if (stepIndex > 0) kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  kb.text("❌ انصراف", "cancel").row();
  return kb;
}

function summaryKB(answers) {
  const kb = new InlineKeyboard();
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const step = STEPS[i];
    const emoji = STEP_EMOJIS[i] || "📝";
    const filled = answers[step.id] !== undefined && answers[step.id] !== "";
    kb.text(`${emoji} ${filled ? "✏️" : "⚠️"} ${step.title}`, `edit:${i}`).row();
  }
  kb.text("✅ تایید نهایی و دریافت گزارش", "confirm").row();
  kb.text("❌ انصراف", "cancel").row();
  return kb;
}

function afterReportKB() {
  return new InlineKeyboard()
    .text("📚 آموزش‌های تخصصی", "edu_list").row()
    .text("💼 بسته‌ها و خدمات", "show_plans").row()
    .text("🔄 شروع مجدد", "start_consultation").row()
    .text("🔙 منو", "menu").row();
}

function aboutUsKB() {
  return new InlineKeyboard().text("📞 ارتباط با ما", "contact_us").row().text("🔙 بازگشت", "menu").row();
}

function contactUsKB() {
  return new InlineKeyboard().text("💼 بسته‌ها", "show_plans").row().text("🔙 بازگشت", "menu").row();
}

function progressText(currentStep) {
  let t = "📊 پیشرفت: ";
  for (let i = 0; i < TOTAL_STEPS; i++) {
    if (i < currentStep) t += "🟢";
    else if (i === currentStep) t += "🔵";
    else t += "⚪";
  }
  t += ` (${currentStep + 1}/${TOTAL_STEPS})`;
  return t;
}

module.exports = { mainMenuKB, stepChoiceKB, stepTextKB, summaryKB, afterReportKB, aboutUsKB, contactUsKB, progressText };
