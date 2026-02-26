// src/flows/deep_assessment.js
// ─── هندلرهای ارزیابی عمیق (فاز ۲) ───
// این فلو بعد از دریافت گزارش رایگان (فاز ۱) فعال می‌شود

import { InlineKeyboard } from "grammy";
import { DEEP_MODULES, DEEP_TOTAL_STEPS } from "../constants/deep_assessment.js";
import { calcDeepTotalScore, generateDeepReport } from "../utils/deep_score.js";
import { getOrCreateUser, updateUser, saveConsultation, upsertLead } from "../utils/db.js";
import { mainMenuKB } from "../utils/keyboard.js";

// ─── وضعیت‌ها ───
// currentStep: 1000 + flatStepIndex  → در حال ارزیابی عمیق
// currentStep: 1900                  → خلاصه ارزیابی عمیق
// currentStep: 1901                  → ویرایش ارزیابی عمیق
// currentStep: 2000                  → تکمیل‌شده

const DEEP_BASE = 1000;
const DEEP_SUMMARY = 1900;
const DEEP_EDITING = 1901; // + stepIndex stored in tempDeepEdit
const DEEP_DONE = 2000;

/**
 * ساخت لیست تخت (flat) از همه مراحل عمیق
 */
function getFlatSteps() {
  const flat = [];
  for (const mod of DEEP_MODULES) {
    for (const step of mod.steps) {
      flat.push({
        ...step,
        moduleId: mod.id,
        moduleTitle: mod.title,
        moduleEmoji: mod.emoji,
      });
    }
  }
  return flat;
}

const FLAT_STEPS = getFlatSteps();

/**
 * ساخت کیبورد برای مرحله عمیق
 */
function deepStepKB(flatIdx) {
  const step = FLAT_STEPS[flatIdx];
  if (!step) return new InlineKeyboard();

  const kb = new InlineKeyboard();

  if (step.type === "choice") {
    for (const opt of step.options) {
      kb.text(opt.label, `deep_ans:${flatIdx}:${opt.value}`).row();
    }
  }

  if (flatIdx > 0) {
    kb.text("⬅️ قبلی", `deep_back:${flatIdx - 1}`).row();
  }
  kb.text("⏭️ رد شدن", `deep_skip:${flatIdx}`).row();
  kb.text("❌ خروج و ذخیره", "deep_exit").row();

  return kb;
}

/**
 * نوار پیشرفت ارزیابی عمیق
 */
function deepProgress(flatIdx) {
  const total = FLAT_STEPS.length;
  const pct = Math.round(((flatIdx + 1) / total) * 100);
  const filled = Math.round(pct / 10);
  const bar = "🟢".repeat(filled) + "⚪".repeat(10 - filled);
  return `📊 پیشرفت: ${bar} ${flatIdx + 1}/${total} (${pct}%)`;
}

// ═══════════════════════════════════════════
//  نمایش صفحه معرفی ارزیابی عمیق
// ═══════════════════════════════════════════
export async function handleStartDeepAssessment(ctx) {
  let t = "";
  t += "🧠 *ارزیابی عمیق کاندیداتوری*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "📋 این ارزیابی شامل *۶ ماژول تخصصی* است:\n\n";

  for (const mod of DEEP_MODULES) {
    t += `${mod.emoji} *${mod.title}*\n`;
    t += `   _${mod.description}_\n\n`;
  }

  t += `📊 مجموع: *${FLAT_STEPS.length} سؤال*\n`;
  t += "⏱️ زمان تقریبی: ۱۵ تا ۲۰ دقیقه\n\n";

  t += "📌 *نکته:* می‌توانید هر زمان خارج شوید و بعداً ادامه دهید.\n";
  t += "پاسخ‌های شما ذخیره می‌شوند.\n\n";

  t += "🎯 در پایان *گزارش جامع تحلیلی* شامل:\n";
  t += "├ تیپ شخصیت انتخاباتی\n";
  t += "├ پروفایل ۵ بعدی شخصیتی\n";
  t += "├ تحلیل رفتار بحرانی\n";
  t += "├ ارزیابی آمادگی رسانه‌ای\n";
  t += "├ احتمال موفقیت\n";
  t += "└ توصیه‌های فوری\n\n";
  t += "آماده‌اید؟ 👇";

  const kb = new InlineKeyboard()
    .text("🚀 شروع ارزیابی عمیق", "deep_begin")
    .row()
    .text("🔙 بازگشت به منو", "menu")
    .row();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
//  شروع واقعی ارزیابی عمیق
// ═══════════════════════════════════════════
export async function handleDeepBegin(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  // بررسی آیا پاسخ‌های قبلی وجود دارد
  let deepAnswers = {};
  try {
    const temp = JSON.parse(user.tempAnswers || "{}");
    if (temp._deep) deepAnswers = temp._deep;
  } catch {}

  // پیدا کردن اولین سؤال بی‌پاسخ
  let startIdx = 0;
  for (let i = 0; i < FLAT_STEPS.length; i++) {
    if (!deepAnswers[FLAT_STEPS[i].id]) {
      startIdx = i;
      break;
    }
    if (i === FLAT_STEPS.length - 1) startIdx = i;
  }

  await updateUser(userId, { currentStep: DEEP_BASE + startIdx });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  if (startIdx > 0) {
    await ctx.reply(
      `✅ ${startIdx} سؤال قبلاً پاسخ داده شده.\nاز سؤال ${startIdx + 1} ادامه می‌دهیم...`,
      { parse_mode: "Markdown" }
    );
  }

  await showDeepStep(ctx, userId, startIdx);
}

// ═══════════════════════════════════════════
//  نمایش یک مرحله عمیق
// ═══════════════════════════════════════════
async function showDeepStep(ctx, userId, flatIdx) {
  if (flatIdx < 0 || flatIdx >= FLAT_STEPS.length) return;

  const step = FLAT_STEPS[flatIdx];
  await updateUser(userId, { currentStep: DEEP_BASE + flatIdx });

  let t = `${deepProgress(flatIdx)}\n\n`;
  t += `${step.moduleEmoji} _${step.moduleTitle}_\n\n`;
  t += `*${step.title}*\n`;
  t += `━━━━━━━━━━━━━━━━━━━\n\n`;
  t += step.question;

  const kb = deepStepKB(flatIdx);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
//  پاسخ گزینه‌ای عمیق
// ═══════════════════════════════════════════
export async function handleDeepAnswer(ctx, flatIdx, value) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let temp = {};
  try { temp = JSON.parse(user.tempAnswers || "{}"); } catch {}
  if (!temp._deep) temp._deep = {};

  const step = FLAT_STEPS[flatIdx];
  if (step) temp._deep[step.id] = value;

  await updateUser(userId, {
    tempAnswers: JSON.stringify(temp),
    lastInteraction: new Date().toISOString(),
  });

  await ctx.answerCallbackQuery({ text: `✅ ثبت شد` });

  const next = flatIdx + 1;
  if (next < FLAT_STEPS.length) {
    await showDeepStep(ctx, userId, next);
  } else {
    await showDeepSummary(ctx, userId, temp._deep);
  }
}

// ═══════════════════════════════════════════
//  ورودی متنی عمیق
// ═══════════════════════════════════════════
export async function handleDeepTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  if (
    user.currentStep === undefined ||
    user.currentStep === null ||
    user.currentStep < DEEP_BASE ||
    user.currentStep >= DEEP_DONE
  ) {
    return false;
  }

  const flatIdx = user.currentStep - DEEP_BASE;
  if (flatIdx < 0 || flatIdx >= FLAT_STEPS.length) return false;

  const step = FLAT_STEPS[flatIdx];
  if (step.type !== "text") return false;

  const input = ctx.message.text.trim();

  // اعتبارسنجی ساده
  if (step.validation === "min_20" && input.length < 20) {
    await ctx.reply("❌ لطفاً حداقل ۲۰ کاراکتر بنویسید. پاسخ مفصل‌تر = تحلیل دقیق‌تر.", { parse_mode: "Markdown" });
    return true;
  }
  if (step.validation === "min_15" && input.length < 15) {
    await ctx.reply("❌ لطفاً حداقل ۱۵ کاراکتر بنویسید.", { parse_mode: "Markdown" });
    return true;
  }
  if (step.validation === "min_10" && input.length < 10) {
    await ctx.reply("❌ لطفاً حداقل ۱۰ کاراکتر بنویسید.", { parse_mode: "Markdown" });
    return true;
  }
  if (step.validation === "min_5" && input.length < 5) {
    await ctx.reply("❌ لطفاً حداقل ۵ کاراکتر بنویسید.", { parse_mode: "Markdown" });
    return true;
  }
  if (step.validation === "min_3" && input.length < 3) {
    await ctx.reply("❌ لطفاً حداقل ۳ کاراکتر بنویسید.", { parse_mode: "Markdown" });
    return true;
  }
  if (step.validation === "min_2" && input.length < 2) {
    await ctx.reply("❌ لطفاً مقداری وارد کنید.", { parse_mode: "Markdown" });
    return true;
  }

  // ذخیره
  let temp = {};
  try { temp = JSON.parse(user.tempAnswers || "{}"); } catch {}
  if (!temp._deep) temp._deep = {};
  temp._deep[step.id] = input;

  await updateUser(userId, {
    tempAnswers: JSON.stringify(temp),
    lastInteraction: new Date().toISOString(),
  });

  await ctx.reply(`✅ *${step.title}* ثبت شد.`, { parse_mode: "Markdown" });

  const next = flatIdx + 1;
  if (next < FLAT_STEPS.length) {
    await showDeepStep(ctx, userId, next);
  } else {
    await showDeepSummary(ctx, userId, temp._deep);
  }

  return true;
}

// ═══════════════════════════════════════════
//  رد شدن (Skip)
// ═══════════════════════════════════════════
export async function handleDeepSkip(ctx, flatIdx) {
  const userId = String(ctx.from.id);
  await ctx.answerCallbackQuery({ text: "⏭️ رد شد" });

  const next = flatIdx + 1;
  if (next < FLAT_STEPS.length) {
    await showDeepStep(ctx, userId, next);
  } else {
    const user = await getOrCreateUser(userId, ctx.from);
    let temp = {};
    try { temp = JSON.parse(user.tempAnswers || "{}"); } catch {}
    await showDeepSummary(ctx, userId, temp._deep || {});
  }
}

// ═══════════════════════════════════════════
//  خلاصه ارزیابی عمیق
// ═══════════════════════════════════════════
async function showDeepSummary(ctx, userId, deepAnswers) {
  await updateUser(userId, { currentStep: DEEP_SUMMARY });

  const answered = Object.keys(deepAnswers).filter((k) => deepAnswers[k]).length;

  let t = "📋 *خلاصه ارزیابی عمیق*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (const mod of DEEP_MODULES) {
    t += `${mod.emoji} *${mod.title}:*\n`;
    for (const step of mod.steps) {
      const ans = deepAnswers[step.id];
      let icon = "⚪";
      let display = "پاسخ داده نشده";
      if (ans) {
        icon = "🟢";
        if (step.type === "choice") {
          const opt = step.options?.find((o) => o.value === ans);
          display = opt ? opt.label : ans;
        } else {
          display = String(ans).substring(0, 40) + (String(ans).length > 40 ? "..." : "");
        }
      }
      t += `  ${icon} ${display}\n`;
    }
    t += "\n";
  }

  t += `📊 پاسخ داده شده: ${answered} از ${FLAT_STEPS.length}\n\n`;
  t += "✅ برای دریافت گزارش *تایید نهایی* را بزنید.";

  const kb = new InlineKeyboard()
    .text("✅ تایید و دریافت گزارش عمیق", "deep_confirm")
    .row()
    .text("🔄 ادامه پاسخ‌دهی", "deep_begin")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
//  تایید و تولید گزارش عمیق
// ═══════════════════════════════════════════
export async function handleDeepConfirm(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, ctx.from);

  let temp = {};
  try { temp = JSON.parse(user.tempAnswers || "{}"); } catch {}
  const deepAnswers = temp._deep || {};

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({ text: "⏳ در حال تولید گزارش عمیق..." });
  }

  // تولید گزارش
  const report = generateDeepReport(deepAnswers);
  const totalResult = calcDeepTotalScore(deepAnswers);

  // ذخیره در consultations
  try {
    await saveConsultation(userId, {
      electionType: temp.election_type || "",
      region: temp.constituency || "",
      answers: JSON.stringify({ basic: temp, deep: deepAnswers }),
      score: totalResult.totalScore,
      riskLevel: totalResult.percent >= 60 ? "low" : totalResult.percent >= 40 ? "medium" : "high",
      finalReport: report,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      status: "deep_complete",
    });
  } catch (e) {
    console.error("خطا در ذخیره گزارش عمیق:", e.message);
  }

  // بروزرسانی لید
  try {
    await upsertLead(userId, {
      leadTemperature: "hot",
      notes: `ارزیابی عمیق تکمیل شد — امتیاز: ${totalResult.totalScore}/${totalResult.maxScore} — ${totalResult.personaType}`,
    });
  } catch (e) {
    console.error("خطا در بروزرسانی لید:", e.message);
  }

  // بروزرسانی وضعیت
  await updateUser(userId, {
    currentStep: DEEP_DONE,
    lastInteraction: new Date().toISOString(),
  });

  // ارسال گزارش (ممکنه بلند باشه — تقسیم به چند پیام)
  const kb = new InlineKeyboard()
    .text("💼 بسته‌های خدماتی (مشاوره تخصصی)", "show_plans")
    .row()
    .text("📚 آموزش‌های تخصصی", "edu_list")
    .row()
    .text("🔄 شروع مجدد", "start_consultation")
    .row()
    .text("🔙 منو", "menu")
    .row();

  // تقسیم پیام اگه بیشتر از 4096 کاراکتر باشه
  if (report.length > 4000) {
    const mid = report.lastIndexOf("\n", 3900);
    const part1 = report.substring(0, mid);
    const part2 = report.substring(mid);

    try {
      await ctx.editMessageText(part1, { parse_mode: "Markdown" });
    } catch {
      await ctx.reply(part1, { parse_mode: "Markdown" });
    }
    await ctx.reply(part2, { parse_mode: "Markdown", reply_markup: kb });
  } else {
    try {
      await ctx.editMessageText(report, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(report, { parse_mode: "Markdown", reply_markup: kb });
    }
  }
}

// ═══════════════════════════════════════════
//  خروج و ذخیره
// ═══════════════════════════════════════════
export async function handleDeepExit(ctx) {
  const userId = String(ctx.from.id);
  // نگه‌داشتن پاسخ‌ها (ذخیره‌شده در tempAnswers._deep)
  await updateUser(userId, { currentStep: null });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "✅ ذخیره شد" });

  const kb = mainMenuKB();
  try {
    await ctx.editMessageText(
      "✅ *پاسخ‌های شما ذخیره شد.*\n\n" +
      "هر زمان خواستید از *منوی اصلی* → «ارزیابی عمیق» ادامه دهید.\n\n" +
      "📌 پاسخ‌های قبلی حفظ می‌شوند.",
      { parse_mode: "Markdown", reply_markup: kb }
    );
  } catch {
    await ctx.reply(
      "✅ *پاسخ‌های شما ذخیره شد.*\nهر زمان خواستید ادامه دهید.",
      { parse_mode: "Markdown", reply_markup: kb }
    );
  }
}
