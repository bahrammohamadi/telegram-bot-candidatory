// src/main.js
// ═══════════════════════════════════════════════════════════════
//  نقطه ورود Appwrite Function — ربات «کاندیداتوری هوشمند»
//  @candidatoryiran_bot
//
//  فیکس اصلی: استفاده از botInfo استاتیک در constructor
//  تا نیازی به await bot.init() نباشد و خطای
//  "Bot not initialized" هرگز رخ ندهد.
// ═══════════════════════════════════════════════════════════════

import { Bot } from "grammy";
import { initDB } from "./utils/db.js";
import { mainMenuKB } from "./utils/keyboard.js";
import { WELCOME_MESSAGE } from "./constants/questions.js";

// ─── Flows ───
import {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleBackStep,
  handleConfirm,
  handleCancelConsultation,
  handleTextInput,
} from "./flows/consultation.js";

import {
  handleShowPlans,
  handleSelectPlan,
  handlePlanRequest,
} from "./flows/plans.js";

import {
  handleAboutUs,
  handleContactUs,
  handleSampleReports,
} from "./flows/contact.js";

import {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
} from "./flows/educational.js";

import {
  handleAdminCommand,
  handleAdminCallback,
  handleAdminSearch,
} from "./flows/admin.js";

// ═══════════════════════════════════════════════════════════════
//  تابع اصلی — export default برای Appwrite Function
// ═══════════════════════════════════════════════════════════════
export default async function (context) {
  const env = context.env || process.env;

  // ─── مقداردهی دیتابیس ───
  initDB(env);

  // ═══════════════════════════════════════════════════════════
  //  فیکس خطای "Bot not initialized"
  //
  //  در محیط serverless (Appwrite Function) هر درخواست یک
  //  instance جدید از Bot می‌سازد. اگر bot.init() فراخوانی
  //  نشود یا به هر دلیلی timeout بخورد، خطای بالا رخ می‌دهد.
  //
  //  راه‌حل ۱: await bot.init() قبل از handleUpdate
  //  راه‌حل ۲: botInfo استاتیک در constructor (سریع‌تر و مطمئن‌تر)
  //
  //  ما هر دو را پیاده می‌کنیم: اول botInfo استاتیک، سپس
  //  اگر نبود fallback به await bot.init()
  // ═══════════════════════════════════════════════════════════

  let bot;

  // اگر BOT_INFO در env ست شده باشد (JSON string)، از آن استفاده کن
  // مثال: BOT_INFO={"id":8478705530,"is_bot":true,"first_name":"کاندیداتوری هوشمند","username":"candidatoryiran_bot","can_join_groups":true,"can_read_all_group_messages":false,"supports_inline_queries":false}
  if (env.BOT_INFO) {
    try {
      const botInfo = JSON.parse(env.BOT_INFO);
      bot = new Bot(env.BOT_TOKEN, { botInfo });
    } catch (e) {
      console.error("⚠️ خطا در parse BOT_INFO، fallback به init():", e.message);
      bot = new Bot(env.BOT_TOKEN);
      await bot.init();
    }
  } else {
    // اگر BOT_INFO نداریم، حتماً init() بزن
    bot = new Bot(env.BOT_TOKEN);
    try {
      await bot.init();
    } catch (e) {
      console.error("❌ خطای bot.init():", e.message);
      // لاگ کن ولی ادامه بده — شاید درخواست قبلی cache شده باشد
    }
  }

  // ─── لیست آیدی ادمین‌ها ───
  const ADMINS = (env.ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);

  // ═══════════════════════════════════════════════════════════
  //  دستورات (Commands)
  // ═══════════════════════════════════════════════════════════

  // ─── /start ───
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

  // ─── /menu ───
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

  // ─── /admin ───
  bot.command("admin", async (ctx) => {
    if (ADMINS.includes(String(ctx.from.id))) {
      await handleAdminCommand(ctx);
    } else {
      await ctx.reply("⛔ شما دسترسی ادمین ندارید.");
    }
  });

  // ─── /search <کد ملی> (ادمین) ───
  bot.command("search", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/search", "").trim();
    if (q) {
      await handleAdminSearch(ctx, "national_id", q);
    } else {
      await ctx.reply("❌ کد ملی را وارد کنید:\n`/search 0012345678`", {
        parse_mode: "Markdown",
      });
    }
  });

  // ─── /searchphone <شماره> (ادمین) ───
  bot.command("searchphone", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/searchphone", "").trim();
    if (q) {
      await handleAdminSearch(ctx, "phone", q);
    } else {
      await ctx.reply("❌ شماره را وارد کنید:\n`/searchphone 09121234567`", {
        parse_mode: "Markdown",
      });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  Callback Queries
  // ═══════════════════════════════════════════════════════════

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

      // ─── شروع مشاوره ───
      if (d === "start_consultation") {
        return await handleStartConsultation(ctx);
      }

      // ─── پاسخ گزینه‌ای: ans:stepIndex:value ───
      if (d.startsWith("ans:")) {
        const parts = d.split(":");
        const stepIndex = parseInt(parts[1]);
        const value = parts.slice(2).join(":"); // مقدار ممکنه خودش : داشته باشه
        return await handleAnswer(ctx, stepIndex, value);
      }

      // ─── بازگشت به مرحله قبل: back:stepIndex ───
      if (d.startsWith("back:")) {
        return await handleBackStep(ctx, parseInt(d.split(":")[1]));
      }

      // ─── ویرایش مرحله: edit:stepIndex ───
      if (d.startsWith("edit:")) {
        return await handleEdit(ctx, parseInt(d.split(":")[1]));
      }

      // ─── تایید نهایی ───
      if (d === "confirm") {
        return await handleConfirm(ctx);
      }

      // ─── انصراف ───
      if (d === "cancel") {
        return await handleCancelConsultation(ctx);
      }

      // ─── پلن‌ها ───
      if (d === "show_plans") {
        return await handleShowPlans(ctx);
      }

      if (d.startsWith("plan:")) {
        return await handleSelectPlan(ctx, d.split(":")[1]);
      }

      if (d.startsWith("plan_request:")) {
        return await handlePlanRequest(ctx, d.split(":")[1]);
      }

      // ─── آموزش: فهرست ───
      if (d === "edu_list") {
        return await handleShowEducationList(ctx);
      }

      // ─── آموزش: noop (دکمه شمارنده صفحه) ───
      if (d === "edu_noop") {
        await ctx.answerCallbackQuery();
        return;
      }

      // ─── آموزش: تغییر تب (eduv:cardId:viewMode) ───
      if (d.startsWith("eduv:")) {
        const parts = d.split(":");
        const cardId = parseInt(parts[1]);
        const viewMode = parts[2] || "summary";
        if (!isNaN(cardId)) {
          return await handleEducationView(ctx, cardId, viewMode);
        }
      }

      // ─── آموزش: کارت‌های مرتبط (edurel:cardId) ───
      if (d.startsWith("edurel:")) {
        const cardId = parseInt(d.split(":")[1]);
        if (!isNaN(cardId)) {
          return await handleRelatedCards(ctx, cardId);
        }
      }

      // ─── آموزش: نمایش کارت (edu:cardId) ───
      if (d.startsWith("edu:")) {
        const cardId = parseInt(d.split(":")[1]);
        if (!isNaN(cardId)) {
          return await handleShowEducationCard(ctx, cardId);
        }
      }

      // ─── صفحات اطلاع‌رسانی ───
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
      console.error("❌ خطای callback:", e.message);
      try {
        await ctx.answerCallbackQuery({ text: "❌ خطا رخ داد. دوباره تلاش کنید." });
      } catch {}
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  پیام‌های متنی
  // ═══════════════════════════════════════════════════════════

  bot.on("message:text", async (ctx) => {
    try {
      // اول بررسی می‌کنیم آیا مربوط به مشاوره (ورودی متنی) هست
      const handled = await handleTextInput(ctx);
      if (handled) return;

      // اگر مربوط به مشاوره نبود → نمایش منو
      await ctx.reply("📌 از منوی زیر انتخاب کنید یا /start بزنید.", {
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      console.error("❌ خطای message:text:", e.message);
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  پردازش آپدیت
  // ═══════════════════════════════════════════════════════════

  try {
    await bot.handleUpdate(context.req.body);
  } catch (e) {
    console.error("❌ خطای handleUpdate:", e.message);
  }

  // پاسخ به Appwrite
  return context.res.json({ ok: true });
}
