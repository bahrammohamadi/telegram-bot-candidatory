// src/flows/consultation.js
// ─── هندلرهای مراحل مشاوره ───
// ۱۰ مرحله: fullName → nationalId → phone → electionType → region → 5 بُعد امتیازی
// سازگار با دیتابیس فعلی (userId, tempAnswers, currentStep, consultations, leads_status)

import { STEPS, TOTAL_STEPS } from "../constants/questions.js";
import { calcScore, generateReport, getRiskLevel } from "../utils/score.js";
import {
  getOrCreateUser,
  updateUser,
  saveConsultation,
  upsertLead,
} from "../utils/db.js";
import {
  stepChoiceKB,
  stepTextKB,
  summaryKB,
  afterReportKB,
  mainMenuKB,
  progressText,
} from "../utils/keyboard.js";

// ─── کدهای وضعیت ───
const ST_SUMMARY = 99;
const ST_DONE = 200;
// ویرایش: currentStep = 100 + stepIndex

// ═══════════════════════════════════════
//  اعتبارسنجی ورودی متنی
// ═══════════════════════════════════════

function validate(text, type) {
  const t = text.trim();

  switch (type) {
    case "national_id": {
      const c = t.replace(/[\s\-]/g, "");
      if (!/^\d{10}$/.test(c))
        return { ok: false, err: "❌ کد ملی باید دقیقاً ۱۰ رقم باشد.\nمثال: 0012345678" };
      return { ok: true, val: c };
    }
    case "phone": {
      const c = t.replace(/[\s\-\+]/g, "");
      if (!/^09\d{9}$/.test(c))
        return { ok: false, err: "❌ شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.\nمثال: 09121234567" };
      return { ok: true, val: c };
    }
    case "min_3": {
      if (t.length < 3)
        return { ok: false, err: "❌ لطفاً حداقل ۳ کاراکتر وارد کنید." };
      return { ok: true, val: t };
    }
    default:
      return { ok: true, val: t };
  }
}

// ═══════════════════════════════════════
//  نمایش مرحله
// ═══════════════════════════════════════

async function showStep(ctx, userId, idx) {
  if (idx < 0 || idx >= TOTAL_STEPS) return;

  const step = STEPS[idx];
  await updateUser(userId, { currentStep: idx });

  let t = `${progressText(idx)}\n\n`;
  t += `${step.title}\n━━━━━━━━━━━━━━━━━━━\n\n`;
  t += step.question;
  if (step.type === "text" && step.placeholder) t += `\n\n💬 ${step.placeholder}`;

  const kb = step.type === "choice" ? stepChoiceKB(idx) : stepTextKB(idx);

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════
//  شروع مشاوره
// ═══════════════════════════════════════

export async function handleStartConsultation(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let answers = {};
  let startAt = 0;

  // اگر کد ملی و تلفن قبلاً ذخیره شده‌اند، رد شو
  if (user.nationalId && user.phone && user.firstName) {
    answers.fullName = user.fullName || user.firstName || "";
    answers.nationalId = user.nationalId;
    answers.phone = user.phone;
    startAt = 3; // از نوع انتخابات
  } else if (user.nationalId && user.phone) {
    answers.nationalId = user.nationalId;
    answers.phone = user.phone;
    startAt = 0; // از نام شروع
  }

  await updateUser(userId, {
    currentStep: startAt,
    tempAnswers: JSON.stringify(answers),
  });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showStep(ctx, userId, startAt);
}

// ═══════════════════════════════════════
//  پاسخ گزینه‌ای
// ═══════════════════════════════════════

export async function handleAnswer(ctx, stepIdx, value) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  const step = STEPS[stepIdx];
  if (step) answers[step.id] = value;

  await updateUser(userId, { tempAnswers: JSON.stringify(answers) });

  await ctx.answerCallbackQuery({ text: `✅ ${step?.title || ""} ذخیره شد` });

  // حالت ویرایش → برگشت به خلاصه
  if (user.currentStep >= 100 && user.currentStep < ST_DONE) {
    return showSummary(ctx, userId, answers);
  }

  // مرحله بعد
  const next = stepIdx + 1;
  if (next < TOTAL_STEPS) {
    await showStep(ctx, userId, next);
  } else {
    await showSummary(ctx, userId, answers);
  }
}

// ═══════════════════════════════════════
//  ورودی متنی
// ═══════════════════════════════════════

export async function handleTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  const cs = user.currentStep;
  if (cs === undefined || cs === null || cs === ST_DONE) return false;

  let stepIdx;
  let editing = false;

  if (cs >= 100 && cs < ST_DONE) {
    stepIdx = cs - 100;
    editing = true;
  } else if (cs === ST_SUMMARY) {
    return false; // در خلاصه → متن قبول نیست
  } else {
    stepIdx = cs;
  }

  if (stepIdx < 0 || stepIdx >= TOTAL_STEPS) return false;

  const step = STEPS[stepIdx];
  if (step.type !== "text") return false;

  const input = ctx.message.text.trim();

  // اعتبارسنجی
  if (step.validation) {
    const v = validate(input, step.validation);
    if (!v.ok) {
      await ctx.reply(v.err);
      return true;
    }

    let answers = {};
    try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

    answers[step.id] = v.val;

    // ذخیره فیلدهای خاص در users
    const upd = { tempAnswers: JSON.stringify(answers) };
    if (step.id === "nationalId") upd.nationalId = v.val;
    else if (step.id === "phone") upd.phone = v.val;
    else if (step.id === "fullName") upd.fullName = v.val;

    await updateUser(userId, upd);

    if (editing) return showSummary(ctx, userId, answers), true;

    const next = stepIdx + 1;
    if (next < TOTAL_STEPS) await showStep(ctx, userId, next);
    else await showSummary(ctx, userId, answers);

    return true;
  }

  // بدون اعتبارسنجی
  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  answers[step.id] = input;
  await updateUser(userId, { tempAnswers: JSON.stringify(answers) });

  if (editing) return showSummary(ctx, userId, answers), true;

  const next = stepIdx + 1;
  if (next < TOTAL_STEPS) await showStep(ctx, userId, next);
  else await showSummary(ctx, userId, answers);

  return true;
}

// ═══════════════════════════════════════
//  خلاصه
// ═══════════════════════════════════════

async function showSummary(ctx, userId, answers) {
  await updateUser(userId, { currentStep: ST_SUMMARY });

  let t = "📋 *خلاصه پاسخ‌های شما*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (let i = 0; i < TOTAL_STEPS; i++) {
    const step = STEPS[i];
    const ans = answers[step.id];
    let display = "—";

    if (ans) {
      if (step.type === "choice") {
        const opt = step.options.find((o) => o.value === ans);
        display = opt ? opt.label : ans;
      } else {
        // ماسک‌کردن اطلاعات حساس
        if (step.id === "nationalId") {
          display = ans.substring(0, 3) + "****" + ans.substring(7);
        } else if (step.id === "phone") {
          display = ans.substring(0, 4) + "***" + ans.substring(8);
        } else {
          display = ans;
        }
      }
    }

    t += `${STEPS[i].title}: ${display}\n`;
  }

  t += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "📝 برای ویرایش هر مورد، روی آن کلیک کنید.\n";
  t += "✅ اگر همه‌چیز درست است، *تایید نهایی* را بزنید.";

  const kb = summaryKB(answers);

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════
//  ویرایش
// ═══════════════════════════════════════

export async function handleEdit(ctx, stepIdx) {
  const userId = String(ctx.from.id);
  await updateUser(userId, { currentStep: 100 + stepIdx });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showStep(ctx, userId, stepIdx);
}

// ═══════════════════════════════════════
//  بازگشت به مرحله قبل
// ═══════════════════════════════════════

export async function handleBackStep(ctx, stepIdx) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showStep(ctx, userId, stepIdx);
}

// ═══════════════════════════════════════
//  تایید نهایی
// ═══════════════════════════════════════

export async function handleConfirm(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let answers = {};
  try { answers = JSON.parse(user.tempAnswers || "{}"); } catch { answers = {}; }

  // بررسی تکمیل
  const missing = [];
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const s = STEPS[i];
    if (s.required && (!answers[s.id] || answers[s.id] === "")) {
      missing.push(s.title);
    }
  }

  if (missing.length > 0) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: `⚠️ ${missing.length} مرحله تکمیل نشده`,
        show_alert: true,
      });
    }
    return;
  }

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({ text: "⏳ در حال تولید گزارش..." });
  }

  // محاسبات
  const score = calcScore(answers);
  const risk = getRiskLevel(score);
  const report = generateReport(score, answers);

  // ذخیره مشاوره در consultations
  try {
    await saveConsultation(userId, {
      electionType: answers.electionType || "",
      region: answers.region || "",
      answers: JSON.stringify(answers),
      score,
      riskLevel: risk.level,
      finalReport: report,
      fullName: answers.fullName || "",
      status: "free",
    });
  } catch (e) {
    console.error("خطا در ذخیره مشاوره:", e.message);
  }

  // ذخیره/بروزرسانی لید
  try {
    await upsertLead(userId, {
      leadTemperature: score >= 75 ? "hot" : score >= 50 ? "warm" : "cold",
      notes: `تحلیل انجام شد — امتیاز: ${score} — ${risk.title} — ${new Date().toISOString()}`,
    });
  } catch (e) {
    console.error("خطا در upsertLead:", e.message);
  }

  // بروزرسانی کاربر
  await updateUser(userId, {
    currentStep: ST_DONE,
    lastInteraction: new Date().toISOString(),
    // فیلدهای اضافه
    nationalId: answers.nationalId || "",
    phone: answers.phone || "",
    fullName: answers.fullName || "",
  });

  // ارسال گزارش
  const kb = afterReportKB();

  try {
    await ctx.editMessageText(report, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(report, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════
//  انصراف
// ═══════════════════════════════════════

export async function handleCancelConsultation(ctx) {
  const userId = String(ctx.from.id);

  await updateUser(userId, {
    currentStep: null,
    tempAnswers: "{}",
  });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ لغو شد" });

  const t = "❌ مشاوره لغو شد.\n\n📌 هر زمان خواستید دوباره شروع کنید.";
  const kb = mainMenuKB();

  try {
    await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}
