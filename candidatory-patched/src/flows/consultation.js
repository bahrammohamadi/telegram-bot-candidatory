// src/flows/consultation.js — نسخه حرفه‌ای با گزارش تحلیلی
const { InlineKeyboard } = require("grammy");
const { STEPS, TOTAL_STEPS } = require("../constants/questions.js");
const { calcScore, generateReport, getRiskLevel } = require("../utils/score.js");
const { saveConsultation, updateUser } = require("../utils/db.js");
const { stepKeyboard, confirmationKB, mainMenuKB } = require("../utils/keyboard.js");

async function handleStartConsultation(ctx) {
  ctx.session.step = 0;
  ctx.session.answers = {};

  await updateUser(ctx.from.id, { currentStep: 0, tempAnswers: "{}" });

  const firstStep = STEPS[0];
  ctx.session.step = firstStep.id;
  await askQuestion(ctx, firstStep);

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
}

async function askQuestion(ctx, step) {
  const currentIndex = STEPS.findIndex((s) => s.id === step.id);
  const progress = Math.round(((currentIndex + 1) / TOTAL_STEPS) * 100);
  const filled = Math.round((progress / 100) * 10);
  const progressBar = "█".repeat(filled) + "░".repeat(10 - filled);

  let text = `${step.emoji} *مرحله ${currentIndex + 1} از ${TOTAL_STEPS}*\n`;
  text += `${progressBar} ${progress}%\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `*${step.question}*\n\n`;

  if (step.hint) text += `💡 ${step.hint}\n\n`;
  if (step.type === "text" || step.type === "number") {
    text += `✏️ _لطفاً پاسخ خود را تایپ کنید:_`;
  }

  const kb = stepKeyboard(step.id);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function handleAnswer(ctx) {
  const data = ctx.callbackQuery.data;
  const parts = data.split(":");
  if (parts.length < 3) {
    await ctx.answerCallbackQuery("خطا در پردازش");
    return;
  }

  const stepId = parseInt(parts[1]);
  const answer = parts[2];

  ctx.session.answers[stepId] = answer;
  await updateUser(ctx.from.id, {
    currentStep: stepId,
    tempAnswers: JSON.stringify(ctx.session.answers),
  });
  await ctx.answerCallbackQuery();

  const currentIndex = STEPS.findIndex((s) => s.id === stepId);
  if (currentIndex >= STEPS.length - 1) {
    await showSummary(ctx);
    return;
  }

  const nextStep = STEPS[currentIndex + 1];
  ctx.session.step = nextStep.id;
  await askQuestion(ctx, nextStep);
}

async function handleEdit(ctx) {
  const data = ctx.callbackQuery.data;
  const stepId = parseInt(data.split(":")[1]);
  const step = STEPS.find((s) => s.id === stepId);

  if (!step) {
    await ctx.answerCallbackQuery("مرحله نامعتبر");
    return;
  }

  ctx.session.step = stepId;
  await ctx.answerCallbackQuery();
  await askQuestion(ctx, step);
}

async function handleTextInput(ctx) {
  const currentStepId = ctx.session.step;
  const step = STEPS.find((s) => s.id === currentStepId);

  if (!step) {
    await ctx.reply("⚠️ خطا. لطفاً /start کنید.");
    ctx.session.step = 0;
    return;
  }

  const userInput = ctx.message.text;
  if (!userInput || userInput.trim().length === 0) {
    await ctx.reply("⚠️ لطفاً یک پاسخ معتبر وارد کنید.");
    return;
  }

  const sanitized = userInput.trim().substring(0, 500);

  if (step.type === "number") {
    const num = parseInt(sanitized);
    const min = step.min || 0;
    const max = step.max || 999999;
    if (isNaN(num)) {
      await ctx.reply("⚠️ لطفاً یک عدد معتبر وارد کنید.");
      return;
    }
    if (num < min || num > max) {
      await ctx.reply(`⚠️ لطفاً عدد بین ${min} تا ${max} وارد کنید.`);
      return;
    }
    ctx.session.answers[currentStepId] = num;
  } else if (step.type === "text") {
    if (sanitized.length < 2) {
      await ctx.reply("⚠️ پاسخ باید حداقل ۲ کاراکتر باشد.");
      return;
    }
    ctx.session.answers[currentStepId] = sanitized;
  } else {
    await ctx.reply("⚠️ لطفاً از دکمه‌ها استفاده کنید.");
    return;
  }

  await updateUser(ctx.from.id, {
    currentStep: currentStepId,
    tempAnswers: JSON.stringify(ctx.session.answers),
  });

  const currentIndex = STEPS.findIndex((s) => s.id === currentStepId);
  if (currentIndex >= STEPS.length - 1) {
    await showSummary(ctx);
    return;
  }

  const nextStep = STEPS[currentIndex + 1];
  ctx.session.step = nextStep.id;
  await askQuestion(ctx, nextStep);
}

async function showSummary(ctx) {
  let text = `📋 *خلاصه پاسخ‌های شما*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  STEPS.forEach((step) => {
    const answer = ctx.session.answers[step.id];
    if (answer !== undefined && answer !== null) {
      text += `${step.emoji} *${step.shortTitle}:*\n`;
      if (step.type === "choice" && step.options) {
        const option = step.options.find((o) => o.value === answer);
        text += `  ➜ ${option ? option.label : answer}\n\n`;
      } else {
        text += `  ➜ ${answer}\n\n`;
      }
    }
  });

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✅ آیا اطلاعات صحیح است؟`;

  const kb = confirmationKB();
  await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleConfirm(ctx) {
  await ctx.answerCallbackQuery("⏳ در حال تولید گزارش...");

  const score = calcScore(ctx.session.answers);
  const riskLevel = getRiskLevel(score);
  const report = generateReport(ctx.session.answers, score, riskLevel);

  try {
    await saveConsultation({
      userId: String(ctx.from.id),
      electionType: ctx.session.answers[1] || "نامشخص",
      region: ctx.session.answers[2] || null,
      answers: JSON.stringify(ctx.session.answers),
      score: score,
      riskLevel: riskLevel,
      finalReport: report,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "free",
    });
  } catch (e) {
    console.error("خطا در ذخیره:", e);
  }

  ctx.session.step = 0;
  ctx.session.answers = {};
  await updateUser(ctx.from.id, { currentStep: null, tempAnswers: "{}" });

  // ارسال گزارش تحلیلی
  await ctx.reply(report, { parse_mode: "Markdown", reply_markup: mainMenuKB() });

  // پیام تشویقی
  await ctx.reply(
    `🎉 *گزارش آماده شد!*\n\n` +
      `برای دریافت تحلیل‌های عمیق‌تر، مشاوره تخصصی و ابزارهای پیشرفته کمپین،\n` +
      `بسته‌های ویژه ما را بررسی کنید. 👆`,
    { parse_mode: "Markdown" }
  );
}

async function handleReset(ctx) {
  ctx.session.step = 0;
  ctx.session.answers = {};
  await updateUser(ctx.from.id, { currentStep: null, tempAnswers: "{}" });
  await ctx.answerCallbackQuery("🔄 ریست شد");
  await ctx.reply("🔄 مشاوره لغو شد.\n\nبرای شروع مجدد از منو استفاده کنید.", {
    reply_markup: mainMenuKB(),
  });
}

module.exports = {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleConfirm,
  handleReset,
  handleTextInput,
};
