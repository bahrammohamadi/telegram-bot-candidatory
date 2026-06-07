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

// فلوها
const onboarding  = require("./flows/onboarding.js");
const readiness   = require("./flows/analysis/readiness.js");
const swot        = require("./flows/analysis/swot.js");
const dashboard   = require("./flows/dashboard.js");
const rivals      = require("./flows/campaign/rivals.js");
const promises    = require("./flows/campaign/promises.js");
const crisis      = require("./flows/campaign/crisis.js");
const content     = require("./flows/content/generator.js");
const educational = require("./flows/educational.js");
const plans       = require("./flows/plans.js");
const history     = require("./flows/history.js");
const contact     = require("./flows/contact.js");
const admin       = require("./flows/admin.js");

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

// /start — منوی اصلی
bot.command("start", async (ctx) => {
  const userId = String(ctx.from.id);

  // ساخت/بازیابی کاربر
  await getOrCreateUser(userId, {
    firstName: ctx.from.first_name || null,
    lastName: ctx.from.last_name || null,
    username: ctx.from.username || null,
    createdAt: new Date().toISOString(),
  });

  // پاک کردن state در حال انجام (در صورت وجود)
  await updateUser(userId, { currentStep: null, tempAnswers: "{}" });

  await showMainMenu(ctx);
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
  await ctx.reply("⚠️ داشبورد در دسترس نیست.");
});

// /admin — پنل ادمین (با کنترل دسترسی داخلی)
bot.command("admin", async (ctx) => {
  return admin.handleAdminPanel(ctx);
});

// ═══════════════════════════════════════════════════════════════
// ۴) نمایش منوی اصلی
// ═══════════════════════════════════════════════════════════════
async function showMainMenu(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});

  const greetingName = user.firstName || ctx.from.first_name || "هم‌میهن";
  const planLabel = {
    none: "🆓 رایگان",
    free: "🆓 رایگان",
    starter: "🚀 راه‌اندازی",
    professional: "⭐ حرفه‌ای",
    vip: "👑 VIP",
  }[user.purchasedPlan || "free"] || "🆓 رایگان";

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

bot.callbackQuery("menu", showMainMenu);

bot.callbackQuery("menu_profile", async (ctx) => {
  if (typeof onboarding.handleProfileMenu === "function") {
    return onboarding.handleProfileMenu(ctx);
  }
  if (typeof onboarding.handleStartOnboarding === "function") {
    return onboarding.handleStartOnboarding(ctx);
  }
  await ctx.answerCallbackQuery({ text: "در دسترس نیست", show_alert: true });
});

bot.callbackQuery("menu_analysis", async (ctx) => {
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
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    try { await ctx.answerCallbackQuery(); } catch {}
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
});

bot.callbackQuery("menu_dashboard", async (ctx) => {
  if (typeof dashboard.handleShowDashboard === "function") {
    return dashboard.handleShowDashboard(ctx);
  }
  await ctx.answerCallbackQuery({ text: "در دسترس نیست", show_alert: true });
});

bot.callbackQuery("menu_campaign", async (ctx) => {
  const text =
    "🏛 *مدیریت کمپین*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "بخش مورد نظر را انتخاب کنید:";

  const kb = new InlineKeyboard()
    .text("⚔️ رقبا", "rivals:menu").row()
    .text("📋 وعده‌ها", "promises:menu").row()
    .text("🚨 مدیریت بحران", "crisis:menu").row()
    .text("🏠 منوی اصلی", "menu");

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
});

bot.callbackQuery("menu_content", async (ctx) => {
  return content.handleContentMenu(ctx);
});

bot.callbackQuery("menu_education", async (ctx) => {
  return educational.handleShowEducationList(ctx, 0);
});

bot.callbackQuery("menu_history", async (ctx) => {
  return history.handleShowHistory(ctx, 0, "all");
});

bot.callbackQuery("menu_plans", async (ctx) => {
  return plans.handleShowPlans(ctx);
});

bot.callbackQuery("menu_contact", async (ctx) => {
  return contact.handleAboutUs(ctx);
});

// ورودی‌های مستقیم ارزیابی
bot.callbackQuery("analysis_readiness", async (ctx) => {
  if (typeof readiness.handleStartReadiness === "function") {
    return readiness.handleStartReadiness(ctx);
  }
  await ctx.answerCallbackQuery({ text: "در دسترس نیست", show_alert: true });
});

bot.callbackQuery("analysis_swot", async (ctx) => {
  if (typeof swot.handleStartSwot === "function") {
    return swot.handleStartSwot(ctx);
  }
  await ctx.answerCallbackQuery({ text: "در دسترس نیست", show_alert: true });
});

// ═══════════════════════════════════════════════════════════════
// ۶) روترهای callback برای فلوها (با regex)
// ═══════════════════════════════════════════════════════════════

// فلوهای جدید با namespace‌بندی
bot.callbackQuery(/^onboarding:/, async (ctx) => {
  if (typeof onboarding.handleOnboardingCallback === "function") {
    return onboarding.handleOnboardingCallback(ctx);
  }
});

bot.callbackQuery(/^readiness:/, async (ctx) => {
  if (typeof readiness.handleReadinessCallback === "function") {
    return readiness.handleReadinessCallback(ctx);
  }
});

bot.callbackQuery(/^swot:/, async (ctx) => {
  if (typeof swot.handleSwotCallback === "function") {
    return swot.handleSwotCallback(ctx);
  }
});

bot.callbackQuery(/^dashboard:/, async (ctx) => {
  if (typeof dashboard.handleDashboardCallback === "function") {
    return dashboard.handleDashboardCallback(ctx);
  }
});

bot.callbackQuery(/^rivals:/, async (ctx) => {
  if (typeof rivals.handleRivalsCallback === "function") {
    return rivals.handleRivalsCallback(ctx);
  }
});

bot.callbackQuery(/^promises:/, async (ctx) => {
  if (typeof promises.handlePromisesCallback === "function") {
    return promises.handlePromisesCallback(ctx);
  }
});

bot.callbackQuery(/^crisis:/, async (ctx) => {
  if (typeof crisis.handleCrisisCallback === "function") {
    return crisis.handleCrisisCallback(ctx);
  }
});

bot.callbackQuery(/^content:/, content.handleContentCallback);
bot.callbackQuery(/^edu:/,     educational.handleEducationCallback);
bot.callbackQuery(/^plans:/,   plans.handlePlansCallback);
bot.callbackQuery(/^history:/, history.handleHistoryCallback);
bot.callbackQuery(/^contact:/, contact.handleContactCallback);
bot.callbackQuery(/^admin:/,   admin.handleAdminCallback);

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
  try {
    // 1. ادمین (جستجو، broadcast)
    if (typeof admin.handleTextInput === "function") {
      if (await admin.handleTextInput(ctx)) return;
    }

    // 2. تولید محتوا
    if (typeof content.handleTextInput === "function") {
      if (await content.handleTextInput(ctx)) return;
    }

    // 3. onboarding (پروفایل کاندیدا)
    if (typeof onboarding.handleTextInput === "function") {
      if (await onboarding.handleTextInput(ctx)) return;
    }

    // 4. readiness (ارزیابی آمادگی)
    if (typeof readiness.handleTextInput === "function") {
      if (await readiness.handleTextInput(ctx)) return;
    }

    // 5. swot
    if (typeof swot.handleTextInput === "function") {
      if (await swot.handleTextInput(ctx)) return;
    }

    // 6. rivals
    if (typeof rivals.handleTextInput === "function") {
      if (await rivals.handleTextInput(ctx)) return;
    }

    // 7. promises
    if (typeof promises.handleTextInput === "function") {
      if (await promises.handleTextInput(ctx)) return;
    }

    // 8. crisis
    if (typeof crisis.handleTextInput === "function") {
      if (await crisis.handleTextInput(ctx)) return;
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
  console.warn("[fallback] unhandled callback:", ctx.callbackQuery.data);
  try {
    await ctx.answerCallbackQuery({
      text: "⚠️ این دکمه دیگر فعال نیست. /start بزنید.",
      show_alert: false,
    });
  } catch {}
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
