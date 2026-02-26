// src/main.js
// ─── نقطه ورود Appwrite Function (نسخه ۳ — با ارزیابی عمیق) ───
// ربات «کاندیداتوری هوشمند» @candidatoryiran_bot

import { Bot } from "grammy";
import { initDB } from "./utils/db.js";
import { mainMenuKB } from "./utils/keyboard.js";
import { WELCOME_MESSAGE } from "./constants/questions.js";

// ─── فلوهای فاز ۱ (مشاوره پایه) ───
import {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleBackStep,
  handleConfirm,
  handleCancelConsultation,
  handleTextInput,
} from "./flows/consultation.js";

// ─── فلوهای پلن‌ها و خدمات ───
import {
  handleShowPlans,
  handleSelectPlan,
  handlePlanRequest,
} from "./flows/plans.js";

// ─── فلوهای ارتباطی ───
import {
  handleAboutUs,
  handleContactUs,
  handleSampleReports,
} from "./flows/contact.js";

// ─── فلوهای آموزشی ───
import {
  handleShowEducationList,
  handleShowEducationCard,
} from "./flows/educational.js";

// ─── فلوهای ادمین ───
import {
  handleAdminCommand,
  handleAdminCallback,
  handleAdminSearch,
} from "./flows/admin.js";

// ─── فلوهای ارزیابی عمیق (فاز ۲) 🆕 ───
import {
  handleStartDeepAssessment,
  handleDeepBegin,
  handleDeepAnswer,
  handleDeepTextInput,
  handleDeepSkip,
  handleDeepBackStep,
  handleDeepConfirm,
  handleDeepExit,
} from "./flows/deep_assessment.js";

// ═══════════════════════════════════════════
//  تابع اصلی Appwrite Function
// ═══════════════════════════════════════════
export default async function (context) {
  const env = context.env || process.env;

  // مقداردهی اولیه دیتابیس
  initDB(env);

  // ساخت نمونه ربات
  const bot = new Bot(env.BOT_TOKEN);

  // لیست آیدی ادمین‌ها
  const ADMINS = (env.ADMIN_IDS || "").split(",").map((s) => s.trim());

  // ═══════════════════════════════════════
  //  دستورات (Commands)
  // ═══════════════════════════════════════

  // ─── /start ───
  bot.command("start", async (ctx) => {
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  });

  // ─── /menu ───
  bot.command("menu", async (ctx) => {
    await ctx.reply("📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:", {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  });

  // ─── /admin (فقط ادمین‌ها) ───
  bot.command("admin", async (ctx) => {
    if (ADMINS.includes(String(ctx.from.id))) {
      await handleAdminCommand(ctx);
    } else {
      await ctx.reply("⛔ دسترسی ندارید.");
    }
  });

  // ─── /search (جستجو با کد ملی — فقط ادمین) ───
  bot.command("search", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/search", "").trim();
    if (q) {
      await handleAdminSearch(ctx, "national_id", q);
    } else {
      await ctx.reply(
        "❌ کد ملی را وارد کنید:\n\n`/search 0012345678`",
        { parse_mode: "Markdown" }
      );
    }
  });

  // ─── /searchphone (جستجو با شماره تماس — فقط ادمین) ───
  bot.command("searchphone", async (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;
    const q = ctx.message.text.replace("/searchphone", "").trim();
    if (q) {
      await handleAdminSearch(ctx, "phone", q);
    } else {
      await ctx.reply(
        "❌ شماره را وارد کنید:\n\n`/searchphone 09121234567`",
        { parse_mode: "Markdown" }
      );
    }
  });

  // ═══════════════════════════════════════
  //  Callback Queries (دکمه‌های اینلاین)
  // ═══════════════════════════════════════

  bot.on("callback_query:data", async (ctx) => {
    const d = ctx.callbackQuery.data;

    try {
      // ─────────────────────────────────
      //  منوی اصلی
      // ─────────────────────────────────
      if (d === "menu") {
        try {
          await ctx.editMessageText(
            "📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:",
            {
              parse_mode: "Markdown",
              reply_markup: mainMenuKB(),
            }
          );
        } catch {
          await ctx.reply(
            "📋 *منوی اصلی*\n\nگزینه مورد نظر را انتخاب کنید:",
            {
              parse_mode: "Markdown",
              reply_markup: mainMenuKB(),
            }
          );
        }
        await ctx.answerCallbackQuery();
        return;
      }

      // ─────────────────────────────────
      //  فاز ۱: مشاوره پایه
      // ─────────────────────────────────

      // شروع مشاوره
      if (d === "start_consultation") {
        return await handleStartConsultation(ctx);
      }

      // پاسخ گزینه‌ای فاز ۱ (ans:stepIndex:value)
      if (d.startsWith("ans:")) {
        const [, idx, ...rest] = d.split(":");
        return await handleAnswer(ctx, parseInt(idx), rest.join(":"));
      }

      // بازگشت به مرحله قبل فاز ۱ (back:stepIndex)
      if (d.startsWith("back:")) {
        return await handleBackStep(ctx, parseInt(d.split(":")[1]));
      }

      // ویرایش مرحله فاز ۱ (edit:stepIndex)
      if (d.startsWith("edit:")) {
        return await handleEdit(ctx, parseInt(d.split(":")[1]));
      }

      // تایید نهایی فاز ۱
      if (d === "confirm") {
        return await handleConfirm(ctx);
      }

      // انصراف فاز ۱
      if (d === "cancel") {
        return await handleCancelConsultation(ctx);
      }

      // ─────────────────────────────────
      //  فاز ۲: ارزیابی عمیق 🆕
      // ─────────────────────────────────

      // صفحه معرفی ارزیابی عمیق
      if (d === "start_deep") {
        return await handleStartDeepAssessment(ctx);
      }

      // شروع واقعی ارزیابی عمیق
      if (d === "deep_begin") {
        return await handleDeepBegin(ctx);
      }

      // پاسخ گزینه‌ای ارزیابی عمیق (deep_ans:flatIdx:value)
      if (d.startsWith("deep_ans:")) {
        const parts = d.split(":");
        const flatIdx = parseInt(parts[1]);
        const value = parts.slice(2).join(":"); // برای مقادیری که : دارند
        return await handleDeepAnswer(ctx, flatIdx, value);
      }

      // بازگشت به مرحله قبل ارزیابی عمیق (deep_back:flatIdx)
      if (d.startsWith("deep_back:")) {
        const flatIdx = parseInt(d.split(":")[1]);
        return await handleDeepBackStep(ctx, flatIdx);
      }

      // رد شدن (Skip) ارزیابی عمیق (deep_skip:flatIdx)
      if (d.startsWith("deep_skip:")) {
        const flatIdx = parseInt(d.split(":")[1]);
        return await handleDeepSkip(ctx, flatIdx);
      }

      // تایید نهایی و تولید گزارش عمیق
      if (d === "deep_confirm") {
        return await handleDeepConfirm(ctx);
      }

      // خروج و ذخیره پاسخ‌های عمیق
      if (d === "deep_exit") {
        return await handleDeepExit(ctx);
      }

      // ─────────────────────────────────
      //  پلن‌ها و خدمات
      // ─────────────────────────────────

      // نمایش صفحه پلن‌ها
      if (d === "show_plans") {
        return await handleShowPlans(ctx);
      }

      // انتخاب پلن (plan:planId)
      if (d.startsWith("plan:")) {
        return await handleSelectPlan(ctx, d.split(":")[1]);
      }

      // ثبت درخواست پلن (plan_request:planId)
      if (d.startsWith("plan_request:")) {
        return await handlePlanRequest(ctx, d.split(":")[1]);
      }

      // ─────────────────────────────────
      //  آموزش‌ها
      // ─────────────────────────────────

      // فهرست آموزش‌ها
      if (d === "edu_list") {
        return await handleShowEducationList(ctx);
      }

      // دکمه بدون عمل (شماره صفحه)
      if (d === "edu_noop") {
        await ctx.answerCallbackQuery();
        return;
      }

      // نمایش کارت آموزشی (edu:index)
      if (d.startsWith("edu:")) {
        const idx = parseInt(d.split(":")[1]);
        if (!isNaN(idx)) {
          return await handleShowEducationCard(ctx, idx);
        }
      }

      // ─────────────────────────────────
      //  صفحات ثابت
      // ─────────────────────────────────

      if (d === "about_us") {
        return await handleAboutUs(ctx);
      }

      if (d === "contact_us") {
        return await handleContactUs(ctx);
      }

      if (d === "sample_reports") {
        return await handleSampleReports(ctx);
      }

      // ─────────────────────────────────
      //  پنل ادمین
      // ─────────────────────────────────

      if (d.startsWith("adm:")) {
        if (ADMINS.includes(String(ctx.from.id))) {
          return await handleAdminCallback(ctx, d);
        }
        await ctx.answerCallbackQuery({ text: "⛔ دسترسی ندارید" });
        return;
      }

      // ─────────────────────────────────
      //  callback ناشناخته
      // ─────────────────────────────────
      await ctx.answerCallbackQuery();

    } catch (e) {
      console.error("❌ خطای callback:", e.message);
      try {
        await ctx.answerCallbackQuery({ text: "❌ خطایی رخ داد" });
      } catch {
        // نادیده بگیر — شاید callback منقضی شده
      }
    }
  });

  // ═══════════════════════════════════════
  //  پیام‌های متنی
  // ═══════════════════════════════════════

  bot.on("message:text", async (ctx) => {
    try {
      // ─── اول: بررسی ارزیابی عمیق (فاز ۲) 🆕 ───
      const deepHandled = await handleDeepTextInput(ctx);
      if (deepHandled) return;

      // ─── دوم: بررسی مشاوره فاز ۱ ───
      const handled = await handleTextInput(ctx);
      if (handled) return;

      // ─── سوم: پیام عادی → نمایش منو ───
      await ctx.reply(
        "📌 از منوی زیر انتخاب کنید یا /start بزنید.",
        { reply_markup: mainMenuKB() }
      );
    } catch (e) {
      console.error("❌ خطای text:", e.message);
    }
  });

  // ═══════════════════════════════════════
  //  پردازش آپدیت دریافتی از تلگرام
  // ═══════════════════════════════════════

  try {
    await bot.handleUpdate(context.req.body);
  } catch (e) {
    console.error("❌ خطای handleUpdate:", e.message);
  }

  return context.res.json({ ok: true });
}
