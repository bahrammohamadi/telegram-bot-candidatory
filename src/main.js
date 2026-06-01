// src/main.js
// ═══════════════════════════════════════════════════════════════
// نقطه ورود Appwrite Function — ربات «کاندیداتوری هوشمند»
// فرمت: CommonJS (سازگار با Appwrite Runtime Node.js)
// اصلاح‌شده:
// ۱. هندلرهای گمشده show_history, show_assessments اضافه شدند
// ۲. هندلرهای deep_* (ارزیابی عمیق) اضافه شدند
// ۳. هندلر history_detail اضافه شد
// ۴. هندلرهای assess: و assess_locked: اضافه شدند
// ۵. ترتیب middleware اصلاح شد
// ═══════════════════════════════════════════════════════════════

const { Bot } = require("grammy");
const { initDB, updateUser } = require("./utils/db.js");
const { mainMenuKB } = require("./utils/keyboard.js");
const { WELCOME_MESSAGE } = require("./constants/questions.js");

// ─── هندلرهای اصلی ───
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

const {
  handleShowHistory,
  handleHistoryDetail,
} = require("./flows/history.js");

const {
  handleShowAssessments,
  handleLockedAssessment,
  handleStartAssessment,
} = require("./flows/assessments.js");

const {
  handleStartDeepAssessment,
  handleDeepBegin,
  handleDeepAnswer,
  handleDeepTextInput,
  handleDeepBackStep,
  handleDeepSkip,
  handleDeepConfirm,
  handleDeepExit,
} = require("./flows/deep_assessment.js");

// ═══════════════════════════════════════════
// تابع اصلی — Appwrite Function
// ═══════════════════════════════════════════
module.exports = async function (context) {
  const env = context.env || process.env;

  // مقداردهی دیتابیس
  initDB(env);

  // ─── ساخت بات ───
  let bot;
  try {
    if (env.BOT_INFO) {
      const botInfo = JSON.parse(env.BOT_INFO);
      bot = new Bot(env.BOT_TOKEN, { botInfo });
    } else {
      bot = new Bot(env.BOT_TOKEN);
      await bot.init();
    }
  } catch (initError) {
    console.error("❌ خطا در مقداردهی بات:", initError.message);
    bot = new Bot(env.BOT_TOKEN);
  }

  // لیست ادمین‌ها (از env)
  const ADMINS = (env.ADMIN_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // ─── Middleware: آپدیت lastInteractionNew ───
  bot.use(async (ctx, next) => {
    try {
      const userId = String(ctx.from?.id);
      if (userId && userId !== "undefined") {
        await updateUser(userId, {
          lastInteractionNew: new Date().toISOString().slice(0, 19),
        });
      }
    } catch (e) {
      console.error("⚠️ خطا در middleware:", e.message);
    }
    await next();
  });

  // ═══════════════════════════════════════
  // دستورات (Commands)
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
      await ctx.reply("📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:", {
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
      await ctx.reply("❌ کد ملی را وارد کنید:\n\n`/search 0012345678`", {
        parse_mode: "Markdown",
      });
  });

  bot.command("searchphone", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/searchphone", "").trim();
    if (q) await handleAdminSearch(ctx, "phone", q);
    else
      await ctx.reply("❌ شماره را وارد کنید:\n\n`/searchphone 09121234567`", {
        parse_mode: "Markdown",
      });
  });

  // ═══════════════════════════════════════
  // Callback Queries (دکمه‌ها)
  // ═══════════════════════════════════════
  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;
    try {

      // ─── منوی اصلی ───
      if (d === "menu") {
        try {
          await ctx.editMessageText(
            "📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:",
            { parse_mode: "Markdown", reply_markup: mainMenuKB() }
          );
        } catch {
          await ctx.reply(
            "📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:",
            { parse_mode: "Markdown", reply_markup: mainMenuKB() }
          );
        }
        await ctx.answerCallbackQuery();
        return;
      }

      // ─── مشاوره هوشمند ───
      if (d === "start_consultation") return await handleStartConsultation(ctx);
      if (d.startsWith("ans:")) {
        const parts = d.split(":");
        const idx = parseInt(parts[1]);
        const val = parts.slice(2).join(":");
        return await handleAnswer(ctx, idx, val);
      }
      if (d.startsWith("back:"))   return await handleBackStep(ctx, parseInt(d.split(":")[1]));
      if (d.startsWith("edit:"))   return await handleEdit(ctx, parseInt(d.split(":")[1]));
      if (d === "confirm")         return await handleConfirm(ctx);
      if (d === "cancel")          return await handleCancelConsultation(ctx);

      // ─── تاریخچه ───
      if (d === "show_history")              return await handleShowHistory(ctx);
      if (d.startsWith("history_detail:"))   return await handleHistoryDetail(ctx, d.split(":")[1]);

      // ─── تحلیل‌ها ───
      if (d === "show_assessments")          return await handleShowAssessments(ctx);
      if (d.startsWith("assess:"))           return await handleStartAssessment(ctx, d.split(":")[1]);
      if (d.startsWith("assess_locked:"))    return await handleLockedAssessment(ctx, d.split(":")[1]);

      // ─── ارزیابی عمیق ───
      if (d === "deep_assessment")           return await handleStartDeepAssessment(ctx);
      if (d === "deep_begin")                return await handleDeepBegin(ctx);
      if (d === "deep_confirm")              return await handleDeepConfirm(ctx);
      if (d === "deep_exit")                 return await handleDeepExit(ctx);
      if (d.startsWith("deep_ans:")) {
        const parts = d.split(":");
        const flatIdx = parseInt(parts[1]);
        const val = parts.slice(2).join(":");
        return await handleDeepAnswer(ctx, flatIdx, val);
      }
      if (d.startsWith("deep_back:"))        return await handleDeepBackStep(ctx, parseInt(d.split(":")[1]));
      if (d.startsWith("deep_skip:"))        return await handleDeepSkip(ctx, parseInt(d.split(":")[1]));

      // ─── پلن‌ها ───
      if (d === "show_plans")                return await handleShowPlans(ctx);
      if (d.startsWith("plan:"))             return await handleSelectPlan(ctx, d.split(":")[1]);
      if (d.startsWith("plan_request:"))     return await handlePlanRequest(ctx, d.split(":")[1]);

      // ─── آموزش‌ها ───
      if (d === "edu_list")                  return await handleShowEducationList(ctx);
      if (d === "edu_noop") {
        await ctx.answerCallbackQuery();
        return;
      }
      if (d.startsWith("eduv:")) {
        const parts = d.split(":");
        const cardId = parseInt(parts[1]);
        const view = parts[2] || "summary";
        if (!isNaN(cardId)) return await handleEducationView(ctx, cardId, view);
      }
      if (d.startsWith("edurel:")) {
        const cardId = parseInt(d.split(":")[1]);
        if (!isNaN(cardId)) return await handleRelatedCards(ctx, cardId);
      }
      if (d.startsWith("edu:")) {
        const cardId = parseInt(d.split(":")[1]);
        if (!isNaN(cardId)) return await handleShowEducationCard(ctx, cardId);
      }

      // ─── صفحات ثابت ───
      if (d === "about_us")        return await handleAboutUs(ctx);
      if (d === "contact_us")      return await handleContactUs(ctx);
      if (d === "sample_reports")  return await handleSampleReports(ctx);

      // ─── پنل ادمین ───
      if (d.startsWith("adm:")) {
        if (ADMINS.includes(String(ctx.from.id))) {
          return await handleAdminCallback(ctx, d);
        }
        await ctx.answerCallbackQuery({ text: "⛔ دسترسی ندارید" });
        return;
      }

      // ─── callback ناشناخته ───
      await ctx.answerCallbackQuery();

    } catch (e) {
      console.error("❌ خطای callback_query:", e.message, e.stack);
      try {
        await ctx.answerCallbackQuery({ text: "❌ خطایی رخ داد، دوباره امتحان کنید" });
      } catch {}
    }
  });

  // ═══════════════════════════════════════
  // پیام‌های متنی
  // ═══════════════════════════════════════
  bot.on("message:text", async (ctx) => {
    try {
      // ارزیابی عمیق اولویت دارد
      const deepHandled = await handleDeepTextInput(ctx);
      if (deepHandled) return;

      // مشاوره معمولی
      const handled = await handleTextInput(ctx);
      if (handled) return;

      // اگر هیچ هندلری نبود
      await ctx.reply(
        "📌 لطفاً از منوی زیر استفاده کنید یا /start بزنید.",
        { reply_markup: mainMenuKB() }
      );
    } catch (e) {
      console.error("❌ خطای message:text:", e.message);
    }
  });

  // ═══════════════════════════════════════
  // پردازش آپدیت تلگرام
  // ═══════════════════════════════════════
  try {
    await bot.handleUpdate(context.req.body);
  } catch (e) {
    console.error("❌ خطای کلی handleUpdate:", e.message, e.stack);
  }

  // همیشه 200 OK برگردون (الزامی برای Appwrite webhook)
  return context.res.json({ ok: true });
};
