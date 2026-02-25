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

const MENU_TEXT = `
🗳️ *به کاندیداتوری هوشمند خوش آمدید!*

سامانه تحلیل و مشاوره هوشمند انتخاباتی 🇮🇷

ما به شما کمک می‌کنیم:
• شانس موفقیت خود را بسنجید 📊
• نقاط قوت و ضعف را بشناسید 🔍
• با برنامه حرفه‌ای وارد میدان شوید 🚀

یکی از گزینه‌های زیر را انتخاب کنید:
`;

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

function extractUpdate(req, log) {
  if (req.method === "GET") {
    return null;
  }

  try {
    if (req.bodyJson && typeof req.bodyJson === "object" && Object.keys(req.bodyJson).length > 0) {
      log("📦 bodyJson");
      return req.bodyJson;
    }
  } catch {}

  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    log("📦 body obj");
    return req.body;
  }

  const sources = [
    { n: "body", v: req.body },
    { n: "bodyRaw", v: req.bodyRaw },
    { n: "bodyText", v: req.bodyText },
  ];
  for (const s of sources) {
    if (typeof s.v === "string" && s.v.trim().length > 5) {
      try {
        const p = JSON.parse(s.v.trim());
        if (p && typeof p === "object") { log("📦 " + s.n); return p; }
      } catch {}
    }
  }

  if (req.bodyBinary && req.bodyBinary.length > 5) {
    try {
      const t = new TextDecoder("utf-8").decode(req.bodyBinary);
      if (t.trim().length > 5) {
        const p = JSON.parse(t.trim());
        log("📦 binary");
        return p;
      }
    } catch {}
  }

  return null;
}

export default async function (context) {
  const log = context.log;
  const error = context.error;

  const env = getEnv();

  if (context.req.method === "GET") {
    log("✅ Health check OK");
    return context.res.json({ ok: true, status: "running" }, 200);
  }

  log("📩 POST received");
  log("body type: " + typeof context.req.body);
  log("body length: " + (context.req.body ? context.req.body.length : 0));
  log("bodyRaw length: " + (context.req.bodyRaw ? context.req.bodyRaw.length : 0));
  log("bodyBinary length: " + (context.req.bodyBinary ? context.req.bodyBinary.length : 0));

  if (!env.BOT_TOKEN) {
    error("❌ no BOT_TOKEN");
    return context.res.json({ ok: true }, 200);
  }

  try { initDB(env); } catch (e) {
    error("❌ DB: " + e.message);
    return context.res.json({ ok: true }, 200);
  }

  const bot = new Bot(env.BOT_TOKEN);

  bot.command("start", async (ctx) => {
    try {
      await getOrCreateUser(ctx.from);
      await ctx.reply(MENU_TEXT, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
    } catch (e) {
      error("/start: " + e.message);
      await ctx.reply("⚠️ خطا. دوباره /start بزنید.");
    }
  });

  bot.command("menu", async (ctx) => {
    try {
      await ctx.reply(MENU_TEXT, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
    } catch (e) { error("/menu: " + e.message); }
  });

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

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    try {
      await handleTextInput(ctx, mainMenuKB, MENU_TEXT);
    } catch (e) {
      error("txt: " + e.message);
      await ctx.reply("⚠️ خطا. /start بزنید.");
    }
  });

  try {
    const update = extractUpdate(context.req, log);

    if (!update) {
      log("⚠️ no update");
      return context.res.json({ ok: true }, 200);
    }

    if (!update.message && !update.callback_query && !update.edited_message) {
      log("⚠️ empty update");
      return context.res.json({ ok: true }, 200);
    }

    log("✅ processing: " + (update.message ? "msg" : "cb"));
    await bot.handleUpdate(update);
    log("✅ done");
  } catch (e) {
    error("❌ " + e.message);
  }

  return context.res.json({ ok: true }, 200);
}
