// src/main.js
// ─── نقطه ورود Appwrite Function ───
// ربات تلگرامی «کاندیداتوری هوشمند» (@candidatoryiran_bot)

import { Bot } from "grammy";
import { initDB } from "./utils/db.js";
import { mainMenuKB } from "./utils/keyboard.js";
import { WELCOME_MESSAGE } from "./constants/questions.js";

// فلوها
import {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleBackStep,
  handleConfirm,
  handleCancelConsultation,
  handleTextInput,
} from "./flows/consultation.js";

import { handleShowPlans, handleSelectPlan } from "./flows/plans.js";

import {
  handleAboutUs,
  handleContactUs,
  handleShowSamples,
} from "./flows/contact.js";

import {
  handleShowEducationList,
  handleShowEducationCard,
} from "./flows/educational.js";

import {
  handleAdminCommand,
  handleAdminCallbackQuery,
  handleSearchNC,
  handleSearchPhone,
} from "./flows/admin.js";

// ═══════════════════════════════════════

export default async function (context) {
  const env = context.env || process.env;

  // مقداردهی اولیه دیتابیس
  initDB(env);

  const bot = new Bot(env.BOT_TOKEN);

  // لیست آیدی ادمین‌ها
  const ADMIN_IDS = (env.ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);

  // ─────────────────────────────────
  //  دستورات
  // ─────────────────────────────────

  bot.command("start", async (ctx) => {
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  });

  bot.command("menu", async (ctx) => {
    await ctx.reply("📋 *منوی اصلی*\n\nیکی از گزینه‌ها را انتخاب کنید:", {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  });

  // ادمین
  bot.command("admin", async (ctx) => {
    if (ADMIN_IDS.includes(String(ctx.from.id))) {
      await handleAdminCommand(ctx);
    } else {
      await ctx.reply("⛔ دسترسی ادمین ندارید.");
    }
  });

  bot.command("search_nc", async (ctx) => {
    if (!ADMIN_IDS.includes(String(ctx.from.id))) return;
    const code = ctx.message.text.split(" ")[1];
    if (!code) return ctx.reply("❌ استفاده: /search\\_nc 0012345678");
    await handleSearchNC(ctx, code);
  });

  bot.command("search_phone", async (ctx) => {
    if (!ADMIN_IDS.includes(String(ctx.from.id))) return;
    const ph = ctx.message.text.split(" ")[1];
    if (!ph) return ctx.reply("❌ استفاده: /search\\_phone 09121234567");
    await handleSearchPhone(ctx, ph);
  });

  // ─────────────────────────────────
  //  Callback Queries
  // ─────────────────────────────────

  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;

    try {
      // منو
      if (d === "menu") {
        try {
          await ctx.editMessageText("📋 *منوی اصلی*\n\nیکی از گزینه‌ها را انتخاب کنید:", {
            parse_mode: "Markdown", reply_markup: mainMenuKB(),
          });
        } catch {
          await ctx.reply("📋 *منوی اصلی*\n\nیکی از گزینه‌ها را انتخاب کنید:", {
            parse_mode: "Markdown", reply_markup: mainMenuKB(),
          });
        }
        return ctx.answerCallbackQuery();
      }

      // مشاوره
      if (d === "start_consultation") return handleStartConsultation(ctx);

      if (d.startsWith("answer:")) {
        const [, si, ...vp] = d.split(":");
        return handleAnswer(ctx, parseInt(si), vp.join(":"));
      }

      if (d.startsWith("back_step:")) {
        return handleBackStep(ctx, parseInt(d.split(":")[1]));
      }

      if (d.startsWith("edit_step:")) {
        return handleEdit(ctx, parseInt(d.split(":")[1]));
      }

      if (d === "confirm_final") return handleConfirm(ctx);
      if (d === "cancel_consultation") return handleCancelConsultation(ctx);

      // پلن‌ها
      if (d === "show_plans") return handleShowPlans(ctx);
      if (d.startsWith("plan:")) return handleSelectPlan(ctx, d.split(":")[1]);

      // آموزش
      if (d === "edu:list") return handleShowEducationList(ctx);
      if (d === "edu:noop") return ctx.answerCallbackQuery();
      if (d.startsWith("edu:")) {
        const idx = parseInt(d.split(":")[1]);
        if (!isNaN(idx)) return handleShowEducationCard(ctx, idx);
      }

      // صفحات ثابت
      if (d === "about_us") return handleAboutUs(ctx);
      if (d === "contact_us") return handleContactUs(ctx);
      if (d === "contact_support") return handleContactUs(ctx);
      if (d === "show_samples") return handleShowSamples(ctx);

      // ادمین
      if (d.startsWith("admin:")) {
        if (ADMIN_IDS.includes(String(ctx.from.id))) {
          return handleAdminCallbackQuery(ctx, d);
        }
        return ctx.answerCallbackQuery({ text: "⛔ دسترسی ندارید" });
      }

      await ctx.answerCallbackQuery();
    } catch (err) {
      console.error("خطا callback:", err.message);
      try { await ctx.answerCallbackQuery({ text: "❌ خطا — دوباره تلاش کنید" }); }
      catch {}
    }
  });

  // ─────────────────────────────────
  //  پیام‌های متنی
  // ─────────────────────────────────

  bot.on("message:text", async (ctx) => {
    try {
      const handled = await handleTextInput(ctx);

      if (!handled) {
        await ctx.reply(
          "📌 از منوی زیر گزینه مورد نظر را انتخاب کنید:\n\nیا /start بزنید.",
          { parse_mode: "Markdown", reply_markup: mainMenuKB() }
        );
      }
    } catch (err) {
      console.error("خطا message:text:", err.message);
    }
  });

  // ─────────────────────────────────
  //  پردازش آپدیت
  // ─────────────────────────────────

  try {
    await bot.handleUpdate(context.req.body);
  } catch (err) {
    console.error("خطا handleUpdate:", err.message);
  }

  return context.res.json({ ok: true });
}
