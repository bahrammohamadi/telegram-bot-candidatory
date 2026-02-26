// src/utils/keyboard.js
// ─── تمام InlineKeyboard های پروژه (بروزرسانی‌شده) ───

import { InlineKeyboard } from "grammy";
import { STEPS, TOTAL_STEPS, STEP_EMOJIS } from "../constants/questions.js";

/**
 * منوی اصلی
 */
export function mainMenuKB() {
  return new InlineKeyboard()
    .text("🚀 شروع تحلیل آمادگی", "start_consultation")
    .row()
    .text("📚 آموزش‌های تخصصی", "edu_list")
    .row()
    .text("💼 خدمات و بسته‌ها", "show_plans")
    .row()
    .text("📞 ارتباط با ما", "contact_us")
    .row()
    .text("📄 نمونه تحلیل‌ها", "sample_reports")
    .row()
    .text("ℹ️ درباره ما", "about_us")
    .row();
}

/**
 * کیبورد گزینه‌ای (choice) برای یک مرحله
 */
export function stepChoiceKB(stepIndex) {
  const step = STEPS[stepIndex];
  if (!step || step.type !== "choice") return new InlineKeyboard();

  const kb = new InlineKeyboard();

  // گزینه‌ها — اگر isDefault باشد اول نمایش داده شود (قبلاً sort شده)
  const sortedOptions = [...step.options].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return 0;
  });

  for (const opt of sortedOptions) {
    kb.text(opt.label, `ans:${stepIndex}:${opt.value}`).row();
  }

  // دکمه‌های ناوبری
  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  }
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

/**
 * کیبورد مرحله متنی (text)
 */
export function stepTextKB(stepIndex) {
  const kb = new InlineKeyboard();

  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  }
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

/**
 * کیبورد خلاصه (قبل از تایید)
 */
export function summaryKB(answers) {
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

/**
 * کیبورد بعد از گزارش
 */
export function afterReportKB() {
  return new InlineKeyboard()
    .text("📚 آموزش‌های تخصصی کاندیداتوری", "edu_list")
    .row()
    .text("💼 مشاهده بسته‌ها و خدمات", "show_plans")
    .row()
    .text("🔄 شروع مجدد تحلیل", "start_consultation")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();
}

/**
 * کیبورد درباره ما
 */
export function aboutUsKB() {
  return new InlineKeyboard()
    .text("📞 ارتباط با ما", "contact_us")
    .row()
    .text("🔙 بازگشت", "menu")
    .row();
}

/**
 * کیبورد ارتباط با ما
 */
export function contactUsKB() {
  return new InlineKeyboard()
    .text("💼 مشاهده بسته‌ها", "show_plans")
    .row()
    .text("🔙 بازگشت", "menu")
    .row();
}

/**
 * متن نوار پیشرفت
 */
export function progressText(currentStep) {
  let t = "📊 پیشرفت: ";
  for (let i = 0; i < TOTAL_STEPS; i++) {
    if (i < currentStep) t += "🟢";
    else if (i === currentStep) t += "🔵";
    else t += "⚪";
  }
  t += ` (${currentStep + 1}/${TOTAL_STEPS})`;
  return t;
}
