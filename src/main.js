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
// 🔄 تابع کمکی — استخراج update از request
// ============================================================

/**
 * آپدیت تلگرام رو از هر جای ممکن در request استخراج می‌کنه
 * پشتیبانی از: body آبجکت، body رشته‌ای، bodyRaw، bodyText
 */
function extractUpdate(req, log) {
  // ---- ۱. اگه body آبجکت آماده باشه ----
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    log("📦 body: object");
    return req.body;
  }

  // ---- ۲. اگه body رشته باشه ----
  if (typeof req.body === "string" && req.body.length > 2) {
    try {
      const parsed = JSON.parse(req.body);
      log("📦 body: parsed string");
      return parsed;
    } catch {
      log("⚠️ body string parse failed");
    }
  }

  // ---- ۳. bodyRaw ----
  if (req.bodyRaw) {
    const raw = typeof req.bodyRaw === "string" ? req.bodyRaw : String(req.bodyRaw);
    if (raw.length > 2) {
      try {
        const parsed = JSON.parse(raw);
        log("📦 bodyRaw: parsed");
        return parsed;
      } catch {
        log("⚠️ bodyRaw parse failed");
      }
    }
  }

  // ---- ۴. bodyText ----
  if (req.bodyText && typeof req.bodyText === "string" && req.bodyText.length > 2) {
    try {
      const parsed = JSON.parse(req.bodyText);
      log("📦 bodyText: parsed");
      return parsed;
    } catch {
      log("⚠️ bodyText parse failed");
    }
  }

  // ---- ۵. bodyBinary (Buffer) ----
  if (req.bodyBinary) {
    try {
      const str = Buffer.from(req.bodyBinary).toString("utf-8");
      const parsed = JSON.parse(str);
      log("📦 bodyBinary: parsed");
      return parsed;
    } catch {
      log("⚠️ bodyBinary parse failed");
    }
  }

  return null;
}

// ============================================================
// 🚀 نقطه ورود Appwrite Function
// ============================================================

export default async function (context) {
  const log = context.log;
  const error = context.error;

  // ---- ۱. خواندن env ----
  const env = getEnv();

  if (!env.BOT_TOKEN) {
    error("❌ BOT_TOKEN پیدا نشد!");
    return context.res.json({ ok: true, error: "missing BOT_TOKEN" }, 200);
  }

  if (!env.APPWRITE_PROJECT_ID || !env.APPWRITE_API_KEY) {
    error("❌ APPWRITE credentials پیدا نشد!");
    return context.res.json({ ok: true, error: "missing credentials" }, 200);
  }

  // ---- ۲. مقداردهی Appwrite ----
  try {
    initDB(env);
  } catch (e) {
    error("❌ DB init error: " + e.message);
    return context.res.json({ ok: true, error: "db init failed" }, 200);
  }

  // ---- ۳. ساخت بات ----
  const bot = new Bot(env.BOT_TOKEN);

  // ============================================================
  // 📩 دستور /start
  // ============================================================
  bot.command("start", async (ctx) => {
    try {
      await getOrCreateUser(ctx.from);
      await ctx.reply(MENU_TEXT, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      error("/start error: " + e.message);
      await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره /start بزنید.");
    }
  });

  bot.command("menu", async (ctx) => {
    try {
      await ctx.reply(MENU_TEXT, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      error("/menu error: " + e.message);
    }
  });

  // ============================================================
  // 🔘 هندلر Callback Query
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
        await ctx.answerCallbackQuery("❌ مشاوره لغو شد");
        return;
      }

      if (d.startsWith("ans_")) {
        const parts = d.split("_");
        await handleAnswer(ctx, parseInt(parts[1]), parseInt(parts[2]));
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

      await ctx.answerCallbackQuery("⚠️ دستور ناشناخته");
    } catch (e) {
      error("callback error: " + e.message);
      try { await ctx.answerCallbackQuery("⚠️ خطا"); } catch {}
    }
  });

  // ============================================================
  // 💬 هندلر پیام‌های متنی
  // ============================================================
  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;

    try {
      await handleTextInput(ctx, mainMenuKB, MENU_TEXT);
    } catch (e) {
      error("text error: " + e.message);
      await ctx.reply("⚠️ خطایی رخ داد. /start بزنید.");
    }
  });

  // ============================================================
  // 🔄 پردازش آپدیت تلگرام
  // ============================================================
  try {
    // استخراج update از request
    const update = extractUpdate(context.req, log);

    if (!update) {
      log("⚠️ هیچ آپدیتی پیدا نشد");
      log("📋 req keys: " + JSON.stringify(Object.keys(context.req || {})));
      log("📋 body type: " + typeof context.req.body);
      log("📋 body value: " + JSON.stringify(context.req.body).substring(0, 300));
      return context.res.json({ ok: true }, 200);
    }

    if (!update.message && !update.callback_query && !update.edited_message) {
      log("⚠️ آپدیت بدون محتوا: " + JSON.stringify(Object.keys(update)));
      return context.res.json({ ok: true }, 200);
    }

    log("📩 آپدیت: " + (update.message ? "message" : "callback"));
    await bot.handleUpdate(update);
    log("✅ پردازش شد");
  } catch (e) {
    error("❌ خطای کلی: " + e.message);
  }

  return context.res.json({ ok: true }, 200);
}
