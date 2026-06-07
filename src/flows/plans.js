// src/flows/plans.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// مرحله ۱۰/۱ — نمایش و مدیریت بسته‌های خدماتی (فروش‌محور)
// ═══════════════════════════════════════════════════════════════
// قابلیت‌ها:
//   • نمایش لیست ۴ بسته (free / starter / professional / vip)
//   • نمایش جزئیات هر بسته با مزایا و قیمت
//   • مقایسه‌ی بسته‌ها در یک نگاه
//   • شروع فرایند خرید (ثبت لید + هدایت به پشتیبان)
//   • نمایش بسته‌ی فعلی کاربر
//
// State اختصاصی: ندارد (stateless)
// دسترسی: همگانی
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser, updateUser, upsertLead } = require("../utils/db.js");
const { PLANS, getPlan } = require("../constants/plans.js");

// ───────────────────────────────────────────────────────────────
// متن‌های بازاریابی برای هر بسته (متقاعدکننده)
// ───────────────────────────────────────────────────────────────
const PLAN_MARKETING = {
  free: {
    badge: "🆓",
    headline: "آغاز رایگان مسیر",
    tagline: "اولین قدم بدون هیچ هزینه",
    benefits: [
      "✅ ارزیابی پایه ۹ مرحله‌ای آمادگی",
      "✅ گزارش رایگان با امتیاز کلی",
      "✅ ۲ بخش اول هر کارت آموزشی",
      "✅ مشاهده‌ی منوی کامل امکانات",
    ],
    limitations: [
      "🔒 بدون تحلیل عمیق",
      "🔒 بدون داشبورد و مدیریت کمپین",
      "🔒 بدون تولید محتوا",
    ],
    cta: "🎯 شروع رایگان",
    closingPitch: "_بهترین راه برای آشنایی با امکانات سیستم_",
  },
  starter: {
    badge: "🚀",
    headline: "بسته راه‌اندازی کمپین",
    tagline: "همه‌ی ابزارهای پایه برای شروع جدی",
    benefits: [
      "✅ همه‌ی امکانات رایگان",
      "✅ پروفایل کامل کاندیدا (۱۵ فیلد)",
      "✅ تحلیل SWOT کامل",
      "✅ مدیریت رقبا (تا ۵ رقیب)",
      "✅ مدیریت وعده‌ها (تا ۱۰ وعده)",
      "✅ تولید محتوای پایه (پست، شعار، پیامک)",
      "✅ ۴ بخش اول هر کارت آموزشی",
      "✅ گزارش تفصیلی",
    ],
    limitations: [
      "🔒 بدون ارزیابی ریسک پیشرفته",
      "🔒 بدون گزارش PDF",
    ],
    cta: "🚀 خرید بسته راه‌اندازی",
    closingPitch: "_۸۰٪ کاندیداهای موفق با این بسته شروع کرده‌اند_",
  },
  professional: {
    badge: "⭐",
    headline: "بسته حرفه‌ای",
    tagline: "برای کاندیداهایی که جدی به پیروزی فکر می‌کنند",
    benefits: [
      "✅ همه‌ی امکانات بسته راه‌اندازی",
      "✅ ارزیابی ریسک کامل",
      "✅ تحلیل رسانه‌ای پیشرفته",
      "✅ داشبورد سلامت کمپین",
      "✅ مدیریت بحران",
      "✅ تولید بیانیه و سخنرانی",
      "✅ تمرین‌ها و نکات حرفه‌ای همه کارت‌ها",
      "✅ گزارش PDF قابل چاپ",
      "✅ گزارش مقایسه‌ای با ارزیابی‌های قبلی",
      "✅ تست‌های نامحدود",
    ],
    limitations: [
      "🔒 بدون تحلیل ۳۶۰ درجه",
      "🔒 بدون پشتیبانی اولویت‌دار",
    ],
    cta: "⭐ خرید بسته حرفه‌ای",
    closingPitch: "_انتخاب اول کاندیداهای حرفه‌ای_",
  },
  vip: {
    badge: "👑",
    headline: "بسته VIP",
    tagline: "تجربه‌ی کامل، بدون محدودیت",
    benefits: [
      "✅ همه‌ی امکانات بسته حرفه‌ای",
      "✅ تحلیل ۳۶۰ درجه کامل",
      "✅ گزارش شخصی‌سازی‌شده",
      "✅ پشتیبانی اولویت‌دار ۲۴/۷",
      "✅ مشاوره تلفنی اختصاصی",
      "✅ آپدیت‌های زودهنگام",
      "✅ دسترسی به ابزارهای آزمایشی",
      "✅ گزارش هفتگی شخصی‌سازی‌شده",
    ],
    limitations: [],
    cta: "👑 خرید بسته VIP",
    closingPitch: "_برای جدی‌ترین کاندیداها — جمعیت محدود_",
  },
};

// قیمت‌های نمایشی (می‌توانید از constants/plans.js بخوانید اگر آنجا هست)
const PLAN_PRICES = {
  free: { display: "رایگان", numeric: 0 },
  starter: { display: "۹۹۰,۰۰۰ تومان", numeric: 990000 },
  professional: { display: "۲,۹۰۰,۰۰۰ تومان", numeric: 2900000 },
  vip: { display: "۹,۹۰۰,۰۰۰ تومان", numeric: 9900000 },
};

const PLAN_ORDER = ["free", "starter", "professional", "vip"];

// ───────────────────────────────────────────────────────────────
// کمکی‌ها
// ───────────────────────────────────────────────────────────────
function getPlanMarketing(planId) {
  return PLAN_MARKETING[planId] || PLAN_MARKETING.free;
}

function getPlanPrice(planId) {
  return PLAN_PRICES[planId] || PLAN_PRICES.free;
}

function getPlanDisplayName(planId) {
  const m = getPlanMarketing(planId);
  return `${m.badge} ${m.headline}`;
}

// ───────────────────────────────────────────────────────────────
// هندلر ۱: نمایش لیست بسته‌ها
// ───────────────────────────────────────────────────────────────
async function handleShowPlans(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const currentPlan = user.purchasedPlan || "free";

  // ثبت آخرین تعامل
  await updateUser(userId, { lastInteractionNew: new Date().toISOString() });

  let text =
    "💎 *بسته‌های خدماتی کاندیداتوری هوشمند*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "هر بسته، متناسب با مرحله‌ای از مسیر شما طراحی شده است.\n\n" +
    `📍 *بسته فعلی شما:* ${getPlanDisplayName(currentPlan)}\n\n` +
    "_برای دیدن جزئیات هر بسته روی آن کلیک کنید:_\n";

  const kb = new InlineKeyboard();

  PLAN_ORDER.forEach((planId) => {
    const m = getPlanMarketing(planId);
    const price = getPlanPrice(planId);
    const isCurrent = planId === currentPlan;
    const label = `${m.badge} ${m.headline}${isCurrent ? " ✓" : ""} — ${price.display}`;
    kb.text(label, `plans:view:${planId}`).row();
  });

  kb.text("📊 مقایسه‌ی همه بسته‌ها", "plans:compare").row();
  kb.text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// هندلر ۲: نمایش جزئیات یک بسته
// ───────────────────────────────────────────────────────────────
async function handleViewPlan(ctx, planId) {
  const m = getPlanMarketing(planId);
  const price = getPlanPrice(planId);

  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const currentPlan = user.purchasedPlan || "free";
  const isCurrent = planId === currentPlan;

  const benefitsText = m.benefits.join("\n");
  const limitationsText = m.limitations.length
    ? "\n\n*⚠️ محدودیت‌ها:*\n" + m.limitations.join("\n")
    : "";

  let text =
    `${m.badge} *${m.headline}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `_${m.tagline}_\n\n` +
    `💰 *قیمت:* ${price.display}\n\n` +
    `*✨ مزایا:*\n${benefitsText}` +
    `${limitationsText}\n\n` +
    `${m.closingPitch}`;

  if (isCurrent) {
    text += "\n\n✅ *این بسته فعلی شماست.*";
  }

  const kb = new InlineKeyboard();

  if (planId !== "free" && !isCurrent) {
    kb.text(m.cta, `plans:buy:${planId}`).row();
  }
  if (planId === "free" && !isCurrent) {
    kb.text(m.cta, "menu").row();
  }

  kb.text("📊 مقایسه", "plans:compare").row();
  kb.text("⬅️ بازگشت", "plans:list").row();
  kb.text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// هندلر ۳: مقایسه‌ی بسته‌ها در یک نگاه
// ───────────────────────────────────────────────────────────────
async function handleComparePlans(ctx) {
  const text =
    "📊 *مقایسه‌ی بسته‌ها در یک نگاه*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "| امکان | 🆓 | 🚀 | ⭐ | 👑 |\n" +
    "|---|:---:|:---:|:---:|:---:|\n" +
    "| ارزیابی پایه | ✅ | ✅ | ✅ | ✅ |\n" +
    "| پروفایل کامل | ❌ | ✅ | ✅ | ✅ |\n" +
    "| SWOT | ❌ | ✅ | ✅ | ✅ |\n" +
    "| مدیریت رقبا | ❌ | ۵ | ۲۰ | ∞ |\n" +
    "| مدیریت وعده‌ها | ❌ | ۱۰ | ۳۰ | ∞ |\n" +
    "| تولید پست/شعار | ❌ | ✅ | ✅ | ✅ |\n" +
    "| تولید سخنرانی | ❌ | ❌ | ✅ | ✅ |\n" +
    "| تولید بیانیه | ❌ | ❌ | ✅ | ✅ |\n" +
    "| داشبورد سلامت | ❌ | ❌ | ✅ | ✅ |\n" +
    "| مدیریت بحران | ❌ | ❌ | ✅ | ✅ |\n" +
    "| ارزیابی ریسک | ❌ | ❌ | ✅ | ✅ |\n" +
    "| گزارش PDF | ❌ | ❌ | ✅ | ✅ |\n" +
    "| تحلیل ۳۶۰° | ❌ | ❌ | ❌ | ✅ |\n" +
    "| پشتیبانی ۲۴/۷ | ❌ | ❌ | ❌ | ✅ |\n" +
    "| مشاوره تلفنی | ❌ | ❌ | ❌ | ✅ |\n\n" +
    "💰 *قیمت‌ها:*\n" +
    `   🆓 رایگان\n` +
    `   🚀 ${PLAN_PRICES.starter.display}\n` +
    `   ⭐ ${PLAN_PRICES.professional.display}\n` +
    `   👑 ${PLAN_PRICES.vip.display}\n\n` +
    "_برای خرید، یکی از بسته‌ها را انتخاب کنید:_";

  const kb = new InlineKeyboard()
    .text("🚀 راه‌اندازی", "plans:view:starter")
    .text("⭐ حرفه‌ای", "plans:view:professional").row()
    .text("👑 VIP", "plans:view:vip").row()
    .text("⬅️ بازگشت", "plans:list").row()
    .text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// هندلر ۴: شروع خرید (ثبت لید + هدایت به پشتیبان)
// ───────────────────────────────────────────────────────────────
async function handleBuyPlan(ctx, planId) {
  if (planId === "free") {
    await ctx.answerCallbackQuery({ text: "این بسته رایگان است", show_alert: false });
    return;
  }

  const m = getPlanMarketing(planId);
  const price = getPlanPrice(planId);
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});

  // ثبت لید
  try {
    await upsertLead({
      userId,
      planId,
      planName: m.headline,
      priceNumeric: price.numeric,
      priceDisplay: price.display,
      username: ctx.from.username || null,
      firstName: ctx.from.first_name || null,
      lastName: ctx.from.last_name || null,
      phone: user.phone || null,
      nationalId: user.nationalId || null,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
  } catch (e) {
    console.error("[plans] upsertLead error:", e);
  }

  // به‌روزرسانی آخرین تعامل
  await updateUser(userId, { lastInteractionNew: new Date().toISOString() });

  const supportUsername = "candidatory_support";
  const orderRef = `ORD-${userId.slice(-6)}-${Date.now().toString().slice(-6)}`;

  const text =
    `🛒 *سفارش شما ثبت شد*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📦 *بسته:* ${m.badge} ${m.headline}\n` +
    `💰 *مبلغ:* ${price.display}\n` +
    `🔖 *کد سفارش:* \`${orderRef}\`\n\n` +
    `📞 *مراحل بعدی:*\n\n` +
    `۱) با پشتیبانی ما در ارتباط باشید:\n` +
    `   👈 @${supportUsername.replace(/_/g, "\\_")}\n\n` +
    `۲) کد سفارش بالا را برای پشتیبانی ارسال کنید.\n\n` +
    `۳) راهنمای پرداخت برای شما ارسال خواهد شد.\n\n` +
    `۴) پس از تأیید پرداخت، بسته در حساب شما فعال می‌شود (حداکثر ۱ ساعت).\n\n` +
    `_⚡ پشتیبانی ما در ساعات اداری در زیر ۱۵ دقیقه پاسخگو است._`;

  const kb = new InlineKeyboard()
    .url(`💬 ارتباط با پشتیبانی`, `https://t.me/${supportUsername}`).row()
    .text("📋 مشاهده بسته‌های دیگر", "plans:list").row()
    .text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery({ text: "✅ سفارش ثبت شد", show_alert: false });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// روتر یکپارچه callback های plans:*
// ───────────────────────────────────────────────────────────────
async function handlePlansCallback(ctx) {
  const data = ctx.callbackQuery?.data || "";
  const parts = data.split(":");

  if (parts[0] !== "plans") return;

  try {
    const action = parts[1];

    if (action === "list") {
      return handleShowPlans(ctx);
    }
    if (action === "view") {
      return handleViewPlan(ctx, parts[2]);
    }
    if (action === "compare") {
      return handleComparePlans(ctx);
    }
    if (action === "buy") {
      return handleBuyPlan(ctx, parts[2]);
    }

    await ctx.answerCallbackQuery({ text: "عملیات نامعتبر", show_alert: false });
  } catch (e) {
    console.error("[plans] callback error:", e);
    try {
      await ctx.answerCallbackQuery({ text: "خطا در پردازش", show_alert: true });
    } catch {}
  }
}

module.exports = {
  handleShowPlans,
  handleViewPlan,
  handleComparePlans,
  handleBuyPlan,
  handlePlansCallback,
  PLAN_MARKETING,
  PLAN_PRICES,
  PLAN_ORDER,
  getPlanDisplayName,
};
