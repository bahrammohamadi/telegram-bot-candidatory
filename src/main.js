// ============================================================
// 🗳️ کاندیداتوری هوشمند — @candidatoryiran_bot
// ============================================================

import { Bot } from "grammy";
import { initDB, getOrCreateUser } from "./utils/db.js";
import { mainMenuKB } from "./utils/keyboard.js";

import {
  handleStartConsultation,
  handleCancelConsultation,
  handleAnswer,
  handleEdit,
  handleBackToSummary,
  handleConfirm,
  handleTextInput,
} from "./flows/consultation.js";

import { handleShowPlans, handleSelectPlan } from "./flows/plans.js";
import { handleContact, handleAbout, handleSamples } from "./flows/contact.js";

// ============================================================
// 📌 متن منوی اصلی
// ============================================================

const MENU_TEXT = `
🗳️ *به کاندیداتوری هوشمند خوش آمدید!*

سامانه تحلیل و مشاوره هوشمند انتخاباتی 🇮🇷

ما به شما کمک می‌کنیم:
• شانس موفقیت خود را بسنجید 📊
• نقاط قوت و ضعف را بشناسید 🔍
• با برنامه حرفه‌ای وارد میدان شوید 🚀

یکی از گزینه‌های زیر را انتخاب کنید:
`;

// ============================================================
// 🔧 خواندن env از process.env
// ============================================================

function getEnv() {
  return {
    BOT_TOKEN: process.env.BOT_TOKEN,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
    DATABASE_ID: process.env.DATABASE_ID || "kandidatory_db",
    COLLECTION_USERS: process.env.COLLECTION_USERS || "users",
    COLLECTION_CONSULT: process.env.COLLECTION_CONSULT || "consultations",
    COLLECTION_LEADS: process.env.COLLECTION_LEADS || "leads_status",
  };
}

// ============================================================
// 🔄 استخراج update از request
// ============================================================

function extractUpdate(req, log) {
  // ۱. bodyJson — کلید اصلی در Appwrite Functions
  if (req.bodyJson && typeof req.bodyJson === "object" && Object.keys(req.bodyJson).length > 0) {
    log("📦 source: bodyJson ✅");
    return req.bodyJson;
  }

  // ۲. body آبجکت
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    log("📦 source: body object");
    return req.body;
  }

  // ۳. body رشته
  if (typeof req.body === "string" && req.body.length > 2) {
    try {
      log("📦 source: body string");
      return JSON.parse(req.body);
    } catch {}
  }

  // ۴. bodyRaw
  if (req.bodyRaw && typeof req.bodyRaw === "string" && req.bodyRaw.length > 2) {
    try {
      log("📦 source: bodyRaw");
      return JSON.parse(req.bodyRaw);
    } catch {}
  }

  // ۵. bodyText
  if (req.bodyText && typeof req.bodyText === "string" && req.bodyText.length > 2) {
    try {
      log("📦 source: bodyText");
      return JSON.parse(req.bodyText);
    } catch {}
  }

  return null;
}

// ============================================================
// 🚀 نقطه ورود Appwrite Function
// ============================================================

export default async function (context) {
  const log = context.log;
  const error = context.error;

  // ---- ۱. env ----
  const env = getEnv();

  if (!env.BOT_TOKEN) {
    error("❌ BOT_TOKEN پیدا نشد!");
    return context.res.json({ ok: true, error: "no token" }, 200);
  }

  if (!env.APPWRITE_PROJECT_ID || !env.APPWRITE_API_KEY) {
    error("❌ Appwrite credentials پیدا نشد!");
    return context.res.json({ ok: true, error: "no credentials" }, 200);
  }

  // ---- ۲. Appwrite ----
  try {
    initDB(env);
  } catch (e) {
    error("❌ DB init: " + e.message);
    return context.res.json({ ok: true, error: "db fail" }, 200);
  }

  // ---- ۳. بات ----
  const bot = new Bot(env.BOT_TOKEN);

  // ============================================================
  // 📩 /start
  // ============================================================
  bot.command("start", async (ctx) => {
    try {
      await getOrCreateUser(ctx.from);
      await ctx.reply(MENU_TEXT, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      error("/start: " + e.message);
      await ctx.reply("⚠️ خطایی رخ داد. دوباره /start بزنید.");
    }
  });

  bot.command("menu", async (ctx) => {
    try {
      await ctx.reply(MENU_TEXT, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      error("/menu: " + e.message);
    }
  });

  // ============================================================
  // 🔘 Callback Query
  // ============================================================
  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;

    try {
      if (d === "main_menu") {
        await ctx.editMessageText(MENU_TEXT, {
          parse_mode: "Markdown",
          reply_markup: mainMenuKB(),
        });
        await ctx.answerCallbackQuery();
        return;
      }

      if (d === "start_consult") {
        await handleStartConsultation(ctx);
        await ctx.answerCallbackQuery();
        return;
      }

      if (d === "cancel_consult") {
        await handleCancelConsultation(ctx, mainMenuKB, MENU_TEXT);
        await ctx.answerCallbackQuery("❌ لغو شد");
        return;
      }

      if (d.startsWith("ans_")) {
        const p = d.split("_");
        await handleAnswer(ctx, parseInt(p[1]), parseInt(p[2]));
        return;
      }

      if (d.startsWith("edit_")) {
        await handleEdit(ctx, parseInt(d.replace("edit_", "")));
        return;
      }

      if (d === "back_summary") {
        await handleBackToSummary(ctx);
        return;
      }

      if (d === "confirm") {
        await handleConfirm(ctx);
        return;
      }

      if (d === "show_plans") {
        await handleShowPlans(ctx);
        return;
      }

      if (d.startsWith("plan_")) {
        await handleSelectPlan(ctx, d.replace("plan_", ""));
        return;
      }

      if (d === "contact") {
        await handleContact(ctx);
        return;
      }

      if (d === "about") {
        await handleAbout(ctx);
        return;
      }

      if (d === "samples") {
        await handleSamples(ctx);
        return;
      }

      await ctx.answerCallbackQuery("⚠️ ناشناخته");
    } catch (e) {
      error("cb: " + e.message);
      try { await ctx.answerCallbackQuery("⚠️ خطا"); } catch {}
    }
  });

  // ============================================================
  // 💬 پیام متنی
  // ============================================================
  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    try {
      await handleTextInput(ctx, mainMenuKB, MENU_TEXT);
    } catch (e) {
      error("txt: " + e.message);
      await ctx.reply("⚠️ خطا. /start بزنید.");
    }
  });

  // ============================================================
  // 🔄 پردازش آپدیت
  // ============================================================
  try {
    const update = extractUpdate(context.req, log);

    if (!update) {
      log("⚠️ آپدیت خالی");
      return context.res.json({ ok: true }, 200);
    }

    if (!update.message && !update.callback_query && !update.edited_message) {
      log("⚠️ بدون محتوا");
      return context.res.json({ ok: true }, 200);
    }

    log("📩 " + (update.message ? "msg" : "cb") + " from: " + (update.message?.from?.id || update.callback_query?.from?.id));
    await bot.handleUpdate(update);
    log("✅ done");
  } catch (e) {
    error("❌ " + e.message);
  }

  return context.res.json({ ok: true }, 200);
}
