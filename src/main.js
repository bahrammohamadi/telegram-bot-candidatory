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
// 🔧 خواندن env — فقط از process.env
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
// 🔄 استخراج update از request — تمام روش‌های ممکن
// ============================================================
function extractUpdate(req, log) {
  // ۱. bodyJson
  if (req.bodyJson && typeof req.bodyJson === "object" && Object.keys(req.bodyJson).length > 0) {
    log("📦 source: bodyJson");
    return req.bodyJson;
  }

  // ۲. body آبجکت
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    log("📦 source: body object");
    return req.body;
  }

  // ۳. رشته‌ها
  const strings = [
    { name: "body", val: req.body },
    { name: "bodyRaw", val: req.bodyRaw },
    { name: "bodyText", val: req.bodyText },
  ];

  for (const s of strings) {
    if (typeof s.val === "string" && s.val.trim().length > 5) {
      try {
        const parsed = JSON.parse(s.val.trim());
        if (parsed && typeof parsed === "object") {
          log("📦 source: " + s.name + " (parsed)");
          return parsed;
        }
      } catch {}
    }
  }

  // ۴. bodyBinary — Uint8Array یا Buffer
  if (req.bodyBinary && req.bodyBinary.length > 5) {
    try {
      let text;
      if (typeof TextDecoder !== "undefined") {
        text = new TextDecoder("utf-8").decode(req.bodyBinary);
      } else {
        text = Buffer.from(req.bodyBinary).toString("utf-8");
      }
      if (text && text.trim().length > 5) {
        const parsed = JSON.parse(text.trim());
        if (parsed && typeof parsed === "object") {
          log("📦 source: bodyBinary (decoded)");
          return parsed;
        }
      }
    } catch (e) {
      log("❌ bodyBinary decode failed: " + e.message);
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

  // ---- ۱. env از process.env ----
  const env = getEnv();

  log("🔍 BOT_TOKEN: " + (env.BOT_TOKEN ? "✅" : "❌"));
  log("🔍 PROJECT_ID: " + (env.APPWRITE_PROJECT_ID ? "✅" : "❌"));
  log("🔍 API_KEY: " + (env.APPWRITE_API_KEY ? "✅" : "❌"));

  if (!env.BOT_TOKEN) {
    error("❌ BOT_TOKEN پیدا نشد در process.env!");
    return context.res.json({ ok: true, error: "no token" }, 200);
  }

  if (!env.APPWRITE_PROJECT_ID || !env.APPWRITE_API_KEY) {
    error("❌ Appwrite credentials پیدا نشد!");
    return context.res.json({ ok: true, error: "no creds" }, 200);
  }

  // ---- ۲. Appwrite ----
  try {
    initDB(env);
    log("✅ DB ready");
  } catch (e) {
    error("❌ DB init: " + e.message);
    return context.res.json({ ok: true, error: "db fail" }, 200);
  }

  // ---- ۳. بات ----
  const bot = new Bot(env.BOT_TOKEN);

  // === /start ===
  bot.command("start", async (ctx) => {
    try {
      await getOrCreateUser(ctx.from);
      await ctx.reply(MENU_TEXT, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
    } catch (e) {
      error("/start: " + e.message);
      await ctx.reply("⚠️ خطا رخ داد. دوباره /start بزنید.");
    }
  });

  // === /menu ===
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

  // === Callback Query ===
  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;
    try {
      if (d === "main_menu") {
        await ctx.editMessageText(MENU_TEXT, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
        await ctx.answerCallbackQuery();
      } else if (d === "start_consult") {
        await handleStartConsultation(ctx);
        await ctx.answerCallbackQuery();
      } else if (d === "cancel_consult") {
        await handleCancelConsultation(ctx, mainMenuKB, MENU_TEXT);
        await ctx.answerCallbackQuery("❌ لغو شد");
      } else if (d.startsWith("ans_")) {
        const p = d.split("_");
        await handleAnswer(ctx, parseInt(p[1]), parseInt(p[2]));
      } else if (d.startsWith("edit_")) {
        await handleEdit(ctx, parseInt(d.replace("edit_", "")));
      } else if (d === "back_summary") {
        await handleBackToSummary(ctx);
      } else if (d === "confirm") {
        await handleConfirm(ctx);
      } else if (d === "show_plans") {
        await handleShowPlans(ctx);
      } else if (d.startsWith("plan_")) {
        await handleSelectPlan(ctx, d.replace("plan_", ""));
      } else if (d === "contact") {
        await handleContact(ctx);
      } else if (d === "about") {
        await handleAbout(ctx);
      } else if (d === "samples") {
        await handleSamples(ctx);
      } else {
        await ctx.answerCallbackQuery("⚠️ ناشناخته");
      }
    } catch (e) {
      error("cb: " + e.message);
      try { await ctx.answerCallbackQuery("⚠️ خطا"); } catch {}
    }
  });

  // === پیام متنی ===
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
  // 🔄 پردازش آپدیت — لاگ کامل برای دیباگ
  // ============================================================
  try {
    log("--- شروع استخراج آپدیت ---");
    log("req keys: " + Object.keys(context.req).join(", "));
    log("body type: " + typeof context.req.body + " | length: " + (context.req.body ? context.req.body.length : 0));
    log("bodyJson type: " + typeof context.req.bodyJson + " | value: " + JSON.stringify(context.req.bodyJson));
    log("bodyText type: " + typeof context.req.bodyText + " | length: " + (context.req.bodyText ? context.req.bodyText.length : 0));
    log("bodyRaw type: " + typeof context.req.bodyRaw + " | length: " + (context.req.bodyRaw ? context.req.bodyRaw.length : 0));
    log("bodyBinary type: " + typeof context.req.bodyBinary + " | length: " + (context.req.bodyBinary ? context.req.bodyBinary.length : 0));

    // سعی کن bodyBinary رو بخون
    if (context.req.bodyBinary && context.req.bodyBinary.length > 5) {
      try {
        const decoded = new TextDecoder("utf-8").decode(context.req.bodyBinary);
        log("bodyBinary decoded (first 500): " + decoded.substring(0, 500));
      } catch (e) {
        log("bodyBinary decode err: " + e.message);
      }
    }

    log("method: " + context.req.method);
    log("content-type: " + (context.req.headers["content-type"] || "none"));
    log("--- پایان لاگ‌های دیباگ ---");

    const update = extractUpdate(context.req, log);

    if (!update) {
      log("⚠️ آپدیت پیدا نشد");
      return context.res.json({ ok: true }, 200);
    }

    if (!update.message && !update.callback_query && !update.edited_message) {
      log("⚠️ آپدیت بدون محتوا");
      return context.res.json({ ok: true }, 200);
    }

    log("📩 " + (update.message ? "message" : "callback"));
    await bot.handleUpdate(update);
    log("✅ done");
  } catch (e) {
    error("❌ " + e.message);
  }

  return context.res.json({ ok: true }, 200);
}
