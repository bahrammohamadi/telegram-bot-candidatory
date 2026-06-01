const { InlineKeyboard } = require("grammy");
const { STEPS } = require("../constants/questions.js");

function mainMenuKB() {
  return new InlineKeyboard()
    .text("🎯 شروع مشاوره", "start_consultation")
    .row()
    .text("📚 آموزش", "show_education")
    .row()
    .text("💼 بسته ها", "show_plans")
    .row()
    .text("📜 تاریخچه", "show_history")
    .row()
    .text("📞 تماس", "contact_us")
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
      if (i % 3 === 0 || i === max) kb.row();
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === stepId);
  if (stepIndex > 0) {
    const prevStep = STEPS[stepIndex - 1];
    kb.text(`« ویرایش`, `edit_step:${prevStep.id}`);
  }

  kb.text("🏠 منو", "menu");

  return kb;
}

function confirmationKB() {
  return new InlineKeyboard()
    .text("✅ تایید", "confirm_final")
    .row()
    .text("🔄 شروع مجدد", "reset_consultation")
    .row()
    .text("🏠 منو", "menu");
}

function contactUsKB() {
  return new InlineKeyboard()
    .url("📱 پشتیبانی", "https://t.me/candidatory_support")
    .row()
    .text("« بازگشت", "menu");
}

function aboutUsKB() {
  return new InlineKeyboard()
    .url("🌐 وب سایت", "https://candidatory.ir")
    .row()
    .text("« بازگشت", "menu");
}

function historyKB(consultations) {
  const kb = new InlineKeyboard();

  if (consultations && consultations.length > 0) {
    consultations.slice(0, 10).forEach((c) => {
      const date = new Date(c.$createdAt || c.createdAt);
      const label = `📊 ${c.electionType || 'تحلیل'}`;
      kb.text(label, `history_detail:${c.$id}`).row();
    });
  }

  kb.text("🏠 منو", "menu");
  return kb;
}

function plansKB() {
  return new InlineKeyboard()
    .text("🆓 رایگان", "select_plan:free")
    .row()
    .text("🚀 راه اندازی", "select_plan:starter")
    .row()
    .text("💼 حرفه ای", "select_plan:professional")
    .row()
    .text("👑 ویژه", "select_plan:vip")
    .row()
    .text("« بازگشت", "menu");
}

module.exports = {
  mainMenuKB,
  stepKeyboard,
  confirmationKB,
  contactUsKB,
  aboutUsKB,
  historyKB,
  plansKB,
};
