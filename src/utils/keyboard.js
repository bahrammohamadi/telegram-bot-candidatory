// src/utils/keyboard.js
// ═══════════════════════════════════════════════════════════════
// ⌨️ Keyboard Utilities - تمام کیبوردهای ربات
// نسخه: 2.0 - پاکسازی‌شده + بهبودیافته
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const { STEPS, TOTAL_STEPS, STEP_EMOJIS } = require("../constants/questions.js");

// ═══════════════════════════════════════════════════════════════
// 🏠 منوی اصلی
// ═══════════════════════════════════════════════════════════════
function mainMenuKB() {
  return new InlineKeyboard()
    .text("🎯 شروع مشاوره", "start_consultation")
    .row()
    .text("📚 آموزش کاندیداتوری", "show_education")
    .row()
    .text("💼 بسته‌های خدماتی", "show_plans")
    .row()
    .text("📜 تاریخچه تحلیل‌ها", "show_history")
    .row()
    .text("📞 تماس با ما", "contact_us")
    .text("ℹ️ درباره ما", "about_us");
}

// ═══════════════════════════════════════════════════════════════
// 📋 کیبورد هر مرحله از سؤالات
// ═══════════════════════════════════════════════════════════════
function stepKeyboard(stepId) {
  const step = STEPS.find((s) => s.id === stepId);
  if (!step) return new InlineKeyboard();

  const kb = new InlineKeyboard();

  // دکمه‌های پاسخ
  if (step.type === "choice" && step.options) {
    step.options.forEach((opt) => {
      kb.text(opt.label, `answer:${stepId}:${opt.value}`).row();
    });
  } else if (step.type === "scale") {
    // دکمه‌های عددی (مثلاً 1 تا 10)
    const min = step.min || 1;
    const max = step.max || 10;
    
    for (let i = min; i <= max; i++) {
      kb.text(String(i), `answer:${stepId}:${i}`);
      if (i % 3 === 0 || i === max) kb.row();
    }
  }

  // دکمه بازگشت (اگر مرحله اول نباشد)
  const stepIndex = STEPS.findIndex((s) => s.id === stepId);
  if (stepIndex > 0) {
    const prevStep = STEPS[stepIndex - 1];
    kb.text(`« ویرایش: ${prevStep.shortTitle || 'قبلی'}`, `edit_step:${prevStep.id}`);
  }

  // دکمه منو
  kb.text("🏠 منو", "menu");

  return kb;
}

// ═══════════════════════════════════════════════════════════════
// ✅ کیبورد تأیید نهایی
// ═══════════════════════════════════════════════════════════════
function confirmationKB() {
  return new InlineKeyboard()
    .text("✅ تأیید و دریافت گزارش", "confirm_final")
    .row()
    .text("🔄 شروع مجدد", "reset_consultation")
    .row()
    .text("🏠 منو", "menu");
}

// ═══════════════════════════════════════════════════════════════
// 📞 کیبورد تماس با ما
// ═══════════════════════════════════════════════════════════════
function contactUsKB() {
  return new InlineKeyboard()
    .url("📱 تلگرام پشتیبانی", "https://t.me/candidatory_support")
    .row()
    .text("« بازگشت", "menu");
}

// ═══════════════════════════════════════════════════════════════
// ℹ️ کیبورد درباره ما
// ═══════════════════════════════════════════════════════════════
function aboutUsKB() {
  return new InlineKeyboard()
    .url("🌐 وب‌سایت", "https://candidatory.ir")
    .row()
    .url("📱 کانال تلگرام", "https://t.me/candidatoryiran_bot")
    .row()
    .text("« بازگشت", "menu");
}

// ═══════════════════════════════════════════════════════════════
// 📜 کیبورد تاریخچه
// ═══════════════════════════════════════════════════════════════
function historyKB(consultations) {
  const kb = new InlineKeyboard();

  if (consultations && consultations.length > 0) {
    consultations.slice(0, 10).forEach((c) => {
      const date = new Date(c.$createdAt || c.createdAt);
      const label = `📊 ${c.electionType || 'تحلیل'} - ${date.toLocaleDateString('fa-IR')}`;
      kb.text(label, `history_detail:${c.$id}`).row();
    });
  }

  kb.text("🏠 منو", "menu");
  return kb;
}

// ═══════════════════════════════════════════════════════════════
// 💼 کیبورد بسته‌ها (ساده‌شده)
// ═══════════════════════════════════════════════════════════════
function plansKB() {
  return new InlineKeyboard()
    .text("🆓 رایگان", "select_plan:free")
    .row()
    .text("🚀 راه‌اندازی", "select_plan:starter")
    .row()
    .text("💼 حرفه‌ای", "select_plan:professional")
    .row()
    .text("👑 ویژه", "select_plan:vip")
    .row()
    .text("« بازگشت", "menu");
}

// ═══════════════════════════════════════════════════════════════
// 📚 کیبورد آموزش
// ═══════════════════════════════════════════════════════════════
function educationMenuKB() {
  return new InlineKeyboard()
    .text("📖 لیست کارت‌های آموزشی", "show_education")
    .row()
    .text("« بازگشت", "menu");
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════
module.exports = {
  mainMenuKB,
  stepKeyboard,
  confirmationKB,
  contactUsKB,
  aboutUsKB,
  historyKB,
  plansKB,
  educationMenuKB,
};
