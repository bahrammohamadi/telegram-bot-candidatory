// src/utils/keyboard.js
// ─── تمام InlineKeyboard های پروژه (نسخه ۳ — با ارزیابی عمیق) ───

import { InlineKeyboard } from "grammy";
import { STEPS, TOTAL_STEPS, STEP_EMOJIS } from "../constants/questions.js";

// ═══════════════════════════════════════════
//  منوی اصلی
// ═══════════════════════════════════════════
export function mainMenuKB() {
  return new InlineKeyboard()
    .text("🚀 شروع تحلیل آمادگی", "start_consultation")
    .row()
    .text("🧠 ارزیابی عمیق (حرفه‌ای)", "start_deep")
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

// ═══════════════════════════════════════════
//  کیبورد گزینه‌ای (choice) برای یک مرحله فاز ۱
// ═══════════════════════════════════════════
export function stepChoiceKB(stepIndex) {
  const step = STEPS[stepIndex];
  if (!step || step.type !== "choice") return new InlineKeyboard();

  const kb = new InlineKeyboard();

  // مرتب‌سازی: اگر isDefault داشت اول بیاد
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

// ═══════════════════════════════════════════
//  کیبورد مرحله متنی (text) فاز ۱
// ═══════════════════════════════════════════
export function stepTextKB(stepIndex) {
  const kb = new InlineKeyboard();

  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back:${stepIndex - 1}`).row();
  }
  kb.text("❌ انصراف", "cancel").row();

  return kb;
}

// ═══════════════════════════════════════════
//  کیبورد خلاصه (قبل از تایید نهایی) — فاز ۱
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
//  کیبورد بعد از گزارش فاز ۱ (با دکمه ارزیابی عمیق)
// ═══════════════════════════════════════════
export function afterReportKB() {
  return new InlineKeyboard()
    .text("🧠 ارزیابی عمیق کاندیداتوری (حرفه‌ای)", "start_deep")
    .row()
    .text("📚 آموزش‌های تخصصی کاندیداتوری", "edu_list")
    .row()
    .text("💼 مشاهده بسته‌ها و خدمات", "show_plans")
    .row()
    .text("🔄 شروع مجدد تحلیل", "start_consultation")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();
}

// ═══════════════════════════════════════════
//  کیبورد درباره ما
// ═══════════════════════════════════════════
export function aboutUsKB() {
  return new InlineKeyboard()
    .text("📞 ارتباط با ما", "contact_us")
    .row()
    .text("🔙 بازگشت", "menu")
    .row();
}

// ═══════════════════════════════════════════
//  کیبورد ارتباط با ما
// ═══════════════════════════════════════════
export function contactUsKB() {
  return new InlineKeyboard()
    .text("💼 مشاهده بسته‌ها", "show_plans")
    .row()
    .text("🔙 بازگشت", "menu")
    .row();
}

// ═══════════════════════════════════════════
//  نوار پیشرفت فاز ۱
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
//  کیبورد بعد از گزارش عمیق (فاز ۲)
// ═══════════════════════════════════════════
export function afterDeepReportKB() {
  return new InlineKeyboard()
    .text("💼 بسته‌های خدماتی (مشاوره تخصصی)", "show_plans")
    .row()
    .text("📚 آموزش‌های تخصصی", "edu_list")
    .row()
    .text("🔄 شروع مجدد تحلیل پایه", "start_consultation")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();
}

// ═══════════════════════════════════════════
//  کیبورد معرفی ارزیابی عمیق (صفحه ورود فاز ۲)
// ═══════════════════════════════════════════
export function deepIntroKB() {
  return new InlineKeyboard()
    .text("🚀 شروع ارزیابی عمیق", "deep_begin")
    .row()
    .text("🔙 بازگشت به منو", "menu")
    .row();
}

// ═══════════════════════════════════════════
//  کیبورد خلاصه ارزیابی عمیق (قبل از تایید)
// ═══════════════════════════════════════════
export function deepSummaryKB() {
  return new InlineKeyboard()
    .text("✅ تایید و دریافت گزارش عمیق", "deep_confirm")
    .row()
    .text("🔄 ادامه پاسخ‌دهی", "deep_begin")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();
}

// ═══════════════════════════════════════════
//  کیبورد ناوبری مرحله عمیق
// ═══════════════════════════════════════════
export function deepStepNavKB(flatIdx, totalSteps) {
  const kb = new InlineKeyboard();

  if (flatIdx > 0) {
    kb.text("⬅️ قبلی", `deep_back:${flatIdx - 1}`);
  }
  kb.text("⏭️ رد شدن", `deep_skip:${flatIdx}`);
  kb.row();
  kb.text("❌ خروج و ذخیره", "deep_exit").row();

  return kb;
}

// ═══════════════════════════════════════════
//  کیبورد گزینه‌ای مرحله عمیق (choice + ناوبری)
// ═══════════════════════════════════════════
export function deepStepChoiceKB(flatIdx, options, totalSteps) {
  const kb = new InlineKeyboard();

  // گزینه‌های سؤال
  for (const opt of options) {
    kb.text(opt.label, `deep_ans:${flatIdx}:${opt.value}`).row();
  }

  // ناوبری
  if (flatIdx > 0) {
    kb.text("⬅️ قبلی", `deep_back:${flatIdx - 1}`);
  }
  kb.text("⏭️ رد شدن", `deep_skip:${flatIdx}`);
  kb.row();
  kb.text("❌ خروج و ذخیره", "deep_exit").row();

  return kb;
}

// ═══════════════════════════════════════════
//  کیبورد مرحله متنی عمیق (text + ناوبری)
// ═══════════════════════════════════════════
export function deepStepTextKB(flatIdx, totalSteps) {
  const kb = new InlineKeyboard();

  if (flatIdx > 0) {
    kb.text("⬅️ قبلی", `deep_back:${flatIdx - 1}`);
  }
  kb.text("⏭️ رد شدن", `deep_skip:${flatIdx}`);
  kb.row();
  kb.text("❌ خروج و ذخیره", "deep_exit").row();

  return kb;
}

// ═══════════════════════════════════════════
//  نوار پیشرفت ارزیابی عمیق
// ═══════════════════════════════════════════
export function deepProgressText(flatIdx, totalSteps) {
  const pct = Math.round(((flatIdx + 1) / totalSteps) * 100);
  const filled = Math.round(pct / 10);
  const barStr = "🟢".repeat(filled) + "⚪".repeat(10 - filled);
  return `📊 پیشرفت ارزیابی عمیق: ${barStr} ${flatIdx + 1}/${totalSteps} (${pct}%)`;
}
