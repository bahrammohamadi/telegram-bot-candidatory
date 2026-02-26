import { Bot } from "grammy";
import { initDB, getOrCreateUser, isAdmin, updateUser, getLastConsultation } from "./utils/db.js";
import { mainMenuKB } from "./utils/keyboard.js";
import {
  handleStartConsultation,
  handleCancelConsultation,
  handleAnswer,
  handleEditSection,
  handleBackToSummary,
  handleConfirm,
  handleTextInput,
} from "./flows/consultation.js";
import { handleShowPlans, handleSelectPlan } from "./flows/plans.js";
import { handleContact, handleAbout, handleSamples } from "./flows/contact.js";
import {
  handleAdminList,
  handleAdminView,
  handleAdminStatus,
  handleAdminNoteStart,
  handleAdminNoteText,
} from "./flows/admin.js";
import { afterReportKB } from "./utils/keyboard.js";

const MENU_TEXT =
  "🗳️ *به کاندیداتوری هوشمند خوش آمدید!*\n\n" +
  "سامانه تحلیل و مشاوره هوشمند انتخاباتی 🇮🇷\n\n" +
  "ما به شما کمک می‌کنیم:\n" +
  "• شانس موفقیت خود را بسنجید 📊\n" +
  "• نقاط قوت و ضعف را بشناسید 🔍\n" +
  "• با برنامه حرفه‌ای وارد میدان شوید 🚀\n\n" +
  "یکی از گزینه‌های زیر را انتخاب کنید:";

const ADMIN_PIN = "1403";

function getEnv() {
  return {
    BOT_TOKEN: process.env.BOT_TOKEN,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
    DATABASE_ID: process.env.DATABASE_ID,
    COLLECTION_USERS: process.env.COLLECTION_USERS || "users",
    COLLECTION_CONSULT: process.env.COLLECTION_CONSULT || "consultations",
    COLLECTION_LEADS: process.env.COLLECTION_LEADS || "leads_status",
  };
}

function extractUpdate(req, log) {
  if (req.method === "GET") return null;
  try {
    if (req.bodyJson && typeof req.bodyJson === "object" && Object.keys(req.bodyJson).length > 0) return req.bodyJson;
  } catch {}
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) return req.body;
  const sources = [{ v: req.body }, { v: req.bodyRaw }, { v: req.bodyText }];
  for (const s of sources) {
    if (typeof s.v === "string" && s.v.trim().length > 5) {
      try { const p = JSON.parse(s.v.trim()); if (p) return p; } catch {}
    }
  }
  if (req.bodyBinary && req.bodyBinary.length > 5) {
    try {
      const t = new TextDecoder("utf-8").decode(req.bodyBinary);
      if (t.trim().length > 5) return JSON.parse(t.trim());
    } catch {}
  }
  return null;
}

export default async function (context) {
  const log = context.log;
  const error = context.error;
  const env = getEnv();

  if (context.req.method === "GET") {
    return context.res.json({ ok: true, status: "running" }, 200);
  }

  if (!env.BOT_TOKEN) {
    error("no BOT_TOKEN");
    return context.res.json({ ok: true }, 200);
  }

  const update = extractUpdate(context.req, log);
  if (!update) return context.res.json({ ok: true }, 200);
  if (!update.message && !update.callback_query && !update.edited_message) {
    return context.res.json({ ok: true }, 200);
  }

  try { initDB(env); } catch (e) {
    error("DB: " + e.message);
    return context.res.json({ ok: true }, 200);
  }

  const bot = new Bot(env.BOT_TOKEN);
  try { await bot.init(); } catch (e) {
    error("bot.init: " + e.message);
    return context.res.json({ ok: true }, 200);
  }

  // === /start ===
  bot.command("start", async (ctx) => {
    try {
      await getOrCreateUser(ctx.from);
      await ctx.reply(MENU_TEXT, { parse_mode: "Markdown", reply_markup: mainMenuKB() });
    } catch (e) {
      error("/start: " + e.message);
      await ctx.reply("خطا رخ داد. دوباره /start بزنید.");
    }
  });

  bot.command("menu", async (ctx) => {
    try { await ctx.reply(MENU_TEXT, { parse_mode: "Markdown", reply_markup: mainMenuKB() }); }
    catch (e) { error("/menu: " + e.message); }
  });

  // === /admin ===
  bot.command("admin", async (ctx) => {
    try {
      const admin = await isAdmin(ctx.from.id);
      if (!admin) {
        await ctx.reply("دسترسی ندارید.");
        return;
      }
      await updateUser(ctx.from.id, { currentStep: 5000 });
      await ctx.reply("🔐 کد امنیتی ۴ رقمی را وارد کنید:");
    } catch (e) {
      error("/admin: " + e.message);
    }
  });

  // === Callbacks ===
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
        await ctx.answerCallbackQuery("لغو شد");

      } else if (d.startsWith("ans_")) {
        const p = d.split("_");
        await handleAnswer(ctx, parseInt(p[1]), parseInt(p[2]));

      } else if (d.startsWith("edit_section_")) {
        const sec = d.replace("edit_section_", "");
        await handleEditSection(ctx, sec);

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

      // === مشاهده آخرین تحلیل ===
      } else if (d === "my_report") {
        try {
          const lastDoc = await getLastConsultation(ctx.from.id);
          if (!lastDoc) {
            await ctx.editMessageText(
              "هنوز تحلیلی ثبت نشده.\n\nبرای شروع، مشاوره هوشمند را انتخاب کنید.",
              { reply_markup: mainMenuKB() }
            );
          } else {
            const report = lastDoc.finalReport || "گزارشی موجود نیست.";
            await ctx.editMessageText("آخرین تحلیل شما در پیام بعدی ارسال میشود...", {
              parse_mode: "Markdown",
            });
            await ctx.reply(report, {
              parse_mode: "Markdown",
              reply_markup: afterReportKB(),
            });
          }
        } catch (e) {
          error("my_report: " + e.message);
          await ctx.editMessageText("خطا در دریافت تحلیل.", { reply_markup: mainMenuKB() });
        }
        await ctx.answerCallbackQuery();

      // === ادمین callbacks ===
      } else if (d === "admin_list") {
        if (await isAdmin(ctx.from.id)) {
          await handleAdminList(ctx, 0);
        }
        await ctx.answerCallbackQuery();

      } else if (d.startsWith("admin_page_")) {
        const page = parseInt(d.replace("admin_page_", ""));
        if (await isAdmin(ctx.from.id)) await handleAdminList(ctx, page);
        await ctx.answerCallbackQuery();

      } else if (d.startsWith("admin_view_")) {
        const docId = d.replace("admin_view_", "");
        if (await isAdmin(ctx.from.id)) await handleAdminView(ctx, docId);

      } else if (d.startsWith("admin_status_")) {
        const rest = d.replace("admin_status_", "");
        // فرمت: docId_status
        const firstUnderscore = rest.indexOf("_");
        const docId = rest.substring(0, firstUnderscore);
        const status = rest.substring(firstUnderscore + 1);
        if (await isAdmin(ctx.from.id)) await handleAdminStatus(ctx, docId, status);

      } else if (d.startsWith("admin_note_")) {
        const docId = d.replace("admin_note_", "");
        if (await isAdmin(ctx.from.id)) await handleAdminNoteStart(ctx, docId, updateUser);

      } else {
        await ctx.answerCallbackQuery("ناشناخته");
      }
    } catch (e) {
      error("cb: " + e.message);
      try { await ctx.answerCallbackQuery("خطا"); } catch {}
    }
  });

  // === پیام متنی ===
  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;

    try {
      const user = await getOrCreateUser(ctx.from);
      const cs = user.currentStep ?? 0;

      // ادمین PIN
      if (cs === 5000) {
        if (ctx.message.text.trim() === ADMIN_PIN) {
          await updateUser(ctx.from.id, { currentStep: 0 });
          await ctx.reply("ورود موفق!");
          await handleAdminList(ctx, 0);
        } else {
          await ctx.reply("کد اشتباه. دوباره /admin بزنید.");
          await updateUser(ctx.from.id, { currentStep: 0 });
        }
        return;
      }

      // ادمین یادداشت
      if (cs === 6000) {
        await handleAdminNoteText(ctx);
        return;
      }

      // مشاوره عادی
      await handleTextInput(ctx, mainMenuKB, MENU_TEXT);
    } catch (e) {
      error("txt: " + e.message);
      await ctx.reply("خطا. /start بزنید.");
    }
  });

  try {
    await bot.handleUpdate(update);
    log("done");
  } catch (e) {
    error(e.message);
  }

  return context.res.json({ ok: true }, 200);
}
