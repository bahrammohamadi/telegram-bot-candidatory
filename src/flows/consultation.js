// ============================================================
// 🧠 فلو مشاوره ۳۰ مرحله‌ای
// ============================================================

import { STEPS, TOTAL_STEPS } from "../constants/questions.js";
import {
  getOrCreateUser,
  updateUser,
  saveConsultation,
  upsertLead,
} from "../utils/db.js";
import {
  calcScore,
  getRiskLevel,
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

// پارس امن JSON
function safeParse(str) {
  try { return JSON.parse(str || "{}"); } catch { return {}; }
}

// ============================================================
// 🟢 شروع مشاوره
// ============================================================
export async function handleStartConsultation(ctx) {
  await getOrCreateUser(ctx.from);

  await updateUser(ctx.from.id, {
    currentStep: 0,
    tempAnswers: JSON.stringify({}),
  });

  const step = STEPS[0];
  if (step.type === "text") {
    await ctx.editMessageText(step.question, {
      parse_mode: "Markdown",
      reply_markup: textStepKB(),
    });
  } else {
    await ctx.editMessageText(step.question, {
      parse_mode: "Markdown",
      reply_markup: stepKB(0),
    });
  }
}

// ============================================================
// ❌ انصراف
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
// 📝 جواب inline — ans_X_Y
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
  answers[step.key] = opt.data;

  const currentStep = user.currentStep ?? 0;
  const isEditing = currentStep >= 1000;

  if (isEditing) {
    // پیدا کردن سوال بعدی در همین بخش
    const editingSection = STEPS[currentStep - 1000]?.section;
    const nextInSection = findNextInSection(stepIdx, editingSection);

    if (nextInSection !== null) {
      // هنوز سوال‌های این بخش مونده
      await updateUser(ctx.from.id, {
        currentStep: 1000 + nextInSection,
        tempAnswers: JSON.stringify(answers),
      });

      const ns = STEPS[nextInSection];
      if (ns.type === "text") {
        await ctx.editMessageText(ns.question, {
          parse_mode: "Markdown",
          reply_markup: editCancelKB(),
        });
      } else {
        await ctx.editMessageText(ns.question, {
          parse_mode: "Markdown",
          reply_markup: stepKB(nextInSection),
        });
      }
    } else {
      // بخش تمام شد → خلاصه
      await updateUser(ctx.from.id, {
        currentStep: 999,
        tempAnswers: JSON.stringify(answers),
      });

      const sc = calcScore(answers);
      await ctx.editMessageText(buildSummaryText(answers, sc), {
        parse_mode: "Markdown",
        reply_markup: summaryKB(),
      });
    }

    await ctx.answerCallbackQuery("✅ ثبت شد");
    return;
  }

  // حالت عادی — مرحله بعد
  const next = stepIdx + 1;

  if (next < TOTAL_STEPS) {
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
    // همه تمام → خلاصه
    await updateUser(ctx.from.id, {
      currentStep: 999,
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
// ✏️ ویرایش بخش — edit_section_X
// ============================================================
export async function handleEditSection(ctx, sectionKey) {
  const firstIdx = STEPS.findIndex((s) => s.section === sectionKey);
  if (firstIdx < 0) {
    await ctx.answerCallbackQuery("❌ بخش پیدا نشد");
    return;
  }

  await updateUser(ctx.from.id, {
    currentStep: 1000 + firstIdx,
  });

  const step = STEPS[firstIdx];
  const title = `✏️ *ویرایش ${step.question}`;

  if (step.type === "text") {
    await ctx.editMessageText(step.question, {
      parse_mode: "Markdown",
      reply_markup: editCancelKB(),
    });
  } else {
    await ctx.editMessageText(step.question, {
      parse_mode: "Markdown",
      reply_markup: stepKB(firstIdx),
    });
  }

  await ctx.answerCallbackQuery();
}

// ============================================================
// ↩️ برگشت به خلاصه
// ============================================================
export async function handleBackToSummary(ctx) {
  const user = await getOrCreateUser(ctx.from);
  const answers = safeParse(user.tempAnswers);

  await updateUser(ctx.from.id, { currentStep: 999 });

  const sc = calcScore(answers);
  await ctx.editMessageText(buildSummaryText(answers, sc), {
    parse_mode: "Markdown",
    reply_markup: summaryKB(),
  });
  await ctx.answerCallbackQuery();
}

// ============================================================
// ✅ تایید نهایی
// ============================================================
export async function handleConfirm(ctx) {
  const user = await getOrCreateUser(ctx.from);
  const answers = safeParse(user.tempAnswers);

  const score = calcScore(answers);
  const risk = getRiskLevel(score);
  const report = generateReport(score, answers);
  const lt = getLeadTemp(score);

  // ذخیره
  await saveConsultation({
    userId: String(ctx.from.id),
    fullName: answers.fullName || "",
    electionType: answers.politicalAffiliation || "",
    region: answers.region || "",
    answers: answers,
    score: score,
    riskLevel: risk,
    finalReport: report,
  });

  await upsertLead(ctx.from.id, {
    leadTemperature: lt,
    purchasedPlan: "none",
    notes: JSON.stringify({
      lastScore: score,
      fullName: answers.fullName,
      region: answers.region,
    }),
  });

  // ریست
  await updateUser(ctx.from.id, {
    currentStep: 0,
    tempAnswers: JSON.stringify({}),
  });

  await ctx.editMessageText(
    "✅ *تحلیل با موفقیت انجام شد!*\n\nگزارش در پیام بعدی...",
    { parse_mode: "Markdown" }
  );

  await ctx.reply(report, {
    parse_mode: "Markdown",
    reply_markup: afterReportKB(),
  });

  await ctx.answerCallbackQuery("✅ گزارش آماده شد!");
}

// ============================================================
// 💬 پیام متنی
// ============================================================
export async function handleTextInput(ctx, mainMenuKB, MENU_TEXT) {
  const text = ctx.message.text.trim();
  const from = ctx.from;
  const user = await getOrCreateUser(from);
  const cs = user.currentStep ?? 0;

  let realIdx;
  let isEditing = false;

  if (cs >= 1000) {
    realIdx = cs - 1000;
    isEditing = true;
  } else if (cs >= 0 && cs < TOTAL_STEPS) {
    realIdx = cs;
  } else {
    await ctx.reply(MENU_TEXT, {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
    return;
  }

  const step = STEPS[realIdx];

  if (!step || step.type !== "text") {
    await ctx.reply("⚠️ لطفاً از دکمه‌های زیر پیام قبلی استفاده کنید.");
    return;
  }

  if (text.length < 2) {
    await ctx.reply("⚠️ حداقل *۲ حرف* وارد کنید.", { parse_mode: "Markdown" });
    return;
  }
  if (text.length > 500) {
    await ctx.reply("⚠️ حداکثر *۵۰۰ حرف* مجاز است.", { parse_mode: "Markdown" });
    return;
  }

  const answers = safeParse(user.tempAnswers);
  answers[step.key] = text;

  if (isEditing) {
    const editingSection = step.section;
    const nextInSection = findNextInSection(realIdx, editingSection);

    if (nextInSection !== null) {
      await updateUser(from.id, {
        currentStep: 1000 + nextInSection,
        tempAnswers: JSON.stringify(answers),
      });

      const ns = STEPS[nextInSection];
      if (ns.type === "text") {
        await ctx.reply(ns.question, {
          parse_mode: "Markdown",
          reply_markup: editCancelKB(),
        });
      } else {
        await ctx.reply(ns.question, {
          parse_mode: "Markdown",
          reply_markup: stepKB(nextInSection),
        });
      }
    } else {
      await updateUser(from.id, {
        currentStep: 999,
        tempAnswers: JSON.stringify(answers),
      });

      const sc = calcScore(answers);
      await ctx.reply(buildSummaryText(answers, sc), {
        parse_mode: "Markdown",
        reply_markup: summaryKB(),
      });
    }
    return;
  }

  // عادی → بعدی
  const next = realIdx + 1;

  if (next < TOTAL_STEPS) {
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
    await updateUser(from.id, {
      currentStep: 999,
      tempAnswers: JSON.stringify(answers),
    });

    const sc = calcScore(answers);
    await ctx.reply(buildSummaryText(answers, sc), {
      parse_mode: "Markdown",
      reply_markup: summaryKB(),
    });
  }
}

// ============================================================
// 🔧 کمکی: پیدا کردن سوال بعدی در همون بخش
// ============================================================
function findNextInSection(currentIdx, section) {
  for (let i = currentIdx + 1; i < TOTAL_STEPS; i++) {
    if (STEPS[i].section === section) return i;
  }
  return null;
}
