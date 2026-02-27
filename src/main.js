// src/main.js
// ═══════════════════════════════════════════════════════════════
//  نقطه ورود Appwrite Function — ربات «کاندیداتوری هوشمند»
//  فرمت: CommonJS (سازگار با Appwrite Runtime)
// ═══════════════════════════════════════════════════════════════

const { Bot } = require("grammy");
const { initDB } = require("./utils/db.js");
const { mainMenuKB } = require("./utils/keyboard.js");
const { WELCOME_MESSAGE } = require("./constants/questions.js");

const {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleBackStep,
  handleConfirm,
  handleCancelConsultation,
  handleTextInput,
} = require("./flows/consultation.js");

const {
  handleShowPlans,
  handleSelectPlan,
  handlePlanRequest,
} = require("./flows/plans.js");

const {
  handleAboutUs,
  handleContactUs,
  handleSampleReports,
} = require("./flows/contact.js");

const {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
} = require("./flows/educational.js");

const {
  handleAdminCommand,
  handleAdminCallback,
  handleAdminSearch,
} = require("./flows/admin.js");

// ═══════════════════════════════════════════
//  تابع اصلی — Appwrite Function
// ═══════════════════════════════════════════
module.exports = async function (context) {
  const env = context.env || process.env;

  // مقداردهی دیتابیس
  initDB(env);

  // ─── ساخت بات با botInfo استاتیک (فیکس "Bot not initialized") ───
  let bot;

  if (env.BOT_INFO) {
    try {
      const botInfo = JSON.parse(env.BOT_INFO);
      bot = new Bot(env.BOT_TOKEN, { botInfo });
    } catch (e) {
      console.error("⚠️ خطا در BOT_INFO، fallback به init():", e.message);
      bot = new Bot(env.BOT_TOKEN);
      await bot.init();
    }
  } else {
    bot = new Bot(env.BOT_TOKEN);
    try {
      await bot.init();
    } catch (e) {
      console.error("❌ خطای bot.init():", e.message);
    }
  }

  // لیست ادمین‌ها
  const ADMINS = (env.ADMIN_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // ═══════════════════════════════════════
  //  دستورات
  // ═══════════════════════════════════════

  bot.command("start", async (ctx) => {
    try {
      await ctx.reply(WELCOME_MESSAGE, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      console.error("خطا در /start:", e.message);
    }
  });

  bot.command("menu", async (ctx) => {
    try {
      await ctx.reply("📋 *منوی اصلی*\n\nگزینه مورد نظر:", {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      console.error("خطا در /menu:", e.message);
    }
  });

  bot.command("admin", async (ctx) => {
    if (ADMINS.includes(String(ctx.from.id))) {
      await handleAdminCommand(ctx);
    } else {
      await ctx.reply("⛔ دسترسی ندارید.");
    }
  });

  bot.command("search", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/search", "").trim();
    if (q) await handleAdminSearch(ctx, "national_id", q);
    else
      await ctx.reply("❌ کد ملی:\n`/search 0012345678`", {
        parse_mode: "Markdown",
      });
  });

  bot.command("searchphone", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/searchphone", "").trim();
    if (q) await handleAdminSearch(ctx, "phone", q);
    else
      await ctx.reply("❌ شماره:\n`/searchphone 09121234567`", {
        parse_mode: "Markdown",
      });
  });

  // ═══════════════════════════════════════
  //  Callback Queries
  // ═══════════════════════════════════════

  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;

    try {
      // منو
      if (d === "menu") {
        try {
          await ctx.editMessageText("📋 *منوی اصلی*\n\nگزینه مورد نظر:", {
            parse_mode: "Markdown",
            reply_markup: mainMenuKB(),
          });
        } catch {
          await ctx.reply("📋 *منوی اصلی*\n\nگزینه مورد نظر:", {
            parse_mode: "Markdown",
            reply_markup: mainMenuKB(),
          });
        }
        await ctx.answerCallbackQuery();
        return;
      }

      // مشاوره
      if (d === "start_consultation")
        return await handleStartConsultation(ctx);

      if (d.startsWith("ans:")) {
        const parts = d.split(":");
        const idx = parseInt(parts[1]);
        const val = parts.slice(2).join(":");
        return await handleAnswer(ctx, idx, val);
      }

      if (d.startsWith("back:"))
        return await handleBackStep(ctx, parseInt(d.split(":")[1]));

      if (d.startsWith("edit:"))
        return await handleEdit(ctx, parseInt(d.split(":")[1]));

      if (d === "confirm") return await handleConfirm(ctx);
      if (d === "cancel") return await handleCancelConsultation(ctx);

      // پلن‌ها
      if (d === "show_plans") return await handleShowPlans(ctx);
      if (d.startsWith("plan:"))
        return await handleSelectPlan(ctx, d.split(":")[1]);
      if (d.startsWith("plan_request:"))
        return await handlePlanRequest(ctx, d.split(":")[1]);

      // آموزش
      if (d === "edu_list") return await handleShowEducationList(ctx);
      if (d === "edu_noop") {
        await ctx.answerCallbackQuery();
        return;
      }
      if (d.startsWith("eduv:")) {
        const parts = d.split(":");
        const cardId = parseInt(parts[1]);
        const view = parts[2] || "summary";
        if (!isNaN(cardId))
          return await handleEducationView(ctx, cardId, view);
      }
      if (d.startsWith("edurel:")) {
        const cardId = parseInt(d.split(":")[1]);
        if (!isNaN(cardId)) return await handleRelatedCards(ctx, cardId);
      }
      if (d.startsWith("edu:")) {
        const cardId = parseInt(d.split(":")[1]);
        if (!isNaN(cardId))
          return await handleShowEducationCard(ctx, cardId);
      }

      // صفحات
      if (d === "about_us") return await handleAboutUs(ctx);
      if (d === "contact_us") return await handleContactUs(ctx);
      if (d === "sample_reports") return await handleSampleReports(ctx);

      // ادمین
      if (d.startsWith("adm:")) {
        if (ADMINS.includes(String(ctx.from.id))) {
          return await handleAdminCallback(ctx, d);
        }
        await ctx.answerCallbackQuery({ text: "⛔ دسترسی ندارید" });
        return;
      }

      await ctx.answerCallbackQuery();
    } catch (e) {
      console.error("❌ خطای callback:", e.message);
      try {
        await ctx.answerCallbackQuery({ text: "❌ خطا رخ داد" });
      } catch {}
    }
  });

  // ═══════════════════════════════════════
  //  پیام‌های متنی
  // ═══════════════════════════════════════

  bot.on("message:text", async (ctx) => {
    try {
      const handled = await handleTextInput(ctx);
      if (handled) return;
      await ctx.reply("📌 از منوی زیر انتخاب کنید یا /start بزنید.", {
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      console.error("❌ خطای text:", e.message);
    }
  });

  // ═══════════════════════════════════════
  //  پردازش آپدیت
  // ═══════════════════════════════════════

  try {
    await bot.handleUpdate(context.req.body);
  } catch (e) {
    console.error("❌ خطای handleUpdate:", e.message);
  }

  return context.res.json({ ok: true });
};
