// src/flows/analysis/swot.js — CommonJS
// ─── تحلیل SWOT اختصاصی کاندیدا ───

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser, updateUser, saveConsultation } = require("../../utils/db.js");
const { requireAccess } = require("../../utils/access.js");
const { backToCampaignKB } = require("../../utils/keyboard.js");
const { bar } = require("../../utils/score.js");

// ═══════════════════════════════════════════
// سؤالات SWOT
// ═══════════════════════════════════════════
const SWOT_STEPS = [

  // ─── نقاط قوت (Strengths) ───
  {
    id: "s_expertise",
    category: "strength",
    title: "💪 تخصص و دانش",
    question:
      "💪 *نقاط قوت — تخصص*\n\n" +
      "چه تخصص یا دانش تخصصی دارید که می‌تواند در خدمت به مردم حوزه مفید باشد؟\n\n" +
      "📌 مثال: «مهندس عمران با ۱۵ سال تجربه در پروژه‌های شهری»\n\n" +
      "💬 بنویسید:",
    type: "text",
    validation: "min_5",
  },
  {
    id: "s_network",
    category: "strength",
    title: "💪 شبکه ارتباطی",
    question:
      "💪 *نقاط قوت — شبکه ارتباطی*\n\n" +
      "قوی‌ترین بخش شبکه ارتباطی شما چیست؟",
    type: "choice",
    options: [
      { label: "🕌 معتمدین و بزرگان محلی", value: "elders" },
      { label: "🏪 اصناف و کسبه", value: "business" },
      { label: "👨‍👩‍👧 خانواده‌های گسترده (قومی)", value: "family" },
      { label: "🎓 تحصیل‌کردگان و نخبگان", value: "educated" },
      { label: "👦 جوانان و دانش‌آموزان", value: "youth" },
      { label: "👩 بانوان و زنان فعال", value: "women" },
      { label: "🕌 هیئت‌ها و مذهبی‌ها", value: "religious" },
    ],
  },
  {
    id: "s_track_record",
    category: "strength",
    title: "💪 سابقه خدمت",
    question:
      "💪 *نقاط قوت — سابقه خدمت*\n\n" +
      "مهم‌ترین خدمتی که تاکنون به مردم حوزه ارائه داده‌اید چیست؟\n\n" +
      "📌 اگر سابقه‌ای ندارید بنویسید: «ندارم»\n\n" +
      "💬 بنویسید:",
    type: "text",
    validation: "min_2",
  },
  {
    id: "s_unique",
    category: "strength",
    title: "💪 مزیت منحصربه‌فرد",
    question:
      "💪 *نقاط قوت — مزیت منحصربه‌فرد*\n\n" +
      "یک چیزی که فقط شما دارید و رقبا ندارند چیست؟\n\n" +
      "💬 بنویسید:",
    type: "text",
    validation: "min_5",
  },

  // ─── نقاط ضعف (Weaknesses) ───
  {
    id: "w_recognition",
    category: "weakness",
    title: "⚠️ شناخته‌شدگی",
    question:
      "⚠️ *نقاط ضعف — شناخته‌شدگی*\n\n" +
      "تخمین می‌زنید چه درصدی از مردم حوزه شما را می‌شناسند؟",
    type: "choice",
    options: [
      { label: "بیش از ۷۰% مردم", value: "high", score: 80 },
      { label: "۴۰ تا ۷۰%", value: "medium_high", score: 55 },
      { label: "۲۰ تا ۴۰%", value: "medium", score: 30 },
      { label: "کمتر از ۲۰%", value: "low", score: 10 },
      { label: "تقریباً هیچ‌کس", value: "none", score: 2 },
    ],
  },
  {
    id: "w_resources",
    category: "weakness",
    title: "⚠️ کمبود منابع",
    question:
      "⚠️ *نقاط ضعف — منابع*\n\n" +
      "بزرگ‌ترین کمبود منابع شما کدام است؟",
    type: "choice",
    options: [
      { label: "💰 بودجه کافی ندارم", value: "budget" },
      { label: "👥 تیم و نیرو ندارم", value: "team" },
      { label: "⏰ وقت کافی ندارم", value: "time" },
      { label: "📱 حضور رسانه‌ای ضعیف دارم", value: "media" },
      { label: "✅ کمبود منابع جدی ندارم", value: "none" },
    ],
  },
  {
    id: "w_vulnerability",
    category: "weakness",
    title: "⚠️ نقطه آسیب‌پذیر",
    question:
      "⚠️ *نقاط ضعف — نقطه آسیب‌پذیر*\n\n" +
      "اگر رقیب بخواهد به شما حمله کند، از چه نقطه‌ای استفاده می‌کند؟\n\n" +
      "📌 این اطلاعات محرمانه است — صادقانه بنویسید:\n\n" +
      "💬 بنویسید:",
    type: "text",
    validation: "min_5",
  },

  // ─── فرصت‌ها (Opportunities) ───
  {
    id: "o_problems",
    category: "opportunity",
    title: "🚀 مشکل اصلی مردم",
    question:
      "🚀 *فرصت‌ها — مشکل اصلی*\n\n" +
      "مهم‌ترین مشکل یا نیاز مردم حوزه که هنوز حل نشده چیست؟\n\n" +
      "📌 این مشکل فرصت اصلی شماست!\n\n" +
      "💬 بنویسید:",
    type: "text",
    validation: "min_10",
  },
  {
    id: "o_rival_gap",
    category: "opportunity",
    title: "🚀 خلأ رقبا",
    question:
      "🚀 *فرصت‌ها — خلأ رقبا*\n\n" +
      "رقبای شما در چه بخشی ضعیف هستند یا از کدام گروه مردم غافل شده‌اند؟\n\n" +
      "💬 بنویسید:",
    type: "text",
    validation: "min_5",
  },

  // ─── تهدیدها (Threats) ───
  {
    id: "t_main_rival",
    category: "threat",
    title: "🔴 رقیب اصلی",
    question:
      "🔴 *تهدیدها — رقیب اصلی*\n\n" +
      "قوی‌ترین رقیب شما کیست و چرا خطرناک است؟\n\n" +
      "📌 اگر هنوز نمی‌دانید بنویسید: «مشخص نیست»\n\n" +
      "💬 بنویسید:",
    type: "text",
    validation: "min_3",
  },
  {
    id: "t_external",
    category: "threat",
    title: "🔴 تهدیدهای خارجی",
    question:
      "🔴 *تهدیدها — تهدیدهای خارجی*\n\n" +
      "بزرگ‌ترین تهدید خارجی برای کمپین شما کدام است؟",
    type: "choice",
    options: [
      { label: "👥 ائتلاف رقبا علیه من", value: "coalition" },
      { label: "📰 رسانه‌های مخالف", value: "media" },
      { label: "💸 رقیب با بودجه خیلی بیشتر", value: "budget_rival" },
      { label: "🗳️ تغییر قوانین انتخاباتی", value: "rules" },
      { label: "📉 بی‌اعتمادی عمومی به کاندیداها", value: "distrust" },
      { label: "⚡ شایعات و اتهامات", value: "rumors" },
    ],
  },
];

const SWOT_STEP_BASE = 700;
const TOTAL_SWOT    = SWOT_STEPS.length;

// ═══════════════════════════════════════════
// کیبورد مرحله SWOT
// ═══════════════════════════════════════════
function swotStepKB(idx) {
  const step = SWOT_STEPS[idx];
  const kb   = new InlineKeyboard();

  if (step.type === "choice") {
    for (const opt of step.options) {
      kb.text(opt.label, `swot_ans:${idx}:${opt.value}`).row();
    }
  }

  if (idx > 0) kb.text("⬅️ قبلی", `swot_back:${idx - 1}`);
  kb.text("⏭️ رد شدن", `swot_skip:${idx}`);
  kb.row();
  kb.text("❌ انصراف", "campaign_menu").row();

  return kb;
}

// نوار پیشرفت
function swotProgress(idx) {
  const pct    = Math.round(((idx + 1) / TOTAL_SWOT) * 100);
  const filled = Math.round(pct / 10);
  const barStr = "🟢".repeat(filled) + "⚪".repeat(10 - filled);

  const categoryEmoji = {
    strength:    "💪",
    weakness:    "⚠️",
    opportunity: "🚀",
    threat:      "🔴",
  }[SWOT_STEPS[idx]?.category] || "📊";

  return `${categoryEmoji} تحلیل SWOT: ${barStr} ${idx + 1}/${TOTAL_SWOT} (${pct}%)`;
}

// ═══════════════════════════════════════════
// نمایش یک مرحله SWOT
// ═══════════════════════════════════════════
async function showSwotStep(ctx, userId, idx) {
  if (idx < 0 || idx >= TOTAL_SWOT) return;

  const step = SWOT_STEPS[idx];
  await updateUser(userId, { currentStep: SWOT_STEP_BASE + idx });

  let text = `${swotProgress(idx)}\n\n`;
  text += `*${step.title}*\n`;
  text += "━━━━━━━━━━━━━━━━━━━\n\n";
  text += step.question;

  const kb = swotStepKB(idx);

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
// شروع تحلیل SWOT
// ═══════════════════════════════════════════
async function handleSwotAnalysis(ctx) {
  const userId = String(ctx.from.id);

  // بررسی دسترسی
  const ok = await requireAccess(ctx, "swot_analysis");
  if (!ok) return;

  const user = await getOrCreateUser(userId, ctx.from);

  // بررسی آیا پروفایل دارد
  let profile = {};
  try { profile = JSON.parse(user.candidateProfile || "{}"); } catch { profile = {}; }

  await updateUser(userId, {
    currentStep: SWOT_STEP_BASE,
    tempAnswers:  JSON.stringify({ _swotMode: true }),
  });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  let intro = "📊 *تحلیل SWOT کاندیداتوری*\n";
  intro += "━━━━━━━━━━━━━━━━━━━\n\n";
  intro += "این تحلیل وضعیت رقابتی شما را از ۴ بُعد بررسی می‌کند:\n\n";
  intro += "💪 *نقاط قوت* — چه مزیت‌هایی دارید؟\n";
  intro += "⚠️ *نقاط ضعف* — کجا آسیب‌پذیرید؟\n";
  intro += "🚀 *فرصت‌ها* — از کجا می‌توانید رشد کنید؟\n";
  intro += "🔴 *تهدیدها* — چه خطراتی در کمین است؟\n\n";
  intro += `📋 ${TOTAL_SWOT} سؤال — زمان تقریبی: ۱۰ دقیقه\n\n`;
  intro += "شروع می‌کنیم 👇";

  await ctx.reply(intro, { parse_mode: "Markdown" });
  await showSwotStep(ctx, userId, 0);
}

// ═══════════════════════════════════════════
// پاسخ گزینه‌ای SWOT
// ═══════════════════════════════════════════
async function handleSwotAnswer(ctx, idx, value) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  let temp = {};
  try { temp = JSON.parse(user.tempAnswers || "{}"); } catch { temp = {}; }

  const step = SWOT_STEPS[idx];
  if (step) temp[step.id] = value;

  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.answerCallbackQuery({ text: "✅ ثبت شد" });

  const next = idx + 1;
  if (next < TOTAL_SWOT) {
    await showSwotStep(ctx, userId, next);
  } else {
    await generateSwotReport(ctx, userId, temp);
  }
}

// ═══════════════════════════════════════════
// ورودی متنی SWOT
// ═══════════════════════════════════════════
async function handleSwotTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  if (
    user.currentStep === null ||
    user.currentStep === undefined ||
    user.currentStep < SWOT_STEP_BASE ||
    user.currentStep >= SWOT_STEP_BASE + TOTAL_SWOT
  ) return false;

  const idx  = user.currentStep - SWOT_STEP_BASE;
  const step = SWOT_STEPS[idx];
  if (!step || step.type !== "text") return false;

  const input = ctx.message.text.trim();

  // اعتبارسنجی
  const minMap = { min_10: 10, min_5: 5, min_3: 3, min_2: 2 };
  const minLen = minMap[step.validation] || 0;
  if (input.length < minLen) {
    await ctx.reply(`❌ لطفاً حداقل *${minLen} کاراکتر* بنویسید.`, { parse_mode: "Markdown" });
    return true;
  }

  let temp = {};
  try { temp = JSON.parse(user.tempAnswers || "{}"); } catch { temp = {}; }
  temp[step.id] = input;

  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.reply(`✅ *${step.title}* ثبت شد.`, { parse_mode: "Markdown" });

  const next = idx + 1;
  if (next < TOTAL_SWOT) {
    await showSwotStep(ctx, userId, next);
  } else {
    await generateSwotReport(ctx, userId, temp);
  }

  return true;
}

// ═══════════════════════════════════════════
// رد شدن
// ═══════════════════════════════════════════
async function handleSwotSkip(ctx, idx) {
  const userId = String(ctx.from.id);
  await ctx.answerCallbackQuery({ text: "⏭️ رد شد" });

  const next = idx + 1;
  if (next < TOTAL_SWOT) {
    await showSwotStep(ctx, userId, next);
  } else {
    const user = await getOrCreateUser(userId, ctx.from);
    let temp = {};
    try { temp = JSON.parse(user.tempAnswers || "{}"); } catch { temp = {}; }
    await generateSwotReport(ctx, userId, temp);
  }
}

// ═══════════════════════════════════════════
// برگشت
// ═══════════════════════════════════════════
async function handleSwotBack(ctx, idx) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showSwotStep(ctx, userId, Math.max(0, idx));
}

// ═══════════════════════════════════════════
// تولید گزارش SWOT
// ═══════════════════════════════════════════
async function generateSwotReport(ctx, userId, answers) {
  await updateUser(userId, { currentStep: null });

  const user = await getOrCreateUser(userId, ctx.from);
  let profile = {};
  try { profile = JSON.parse(user.candidateProfile || "{}"); } catch { profile = {}; }

  const name = profile.fullName || user.firstName || "کاندیدا";

  let r = "📊 *تحلیل SWOT کاندیداتوری*\n";
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  r += `👤 کاندیدا: *${name}*\n`;
  r += `📅 تاریخ: ${new Date().toLocaleDateString("fa-IR")}\n\n`;

  // ─── نقاط قوت ───
  r += "╔══════════════════════╗\n";
  r += "║  💪 نقاط قوت (Strengths)  ║\n";
  r += "╚══════════════════════╝\n\n";

  if (answers.s_expertise) r += `• تخصص: ${answers.s_expertise}\n`;
  if (answers.s_network) {
    const networkLabels = {
      elders: "معتمدین و بزرگان محلی",
      business: "اصناف و کسبه",
      family: "شبکه خانوادگی/قومی",
      educated: "تحصیل‌کردگان",
      youth: "جوانان",
      women: "بانوان",
      religious: "هیئت‌ها و مذهبی‌ها",
    };
    r += `• شبکه ارتباطی: ${networkLabels[answers.s_network] || answers.s_network}\n`;
  }
  if (answers.s_track_record && answers.s_track_record !== "ندارم") {
    r += `• سابقه خدمت: ${answers.s_track_record}\n`;
  }
  if (answers.s_unique) r += `• مزیت منحصربه‌فرد: ${answers.s_unique}\n`;
  r += "\n";

  // ─── نقاط ضعف ───
  r += "╔══════════════════════╗\n";
  r += "║  ⚠️ نقاط ضعف (Weaknesses)  ║\n";
  r += "╚══════════════════════╝\n\n";

  if (answers.w_recognition) {
    const recLabels = {
      high: "بیش از ۷۰% مردم شما را می‌شناسند ✅",
      medium_high: "۴۰ تا ۷۰% شناخته‌شدگی 🔵",
      medium: "۲۰ تا ۴۰% شناخته‌شدگی 🟡",
      low: "کمتر از ۲۰% شناخته‌شدگی 🟠",
      none: "تقریباً ناشناخته 🔴",
    };
    r += `• شناخته‌شدگی: ${recLabels[answers.w_recognition] || answers.w_recognition}\n`;
  }
  if (answers.w_resources) {
    const resLabels = {
      budget: "کمبود بودجه",
      team: "کمبود تیم و نیرو",
      time: "کمبود وقت",
      media: "ضعف رسانه‌ای",
      none: "کمبود منابع جدی ندارید",
    };
    r += `• کمبود اصلی: ${resLabels[answers.w_resources] || answers.w_resources}\n`;
  }
  if (answers.w_vulnerability) r += `• نقطه آسیب‌پذیر: ${answers.w_vulnerability}\n`;
  r += "\n";

  // ─── فرصت‌ها ───
  r += "╔════════════════════════╗\n";
  r += "║  🚀 فرصت‌ها (Opportunities)  ║\n";
  r += "╚════════════════════════╝\n\n";

  if (answers.o_problems) r += `• مشکل اصلی مردم (فرصت شما): ${answers.o_problems}\n`;
  if (answers.o_rival_gap) r += `• خلأ رقبا: ${answers.o_rival_gap}\n`;
  r += "\n";

  // ─── تهدیدها ───
  r += "╔════════════════════╗\n";
  r += "║  🔴 تهدیدها (Threats)  ║\n";
  r += "╚════════════════════╝\n\n";

  if (answers.t_main_rival) r += `• رقیب اصلی: ${answers.t_main_rival}\n`;
  if (answers.t_external) {
    const threatLabels = {
      coalition: "ائتلاف رقبا علیه شما",
      media: "رسانه‌های مخالف",
      budget_rival: "رقیب با بودجه بسیار بیشتر",
      rules: "تغییر قوانین انتخاباتی",
      distrust: "بی‌اعتمادی عمومی",
      rumors: "شایعات و اتهامات",
    };
    r += `• تهدید خارجی: ${threatLabels[answers.t_external] || answers.t_external}\n`;
  }
  r += "\n";

  // ─── تحلیل استراتژیک ───
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += "🧭 *توصیه‌های استراتژیک*\n\n";

  // توصیه بر اساس شناخته‌شدگی
  const recScore = { high: 80, medium_high: 55, medium: 30, low: 10, none: 2 }[answers.w_recognition] || 30;
  if (recScore < 30) {
    r += "1. 🔴 *اولویت اول: افزایش شناخته‌شدگی*\n";
    r += "   دیدارهای خانه‌به‌خانه و حضور در مراسم‌ها را از همین امروز شروع کنید.\n\n";
  }

  if (answers.w_resources === "team") {
    r += "2. 👥 *تیم‌سازی فوری*\n";
    r += "   حداقل ۵ نفر متعهد را برای هسته مرکزی کمپین جذب کنید.\n\n";
  }

  if (answers.o_problems) {
    r += "3. 🎯 *پیام محوری خود را بر اساس مشکل اصلی مردم بسازید*\n";
    r += `   مشکل: «${answers.o_problems.substring(0, 60)}...»\n`;
    r += "   این مشکل را محور شعار و برنامه خود کنید.\n\n";
  }

  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += "🤖 _کاندیداتوری هوشمند_";

  // ذخیره
  try {
    await saveConsultation(userId, {
      electionType:   profile.electionType || "",
      region:         profile.constituency || "",
      answers:        JSON.stringify(answers),
      score:          0,
      riskLevel:      "swot",
      finalReport:    r,
      fullName:       name,
      status:         "swot_complete",
    });
  } catch (e) {
    console.error("خطا در ذخیره SWOT:", e.message);
  }

  const kb = new InlineKeyboard()
    .text("🤖 استراتژی هوشمند (AI)", "swot:ai_insight").row()
    .text("⚔️ تحلیل رقبا", "rivals_menu").row()
    .text("📋 وعده‌های انتخاباتی", "promises_menu").row()
    .text("🗂️ مدیریت کمپین", "campaign_menu").row()
    .text("🔙 منوی اصلی", "menu").row();

  // اگر گزارش طولانی بود، تقسیم کن
  if (r.length > 4000) {
    const mid   = r.lastIndexOf("\n", 3900);
    const part1 = r.substring(0, mid);
    const part2 = r.substring(mid);

    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(part1, { parse_mode: "Markdown" });
      } else {
        await ctx.reply(part1, { parse_mode: "Markdown" });
      }
    } catch {
      await ctx.reply(part1, { parse_mode: "Markdown" });
    }
    await ctx.reply(part2, { parse_mode: "Markdown", reply_markup: kb });
  } else {
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(r, { parse_mode: "Markdown", reply_markup: kb });
      } else {
        await ctx.reply(r, { parse_mode: "Markdown", reply_markup: kb });
      }
    } catch {
      await ctx.reply(r, { parse_mode: "Markdown", reply_markup: kb });
    }
  }
}

// ═══════════════════════════════════════════
// استراتژی هوشمند (AI) بر اساس نتیجه‌ی SWOT
// ═══════════════════════════════════════════
async function handleSwotInsight(ctx) {
  const userId = String(ctx.from.id);
  const { generateAI, isAIConfigured } = require("../../utils/ai.js");
  const { swotInsightPrompt } = require("../../utils/ai-prompts.js");

  const backKb = new InlineKeyboard()
    .text("🔁 تلاش مجدد", "swot:ai_insight").row()
    .text("🔙 منوی اصلی", "menu");

  if (!isAIConfigured()) {
    try { await ctx.answerCallbackQuery({ text: "هوش مصنوعی پیکربندی نشده", show_alert: true }); } catch {}
    return;
  }

  let user, answers = {};
  try {
    user = await getOrCreateUser(userId, {});
    answers = JSON.parse(user.tempAnswers || "{}");
  } catch {}

  if (!answers || Object.keys(answers).length === 0) {
    try { await ctx.answerCallbackQuery({ text: "ابتدا تحلیل SWOT را کامل کنید", show_alert: true }); } catch {}
    return;
  }

  let profile = user.profile || user;
  if (typeof profile === "string") { try { profile = JSON.parse(profile); } catch {} }

  try {
    await ctx.answerCallbackQuery({ text: "🤖 در حال تدوین استراتژی…" });
    await ctx.reply("🤖 *در حال تدوین استراتژی هوشمند…*", { parse_mode: "Markdown" });
  } catch {}

  try {
    const { system, prompt } = swotInsightPrompt({ answers, profile });
    const aiText = await generateAI({ system, prompt });
    const text =
      "🤖 *استراتژی هوشمند کمپین (بر پایه SWOT)*\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      aiText +
      "\n\n_✨ تولیدشده با هوش مصنوعی_";
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: backKb });
  } catch (e) {
    console.error("[swot][AI] error:", e?.message || e);
    await ctx.reply("⚠️ تدوین استراتژی موقتاً ناموفق بود. دوباره تلاش کنید.", { reply_markup: backKb });
  }
}

module.exports = {
  handleSwotAnalysis,
  handleSwotAnswer,
  handleSwotTextInput,
  handleSwotSkip,
  handleSwotBack,
  handleSwotInsight,
  SWOT_STEP_BASE,
  TOTAL_SWOT,
};
