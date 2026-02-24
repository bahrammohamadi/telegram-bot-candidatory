// ============================================================
// 🧠 فلو مشاوره ۶ مرحله‌ای
// تمام هندلرهای مربوط به فرآیند مشاوره
// ============================================================

import { STEPS } from "../constants/questions.js";
import {
  getOrCreateUser,
  updateUser,
  saveConsultation,
  upsertLead,
} from "../utils/db.js";
import {
  calcScore,
  getRiskLevel,
  riskLabel,
  getLeadTemp,
  generateReport,
} from "../utils/score.js";
import {
  stepKB,
  textStepKB,
  summaryKB,
  editCancelKB,
  afterReportKB,
  buildSummaryText,
} from "../utils/keyboard.js";

/**
 * پارس امن JSON
 */
function safeParse(str) {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}

// ============================================================
// شروع مشاوره
// ============================================================
export async function handleStartConsultation(ctx) {
  const from = ctx.from;
  const user = await getOrCreateUser(from);

  // ریست state
  await updateUser(from.id, {
    currentStep: 0,
    tempAnswers: JSON.stringify({}),
  });

  // نمایش سوال اول
  const step = STEPS[0];
  await ctx.editMessageText(step.question, {
    parse_mode: "Markdown",
    reply_markup: stepKB(0),
  });
}

// ============================================================
// انصراف مشاوره
// ============================================================
export async function handleCancelConsultation(ctx, mainMenuKB, MENU_TEXT) {
  await updateUser(ctx.from.id, {
    currentStep: 0,
    tempAnswers: JSON.stringify({}),
  });

  await ctx.editMessageText(MENU_TEXT, {
    parse_mode: "Markdown",
    reply_markup: mainMenuKB(),
  });
}

// ============================================================
// دریافت جواب inline — callback: ans_X_Y
// ============================================================
export async function handleAnswer(ctx, stepIdx, optIdx) {
  const step = STEPS[stepIdx];
  const opt = step.options[optIdx];
  if (!opt) {
    await ctx.answerCallbackQuery("❌ گزینه نامعتبر");
    return;
  }

  const user = await getOrCreateUser(ctx.from);
  const answers = safeParse(user.tempAnswers);

  // ذخیره جواب
  answers[step.key] = opt.data;

  // بررسی حالت ویرایش
  const currentStep = user.currentStep ?? 0;
  const isEditing = currentStep >= 100; // مراحل ۱۰۰+ = حالت ویرایش

  if (isEditing) {
    // برگشت به خلاصه
    await updateUser(ctx.from.id, {
      currentStep: 99, // ← 99 = صفحه خلاصه
      tempAnswers: JSON.stringify(answers),
    });

    const sc = calcScore(answers);
    await ctx.editMessageText(buildSummaryText(answers, sc), {
      parse_mode: "Markdown",
      reply_markup: summaryKB(),
    });
    await ctx.answerCallbackQuery("✅ ویرایش ثبت شد");
    return;
  }

  // حالت عادی — مرحله بعد
  const next = stepIdx + 1;

  if (next < STEPS.length) {
    await updateUser(ctx.from.id, {
      currentStep: next,
      tempAnswers: JSON.stringify(answers),
    });

    const ns = STEPS[next];
    if (ns.type === "text") {
      await ctx.editMessageText(ns.question, {
        parse_mode: "Markdown",
        reply_markup: textStepKB(),
      });
    } else {
      await ctx.editMessageText(ns.question, {
        parse_mode: "Markdown",
        reply_markup: stepKB(next),
      });
    }
  } else {
    // همه مراحل تمام → خلاصه
    await updateUser(ctx.from.id, {
      currentStep: 99,
      tempAnswers: JSON.stringify(answers),
    });

    const sc = calcScore(answers);
    await ctx.editMessageText(buildSummaryText(answers, sc), {
      parse_mode: "Markdown",
      reply_markup: summaryKB(),
    });
  }

  await ctx.answerCallbackQuery();
}

// ============================================================
// ویرایش مرحله — callback: edit_X
// ============================================================
export async function handleEdit(ctx, stepIdx) {
  const step = STEPS[stepIdx];

  // currentStep = 100 + stepIdx → مشخص‌کننده حالت ویرایش
  await updateUser(ctx.from.id, {
    currentStep: 100 + stepIdx,
  });

  const title = `✏️ *ویرایش مرحله ${stepIdx + 1}*\n\n${step.question}`;

  if (step.type === "text") {
    await ctx.editMessageText(title, {
      parse_mode: "Markdown",
      reply_markup: editCancelKB(),
    });
  } else {
    await ctx.editMessageText(title, {
      parse_mode: "Markdown",
      reply_markup: stepKB(stepIdx),
    });
  }

  await ctx.answerCallbackQuery();
}

// ============================================================
// انصراف از ویرایش — برگشت به خلاصه
// ============================================================
export async function handleBackToSummary(ctx) {
  const user = await getOrCreateUser(ctx.from);
  const answers = safeParse(user.tempAnswers);

  await updateUser(ctx.from.id, { currentStep: 99 });

  const sc = calcScore(answers);
  await ctx.editMessageText(buildSummaryText(answers, sc), {
    parse_mode: "Markdown",
    reply_markup: summaryKB(),
  });
  await ctx.answerCallbackQuery();
}

// ============================================================
// تایید نهایی — محاسبه + ذخیره + گزارش
// ============================================================
export async function handleConfirm(ctx) {
  const user = await getOrCreateUser(ctx.from);
  const answers = safeParse(user.tempAnswers);

  // محاسبه امتیاز
  const score = calcScore(answers);
  const risk = getRiskLevel(score);
  const report = generateReport(score, answers);
  const lt = getLeadTemp(score);

  // ذخیره در consultations
  await saveConsultation({
    userId: String(ctx.from.id),
    electionType: answers.electionType || "",
    region: answers.region || "",
    answers: answers, // ← تابع db.js خودش JSON.stringify می‌کند
    score: score,
    riskLevel: risk,
    finalReport: report,
  });

  // بروزرسانی لید
  await upsertLead(ctx.from.id, {
    leadTemperature: lt,
    purchasedPlan: "none",
    notes: JSON.stringify({
      lastScore: score,
      lastElection: answers.electionType,
    }),
  });

  // ریست state کاربر
  await updateUser(ctx.from.id, {
    currentStep: 0,
    tempAnswers: JSON.stringify({}),
  });

  // ارسال نتیجه
  await ctx.editMessageText(
    "✅ *تحلیل با موفقیت انجام شد!*\n\nگزارش شما در پیام بعدی ارسال می‌شود...",
    { parse_mode: "Markdown" }
  );

  await ctx.reply(report, {
    parse_mode: "Markdown",
    reply_markup: afterReportKB(),
  });

  await ctx.answerCallbackQuery("✅ گزارش آماده شد!");
}

// ============================================================
// دریافت پیام متنی (مرحله حوزه انتخابیه یا ویرایش متنی)
// ============================================================
export async function handleTextInput(ctx, mainMenuKB, MENU_TEXT) {
  const text = ctx.message.text.trim();
  const from = ctx.from;
  const user = await getOrCreateUser(from);
  const cs = user.currentStep ?? 0;

  // مشخص کردن ایندکس واقعی مرحله
  let realIdx;
  let isEditing = false;

  if (cs >= 100) {
    // حالت ویرایش
    realIdx = cs - 100;
    isEditing = true;
  } else if (cs >= 0 && cs < STEPS.length) {
    realIdx = cs;
  } else {
    // کاربر در مشاوره نیست → منو
    await ctx.reply(MENU_TEXT, {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
    return;
  }

  const step = STEPS[realIdx];

  // فقط مراحل متنی قبول
  if (!step || step.type !== "text") {
    await ctx.reply("⚠️ لطفاً از دکمه‌های زیر پیام قبلی استفاده کنید.");
    return;
  }

  // اعتبارسنجی
  if (text.length < 2) {
    await ctx.reply("⚠️ لطفاً حداقل ۲ حرف وارد کنید.");
    return;
  }
  if (text.length > 100) {
    await ctx.reply("⚠️ حداکثر ۱۰۰ حرف مجاز است.");
    return;
  }

  // ذخیره
  const answers = safeParse(user.tempAnswers);
  answers[step.key] = text;

  if (isEditing) {
    // برگشت به خلاصه
    await updateUser(from.id, {
      currentStep: 99,
      tempAnswers: JSON.stringify(answers),
    });

    const sc = calcScore(answers);
    await ctx.reply(buildSummaryText(answers, sc), {
      parse_mode: "Markdown",
      reply_markup: summaryKB(),
    });
    return;
  }

  // مرحله بعد
  const next = realIdx + 1;

  if (next < STEPS.length) {
    await updateUser(from.id, {
      currentStep: next,
      tempAnswers: JSON.stringify(answers),
    });

    const ns = STEPS[next];
    if (ns.type === "text") {
      await ctx.reply(ns.question, {
        parse_mode: "Markdown",
        reply_markup: textStepKB(),
      });
    } else {
      await ctx.reply(ns.question, {
        parse_mode: "Markdown",
        reply_markup: stepKB(next),
      });
    }
  } else {
    // خلاصه
    await updateUser(from.id, {
      currentStep: 99,
      tempAnswers: JSON.stringify(answers),
    });

    const sc = calcScore(answers);
    await ctx.reply(buildSummaryText(answers, sc), {
      parse_mode: "Markdown",
      reply_markup: summaryKB(),
    });
  }
}