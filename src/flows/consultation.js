// src/flows/consultation.js — نسخه 2.0
// ═══════════════════════════════════════════════════════════════
// ✅ بهبودیافته: Input Validation + Sanitization
// ✅ بهبودیافته: Progress Indicator
// ✅ بهبودیافته: UX بهتر
// ✅ پاکسازی‌شده از کدهای تکراری
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const { STEPS, TOTAL_STEPS, STEP_EMOJIS } = require("../constants/questions.js");
const { calcScore, generateReport, getRiskLevel } = require("../utils/score.js");
const { saveConsultation, updateUser } = require("../utils/db.js");
const { stepKeyboard, confirmationKB, mainMenuKB } = require("../utils/keyboard.js");

// ═══════════════════════════════════════════════════════════════
// شروع مشاوره
// ═══════════════════════════════════════════════════════════════
async function handleStartConsultation(ctx) {
  // ریست session
  ctx.session.step = 0;
  ctx.session.answers = {};

  await updateUser(ctx.from.id, {
    currentStep: 0,
    tempAnswers: "{}",
  });

  // شروع از مرحله اول
  const firstStep = STEPS[0];
  ctx.session.step = firstStep.id;

  await askQuestion(ctx, firstStep);
  
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
  }
}

// ═══════════════════════════════════════════════════════════════
// پرسیدن یک سؤال
// ═══════════════════════════════════════════════════════════════
async function askQuestion(ctx, step) {
  const currentIndex = STEPS.findIndex((s) => s.id === step.id);
  const progress = Math.round(((currentIndex + 1) / TOTAL_STEPS) * 100);

  // ساخت Progress Bar
  const barLength = 10;
  const filledLength = Math.round((progress / 100) * barLength);
  const emptyLength = barLength - filledLength;
  const progressBar = "█".repeat(filledLength) + "░".repeat(emptyLength);

  // ساخت متن سؤال
  let text = `${step.emoji || "📝"} *مرحله ${currentIndex + 1} از ${TOTAL_STEPS}*\n`;
  text += `${progressBar} ${progress}%\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `*${step.question}*\n\n`;

  // اگر راهنما دارد
  if (step.hint) {
    text += `💡 ${step.hint}\n\n`;
  }

  // اگر نوع text یا number است
  if (step.type === "text" || step.type === "number") {
    text += "✏️ لطفاً پاسخ خود را تایپ کنید:";
  }

  const kb = stepKeyboard(step.id);

  // ارسال پیام
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    }
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: kb,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// دریافت پاسخ (از دکمه‌ها)
// ═══════════════════════════════════════════════════════════════
async function handleAnswer(ctx) {
  const data = ctx.callbackQuery.data; // مثال: "answer:step1:yes"
  const parts = data.split(":");
  
  if (parts.length < 3) {
    await ctx.answerCallbackQuery("❌ خطا در پردازش پاسخ");
    return;
  }

  const stepId = parseInt(parts[1]);
  const answer = parts[2];

  // ذخیره پاسخ
  ctx.session.answers[stepId] = answer;

  // آپدیت دیتابیس
  await updateUser(ctx.from.id, {
    currentStep: stepId,
    tempAnswers: JSON.stringify(ctx.session.answers),
  });

  await ctx.answerCallbackQuery();

  // یافتن مرحله فعلی
  const currentIndex = STEPS.findIndex((s) => s.id === stepId);

  // اگر آخرین مرحله بود
  if (currentIndex >= STEPS.length - 1) {
    await showSummary(ctx);
    return;
  }

  // رفتن به مرحله بعدی
  const nextStep = STEPS[currentIndex + 1];
  ctx.session.step = nextStep.id;

  await askQuestion(ctx, nextStep);
}

// ═══════════════════════════════════════════════════════════════
// ویرایش یک مرحله
// ═══════════════════════════════════════════════════════════════
async function handleEdit(ctx) {
  const data = ctx.callbackQuery.data; // مثال: "edit_step:step1"
  const stepId = parseInt(data.split(":")[1]);

  const step = STEPS.find((s) => s.id === stepId);

  if (!step) {
    await ctx.answerCallbackQuery("❌ مرحله نامعتبر");
    return;
  }

  // تنظیم session
  ctx.session.step = stepId;

  await ctx.answerCallbackQuery();
  await askQuestion(ctx, step);
}

// ═══════════════════════════════════════════════════════════════
// ✅ بهبودیافته: دریافت پاسخ متنی
// ═══════════════════════════════════════════════════════════════
async function handleTextInput(ctx) {
  const currentStepId = ctx.session.step;
  const step = STEPS.find((s) => s.id === currentStepId);

  if (!step) {
    await ctx.reply("❌ خطا: مرحله نامعتبر است. لطفاً /start کنید.");
    ctx.session.step = 0;
    return;
  }

  const userInput = ctx.message.text;

  // ✅ Validation: خالی نباشد
  if (!userInput || userInput.trim().length === 0) {
    await ctx.reply("⚠️ لطفاً یک پاسخ معتبر وارد کنید.");
    return;
  }

  // ✅ Sanitization: حداکثر 500 کاراکتر
  const sanitizedInput = userInput.trim().substring(0, 500);

  // ✅ اعتبارسنجی بر اساس نوع سؤال
  if (step.type === "number") {
    const num = parseInt(sanitizedInput);
    const min = step.min || 0;
    const max = step.max || 999999;

    if (isNaN(num)) {
      await ctx.reply(`⚠️ لطفاً یک عدد معتبر وارد کنید.`);
      return;
    }

    if (num < min || num > max) {
      await ctx.reply(`⚠️ لطفاً یک عدد بین ${min.toLocaleString('fa-IR')} تا ${max.toLocaleString('fa-IR')} وارد کنید.`);
      return;
    }

    ctx.session.answers[currentStepId] = num;
  } else if (step.type === "text") {
    // حداقل 3 کاراکتر برای متن
    if (sanitizedInput.length < 3) {
      await ctx.reply("⚠️ پاسخ شما باید حداقل 3 کاراکتر باشد.");
      return;
    }

    ctx.session.answers[currentStepId] = sanitizedInput;
  } else {
    // اگر سؤال از نوع choice یا scale بود که نباید به اینجا برسد
    await ctx.reply("⚠️ لطفاً از دکمه‌ها استفاده کنید.");
    return;
  }

  // ✅ آپدیت دیتابیس
  await updateUser(ctx.from.id, {
    currentStep: currentStepId,
    tempAnswers: JSON.stringify(ctx.session.answers),
  });

  // یافتن ایندکس فعلی
  const currentIndex = STEPS.findIndex((s) => s.id === currentStepId);

  // ✅ اگر آخرین مرحله بود
  if (currentIndex >= STEPS.length - 1) {
    await showSummary(ctx);
    return;
  }

  // ✅ رفتن به مرحله بعدی
  const nextStep = STEPS[currentIndex + 1];
  ctx.session.step = nextStep.id;

  await askQuestion(ctx, nextStep);
}

// ═══════════════════════════════════════════════════════════════
// نمایش خلاصه پاسخ‌ها
// ═══════════════════════════════════════════════════════════════
async function showSummary(ctx) {
  let text = "📋 *خلاصه پاسخ‌های شما*\n";
  text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  // نمایش تمام پاسخ‌ها
  STEPS.forEach((step) => {
    const answer = ctx.session.answers[step.id];
    
    if (answer !== undefined && answer !== null) {
      text += `${step.emoji || "•"} *${step.shortTitle || step.question}*\n`;
      
      // اگر پاسخ از نوع choice بود، لیبل را نمایش بده
      if (step.type === "choice" && step.options) {
        const option = step.options.find((o) => o.value === answer);
        text += `   ➜ ${option ? option.label : answer}\n\n`;
      } else {
        text += `   ➜ ${answer}\n\n`;
      }
    }
  });

  text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  text += "✅ آیا اطلاعات صحیح است؟\n\n";
  text += "با تأیید، گزارش تحلیلی شما آماده می‌شود.";

  const kb = confirmationKB();

  await ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: kb,
  });
}

// ═══════════════════════════════════════════════════════════════
// تأیید نهایی و تولید گزارش
// ═══════════════════════════════════════════════════════════════
async function handleConfirm(ctx) {
  await ctx.answerCallbackQuery("⏳ در حال تولید گزارش...");

  // محاسبه امتیاز
  const score = calcScore(ctx.session.answers);
  const riskLevel = getRiskLevel(score);
  
  // تولید گزارش
  const report = generateReport(ctx.session.answers, score, riskLevel);

  // ذخیره در دیتابیس
  try {
    await saveConsultation({
      userId: String(ctx.from.id),
      electionType: ctx.session.answers[1] || "نامشخص", // step 1 = نوع انتخابات
      region: ctx.session.answers[2] || null, // step 2 = منطقه
      answers: JSON.stringify(ctx.session.answers),
      score: score,
      riskLevel: riskLevel,
      finalReport: report,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "free", // وضعیت اشتراک
    });

    console.log(`✅ Consultation saved for user ${ctx.from.id}`);
  } catch (e) {
    console.error("❌ خطا در ذخیره consultation:", e);
  }

  // ریست session
  ctx.session.step = 0;
  ctx.session.answers = {};

  await updateUser(ctx.from.id, {
    currentStep: null,
    tempAnswers: "{}",
  });

  // ارسال گزارش
  await ctx.reply(report, {
    parse_mode: "Markdown",
    reply_markup: mainMenuKB(),
  });

  // پیام تشویقی
  await ctx.reply(
    "🎉 *گزارش شما آماده شد!*\n\n" +
      "برای دریافت تحلیل‌های پیشرفته‌تر و دسترسی به ابزارهای حرفه‌ای، " +
      "بسته‌های ویژه ما را بررسی کنید.\n\n" +
      "💼 /start > بسته‌های خدماتی",
    { parse_mode: "Markdown" }
  );
}

// ═══════════════════════════════════════════════════════════════
// ریست مشاوره (شروع مجدد)
// ═══════════════════════════════════════════════════════════════
async function handleReset(ctx) {
  ctx.session.step = 0;
  ctx.session.answers = {};

  await updateUser(ctx.from.id, {
    currentStep: null,
    tempAnswers: "{}",
  });

  await ctx.answerCallbackQuery("✅ اطلاعات پاک شد");

  await ctx.reply(
    "🔄 مشاوره لغو شد.\n\n" +
      "برای شروع مجدد از منو استفاده کنید.",
    { reply_markup: mainMenuKB() }
  );
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════
module.exports = {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleConfirm,
  handleReset,
  handleTextInput,
};
