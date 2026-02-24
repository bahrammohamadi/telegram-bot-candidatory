// ============================================================
// ⌨️ توابع ساخت Inline Keyboard
// ============================================================

import { InlineKeyboard } from "grammy";
import { STEPS, STEP_EMOJIS } from "../constants/questions.js";
import { answerLabel } from "./score.js";

/**
 * کیبورد منوی اصلی
 */
export function mainMenuKB() {
  return new InlineKeyboard()
    .text("🧠 مشاوره هوشمند کاندیداتوری", "start_consult")
    .row()
    .text("📦 پلن‌های خدمات", "show_plans")
    .row()
    .text("📞 ارتباط با ما", "contact")
    .row()
    .text("📊 نمونه تحلیل‌ها", "samples")
    .row()
    .text("ℹ️ درباره ما", "about");
}

/**
 * کیبورد سوال inline — گزینه‌ها + دکمه انصراف
 * @param {number} idx شماره مرحله (۰ تا ۵)
 */
export function stepKB(idx) {
  const kb = new InlineKeyboard();
  STEPS[idx].options.forEach((o, i) => {
    kb.text(o.text, `ans_${idx}_${i}`).row();
  });
  kb.text("❌ انصراف و بازگشت", "cancel_consult");
  return kb;
}

/**
 * کیبورد مرحله متنی — فقط دکمه انصراف
 */
export function textStepKB() {
  return new InlineKeyboard().text("❌ انصراف و بازگشت", "cancel_consult");
}

/**
 * کیبورد صفحه خلاصه — ویرایش هر مرحله + تایید نهایی
 */
export function summaryKB() {
  const kb = new InlineKeyboard();
  STEPS.forEach((_, i) => {
    kb.text(`✏️ ویرایش مرحله ${i + 1}`, `edit_${i}`).row();
  });
  kb.text("✅ تایید نهایی و دریافت گزارش", "confirm").row();
  kb.text("❌ انصراف", "cancel_consult");
  return kb;
}

/**
 * کیبورد بعد ویرایش مرحله متنی — انصراف از ویرایش
 */
export function editCancelKB() {
  return new InlineKeyboard().text("↩️ انصراف از ویرایش", "back_summary");
}

/**
 * کیبورد بعد از نمایش گزارش
 */
export function afterReportKB() {
  return new InlineKeyboard()
    .text("📦 مشاهده پلن‌ها", "show_plans")
    .row()
    .text("📞 ارتباط با ما", "contact")
    .row()
    .text("🔄 مشاوره جدید", "start_consult")
    .row()
    .text("🏠 منوی اصلی", "main_menu");
}

/**
 * کیبورد بازگشت ساده
 */
export function backKB() {
  return new InlineKeyboard().text("🏠 بازگشت به منوی اصلی", "main_menu");
}

/**
 * ساخت متن صفحه خلاصه از جواب‌ها
 * @param {object} answers
 * @param {number} estimatedScore
 * @returns {string}
 */
export function buildSummaryText(answers, estimatedScore) {
  let txt = `\n📋 *خلاصه پاسخ‌های شما*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

  STEPS.forEach((s, i) => {
    const raw = answers[s.key];
    const label = s.type === "text" ? (raw || "—") : answerLabel(raw);
    txt += `${STEP_EMOJIS[i]} مرحله ${i + 1}: *${label}*\n`;
  });

  txt += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += `📈 امتیاز تخمینی: *${estimatedScore} از ۸۵*\n\n`;
  txt += `✅ اگر پاسخ‌ها صحیح هستند، *تایید نهایی* را بزنید.\n`;
  txt += `✏️ برای تغییر هر مرحله، دکمه ویرایش آن را بزنید.`;

  return txt;
}