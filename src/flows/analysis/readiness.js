// src/flows/analysis/readiness.js — CommonJS
// ─── ارزیابی آمادگی کاندیداتوری (۹ مرحله) ───

const { STEPS, TOTAL_STEPS } = require("../../constants/questions.js");
const { calcScore, generateReport, getRiskLevel } = require("../../utils/score.js");
const { getOrCreateUser, updateUser, saveConsultation, upsertLead } = require("../../utils/db.js");
const {
  stepChoiceKB,
  stepTextKB,
  summaryKB,
  afterReportKB,
  progressText,
  mainMenuKB,
} = require("../../utils/keyboard.js");

// ثابت‌های وضعیت
const ST_SUMMARY = 99;
const ST_DONE    = 200;

// ═══════════════════════════════════════════
// اعتبارسنجی ورودی
// ═══════════════════════════════════════════
function validateInput(text, type, customMessage = null) {
  const t = text.trim();

  switch (type) {
    case "national_id": {
      const c = t.replace(/[\s\-]/g, "");
      if (!/^\d{10}$/.test(c))
        return { ok: false, err: customMessage || "❌ کد ملی باید دقیقاً ۱۰ رقم باشد.\nمثال: `0012345678`" };
      if (/^(\d)\1{9}$/.test(c))
        return { ok: false, err: customMessage || "❌ کد ملی نامعتبر است (تکراری)." };
      return { ok: true, val: c };
    }

    case "phone": {
      let c = t.replace(/[\s\-\+]/g, "");
      if (c.startsWith("98") && c.length === 12) c = "0" + c.substring(2);
      if (!/^09\d{9}$/.test(c))
        return { ok: false, err: customMessage || "❌ شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.\nمثال: `09121234567`" };
      return { ok: true, val: c };
    }

    case "min_5":
      if (t.length < 5)
        return { ok: false, err: customMessage || "❌ لطفاً حداقل ۵ کاراکتر وارد کنید." };
      return { ok: true, val: t };

    default:
      if (t.length < 1)
        return { ok: false, err: customMessage || "❌ لطفاً مقداری وارد کنید." };
      return { ok: true, val: t };
  }
}

// ═══════════════════════════════════════════
// نمایش یک مرحله
// ═══════════════════════════════════════════
async function showStep(ctx, userId, idx) {
  if (idx < 0 || idx >= TOTAL_STEPS) return;

  const step = STEPS[idx];
  await updateUser(userId, { currentStep: idx });

  let text = `${progressText(idx)}\n\n*${step.title}*\n━━━━━━━━━━━━━━━━━━━\n\n${step.question}`;
  if (step.type === "text" && step.placeholder) {
    text += `\n\n💬 _${step.placeholder}_`;
  }

  const kb = step.type === "choice" ? stepChoiceKB(idx) : stepTextKB(idx);

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
// شروع ارزیابی
// ═══════════════════════════════════════════
async function handleStartConsultation(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  let existing = {};
  try { existing = JSON.parse(user.tempAnswers || "{}"); } catch { existing = {}; }

  // اگر اطلاعات هویتی قبلاً ثبت شده، رد شو
  let startIdx = 0;
  if (user.nationalId && user.phone) {
    existing.national_id = user.nationalId;
    existing.phone       = user.phone;
    startIdx = 2;
  } else if (user.nationalId) {
    existing.national_id = user.nationalId;
    startIdx = 1;
  }

  await updateUser(userId, {
    currentStep:        startIdx,
    tempAnswers:        JSON.stringify(existing),
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  if (startIdx === 0) {
    await ctx.reply(
      "🚀 *ارزیابی آمادگی کاندیداتوری*\n" +
      "━━━━━━━━━━━━━━━━━━━\n\n" +
      "📋 ۹ مرحله ساده\n" +
      "⏱️ زمان تقریبی: ۳ تا ۵ دقیقه\n" +
      "📊 در پایان گزارش جامع دریافت می‌کنید.\n\n" +
      "بزن بریم! 👇",
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      `✅ اطلاعات هویتی شما قبلاً ثبت شده.\nاز مرحله ${startIdx + 1} ادامه می‌دهیم...`,
      { parse_mode: "Markdown" }
    );
  }

  await showStep(ctx, userId, startIdx);
}

// ═══════════════════════════════════════════
// پاسخ گزینه‌ای (ans:step:value)
// ═══════════════════════════════════════════
async function handleAnswer(ctx, stepIndex, value) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  const step = STEPS[stepIndex];
  if (step) answers[step.id] = value;

  await updateUser(userId, {
    tempAnswers:        JSON.stringify(answers),
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  await ctx.answerCallbackQuery({ text: `✅ ${step?.title || "گزینه"} ثبت شد` });

  // اگر در حال ویرایش بودیم، برگرد به خلاصه
  const isEditing = user.currentStep >= 100 && user.currentStep < ST_DONE;
  if (isEditing) {
    return await showSummary(ctx, userId, answers);
  }

  const next = stepIndex + 1;
  if (next < TOTAL_STEPS) {
    await showStep(ctx, userId, next);
  } else {
    await showSummary(ctx, userId, answers);
  }
}

// ═══════════════════════════════════════════
// ورودی متنی
// ═══════════════════════════════════════════
async function handleTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  if (
    user.currentStep === undefined ||
    user.currentStep === null ||
    user.currentStep === ST_DONE ||
    user.currentStep === ST_SUMMARY
  ) return false;

  // فقط مراحل ۰ تا TOTAL_STEPS-1 و حالت ویرایش (100+)
  let stepIdx;
  let isEditing = false;

  if (user.currentStep >= 100 && user.currentStep < ST_DONE) {
    stepIdx   = user.currentStep - 100;
    isEditing = true;
  } else if (user.currentStep >= 0 && user.currentStep < TOTAL_STEPS) {
    stepIdx = user.currentStep;
  } else {
    return false;
  }

  const step = STEPS[stepIdx];
  if (!step || step.type !== "text") return false;

  const input = ctx.message.text.trim();
  const v     = validateInput(input, step.validation, step.validationMessage);

  if (!v.ok) {
    await ctx.reply(v.err, { parse_mode: "Markdown" });
    return true;
  }

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  answers[step.id] = v.val;

  const upd = {
    tempAnswers:        JSON.stringify(answers),
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  };

  if (step.id === "national_id") upd.nationalId = v.val;
  else if (step.id === "phone")  upd.phone      = v.val;

  await updateUser(userId, upd);
  await ctx.reply(`✅ *${step.title}* ثبت شد.`, { parse_mode: "Markdown" });

  if (isEditing) {
    await showSummary(ctx, userId, answers);
  } else {
    const next = stepIdx + 1;
    if (next < TOTAL_STEPS) {
      await showStep(ctx, userId, next);
    } else {
      await showSummary(ctx, userId, answers);
    }
  }

  return true;
}

// ═══════════════════════════════════════════
// نمایش خلاصه پاسخ‌ها
// ═══════════════════════════════════════════
async function showSummary(ctx, userId, answers) {
  await updateUser(userId, {
    currentStep:        ST_SUMMARY,
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  let t = "📋 *خلاصه پاسخ‌های شما*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const step   = STEPS[i];
    const ans    = answers[step.id];
    let display  = "— _پاسخ داده نشده_";

    if (ans) {
      if (step.type === "choice") {
        const opt = step.options.find(o => o.value === ans);
        display   = opt ? opt.label : ans;
      } else {
        if (step.id === "national_id") {
          display = ans.substring(0, 3) + "****" + ans.substring(7);
        } else if (step.id === "phone") {
          display = ans.substring(0, 4) + "***" + ans.substring(8);
        } else {
          display = ans.length > 40 ? ans.substring(0, 40) + "..." : ans;
        }
      }
    }

    t += `${step.title}: ${display}\n`;
  }

  t += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  t += "✏️ برای ویرایش هر مرحله روی آن کلیک کنید.\n";
  t += "✅ اگر همه چیز درست است، *تایید نهایی* را بزنید.";

  const kb = summaryKB(answers);

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
// ویرایش یک مرحله
// ═══════════════════════════════════════════
async function handleEdit(ctx, stepIndex) {
  const userId = String(ctx.from.id);
  await updateUser(userId, { currentStep: 100 + stepIndex });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showStep(ctx, userId, stepIndex);
}

// ═══════════════════════════════════════════
// برگشت به مرحله قبل
// ═══════════════════════════════════════════
async function handleBackStep(ctx, stepIndex) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showStep(ctx, userId, stepIndex);
}

// ═══════════════════════════════════════════
// تایید نهایی و تولید گزارش
// ═══════════════════════════════════════════
async function handleConfirm(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  // چک مراحل اجباری
  const missing = [];
  for (const s of STEPS) {
    if (s.required && (!answers[s.id] || answers[s.id] === "")) {
      missing.push(s.title);
    }
  }

  if (missing.length > 0) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: `⚠️ ${missing.length} مرحله تکمیل نشده: ${missing.slice(0, 2).join("، ")}`,
        show_alert: true,
      });
    }
    return;
  }

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({ text: "⏳ در حال تولید گزارش..." });
  }

  const score  = calcScore(answers);
  const risk   = getRiskLevel(score);
  const report = generateReport(score, answers);

  // ذخیره مشاوره
  try {
    await saveConsultation(userId, {
      electionType: answers.election_type || "",
      region:       answers.constituency  || "",
      answers:      JSON.stringify(answers),
      score,
      riskLevel:    risk.riskText,
      finalReport:  report,
      fullName:     `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      status:       "free",
    });
  } catch (e) {
    console.error("خطا در ذخیره مشاوره:", e.message);
  }

  // بروزرسانی لید
  try {
    await upsertLead(userId, {
      leadTemperature: score >= 75 ? "hot" : score >= 50 ? "warm" : "cold",
      notes: `ارزیابی آمادگی — امتیاز: ${score}/125 — ${risk.title}`,
    });
  } catch (e) {
    console.error("خطا در بروزرسانی لید:", e.message);
  }

  await updateUser(userId, {
    currentStep:        ST_DONE,
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  const kb = afterReportKB();

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(report, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(report, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    await ctx.reply("⚠️ گزارش تولید شد اما نمایش آن با مشکل مواجه شد.", { reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
// تحلیل هوشمند (AI) روی نتیجه‌ی ارزیابی
// ═══════════════════════════════════════════
async function handleAiInsight(ctx) {
  const userId = String(ctx.from.id);
  const { generateAI, isAIConfigured } = require("../../utils/ai.js");
  const { readinessInsightPrompt } = require("../../utils/ai-prompts.js");
  const { InlineKeyboard } = require("grammy");

  const backKb = new InlineKeyboard()
    .text("🔁 تلاش مجدد", "readiness:ai_insight").row()
    .text("🔙 منوی اصلی", "menu");

  if (!isAIConfigured()) {
    try {
      await ctx.answerCallbackQuery({ text: "هوش مصنوعی پیکربندی نشده", show_alert: true });
    } catch {}
    return;
  }

  let user, answers = {};
  try {
    user = await getOrCreateUser(userId, {});
    answers = JSON.parse(user.tempAnswers || "{}");
  } catch {}

  // اگر پاسخ‌ها در دسترس نیست
  if (!answers || Object.keys(answers).length === 0) {
    try {
      await ctx.answerCallbackQuery({ text: "ابتدا یک ارزیابی کامل انجام دهید", show_alert: true });
    } catch {}
    return;
  }

  const score = calcScore(answers);
  let profile = user.profile || user;
  if (typeof profile === "string") { try { profile = JSON.parse(profile); } catch {} }

  // حالت در حال تولید
  try {
    await ctx.answerCallbackQuery({ text: "🤖 در حال تحلیل…" });
    await ctx.reply("🤖 *در حال تحلیل هوشمند نتیجه‌ی شما…*", { parse_mode: "Markdown" });
  } catch {}

  try {
    const { system, prompt } = readinessInsightPrompt({ score, answers, profile });
    const aiText = await generateAI({ system, prompt });
    const text =
      "🤖 *تحلیل هوشمند آمادگی شما*\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      aiText +
      "\n\n_✨ تولیدشده با هوش مصنوعی_";
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: backKb });
  } catch (e) {
    console.error("[readiness][AI] error:", e?.message || e);
    await ctx.reply(
      "⚠️ تحلیل هوشمند موقتاً ناموفق بود. لطفاً دوباره تلاش کنید.",
      { reply_markup: backKb }
    );
  }
}

// ═══════════════════════════════════════════
// انصراف از ارزیابی
// ═══════════════════════════════════════════
async function handleCancelConsultation(ctx) {
  const userId = String(ctx.from.id);

  await updateUser(userId, {
    currentStep:        null,
    tempAnswers:        "{}",
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ لغو شد" });

  const msg = "❌ *ارزیابی لغو شد.*\n\n📌 هر زمان خواستید دوباره شروع کنید.";

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(msg, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
    } else {
      await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
    }
  } catch {
    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
  }
}

module.exports = {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleBackStep,
  handleConfirm,
  handleCancelConsultation,
  handleAiInsight,
  handleTextInput,
};
