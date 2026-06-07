// src/main.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// مرحله ۱۱ — نقطه ورود ربات کاندیداتوری هوشمند
// ═══════════════════════════════════════════════════════════════
// سازگار با Appwrite Functions (Node.js runtime)
// همچنین قابل اجرا به صورت standalone (long-polling) با: node src/main.js
//
// نسخه ۲.۰ — معماری جدید با ۱۲ فلوی مستقل:
//   onboarding | readiness | swot | dashboard | rivals | promises |
//   crisis | content | educational | plans | history | contact | admin
// ═══════════════════════════════════════════════════════════════

const { Bot, InlineKeyboard, webhookCallback } = require("grammy");

// ───────────────────────────────────────────────────────────────
// ماژول‌ها (ترتیب: utils → flows)
// ───────────────────────────────────────────────────────────────
const { getOrCreateUser, updateUser, initDB } = require("./utils/db.js");
const { requireAccess } = require("./utils/access.js");
const { mainMenuKB, analysisMenuKB } = require("./utils/keyboard.js");
const { isAdminUserSync } = require("./utils/admin-auth.js");
const { registerCompatRoutes } = require("./flows/router-compat.js");

// ─── بارگذاری امن فلوها ─────────────────────────────────────────
// اگر فایلی هنوز در پروژه نباشد، crash نمی‌کنیم؛ یک stub قرار می‌دهیم
// تا callbackها به جای fallback مبهم، یک پیام «در حال توسعه» بدهند.
// ───────────────────────────────────────────────────────────────
function safeRequire(path, name) {
  try {
    return require(path);
  } catch (e) {
    console.warn(`⚠️  ماژول ${name} بارگذاری نشد (${path}): ${e.message}`);
    return null;
  }
}

const onboarding  = safeRequire("./flows/onboarding.js",           "onboarding")  || {};
const readiness   = safeRequire("./flows/analysis/readiness.js",   "readiness")   || {};
const swot        = safeRequire("./flows/analysis/swot.js",        "swot")        || {};
const dashboard   = safeRequire("./flows/dashboard.js",            "dashboard")   || {};
const rivals      = safeRequire("./flows/campaign/rivals.js",      "rivals")      || {};
const promises    = safeRequire("./flows/campaign/promises.js",    "promises")    || {};
const crisis      = safeRequire("./flows/campaign/crisis.js",      "crisis")      || {};
const content     = safeRequire("./flows/content/generator.js",    "content")     || {};
const educational = safeRequire("./flows/educational.js",          "educational") || {};
const plans       = safeRequire("./flows/plans.js",                "plans")       || {};
const history     = safeRequire("./flows/history.js",              "history")     || {};
const contact     = safeRequire("./flows/contact.js",              "contact")     || {};
const admin       = safeRequire("./flows/admin.js",                "admin")       || {};

// کمکی: ارسال پیام «در حال توسعه» برای فلوهایی که هنوز کد ندارند
async function notReady(ctx, featureName) {
  const text =
    `🚧 *${featureName}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `این بخش در حال توسعه است و به زودی فعال می‌شود.\n\n` +
    `_لطفاً از بخش‌های فعال دیگر استفاده کنید._`;
  const kb = new InlineKeyboard().text("🏠 بازگشت به منو", "menu");

  try {
    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
      } catch {
        await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
      }
      try { await ctx.answerCallbackQuery(); } catch {}
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch (e) {
    console.error("[notReady] error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// ۱) ساخت bot با مدیریت خطای "Bot not initialized"
// ═══════════════════════════════════════════════════════════════
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN در Environment Variables تنظیم نشده");
  throw new Error("BOT_TOKEN is required");
}

// در محیط serverless (Appwrite Function)، استفاده از BOT_INFO استاتیک
// از تماس‌های اضافی به API تلگرام و خطای "Bot not initialized" جلوگیری می‌کند
let botInfo;
if (process.env.BOT_INFO) {
  try {
    botInfo = JSON.parse(process.env.BOT_INFO);
  } catch (e) {
    console.warn("⚠️ BOT_INFO نامعتبر؛ از API دریافت می‌شود.");
  }
}

const bot = new Bot(BOT_TOKEN, botInfo ? { botInfo } : undefined);

// ───────────────────────────────────────────────────────────────
// پاکسازی چیدمان کیبوردها (رفع «جایگیری بد آیتم‌ها»)
// بسیاری از کیبوردها به‌خاطر الگوی .text(...).row() در آخرین دکمه،
// یک ردیف خالی اضافه در انتها داشتند که باعث چیدمان/فاصله‌ی نامرتب
// می‌شد. این transformer قبل از ارسال، همه‌ی ردیف‌های خالی را حذف می‌کند.
// ───────────────────────────────────────────────────────────────
bot.api.config.use(async (prev, method, payload, signal) => {
  try {
    const rm = payload && payload.reply_markup;
    if (rm && Array.isArray(rm.inline_keyboard)) {
      rm.inline_keyboard = rm.inline_keyboard.filter(
        (row) => Array.isArray(row) && row.length > 0
      );
    }
  } catch {}
  return prev(method, payload, signal);
});

// ═══════════════════════════════════════════════════════════════
// ۲) Middleware جهانی: خطایابی و log
// ═══════════════════════════════════════════════════════════════
bot.use(async (ctx, next) => {
  const t0 = Date.now();
  try {
    await next();
    const dt = Date.now() - t0;
    if (dt > 2000) {
      console.warn(`⏱ کند: ${ctx.update.update_id} — ${dt}ms`);
    }
  } catch (e) {
    console.error("[middleware] error:", e);
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({ text: "خطا رخ داد", show_alert: false });
      } else if (ctx.message) {
        await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره تلاش کنید یا /start بزنید.");
      }
    } catch {}
  }
});

// به‌روزرسانی lastInteractionNew برای هر پیام
bot.use(async (ctx, next) => {
  try {
    if (ctx.from?.id) {
      const userId = String(ctx.from.id);
      // بدون await در پس‌زمینه (برای کاهش latency)
      updateUser(userId, { lastInteractionNew: new Date().toISOString() })
        .catch(() => {});
    }
  } catch {}
  await next();
});

// ═══════════════════════════════════════════════════════════════
// ۳) دستورات اصلی
// ═══════════════════════════════════════════════════════════════

// /start — راهنمای ورود اول (برای کاربر جدید) یا منوی اصلی
bot.command("start", async (ctx) => {
  const userId = String(ctx.from.id);

  // ساخت/بازیابی کاربر
  const user = await getOrCreateUser(userId, {
    firstName: ctx.from.first_name || null,
    lastName: ctx.from.last_name || null,
    username: ctx.from.username || null,
    createdAt: new Date().toISOString(),
  });

  // پاک کردن state در حال انجام (در صورت وجود)
  await updateUser(userId, { currentStep: null, tempAnswers: "{}" });

  // ─── راهنمای ورود اول ───
  // اگر کاربر تا به حال راهنما را ندیده (onboardingSeen تنظیم نشده)،
  // به جای منوی اصلی، صفحه‌ی خوش‌آمد + شمای کلی ربات را نشان می‌دهیم.
  if (!user.onboardingSeen) {
    return showWelcomeGuide(ctx);
  }

  await showMainMenu(ctx);
});

// دکمه‌ی «شروع» در صفحه‌ی خوش‌آمد → علامت‌گذاری دیده‌شدن راهنما و ورود به منو
bot.callbackQuery("welcome_start", async (ctx) => {
  const userId = String(ctx.from.id);
  try {
    await updateUser(userId, { onboardingSeen: true });
  } catch (e) {
    // اگر فیلد onboardingSeen در دیتابیس نباشد، باز هم منو را نشان می‌دهیم
    console.warn("[welcome] onboardingSeen warn:", e?.message || e);
  }
  await showMainMenu(ctx);
});

// نمایش مجدد راهنما با دکمه/دستور
bot.callbackQuery("show_guide", async (ctx) => {
  await showWelcomeGuide(ctx);
});

// /menu — همان منوی اصلی
bot.command("menu", async (ctx) => {
  await showMainMenu(ctx);
});

// /help — راهنما
bot.command("help", async (ctx) => {
  const text =
    "🆘 *راهنمای ربات کاندیداتوری هوشمند*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "*دستورات:*\n" +
    "   /start — شروع و منوی اصلی\n" +
    "   /menu — نمایش منو\n" +
    "   /profile — پروفایل کاندیدای شما\n" +
    "   /dashboard — داشبورد کمپین\n" +
    "   /help — این راهنما\n" +
    "   /cancel — لغو عملیات جاری\n\n" +
    "*مسیر پیشنهادی:*\n" +
    "   ۱) پروفایل کاندیدا را تکمیل کنید\n" +
    "   ۲) ارزیابی آمادگی را انجام دهید\n" +
    "   ۳) تحلیل SWOT بگیرید\n" +
    "   ۴) رقبا و وعده‌ها را ثبت کنید\n" +
    "   ۵) داشبورد سلامت کمپین را ببینید\n\n" +
    "*پشتیبانی:* @candidatory\\_support";

  await ctx.reply(text, { parse_mode: "Markdown" });
});

// /cancel — لغو هر state در حال انجام
bot.command("cancel", async (ctx) => {
  const userId = String(ctx.from.id);
  await updateUser(userId, { currentStep: null, tempAnswers: "{}" });
  await ctx.reply("✅ عملیات جاری لغو شد.");
  await showMainMenu(ctx);
});

// /profile — پروفایل کاندیدا
bot.command("profile", async (ctx) => {
  if (typeof onboarding.handleProfileMenu === "function") {
    return onboarding.handleProfileMenu(ctx);
  }
  if (typeof onboarding.handleStartOnboarding === "function") {
    return onboarding.handleStartOnboarding(ctx);
  }
  await ctx.reply("⚠️ فلوی پروفایل در دسترس نیست.");
});

// /dashboard — داشبورد سلامت
bot.command("dashboard", async (ctx) => {
  if (typeof dashboard.handleShowDashboard === "function") {
    return dashboard.handleShowDashboard(ctx);
  }
  if (typeof dashboard.handleDashboard === "function") {
    return dashboard.handleDashboard(ctx);
  }
  await ctx.reply("⚠️ داشبورد در دسترس نیست.");
});

// /admin — پنل ادمین (با کنترل دسترسی داخلی)
bot.command("admin", async (ctx) => {
  return admin.handleAdminPanel(ctx);
});

// ═══════════════════════════════════════════════════════════════
// ۴‑الف) صفحه‌ی خوش‌آمد و راهنمای ورود اول
// ═══════════════════════════════════════════════════════════════
async function showWelcomeGuide(ctx) {
  const name = ctx.from.first_name || "هم‌میهن";

  const text =
    `🏛️ *به «کاندیداتوری هوشمند» خوش آمدید، ${name} عزیز!*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `این ربات، *دستیار جامع کمپین انتخاباتی* شماست؛ از سنجش آمادگی تا مدیریت رقبا، تولید محتوا و آموزش تخصصی.\n\n` +
    `🗺️ *شمای کلی کار ربات:*\n\n` +
    `1️⃣ *ارزیابی آمادگی* — با پاسخ به ۹ پرسش علمی، امتیاز آمادگی و نقاط قوت/ضعف خود را بگیرید.\n` +
    `2️⃣ *تحلیل و داشبورد* — تحلیل SWOT و داشبورد سلامت کمپین.\n` +
    `3️⃣ *مدیریت کمپین* — رقبا، وعده‌ها، تیم و مدیریت بحران.\n` +
    `4️⃣ *تولید محتوا* — پست، بیانیه، سخنرانی و پاسخ به انتقاد.\n` +
    `5️⃣ *آموزش تخصصی* — کارت‌های آموزشی کاربردی برای کمپین.\n\n` +
    `🎁 *به‌صورت رایگان می‌توانید* همین حالا ارزیابی آمادگی کامل را انجام دهید و امتیاز کلی‌تان را ببینید.\n\n` +
    `💡 *نکته:* هر وقت گم شدید، کافیست /menu را بزنید یا /help را ببینید.\n\n` +
    `👇 برای شروع، دکمه‌ی زیر را بزنید:`;

  const kb = new InlineKeyboard()
    .text("🚀 شروع کار با ربات", "welcome_start").row()
    .text("🆘 راهنمای کامل", "show_guide").row();

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
    try { await ctx.answerCallbackQuery(); } catch {}
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════════════════════════
// ۴) نمایش منوی اصلی
// ═══════════════════════════════════════════════════════════════
async function showMainMenu(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});

  const greetingName = user.firstName || ctx.from.first_name || "هم‌میهن";
  const isAdmin = isAdminUserSync(user);
  const planLabel = isAdmin
    ? "🛠 ادمین (دسترسی کامل)"
    : ({
        none: "🆓 رایگان",
        free: "🆓 رایگان",
        starter: "🚀 راه‌اندازی",
        professional: "⭐ حرفه‌ای",
        vip: "👑 VIP",
      }[user.purchasedPlan || "free"] || "🆓 رایگان");

  const text =
    `👋 *سلام ${greetingName} عزیز!*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎯 *کاندیداتوری هوشمند* — دستیار جامع کمپین انتخاباتی شما\n\n` +
    `💎 *بسته فعلی:* ${planLabel}\n\n` +
    `_بخش مورد نظر را انتخاب کنید:_`;

  const kb = (typeof mainMenuKB === "function")
    ? mainMenuKB(user)
    : new InlineKeyboard()
        .text("👤 پروفایل کاندیدا", "menu_profile").row()
        .text("🎯 ارزیابی و تحلیل", "menu_analysis").row()
        .text("📊 داشبورد کمپین", "menu_dashboard").row()
        .text("🏛 مدیریت کمپین", "menu_campaign").row()
        .text("✍️ تولید محتوا", "menu_content").row()
        .text("🎓 آموزش", "menu_education").row()
        .text("📜 تاریخچه", "menu_history").row()
        .text("💎 بسته‌ها", "menu_plans").row()
        .text("ℹ️ درباره / تماس", "menu_contact");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    try { await ctx.answerCallbackQuery(); } catch {}
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════════════════════════
// ۵) callbackهای منوی اصلی
// ═══════════════════════════════════════════════════════════════
// نکته مهم: علاوه بر اسامی جدید (menu_xxx) و namespace جدید (rivals:menu)،
// alias های callback های قدیمی keyboard.js (مثل dashboard, profile,
// start_consultation, show_history, show_plans, ...) هم پشتیبانی می‌شوند
// تا با هر نسخه از keyboard.js کار کند.
// ═══════════════════════════════════════════════════════════════

// ─── منوی اصلی ─────────────────────────────────────────────────
const MENU_ALIASES = ["menu", "main_menu", "back_to_menu", "home"];
MENU_ALIASES.forEach((cb) => bot.callbackQuery(cb, showMainMenu));

// ─── پروفایل کاندیدا ───────────────────────────────────────────
const PROFILE_HANDLER = async (ctx) => {
  if (typeof onboarding.handleProfileMenu === "function")
    return onboarding.handleProfileMenu(ctx);
  if (typeof onboarding.handleStartOnboarding === "function")
    return onboarding.handleStartOnboarding(ctx);
  return notReady(ctx, "پروفایل کاندیدا");
};
["menu_profile", "profile", "show_profile", "candidate_profile"]
  .forEach((cb) => bot.callbackQuery(cb, PROFILE_HANDLER));

// ─── ارزیابی و تحلیل (منوی واسط) ──────────────────────────────
const ANALYSIS_MENU_HANDLER = async (ctx) => {
  const text =
    "🎯 *ارزیابی و تحلیل*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "نوع ارزیابی را انتخاب کنید:";

  const kb = (typeof analysisMenuKB === "function")
    ? analysisMenuKB()
    : new InlineKeyboard()
        .text("🎯 ارزیابی آمادگی (۹ مرحله)", "analysis_readiness").row()
        .text("🧭 تحلیل SWOT", "analysis_swot").row()
        .text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
    try { await ctx.answerCallbackQuery(); } catch {}
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
};
["menu_analysis", "show_assessments", "assessments_menu"]
  .forEach((cb) => bot.callbackQuery(cb, ANALYSIS_MENU_HANDLER));

// ─── شروع ارزیابی آمادگی ──────────────────────────────────────
const READINESS_HANDLER = async (ctx) => {
  if (typeof readiness.handleStartReadiness === "function")
    return readiness.handleStartReadiness(ctx);
  if (typeof readiness.handleStartConsultation === "function")
    return readiness.handleStartConsultation(ctx);
  return notReady(ctx, "ارزیابی آمادگی ۹ مرحله‌ای");
};
["analysis_readiness", "start_consultation", "start_assessment", "readiness:start"]
  .forEach((cb) => bot.callbackQuery(cb, READINESS_HANDLER));

// ─── شروع SWOT ────────────────────────────────────────────────
const SWOT_HANDLER = async (ctx) => {
  if (typeof swot.handleStartSwot === "function")
    return swot.handleStartSwot(ctx);
  return notReady(ctx, "تحلیل SWOT");
};
["analysis_swot", "start_swot", "swot:start"]
  .forEach((cb) => bot.callbackQuery(cb, SWOT_HANDLER));

// ─── داشبورد ──────────────────────────────────────────────────
const DASHBOARD_HANDLER = async (ctx) => {
  if (typeof dashboard.handleShowDashboard === "function")
    return dashboard.handleShowDashboard(ctx);
  if (typeof dashboard.handleDashboardMenu === "function")
    return dashboard.handleDashboardMenu(ctx);
  // نام واقعی تابع در فلوی داشبورد: handleDashboard
  if (typeof dashboard.handleDashboard === "function")
    return dashboard.handleDashboard(ctx);
  return notReady(ctx, "داشبورد سلامت کمپین");
};
["menu_dashboard", "dashboard", "show_dashboard", "campaign_dashboard"]
  .forEach((cb) => bot.callbackQuery(cb, DASHBOARD_HANDLER));

// ─── مدیریت کمپین (منوی واسط) ─────────────────────────────────
const CAMPAIGN_MENU_HANDLER = async (ctx) => {
  const text =
    "🏛 *مدیریت کمپین*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "بخش مورد نظر را انتخاب کنید:";

  const kb = new InlineKeyboard()
    .text("👤 پروفایل کاندیدا", "candidate_profile").row()
    .text("🧭 تحلیل SWOT", "swot_analysis").row()
    .text("⚔️ رقبا", "rivals_menu")
    .text("📋 وعده‌ها", "promises_menu").row()
    .text("🚨 مدیریت بحران", "crisis_menu").row()
    .text("✍️ تولید محتوا", "content:menu").row()
    .text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
    try { await ctx.answerCallbackQuery(); } catch {}
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
};
["menu_campaign", "campaign", "show_campaign", "campaign_menu"]
  .forEach((cb) => bot.callbackQuery(cb, CAMPAIGN_MENU_HANDLER));

// ─── ورودی‌های مستقیم مدیریت کمپین (alias های قدیمی) ─────────
["rivals", "show_rivals"].forEach((cb) => bot.callbackQuery(cb, async (ctx) => {
  if (typeof rivals.handleRivalsMenu === "function") return rivals.handleRivalsMenu(ctx);
  if (typeof rivals.handleShowRivals === "function") return rivals.handleShowRivals(ctx);
  return notReady(ctx, "مدیریت رقبا");
}));
["promises", "show_promises"].forEach((cb) => bot.callbackQuery(cb, async (ctx) => {
  if (typeof promises.handlePromisesMenu === "function") return promises.handlePromisesMenu(ctx);
  if (typeof promises.handleShowPromises === "function") return promises.handleShowPromises(ctx);
  return notReady(ctx, "مدیریت وعده‌ها");
}));
["crisis", "show_crisis"].forEach((cb) => bot.callbackQuery(cb, async (ctx) => {
  if (typeof crisis.handleCrisisMenu === "function") return crisis.handleCrisisMenu(ctx);
  if (typeof crisis.handleShowCrisis === "function") return crisis.handleShowCrisis(ctx);
  return notReady(ctx, "مدیریت بحران");
}));

// ─── تولید محتوا ──────────────────────────────────────────────
const CONTENT_HANDLER = async (ctx) => {
  if (typeof content.handleContentMenu === "function")
    return content.handleContentMenu(ctx);
  return notReady(ctx, "تولید محتوا");
};
["menu_content", "content", "show_content", "content_menu"]
  .forEach((cb) => bot.callbackQuery(cb, CONTENT_HANDLER));

// ─── آموزش ────────────────────────────────────────────────────
const EDUCATION_HANDLER = async (ctx) => {
  if (typeof educational.handleShowEducationList === "function")
    return educational.handleShowEducationList(ctx, 0);
  return notReady(ctx, "مرکز آموزش");
};
["menu_education", "show_education", "education", "educational"]
  .forEach((cb) => bot.callbackQuery(cb, EDUCATION_HANDLER));

// ─── تاریخچه ──────────────────────────────────────────────────
const HISTORY_HANDLER = async (ctx) => {
  if (typeof history.handleShowHistory === "function")
    return history.handleShowHistory(ctx, 0, "all");
  return notReady(ctx, "تاریخچه تحلیل‌ها");
};
["menu_history", "show_history", "history"]
  .forEach((cb) => bot.callbackQuery(cb, HISTORY_HANDLER));

// ─── بسته‌ها ──────────────────────────────────────────────────
const PLANS_HANDLER = async (ctx) => {
  if (typeof plans.handleShowPlans === "function")
    return plans.handleShowPlans(ctx);
  return notReady(ctx, "بسته‌های خدماتی");
};
["menu_plans", "show_plans", "plans", "buy_plan"]
  .forEach((cb) => bot.callbackQuery(cb, PLANS_HANDLER));

// ─── درباره / تماس / نمونه‌ها (alias های کامل) ────────────────
const ABOUT_HANDLER = async (ctx) => {
  if (typeof contact.handleAboutUs === "function")
    return contact.handleAboutUs(ctx);
  return notReady(ctx, "درباره ما");
};
["menu_contact", "about_us", "about"]
  .forEach((cb) => bot.callbackQuery(cb, ABOUT_HANDLER));

bot.callbackQuery("contact_us", async (ctx) => {
  if (typeof contact.handleContactUs === "function")
    return contact.handleContactUs(ctx);
  return notReady(ctx, "ارتباط با ما");
});

bot.callbackQuery("sample_reports", async (ctx) => {
  if (typeof contact.handleSampleReports === "function")
    return contact.handleSampleReports(ctx);
  return notReady(ctx, "نمونه گزارش‌ها");
});

bot.callbackQuery("faq", async (ctx) => {
  if (typeof contact.handleFAQMenu === "function")
    return contact.handleFAQMenu(ctx);
  return notReady(ctx, "سوالات متداول");
});

// ─── ادمین (alias) ────────────────────────────────────────────
["admin_panel", "admin"].forEach((cb) => bot.callbackQuery(cb, async (ctx) => {
  if (typeof admin.handleAdminPanel === "function")
    return admin.handleAdminPanel(ctx);
  return notReady(ctx, "پنل ادمین");
}));

// ═══════════════════════════════════════════════════════════════
// ۶) روترهای callback برای فلوها (با regex)
// ═══════════════════════════════════════════════════════════════

// فلوهای جدید با namespace‌بندی
bot.callbackQuery(/^onboarding:/, async (ctx) => {
  if (typeof onboarding.handleOnboardingCallback === "function") {
    return onboarding.handleOnboardingCallback(ctx);
  }
  if (typeof onboarding.handleProfileMenu === "function") return onboarding.handleProfileMenu(ctx);
});

bot.callbackQuery(/^readiness:/, async (ctx) => {
  if (typeof readiness.handleReadinessCallback === "function") {
    return readiness.handleReadinessCallback(ctx);
  }
  const data = ctx.callbackQuery?.data || "";
  // تحلیل هوشمند (AI) روی نتیجه‌ی ارزیابی
  if (data === "readiness:ai_insight" && typeof readiness.handleAiInsight === "function") {
    return readiness.handleAiInsight(ctx);
  }
  // readiness:start → شروع ارزیابی
  if (typeof readiness.handleStartConsultation === "function") {
    return readiness.handleStartConsultation(ctx);
  }
});

bot.callbackQuery(/^swot:/, async (ctx) => {
  if (typeof swot.handleSwotCallback === "function") {
    return swot.handleSwotCallback(ctx);
  }
  const data = ctx.callbackQuery?.data || "";
  // استراتژی هوشمند (AI) روی نتیجه SWOT
  if (data === "swot:ai_insight" && typeof swot.handleSwotInsight === "function") {
    return swot.handleSwotInsight(ctx);
  }
  // fallback: swot:start / swot:menu → شروع تحلیل SWOT
  if (typeof swot.handleSwotAnalysis === "function") return swot.handleSwotAnalysis(ctx);
});

bot.callbackQuery(/^dashboard:/, async (ctx) => {
  if (typeof dashboard.handleDashboardCallback === "function") {
    return dashboard.handleDashboardCallback(ctx);
  }
  if (typeof dashboard.handleDashboard === "function") return dashboard.handleDashboard(ctx);
});

bot.callbackQuery(/^rivals:/, async (ctx) => {
  if (typeof rivals.handleRivalsCallback === "function") {
    return rivals.handleRivalsCallback(ctx);
  }
  // fallback: rivals:menu → منوی رقبا (نام تابع واقعی متفاوت است)
  if (typeof rivals.handleRivalsMenu === "function") return rivals.handleRivalsMenu(ctx);
});

bot.callbackQuery(/^promises:/, async (ctx) => {
  if (typeof promises.handlePromisesCallback === "function") {
    return promises.handlePromisesCallback(ctx);
  }
  if (typeof promises.handlePromisesMenu === "function") return promises.handlePromisesMenu(ctx);
});

bot.callbackQuery(/^crisis:/, async (ctx) => {
  if (typeof crisis.handleCrisisCallback === "function") {
    return crisis.handleCrisisCallback(ctx);
  }
  if (typeof crisis.handleCrisisMenu === "function") return crisis.handleCrisisMenu(ctx);
});

bot.callbackQuery(/^content:/, content.handleContentCallback);
bot.callbackQuery(/^edu:/,     educational.handleEducationCallback);
bot.callbackQuery(/^plans:/,   plans.handlePlansCallback);
bot.callbackQuery(/^history:/, history.handleHistoryCallback);
bot.callbackQuery(/^contact:/, contact.handleContactCallback);
bot.callbackQuery(/^admin:/,   admin.handleAdminCallback);

// ═══════════════════════════════════════════════════════════════
// ۶‑الف) روتر سازگاری: وصل کردن callbackهای legacy فلوها
// (rival_add, swot_ans:.., prf:.., profile_create, edu_list, ...)
// به توابع واقعیِ هر فلو. بدون این، این دکمه‌ها به fallback
// «در حال توسعه» می‌رسیدند و بخش‌های کمپین/پروفایل/SWOT خالی به‌نظر می‌رسید.
// ═══════════════════════════════════════════════════════════════
registerCompatRoutes(bot, {
  onboarding, readiness, swot, rivals, promises, crisis, dashboard, educational,
});

// ═══════════════════════════════════════════════════════════════
// ۷) ورودی پیام متنی — اولویت‌بندی فلوها
// هر فلو که برمی‌گرداند true یعنی پیام را خورد و نباید به بعدی برود.
// ═══════════════════════════════════════════════════════════════
bot.on("message:text", async (ctx) => {
  const text = ctx.message?.text || "";

  // پیام دستوری از قبل توسط bot.command پردازش شده — اگر اینجا رسید یعنی متن آزاد است
  if (text.startsWith("/")) {
    // پاسخ پیش‌فرض به دستور ناشناخته
    await ctx.reply("⚠️ این دستور را نمی‌شناسم. /help را امتحان کنید.");
    return;
  }

  // ترتیب اولویت: ادمین → فلوهای state-محور
  // نکته: هر فلو نام تابع ورودی متنی خودش را دارد؛ برای مقاومت در برابر
  // ناهماهنگی نام‌ها، هم نام عمومی (handleTextInput) و هم نام اختصاصی را
  // امتحان می‌کنیم. اولین فلویی که true برگرداند، پیام را «خورده» است.
  try {
    const textHandlers = [
      [admin,       ["handleTextInput"]],
      [content,     ["handleTextInput"]],
      [onboarding,  ["handleTextInput", "handleProfileTextInput"]],
      [readiness,   ["handleTextInput"]],
      [swot,        ["handleTextInput", "handleSwotTextInput"]],
      [rivals,      ["handleTextInput", "handleRivalTextInput"]],
      [promises,    ["handleTextInput", "handlePromiseTextInput"]],
      [crisis,      ["handleTextInput", "handleCrisisTextInput"]],
    ];

    for (const [mod, fnNames] of textHandlers) {
      for (const name of fnNames) {
        if (mod && typeof mod[name] === "function") {
          if (await mod[name](ctx)) return;
          break; // فقط اولین تابع موجود هر فلو را صدا بزن
        }
      }
    }
  } catch (e) {
    console.error("[message:text] error:", e);
  }

  // هیچ فلویی پیام را نگرفت → پاسخ پیش‌فرض
  await ctx.reply(
    "💬 برای استفاده از ربات، از منوی اصلی استفاده کنید.\n\n👈 /menu",
    {
      reply_markup: new InlineKeyboard()
        .text("🏠 منوی اصلی", "menu"),
    }
  );
});

// ═══════════════════════════════════════════════════════════════
// ۸) دریافت contact (شماره تماس از طریق دکمه)
// ═══════════════════════════════════════════════════════════════
bot.on("message:contact", async (ctx) => {
  const userId = String(ctx.from.id);
  const phone = ctx.message?.contact?.phone_number;

  if (!phone) {
    await ctx.reply("⚠️ شماره دریافت نشد.");
    return;
  }

  // نرمال‌سازی به فرمت 09xxxxxxxxx
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("98")) normalized = "0" + normalized.slice(2);
  if (normalized.startsWith("0098")) normalized = "0" + normalized.slice(4);
  if (!normalized.startsWith("0")) normalized = "0" + normalized;

  await updateUser(userId, { phone: normalized });
  await ctx.reply(`✅ شماره شما ثبت شد: ${normalized}`);

  // ادامه به فلوی onboarding اگر در حال انجام است
  try {
    if (typeof onboarding.handlePhoneReceived === "function") {
      return onboarding.handlePhoneReceived(ctx, normalized);
    }
  } catch (e) {
    console.error("[contact] onboarding error:", e);
  }
});

// ═══════════════════════════════════════════════════════════════
// ۹) callback پیش‌فرض (فاللبک) برای callbackهای ناشناخته
// ═══════════════════════════════════════════════════════════════
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery?.data || "";
  console.warn("[fallback] unhandled callback:", data);

  // toast کوتاه به کاربر
  try {
    await ctx.answerCallbackQuery({
      text: "⚠️ این بخش فعلاً در دسترس نیست",
      show_alert: false,
    });
  } catch {}

  // پیام مفهومی + برگشت به منو
  try {
    const text =
      `🚧 *در حال توسعه*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `این قابلیت (\`${data}\`) هنوز فعال نشده.\n\n` +
      `لطفاً از منوی اصلی یکی از بخش‌های فعال را انتخاب کنید.`;
    const kb = new InlineKeyboard().text("🏠 منوی اصلی", "menu");

    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch (e) {
    console.error("[fallback] reply error:", e);
  }
});

// ═══════════════════════════════════════════════════════════════
// ۱۰) مدیریت خطای سراسری grammy
// ═══════════════════════════════════════════════════════════════
bot.catch((err) => {
  console.error("❌ [bot.catch] خطای ناگرفته:");
  console.error("  Update ID:", err.ctx?.update?.update_id);
  console.error("  Error:", err.error);
  if (err.error?.stack) console.error(err.error.stack);
});

// ═══════════════════════════════════════════════════════════════
// ۱۱) Appwrite Function Entry Point
// ═══════════════════════════════════════════════════════════════
// Appwrite این تابع را با ({req, res, log, error}) صدا می‌زند.
// تلگرام POSTهای webhook را به این endpoint ارسال می‌کند.
// ═══════════════════════════════════════════════════════════════

let webhookHandler = null;

function getWebhookHandler() {
  if (!webhookHandler) {
    // grammy یک adapter سفارشی برای Appwrite ندارد، پس از adapter استاندارد استفاده می‌کنیم
    webhookHandler = webhookCallback(bot, "http");
  }
  return webhookHandler;
}

/**
 * Appwrite Function entry
 * https://appwrite.io/docs/products/functions
 */
module.exports = async function ({ req, res, log, error }) {
  try {
    // health check
    if (req.method === "GET") {
      log && log("[health] GET request");
      return res.json({
        status: "ok",
        bot: "candidatory-bot",
        version: "2.0.0",
        runtime: "appwrite-function",
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method !== "POST") {
      return res.json({ error: "Method not allowed" }, 405);
    }

    // اطمینان از init دیتابیس (idempotent)
    try {
      if (typeof initDB === "function") {
        await initDB();
      }
    } catch (e) {
      error && error("[initDB] " + (e?.message || e));
    }

    // بدنه‌ی request (Appwrite ممکن است body را به صورت آبجکت یا string بدهد)
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch {}
    }
    if (!body || typeof body !== "object") {
      log && log("[webhook] empty body");
      return res.json({ ok: true });
    }

    // ساخت یک Request شبیه‌سازی‌شده برای grammy webhookCallback
    const fakeRequest = {
      method: "POST",
      headers: req.headers || {},
      body: () => Promise.resolve(body),
      json: () => Promise.resolve(body),
    };

    let responseBody = null;
    let responseStatus = 200;
    const fakeResponse = {
      end: (data) => { responseBody = data; },
      status: (s) => { responseStatus = s; return fakeResponse; },
      send: (data) => { responseBody = data; },
      json: (data) => { responseBody = JSON.stringify(data); },
      setHeader: () => {},
    };

    // پردازش مستقیم با bot.handleUpdate (روش ساده‌تر و قابل اعتماد در serverless)
    await bot.handleUpdate(body);

    return res.json({ ok: true });

  } catch (e) {
    error && error("[function] " + (e?.message || e));
    if (e?.stack) error && error(e.stack);
    // در serverless، خطای 5xx باعث retry تلگرام می‌شود — بهتر است 200 برگردانیم
    return res.json({ ok: false, error: "internal" });
  }
};

// ═══════════════════════════════════════════════════════════════
// ۱۲) اجرای standalone (برای توسعه‌ی محلی)
// با: node src/main.js
// ═══════════════════════════════════════════════════════════════
if (require.main === module) {
  (async () => {
    console.log("🚀 شروع ربات در حالت long-polling (development)");

    try {
      if (typeof initDB === "function") {
        await initDB();
        console.log("✅ دیتابیس راه‌اندازی شد");
      }
    } catch (e) {
      console.error("⚠️ خطای initDB:", e.message);
    }

    try {
      const me = await bot.api.getMe();
      console.log(`✅ ربات متصل شد: @${me.username} (id: ${me.id})`);
    } catch (e) {
      console.error("❌ اتصال به تلگرام ناموفق:", e.message);
      process.exit(1);
    }

    bot.start({
      onStart: (info) => {
        console.log(`✅ ربات در حال گوش‌دادن... (@${info.username})`);
      },
      drop_pending_updates: true,
    });

    // graceful shutdown
    const stopBot = async (signal) => {
      console.log(`\n📥 سیگنال ${signal} دریافت شد. در حال خاموش‌سازی...`);
      try {
        await bot.stop();
        console.log("✅ ربات با موفقیت متوقف شد");
      } catch (e) {
        console.error("⚠️ خطا هنگام stop:", e.message);
      }
      process.exit(0);
    };

    process.once("SIGINT",  () => stopBot("SIGINT"));
    process.once("SIGTERM", () => stopBot("SIGTERM"));
  })();
}

// برای دسترسی به bot از خارج (مثلاً تست)
module.exports.bot = bot;
module.exports.showMainMenu = showMainMenu;
module.exports.showWelcomeGuide = showWelcomeGuide;
