// ============================================================
// 🗳️ کاندیداتوری هوشمند — @candidatoryiran_bot
// ============================================================
// فایل اصلی Appwrite Function — نسخه مقاوم در برابر مشکلات body
// Runtime: Node.js 20 | grammY | Appwrite Cloud
// ============================================================

import { Bot } from "grammy";

// وابستگی‌های داخلی
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
// 🔧 خواندن env
// ============================================================
function getEnv(env) {
  return {
    BOT_TOKEN: env.BOT_TOKEN,
    APPWRITE_PROJECT_ID: env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: env.APPWRITE_API_KEY,
    APPWRITE_ENDPOINT: env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
    DATABASE_ID: env.DATABASE_ID || "kandidatory_db",
    COLLECTION_USERS: env.COLLECTION_USERS || "users",
    COLLECTION_CONSULT: env.COLLECTION_CONSULT || "consultations",
    COLLECTION_LEADS: env.COLLECTION_LEADS || "leads_status",
  };
}

// ============================================================
// 🔄 استخراج update — نسخه بسیار مقاوم
// ============================================================
function extractUpdate(req, log = console.log) {
  log("[REQUEST] شروع استخراج update");

  // لاگ کلیدهای req برای دیباگ
  log("کلیدهای req موجود: " + (req ? Object.keys(req).join(", ") : "req خالی است"));

  // ۱. bodyJson — منبع اصلی در Appwrite جدید
  if (req.bodyJson && typeof req.bodyJson === "object" && Object.keys(req.bodyJson).length > 0) {
    log("✅ bodyJson معتبر پیدا شد");
    return req.bodyJson;
  }

  // ۲. body اگر آبجکت باشد
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    log("✅ body (object) معتبر پیدا شد");
    return req.body;
  }

  // ۳. payload (بعضی deploymentها این رو دارن)
  if (req.payload && typeof req.payload === "object" && Object.keys(req.payload).length > 0) {
    log("✅ payload معتبر پیدا شد");
    return req.payload;
  }

  // ۴. رشته‌های مختلف — با چک طول و trim
  const candidates = [
    { name: "body", val: req.body },
    { name: "bodyRaw", val: req.bodyRaw },
    { name: "bodyText", val: req.bodyText },
  ];

  for (const cand of candidates) {
    if (typeof cand.val === "string" && cand.val.trim().length >= 10) {
      try {
        const trimmed = cand.val.trim();
        log(`تلاش parse از ${cand.name} — طول: ${trimmed.length}`);
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          log(`✅ ${cand.name} با موفقیت parse شد`);
          return parsed;
        }
      } catch (e) {
        log(`❌ parse شکست در ${cand.name}: ${e.message} (طول: ${cand.val?.length || 0})`);
      }
    } else if (typeof cand.val === "string") {
      log(`❌ ${cand.name} خیلی کوتاه است (طول: ${cand.val.length})`);
    }
  }

  // اگر هیچی نبود
  log("⚠️ هیچ منبع معتبری برای update پیدا نشد — body احتمالاً خالی است");
  return null;
}

// ============================================================
// 🚀 نقطه ورود اصلی Appwrite Function
// ============================================================
export default async function (context) {
  const log = context.log || console.log;
  const error = context.error || console.error;

  log("[START] اجرای function شروع شد");

  // ---- ۱. خواندن محیط ----
  const env = getEnv(context.env || {});
  
  if (!env.BOT_TOKEN) {
    error("❌ BOT_TOKEN تنظیم نشده");
    return context.res.json({ ok: true, error: "missing BOT_TOKEN" }, 200);
  }

  // ---- ۲. اتصال به Appwrite ----
  try {
    initDB(env);
    log("✅ Appwrite با موفقیت مقداردهی شد");
  } catch (e) {
    error("❌ خطا در initDB: " + e.message);
    return context.res.json({ ok: true, error: "db init failed" }, 200);
  }

  // ---- ۳. ساخت بات ----
  const bot = new Bot(env.BOT_TOKEN);

  // ============================================================
  // هندلر دستورات
  // ============================================================
  bot.command("start", async (ctx) => {
    try {
      await getOrCreateUser(ctx.from);
      await ctx.reply(MENU_TEXT, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKB(),
      });
      log("/start موفق");
    } catch (e) {
      error("/start error: " + e.message);
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
      error("/menu error: " + e.message);
    }
  });

  // ============================================================
  // هندلر callback_query
  // ============================================================
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    log(`Callback دریافت شد: ${data}`);

    try {
      if (data === "main_menu") {
        await ctx.editMessageText(MENU_TEXT, {
          parse_mode: "Markdown",
          reply_markup: mainMenuKB(),
        });
      } else if (data === "start_consult") {
        await handleStartConsultation(ctx);
      } else if (data === "cancel_consult") {
        await handleCancelConsultation(ctx, mainMenuKB, MENU_TEXT);
        await ctx.answerCallbackQuery("❌ مشاوره لغو شد");
      } else if (data.startsWith("ans_")) {
        const parts = data.split("_");
        await handleAnswer(ctx, parseInt(parts[1]), parseInt(parts[2]));
      } else if (data.startsWith("edit_")) {
        await handleEdit(ctx, parseInt(data.replace("edit_", "")));
      } else if (data === "back_summary") {
        await handleBackToSummary(ctx);
      } else if (data === "confirm") {
        await handleConfirm(ctx);
      } else if (data === "show_plans") {
        await handleShowPlans(ctx);
      } else if (data.startsWith("plan_")) {
        await handleSelectPlan(ctx, data.replace("plan_", ""));
      } else if (data === "contact") {
        await handleContact(ctx);
      } else if (data === "about") {
        await handleAbout(ctx);
      } else if (data === "samples") {
        await handleSamples(ctx);
      } else {
        await ctx.answerCallbackQuery("⚠️ دستور ناشناخته");
      }
    } catch (e) {
      error(`خطا در callback ${data}: ${e.message}`);
      try { await ctx.answerCallbackQuery("⚠️ خطایی رخ داد"); } catch {}
    }
  });

  // ============================================================
  // هندلر پیام متنی (غیر دستوری)
  // ============================================================
  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    try {
      await handleTextInput(ctx, mainMenuKB, MENU_TEXT);
    } catch (e) {
      error("text handler error: " + e.message);
      await ctx.reply("⚠️ خطایی رخ داد. لطفاً /start بزنید.");
    }
  });

  // ============================================================
  // پردازش آپدیت تلگرام
  // ============================================================
  try {
    log("تلاش برای استخراج update...");
    const update = extractUpdate(context.req, log);

    if (!update) {
      log("⚠️ update استخراج نشد — درخواست احتمالاً بدون body معتبر است");
      return context.res.json({ ok: true }, 200);
    }

    log(`update استخراج شد — نوع: ${update.message ? "message" : update.callback_query ? "callback" : "دیگر"}`);

    if (!update.message && !update.callback_query && !update.edited_message) {
      log("⚠️ آپدیت بدون محتوای قابل پردازش");
      return context.res.json({ ok: true }, 200);
    }

    await bot.handleUpdate(update);
    log("✅ آپدیت با موفقیت پردازش شد");
  } catch (e) {
    error("❌ خطای کلی در پردازش آپدیت: " + e.message);
  }

  // همیشه 200 برگردان
  return context.res.json({ ok: true }, 200);
}
