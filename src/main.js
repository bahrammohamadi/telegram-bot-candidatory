// src/main.js
// ═══════════════════════════════════════════════════════════════
// نقطه ورود Appwrite Function — ربات «کاندیداتوری هوشمند»
// فرمت: CommonJS (سازگار با Appwrite Runtime Node.js)
// نسخه اصلاح‌شده: ۱۴۰۴/۱۲/۰۸ — با فیکس پایداری و lastInteractionNew
// ═══════════════════════════════════════════════════════════════

const { Bot } = require("grammy");
const { initDB, updateUser } = require("./utils/db.js"); // updateUser رو برای آپدیت lastInteractionNew نیاز داریم
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

// ═══════════════════════════════════════════
// تابع اصلی — Appwrite Function
// ═══════════════════════════════════════════
module.exports = async function (context) {
  const env = context.env || process.env;

  // مقداردهی دیتابیس
  initDB(env);

  // ─── ساخت بات با فیکس Bot not initialized ───
  let bot;
  try {
    // اولویت ۱: اگر BOT_INFO در env تعریف شده (پیشنهاد Appwrite)
    if (env.BOT_INFO) {
      const botInfo = JSON.parse(env.BOT_INFO);
      bot = new Bot(env.BOT_TOKEN, { botInfo });
    } else {
      // اولویت ۲: ساخت معمولی + await init()
      bot = new Bot(env.BOT_TOKEN);
      await bot.init(); // این خط مهم‌ترین فیکس خطای "Bot not initialized" است
    }
  } catch (initError) {
    console.error("❌ خطا در مقداردهی بات:", initError.message);
    // fallback نهایی: بدون init — فقط برای جلوگیری از crash کامل
    bot = new Bot(env.BOT_TOKEN);
  }

  // لیست ادمین‌ها (از env)
  const ADMINS = (env.ADMIN_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // ─── Middleware کوچک: هر بار که کاربر تعاملی دارد، lastInteractionNew رو آپدیت کن ───
  bot.use(async (ctx, next) => {
    try {
      const userId = String(ctx.from?.id);
      if (userId) {
        // آپدیت زمان آخرین فعالیت (با فرمت کوتاه برای سازگاری با string 30 یا 50)
        await updateUser(userId, {
          lastInteractionNew: new Date().toISOString().slice(0, 19), // "2026-02-28T14:35:22"
        });
      }
    } catch (e) {
      console.error("⚠️ خطا در آپدیت lastInteractionNew:", e.message);
      // خطا را نادیده می‌گیریم تا ربات متوقف نشود
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
          await ctx.editMessageText("📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:", {
            parse_mode: "Markdown",
            reply_markup: mainMenuKB(),
          });
        } catch {
          await ctx.reply("📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:", {
            parse_mode: "Markdown",
            reply_markup: mainMenuKB(),
          });
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
      if (d.startsWith("back:")) return await handleBackStep(ctx, parseInt(d.split(":")[1]));
      if (d.startsWith("edit:")) return await handleEdit(ctx, parseInt(d.split(":")[1]));
      if (d === "confirm") return await handleConfirm(ctx);
      if (d === "cancel") return await handleCancelConsultation(ctx);

      // ─── پلن‌ها ───
      if (d === "show_plans") return await handleShowPlans(ctx);
      if (d.startsWith("plan:")) return await handleSelectPlan(ctx, d.split(":")[1]);
      if (d.startsWith("plan_request:")) return await handlePlanRequest(ctx, d.split(":")[1]);

      // ─── آموزش‌ها ───
      if (d === "edu_list") return await handleShowEducationList(ctx);
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
      if (d === "about_us") return await handleAboutUs(ctx);
      if (d === "contact_us") return await handleContactUs(ctx);
      if (d === "sample_reports") return await handleSampleReports(ctx);

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
      const handled = await handleTextInput(ctx);
      if (handled) return;

      // اگر هیچ هندلری نبود → پیام راهنما
      await ctx.reply("📌 لطفاً از منوی زیر استفاده کنید یا /start بزنید.", {
        reply_markup: mainMenuKB(),
      });
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
