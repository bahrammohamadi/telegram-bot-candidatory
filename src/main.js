// src/main.js
// ─── نقطه ورود Appwrite Function ───
// ربات «کاندیداتوری هوشمند» @candidatoryiran_bot

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
} from "./flows/educational.js";

import {
  handleAdminCommand,
  handleAdminCallback,
  handleAdminSearch,
} from "./flows/admin.js";

// ═══════════════════════════════════════════
export default async function (context) {
  const env = context.env || process.env;
  initDB(env);

  const bot = new Bot(env.BOT_TOKEN);
  const ADMINS = (env.ADMIN_IDS || "").split(",").map((s) => s.trim());

  // ═══════════════════════════════════════
  //  دستورات
  // ═══════════════════════════════════════

  bot.command("start", async (ctx) => {
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  });

  bot.command("menu", async (ctx) => {
    await ctx.reply("📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:", {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  });

  bot.command("admin", async (ctx) => {
    if (ADMINS.includes(String(ctx.from.id))) {
      await handleAdminCommand(ctx);
    } else {
      await ctx.reply("⛔ دسترسی ندارید.");
    }
  });

  // ─── جستجوی ادمین ───
  bot.command("search", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/search", "").trim();
    if (q) await handleAdminSearch(ctx, "national_id", q);
    else await ctx.reply("❌ کد ملی را وارد کنید: `/search 0012345678`", { parse_mode: "Markdown" });
  });

  bot.command("searchphone", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/searchphone", "").trim();
    if (q) await handleAdminSearch(ctx, "phone", q);
    else await ctx.reply("❌ شماره را وارد کنید: `/searchphone 09121234567`", { parse_mode: "Markdown" });
  });

  // ═══════════════════════════════════════
  //  Callback Queries
  // ═══════════════════════════════════════

  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;

    try {
      // ─── منو ───
      if (d === "menu") {
        try {
          await ctx.editMessageText("📋 *منوی اصلی*\n\nگزینه مورد نظر:", {
            parse_mode: "Markdown",
            reply_markup: mainMenuKB(),
          });
        } catch {
          await ctx.reply("📋 *منوی اصلی*\n\nگزینه مورد نظر:", {
            parse_mode: "Markdown",
            reply_markup: mainMenuKB(),
          });
        }
        await ctx.answerCallbackQuery();
        return;
      }

      // ─── مشاوره ───
      if (d === "start_consultation") return await handleStartConsultation(ctx);

      if (d.startsWith("ans:")) {
        const [, idx, ...rest] = d.split(":");
        return await handleAnswer(ctx, parseInt(idx), rest.join(":"));
      }

      if (d.startsWith("back:")) {
        return await handleBackStep(ctx, parseInt(d.split(":")[1]));
      }

      if (d.startsWith("edit:")) {
        return await handleEdit(ctx, parseInt(d.split(":")[1]));
      }

      if (d === "confirm") return await handleConfirm(ctx);
      if (d === "cancel") return await handleCancelConsultation(ctx);

      // ─── پلن‌ها ───
      if (d === "show_plans") return await handleShowPlans(ctx);

      if (d.startsWith("plan:")) {
        return await handleSelectPlan(ctx, d.split(":")[1]);
      }

      if (d.startsWith("plan_request:")) {
        return await handlePlanRequest(ctx, d.split(":")[1]);
      }

      // ─── آموزش ───
      if (d === "edu_list") return await handleShowEducationList(ctx);
      if (d === "edu_noop") { await ctx.answerCallbackQuery(); return; }
      if (d.startsWith("edu:")) {
        const idx = parseInt(d.split(":")[1]);
        if (!isNaN(idx)) return await handleShowEducationCard(ctx, idx);
      }

      // ─── صفحات ───
      if (d === "about_us") return await handleAboutUs(ctx);
      if (d === "contact_us") return await handleContactUs(ctx);
      if (d === "sample_reports") return await handleSampleReports(ctx);

      // ─── ادمین ───
      if (d.startsWith("adm:")) {
        if (ADMINS.includes(String(ctx.from.id))) {
          return await handleAdminCallback(ctx, d);
        }
        await ctx.answerCallbackQuery({ text: "⛔ دسترسی ندارید" });
        return;
      }

      // ─── ناشناخته ───
      await ctx.answerCallbackQuery();
    } catch (e) {
      console.error("خطای callback:", e.message);
      try { await ctx.answerCallbackQuery({ text: "❌ خطا رخ داد" }); } catch {}
    }
  });

  // ═══════════════════════════════════════
  //  پیام‌های متنی
  // ═══════════════════════════════════════

  bot.on("message:text", async (ctx) => {
    try {
      // اول بررسی مشاوره
      const handled = await handleTextInput(ctx);
      if (handled) return;

      // پیام عادی → منو
      await ctx.reply(
        "📌 از منوی زیر انتخاب کنید یا /start بزنید.",
        { reply_markup: mainMenuKB() }
      );
    } catch (e) {
      console.error("خطای text:", e.message);
    }
  });

  // ═══════════════════════════════════════
  //  پردازش آپدیت
  // ═══════════════════════════════════════

  try {
    await bot.handleUpdate(context.req.body);
  } catch (e) {
    console.error("خطای handleUpdate:", e.message);
  }

  return context.res.json({ ok: true });
}
