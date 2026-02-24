// ============================================================
// 🗳️ کاندیداتوری هوشمند — @candidatoryiran_bot
// فایل اصلی Appwrite Function
// Runtime: Node.js 20 | Framework: grammY | DB: Appwrite Cloud
// ============================================================

import { Bot } from "grammy";
import { initDB, getOrCreateUser } from "./utils/db.js";
import { mainMenuKB } from "./utils/keyboard.js";
import { STEPS } from "./constants/questions.js";

// فلوها
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
• با برنامه‌ریزی حرفه‌ای وارد میدان شوید 🚀

لطفاً یکی از گزینه‌ها را انتخاب کنید:
`;

// ============================================================
// 🚀 نقطه ورود Appwrite Function
// ============================================================
export default async function (context) {
  // ---- خواندن env ----
  const env = context.env || {};
  const BOT_TOKEN = env.BOT_TOKEN;

  // بررسی توکن
  if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN تنظیم نشده!");
    return context.res.json({ ok: true, error: "missing BOT_TOKEN" }, 200);
  }

  // ---- مقداردهی Appwrite ----
  initDB(env);

  // ---- ساخت بات ----
  const bot = new Bot(BOT_TOKEN);

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
      console.error("/start error:", e.message);
      await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره /start بزنید.");
    }
  });

  // دستور /menu
  bot.command("menu", async (ctx) => {
    await ctx.reply(MENU_TEXT, {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  });

  // ============================================================
  // 🔘 هندلر تمام Callback Query ها
  // ============================================================
  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;

    try {
      // ---- منوی اصلی ----
      if (d === "main_menu") {
        await ctx.editMessageText(MENU_TEXT, {
          parse_mode: "Markdown",
          reply_markup: mainMenuKB(),
        });
        await ctx.answerCallbackQuery();
        return;
      }

      // ---- شروع مشاوره ----
      if (d === "start_consult") {
        await handleStartConsultation(ctx);
        await ctx.answerCallbackQuery();
        return;
      }

      // ---- انصراف مشاوره ----
      if (d === "cancel_consult") {
        await handleCancelConsultation(ctx, mainMenuKB, MENU_TEXT);
        await ctx.answerCallbackQuery("❌ لغو شد");
        return;
      }

      // ---- جواب inline: ans_X_Y ----
      if (d.startsWith("ans_")) {
        const parts = d.split("_");
        const stepIdx = parseInt(parts[1]);
        const optIdx = parseInt(parts[2]);
        await handleAnswer(ctx, stepIdx, optIdx);
        return;
      }

      // ---- ویرایش مرحله: edit_X ----
      if (d.startsWith("edit_")) {
        const idx = parseInt(d.replace("edit_", ""));
        await handleEdit(ctx, idx);
        return;
      }

      // ---- برگشت به خلاصه از ویرایش ----
      if (d === "back_summary") {
        await handleBackToSummary(ctx);
        return;
      }

      // ---- تایید نهایی ----
      if (d === "confirm") {
        await handleConfirm(ctx);
        return;
      }

      // ---- پلن‌ها ----
      if (d === "show_plans") {
        await handleShowPlans(ctx);
        return;
      }

      // ---- انتخاب پلن ----
      if (d.startsWith("plan_")) {
        const type = d.replace("plan_", "");
        await handleSelectPlan(ctx, type);
        return;
      }

      // ---- ارتباط با ما ----
      if (d === "contact") {
        await handleContact(ctx);
        return;
      }

      // ---- درباره ما ----
      if (d === "about") {
        await handleAbout(ctx);
        return;
      }

      // ---- نمونه تحلیل‌ها ----
      if (d === "samples") {
        await handleSamples(ctx);
        return;
      }

      // ---- ناشناخته ----
      await ctx.answerCallbackQuery("⚠️ دستور ناشناخته");
    } catch (e) {
      console.error("callback error:", e.message);
      try {
        await ctx.answerCallbackQuery("⚠️ خطا رخ داد");
      } catch {}
    }
  });

  // ============================================================
  // 💬 هندلر پیام‌های متنی
  // ============================================================
  bot.on("message:text", async (ctx) => {
    // دستورات را نادیده بگیر (خود grammY هندل می‌کند)
    if (ctx.message.text.startsWith("/")) return;

    try {
      await handleTextInput(ctx, mainMenuKB, MENU_TEXT);
    } catch (e) {
      console.error("text error:", e.message);
      await ctx.reply("⚠️ خطایی رخ داد. /start بزنید.");
    }
  });

  // ============================================================
  // 🔄 پردازش آپدیت تلگرام
  // ============================================================
  try {
    const update = context.req.body;

    // بررسی آپدیت معتبر
    if (!update || typeof update !== "object") {
      return context.res.json({ ok: true }, 200);
    }

    if (!update.message && !update.callback_query && !update.edited_message) {
      return context.res.json({ ok: true }, 200);
    }

    await bot.handleUpdate(update);
  } catch (e) {
    console.error("❌ خطای کلی:", e.message);
  }

  // همیشه 200 OK
  return context.res.json({ ok: true }, 200);
}