// src/utils/keyboard.js
// ─── تمام InlineKeyboard های پروژه ───
// سازگار با ساختار جدید ۱۰ مرحله‌ای

import { InlineKeyboard } from "grammy";
import { STEPS, TOTAL_STEPS, STEP_EMOJIS } from "../constants/questions.js";

// ═══════════════════════════════════════
//  منوی اصلی
// ═══════════════════════════════════════

export function mainMenuKB() {
  return new InlineKeyboard()
    .text("🚀 شروع تحلیل آمادگی", "start_consultation")
    .row()
    .text("📚 آموزش‌های تخصصی", "edu:list")
    .row()
    .text("💼 بسته‌های خدماتی", "show_plans")
    .row()
    .text("📞 ارتباط با ما", "contact_us")
    .row()
    .text("ℹ️ درباره ما", "about_us")
    .text("📄 نمونه تحلیل‌ها", "show_samples")
    .row();
}

// ═══════════════════════════════════════
//  کیبورد مراحل
// ═══════════════════════════════════════

/** گزینه‌های مرحله choice */
export function stepChoiceKB(stepIndex) {
  const step = STEPS[stepIndex];
  if (!step || step.type !== "choice") return new InlineKeyboard();

  const kb = new InlineKeyboard();

  for (const opt of step.options) {
    kb.text(opt.label, `answer:${stepIndex}:${opt.value}`).row();
  }

  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back_step:${stepIndex - 1}`).row();
  }

  kb.text("❌ انصراف", "cancel_consultation").row();

  return kb;
}

/** کیبورد مرحله متنی */
export function stepTextKB(stepIndex) {
  const kb = new InlineKeyboard();

  if (stepIndex > 0) {
    kb.text("⬅️ مرحله قبل", `back_step:${stepIndex - 1}`).row();
  }

  kb.text("❌ انصراف", "cancel_consultation").row();

  return kb;
}

// ═══════════════════════════════════════
//  کیبورد خلاصه
// ═══════════════════════════════════════

/** خلاصه پاسخ‌ها + دکمه ویرایش */
export function summaryKB(answers) {
  const kb = new InlineKeyboard();

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const step = STEPS[i];
    const emoji = STEP_EMOJIS[i] || "📝";
    const filled = answers[step.id] !== undefined && answers[step.id] !== "";
    const icon = filled ? "✏️" : "⚠️";
    kb.text(`${emoji} ${icon} ${step.title}`, `edit_step:${i}`).row();
  }

  kb.text("✅ تایید نهایی و دریافت گزارش", "confirm_final").row();
  kb.text("❌ انصراف", "cancel_consultation").row();

  return kb;
}

// ═══════════════════════════════════════
//  کیبورد بعد از گزارش
// ═══════════════════════════════════════

export function afterReportKB() {
  return new InlineKeyboard()
    .text("📚 آموزش‌های تخصصی کاندیداتوری", "edu:list")
    .row()
    .text("💼 مشاهده بسته‌ها و خدمات", "show_plans")
    .row()
    .text("🔄 تحلیل مجدد", "start_consultation")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();
}

// ═══════════════════════════════════════
//  کیبوردهای صفحات ثابت
// ═══════════════════════════════════════

export function aboutUsKB() {
  return new InlineKeyboard()
    .text("📞 ارتباط با ما", "contact_us")
    .row()
    .text("💼 بسته‌ها", "show_plans")
    .row()
    .text("🔙 منو", "menu")
    .row();
}

export function contactUsKB() {
  return new InlineKeyboard()
    .text("💼 مشاهده بسته‌ها", "show_plans")
    .row()
    .text("🔙 منو", "menu")
    .row();
}

export function samplesKB() {
  return new InlineKeyboard()
    .text("🚀 شروع تحلیل آمادگی", "start_consultation")
    .row()
    .text("🔙 منو", "menu")
    .row();
}

// ═══════════════════════════════════════
//  نوار پیشرفت متنی
// ═══════════════════════════════════════

/**
 * تولید نوار پیشرفت دایره‌ای
 * @param {number} current - ایندکس فعلی (0-based)
 * @returns {string}
 */
export function progressText(current) {
  let t = "📊 ";
  for (let i = 0; i < TOTAL_STEPS; i++) {
    if (i < current) t += "🟢";
    else if (i === current) t += "🔵";
    else t += "⚪";
  }
  t += ` (${current + 1}/${TOTAL_STEPS})`;
  return t;
}
