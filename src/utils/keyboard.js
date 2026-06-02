// src/utils/keyboard.js — نسخه جذاب و کاربرپسند
const { InlineKeyboard } = require("grammy");
const { STEPS } = require("../constants/questions.js");

function mainMenuKB() {
  return new InlineKeyboard()
    .text("🚀 شروع تحلیل آمادگی", "start_consultation")
    .row()
    .text("📚 آموزش کاندیداتوری", "show_education")
    .row()
    .text("🧪 تست‌های تخصصی", "show_assessments")
    .row()
    .text("📦 بسته‌های خدماتی", "show_plans")
    .row()
    .text("📋 تاریخچه تحلیل‌ها", "show_history")
    .row()
    .text("📞 تماس با ما", "contact_us")
    .text("ℹ️ درباره ما", "about_us");
}

function stepKeyboard(stepId) {
  const step = STEPS.find((s) => s.id === stepId);
  if (!step) return new InlineKeyboard();

  const kb = new InlineKeyboard();

  if (step.type === "choice" && step.options) {
    step.options.forEach((opt) => {
      kb.text(opt.label, `answer:${stepId}:${opt.value}`).row();
    });
  } else if (step.type === "scale") {
    const min = step.min || 1;
    const max = step.max || 10;
    for (let i = min; i <= max; i++) {
      kb.text(String(i), `answer:${stepId}:${i}`);
      if (i % 5 === 0 || i === max) kb.row();
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === stepId);
  if (stepIndex > 0) {
    const prevStep = STEPS[stepIndex - 1];
    kb.text(`✏️ ویرایش قبلی`, `edit_step:${prevStep.id}`);
  }
  kb.text("🏠 منوی اصلی", "menu");

  return kb;
}

function confirmationKB() {
  return new InlineKeyboard()
    .text("✅ تأیید و دریافت گزارش", "confirm_final")
    .row()
    .text("✏️ ویرایش پاسخ‌ها", "reset_consultation")
    .row()
    .text("🏠 منوی اصلی", "menu");
}

function backToMainKB() {
  return new InlineKeyboard().text("🏠 بازگشت به منوی اصلی", "menu");
}

function historyKB(consultations) {
  const kb = new InlineKeyboard();
  if (consultations && consultations.length > 0) {
    consultations.slice(0, 10).forEach((c) => {
      const label = `📊 ${c.electionType || "تحلیل"}`;
      kb.text(label, `history_detail:${c.$id}`).row();
    });
  }
  kb.text("🏠 منوی اصلی", "menu");
  return kb;
}

function plansKB() {
  return new InlineKeyboard()
    .text("🆓 رایگان", "select_plan:free")
    .row()
    .text("🌱 راه‌اندازی", "select_plan:starter")
    .row()
    .text("⭐ حرفه‌ای", "select_plan:professional")
    .row()
    .text("👑 ویژه VIP", "select_plan:vip")
    .row()
    .text("🏠 منوی اصلی", "menu");
}

module.exports = { mainMenuKB, stepKeyboard, confirmationKB, backToMainKB, historyKB, plansKB };
