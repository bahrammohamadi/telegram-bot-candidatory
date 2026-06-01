// src/flows/deep_assessment.js — تبدیل‌شده به CommonJS
// ═══════════════════════════════════════════════════════════════
// ✅ فیکس: تبدیل از ESM به CommonJS
// ✅ فیکس: سازگاری کامل با بقیه پروژه
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const { DEEP_MODULES, DEEP_TOTAL_STEPS } = require("../constants/deep_assessment.js");
const { calcDeepTotalScore, calcDeepPersonalityProfile, generateDeepReport } = require("../utils/deep_score.js");
const { saveConsultation, updateUser } = require("../utils/db.js");

// ═══════════════════════════════════════════════════════════════
// شروع ارزیابی عمیق یک ماژول
// ═══════════════════════════════════════════════════════════════
async function handleStartDeepAssessment(ctx) {
  const moduleId = ctx.callbackQuery.data.split(":")[1];
  const module = DEEP_MODULES.find((m) => m.id === moduleId);

  if (!module) {
    await ctx.answerCallbackQuery("❌ ماژول پیدا نشد");
    return;
  }

  // ریست session
  ctx.session.deepModuleId = moduleId;
  ctx.session.deepStep = 1;
  ctx.session.deepAnswers = {};

  const step = module.steps[0];
  let text = `${module.emoji} *${module.name}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📝 سؤال ۱ از ${module.steps.length}:\n\n`;
  text += `*${step.question}*\n\n`;
  if (step.hint) text += `💡 ${step.hint}\n\n`;

  const kb = new InlineKeyboard();

  if (step.type === "choice") {
    step.options.forEach((opt) => {
      kb.text(opt.label, `deep_answer:${moduleId}:1:${opt.value}`).row();
    });
  } else if (step.type === "scale") {
    for (let i = step.min; i <= step.max; i++) {
      kb.text(String(i), `deep_answer:${moduleId}:1:${i}`);
      if (i % 3 === 0) kb.row();
    }
  } else if (step.type === "text" || step.type === "number") {
    text += "✏️ لطفاً پاسخ خود را تایپ کنید:";
  }

  kb.row().text("🏠 منو", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

// ═══════════════════════════════════════════════════════════════
// ثبت پاسخ و نمایش سؤال بعدی
// ═══════════════════════════════════════════════════════════════
async function handleDeepAnswer(ctx) {
  const parts = ctx.callbackQuery.data.split(":");
  const moduleId = parts[1];
  const stepNum = parseInt(parts[2]);
  const answer = parts[3];

  const module = DEEP_MODULES.find((m) => m.id === moduleId);
  if (!module) return;

  // ذخیره پاسخ
  ctx.session.deepAnswers[`step${stepNum}`] = answer;
  ctx.session.deepStep = stepNum + 1;

  // اگر تمام شد
  if (stepNum >= module.steps.length) {
    await showDeepSummary(ctx, moduleId);
    return;
  }

  // سؤال بعدی
  const nextStep = module.steps[stepNum];
  let text = `${module.emoji} *${module.name}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📝 سؤال ${stepNum + 1} از ${module.steps.length}:\n\n`;
  text += `*${nextStep.question}*\n\n`;
  if (nextStep.hint) text += `💡 ${nextStep.hint}\n\n`;

  const kb = new InlineKeyboard();

  if (nextStep.type === "choice") {
    nextStep.options.forEach((opt) => {
      kb.text(opt.label, `deep_answer:${moduleId}:${stepNum + 1}:${opt.value}`).row();
    });
  } else if (nextStep.type === "scale") {
    for (let i = nextStep.min; i <= nextStep.max; i++) {
      kb.text(String(i), `deep_answer:${moduleId}:${stepNum + 1}:${i}`);
      if (i % 3 === 0) kb.row();
    }
  } else if (nextStep.type === "text" || nextStep.type === "number") {
    text += "✏️ لطفاً پاسخ خود را تایپ کنید:";
  }

  kb.row()
    .text(`« ویرایش سؤال ${stepNum}`, `deep_edit:${moduleId}:${stepNum}`)
    .row()
    .text("🏠 منو", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

// ═══════════════════════════════════════════════════════════════
// دریافت پاسخ متنی
// ═══════════════════════════════════════════════════════════════
async function handleDeepTextInput(ctx) {
  const moduleId = ctx.session.deepModuleId;
  const stepNum = ctx.session.deepStep;

  if (!moduleId || stepNum === 0) {
    await ctx.reply("❌ ابتدا یک ارزیابی شروع کنید.");
    return;
  }

  const module = DEEP_MODULES.find((m) => m.id === moduleId);
  if (!module) return;

  const step = module.steps[stepNum - 1];
  const userInput = ctx.message.text;

  // اعتبارسنجی
  if (step.type === "number") {
    const num = parseInt(userInput);
    if (isNaN(num) || num < step.min || num > step.max) {
      await ctx.reply(`❌ لطفاً یک عدد بین ${step.min} تا ${step.max} وارد کنید.`);
      return;
    }
    ctx.session.deepAnswers[`step${stepNum}`] = num;
  } else {
    ctx.session.deepAnswers[`step${stepNum}`] = userInput;
  }

  ctx.session.deepStep = stepNum + 1;

  // اگر تمام شد
  if (stepNum >= module.steps.length) {
    await showDeepSummary(ctx, moduleId);
    return;
  }

  // سؤال بعدی
  const nextStep = module.steps[stepNum];
  let text = `${module.emoji} *${module.name}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📝 سؤال ${stepNum + 1} از ${module.steps.length}:\n\n`;
  text += `*${nextStep.question}*\n\n`;
  if (nextStep.hint) text += `💡 ${nextStep.hint}\n\n`;

  const kb = new InlineKeyboard();

  if (nextStep.type === "choice") {
    nextStep.options.forEach((opt) => {
      kb.text(opt.label, `deep_answer:${moduleId}:${stepNum + 1}:${opt.value}`).row();
    });
  } else if (nextStep.type === "scale") {
    for (let i = nextStep.min; i <= nextStep.max; i++) {
      kb.text(String(i), `deep_answer:${moduleId}:${stepNum + 1}:${i}`);
      if (i % 3 === 0) kb.row();
    }
  } else {
    text += "✏️ لطفاً پاسخ خود را تایپ کنید:";
  }

  kb.row()
    .text(`« ویرایش سؤال ${stepNum}`, `deep_edit:${moduleId}:${stepNum}`)
    .row()
    .text("🏠 منو", "menu");

  await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
}

// ═══════════════════════════════════════════════════════════════
// نمایش خلاصه و تأیید نهایی
// ═══════════════════════════════════════════════════════════════
async function showDeepSummary(ctx, moduleId) {
  const module = DEEP_MODULES.find((m) => m.id === moduleId);
  if (!module) return;

  let text = `${module.emoji} *خلاصه پاسخ‌های شما*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  module.steps.forEach((step, idx) => {
    const ans = ctx.session.deepAnswers[`step${idx + 1}`];
    text += `*${idx + 1}. ${step.question}*\n`;
    text += `➜ ${ans}\n\n`;
  });

  text += "✅ تأیید می‌کنید؟";

  const kb = new InlineKeyboard()
    .text("✅ تأیید و دریافت گزارش", "deep_confirm")
    .row()
    .text("🔄 شروع مجدد", "deep_reset")
    .row()
    .text("🏠 منو", "menu");

  await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
}

// ═══════════════════════════════════════════════════════════════
// تأیید نهایی و تولید گزارش
// ═══════════════════════════════════════════════════════════════
async function handleDeepConfirm(ctx) {
  await ctx.answerCallbackQuery("⏳ در حال تولید گزارش...");

  const moduleId = ctx.session.deepModuleId;
  const module = DEEP_MODULES.find((m) => m.id === moduleId);

  if (!module) {
    await ctx.reply("❌ خطا: ماژول پیدا نشد");
    return;
  }

  const answers = ctx.session.deepAnswers;
  const score = calcDeepTotalScore(moduleId, answers);
  const personality = calcDeepPersonalityProfile(answers);
  const report = generateDeepReport(moduleId, answers, score, personality);

  // ذخیره در دیتابیس
  await saveConsultation({
    userId: String(ctx.from.id),
    electionType: `deep_${moduleId}`,
    region: null,
    answers: JSON.stringify(answers),
    score: score,
    riskLevel: score >= 80 ? "high" : score >= 50 ? "medium" : "low",
    finalReport: report,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ریست session
  ctx.session.deepStep = 0;
  ctx.session.deepAnswers = {};
  ctx.session.deepModuleId = null;

  await updateUser(ctx.from.id, { currentStep: null });

  await ctx.reply(report, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
}

// ═══════════════════════════════════════════════════════════════
// ویرایش یک سؤال
// ═══════════════════════════════════════════════════════════════
async function handleDeepEdit(ctx) {
  const parts = ctx.callbackQuery.data.split(":");
  const moduleId = parts[1];
  const stepNum = parseInt(parts[2]);

  const module = DEEP_MODULES.find((m) => m.id === moduleId);
  if (!module) return;

  const step = module.steps[stepNum - 1];

  let text = `${module.emoji} *ویرایش سؤال ${stepNum}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `*${step.question}*\n\n`;

  const kb = new InlineKeyboard();

  if (step.type === "choice") {
    step.options.forEach((opt) => {
      kb.text(opt.label, `deep_answer:${moduleId}:${stepNum}:${opt.value}`).row();
    });
  } else if (step.type === "scale") {
    for (let i = step.min; i <= step.max; i++) {
      kb.text(String(i), `deep_answer:${moduleId}:${stepNum}:${i}`);
      if (i % 3 === 0) kb.row();
    }
  } else {
    text += "✏️ پاسخ جدید را تایپ کنید:";
  }

  kb.row().text("🏠 منو", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

// ═══════════════════════════════════════════════════════════════
// ریست ارزیابی
// ═══════════════════════════════════════════════════════════════
async function handleDeepReset(ctx) {
  ctx.session.deepStep = 0;
  ctx.session.deepAnswers = {};
  const moduleId = ctx.session.deepModuleId;
  ctx.session.deepModuleId = null;

  await updateUser(ctx.from.id, { currentStep: null });

  await ctx.answerCallbackQuery("✅ ارزیابی ریست شد");
  await ctx.reply("ارزیابی عمیق لغو شد.", { reply_markup: mainMenuKB() });
}

// ═══════════════════════════════════════════════════════════════
// Helper: mainMenuKB
// ═══════════════════════════════════════════════════════════════
function mainMenuKB() {
  const { mainMenuKB: mkb } = require("../utils/keyboard.js");
  return mkb();
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════
module.exports = {
  handleStartDeepAssessment,
  handleDeepAnswer,
  handleDeepConfirm,
  handleDeepEdit,
  handleDeepReset,
  handleDeepTextInput,
};
