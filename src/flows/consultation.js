// src/flows/consultation.js
// ═══════════════════════════════════════════════════════════════
//  هندلرهای مراحل مشاوره (۹ مرحله)
//  سازگار با دیتابیس واقعی (userId, tempAnswers, currentStep)
// ═══════════════════════════════════════════════════════════════

import { STEPS, TOTAL_STEPS } from "../constants/questions.js";
import { calcScore, generateReport, getRiskLevel } from "../utils/score.js";
import {
  getOrCreateUser, updateUser, saveConsultation, upsertLead,
} from "../utils/db.js";
import {
  stepChoiceKB, stepTextKB, summaryKB, afterReportKB,
  progressText, mainMenuKB,
} from "../utils/keyboard.js";

// ثابت‌های وضعیت
const ST_SUMMARY = 99;
const ST_DONE = 200;

// ─── اعتبارسنجی ورودی متنی ───
function validateInput(text, type) {
  const t = text.trim();
  switch (type) {
    case "national_id": {
      const c = t.replace(/[\s\-]/g, "");
      if (!/^\d{10}$/.test(c))
        return { ok: false, err: "❌ کد ملی باید دقیقاً *۱۰ رقم* باشد.\nمثال: `0012345678`" };
      if (/^(\d)\1{9}$/.test(c))
        return { ok: false, err: "❌ کد ملی نامعتبر است." };
      return { ok: true, val: c };
    }
    case "phone": {
      const c = t.replace(/[\s\-\+]/g, "");
      if (!/^09\d{9}$/.test(c))
        return { ok: false, err: "❌ شماره باید *۱۱ رقم* و با *۰۹* شروع شود.\nمثال: `09121234567`" };
      return { ok: true, val: c };
    }
    case "min_5":
      if (t.length < 5)
        return { ok: false, err: "❌ لطفاً حداقل ۵ کاراکتر وارد کنید." };
      return { ok: true, val: t };
    default:
      if (t.length < 1)
        return { ok: false, err: "❌ لطفاً مقداری وارد کنید." };
      return { ok: true, val: t };
  }
}

// ─── نمایش یک مرحله ───
async function showStep(ctx, userId, idx) {
  if (idx < 0 || idx >= TOTAL_STEPS) return;
  const step = STEPS[idx];
  await updateUser(userId, { currentStep: idx });

  let text = `${progressText(idx)}\n\n`;
  text += `*${step.title}*\n━━━━━━━━━━━━━━━━━━━\n\n`;
  text += step.question;
  if (step.type === "text" && step.placeholder) text += `\n\n💬 _${step.placeholder}_`;

  const kb = step.type === "choice" ? stepChoiceKB(idx) : stepTextKB(idx);

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ─── شروع مشاوره ───
export async function handleStartConsultation(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let existing = {};
  try { existing = JSON.parse(user.tempAnswers || "{}"); } catch { existing = {}; }

  let startIdx = 0;
  if (user.nationalId && user.phone) {
    existing.national_id = user.nationalId;
    existing.phone = user.phone;
    startIdx = 2;
  } else if (user.nationalId) {
    existing.national_id = user.nationalId;
    startIdx = 1;
  }

  await updateUser(userId, {
    currentStep: startIdx,
    tempAnswers: JSON.stringify(existing),
    lastInteraction: new Date().toISOString(),
  });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  if (startIdx === 0) {
    await ctx.reply(
      "🚀 *تحلیل آمادگی کاندیداتوری*\n━━━━━━━━━━━━━━━━━━━\n\n" +
      "📋 ۹ مرحله ساده | ⏱️ ۳–۵ دقیقه | 📊 گزارش جامع\n\nبزن بریم! 👇",
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      `✅ اطلاعات هویتی قبلاً ثبت شده. از مرحله ${startIdx + 1} ادامه می‌دهیم...`,
      { parse_mode: "Markdown" }
    );
  }

  await showStep(ctx, userId, startIdx);
}

// ─── پاسخ گزینه‌ای ───
export async function handleAnswer(ctx, stepIndex, value) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  const step = STEPS[stepIndex];
  if (step) answers[step.id] = value;

  await updateUser(userId, {
    tempAnswers: JSON.stringify(answers),
    lastInteraction: new Date().toISOString(),
  });

  await ctx.answerCallbackQuery({ text: `✅ ${step?.title || ""} ثبت شد` });

  const isEditing = user.currentStep >= 100 && user.currentStep < ST_DONE;
  if (isEditing) {
    await showSummary(ctx, userId, answers);
    return;
  }

  const next = stepIndex + 1;
  if (next < TOTAL_STEPS) await showStep(ctx, userId, next);
  else await showSummary(ctx, userId, answers);
}

// ─── ورودی متنی ───
export async function handleTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  if (user.currentStep === undefined || user.currentStep === null ||
      user.currentStep === ST_DONE || user.currentStep === ST_SUMMARY) {
    return false;
  }

  let stepIdx;
  let isEditing = false;

  if (user.currentStep >= 100 && user.currentStep < ST_DONE) {
    stepIdx = user.currentStep - 100;
    isEditing = true;
  } else {
    stepIdx = user.currentStep;
  }

  if (stepIdx < 0 || stepIdx >= TOTAL_STEPS) return false;
  const step = STEPS[stepIdx];
  if (step.type !== "text") return false;

  const input = ctx.message.text.trim();
  const v = validateInput(input, step.validation);
  if (!v.ok) {
    await ctx.reply(v.err, { parse_mode: "Markdown" });
    return true;
  }

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }
  answers[step.id] = v.val;

  const updateData = {
    tempAnswers: JSON.stringify(answers),
    lastInteraction: new Date().toISOString(),
  };

  if (step.id === "national_id") updateData.nationalId = v.val;
  else if (step.id === "phone") updateData.phone = v.val;

  await updateUser(userId, updateData);
  await ctx.reply(`✅ *${step.title}* ثبت شد.`, { parse_mode: "Markdown" });

  if (isEditing) {
    await showSummary(ctx, userId, answers);
  } else {
    const next = stepIdx + 1;
    if (next < TOTAL_STEPS) await showStep(ctx, userId, next);
    else await showSummary(ctx, userId, answers);
  }

  return true;
}

// ─── نمایش خلاصه ───
async function showSummary(ctx, userId, answers) {
  await updateUser(userId, { currentStep: ST_SUMMARY });

  let t = "📋 *خلاصه پاسخ‌های شما*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const step = STEPS[i];
    const ans = answers[step.id];
    let display = "— _پاسخ داده نشده_";

    if (ans) {
      if (step.type === "choice") {
        const opt = step.options.find((o) => o.value === ans);
        display = opt ? opt.label : ans;
      } else {
        if (step.id === "national_id") display = ans.substring(0, 3) + "****" + ans.substring(7);
        else if (step.id === "phone") display = ans.substring(0, 4) + "***" + ans.substring(8);
        else display = ans;
      }
    }
    t += `${STEPS[i].title}: ${display}\n`;
  }

  t += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "✏️ برای ویرایش کلیک کنید.\n✅ اگر درست است، *تایید نهایی* بزنید.";

  const kb = summaryKB(answers);
  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ─── ویرایش ───
export async function handleEdit(ctx, stepIndex) {
  const userId = String(ctx.from.id);
  await updateUser(userId, { currentStep: 100 + stepIndex });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showStep(ctx, userId, stepIndex);
}

// ─── بازگشت ───
export async function handleBackStep(ctx, stepIndex) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showStep(ctx, userId, stepIndex);
}

// ─── تایید نهایی ───
export async function handleConfirm(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  // بررسی تکمیل
  const missing = [];
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const s = STEPS[i];
    if (s.required && (!answers[s.id] || answers[s.id] === "")) missing.push(s.title);
  }
  if (missing.length > 0) {
    if (ctx.callbackQuery)
      await ctx.answerCallbackQuery({ text: `⚠️ ${missing.length} مرحله تکمیل نشده`, show_alert: true });
    return;
  }

  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "⏳ تولید گزارش..." });

  const score = calcScore(answers);
  const risk = getRiskLevel(score);
  const report = generateReport(score, answers);

  // ذخیره مشاوره
  try {
    await saveConsultation(userId, {
      electionType: answers.election_type || "",
      region: answers.constituency || "",
      answers: JSON.stringify(answers),
      score,
      riskLevel: risk.riskText,
      finalReport: report,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      status: "free",
    });
  } catch (e) { console.error("خطا در ذخیره مشاوره:", e.message); }

  // بروزرسانی لید
  try {
    await upsertLead(userId, {
      leadTemperature: score >= 75 ? "hot" : score >= 50 ? "warm" : "cold",
      notes: `تحلیل — امتیاز: ${score}/${125} — ${risk.title}`,
    });
  } catch (e) { console.error("خطا در لید:", e.message); }

  await updateUser(userId, {
    currentStep: ST_DONE,
    lastInteraction: new Date().toISOString(),
  });

  const kb = afterReportKB();
  try { await ctx.editMessageText(report, { parse_mode: "Markdown", reply_markup: kb }); }
  catch { await ctx.reply(report, { parse_mode: "Markdown", reply_markup: kb }); }
}

// ─── انصراف ───
export async function handleCancelConsultation(ctx) {
  const userId = String(ctx.from.id);
  await updateUser(userId, {
    currentStep: null, tempAnswers: "{}",
    lastInteraction: new Date().toISOString(),
  });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ لغو شد" });

  const kb = mainMenuKB();
  try {
    await ctx.editMessageText("❌ *مشاوره لغو شد.*\n\n📌 هر زمان دوباره شروع کنید.", {
      parse_mode: "Markdown", reply_markup: kb,
    });
  } catch {
    await ctx.reply("❌ *مشاوره لغو شد.*\n\n📌 هر زمان دوباره شروع کنید.", {
      parse_mode: "Markdown", reply_markup: kb,
    });
  }
}
