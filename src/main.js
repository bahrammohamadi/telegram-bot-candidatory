// src/main.js — اصلاح‌شده نهایی ۱۴۰۴/۱۲/۰۸
// ═══════════════════════════════════════════════════════════════
// ✅ فیکس: اضافه شدن هندلرهای گمشده show_history, show_assessments
// ✅ فیکس: اضافه شدن callback handlers برای deep assessment
// ✅ بهبود: مدیریت اولویت متون برای deep assessment
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const { Bot, session } = require("grammy");
const { getOrCreateUser, updateUser } = require("./utils/db.js");
const { mainMenuKB } = require("./utils/keyboard.js");

// ═══════════════════════════════════════════════════════════════
// Flows
// ═══════════════════════════════════════════════════════════════
const {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleConfirm,
  handleReset,
} = require("./flows/consultation.js");

const { handleShowPlans, handleSelectPlan } = require("./flows/plans.js");
const { handleAdminPanel } = require("./flows/admin.js");
const { handleAboutUs, handleContactUs, handleSampleReports } = require("./flows/contact.js");

// ✅ فیکس: import history handlers
const { handleShowHistory, handleHistoryDetail } = require("./flows/history.js");

// ✅ فیکس: import assessment list
const { handleShowAssessments, handleSelectAssessment, handleAssessmentLocked } = require("./flows/assessments.js");

// ✅ فیکس: import educational handlers
const {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
} = require("./flows/educational.js");

// ✅ فیکس: import deep assessment
const {
  handleStartDeepAssessment,
  handleDeepAnswer,
  handleDeepConfirm,
  handleDeepEdit,
  handleDeepReset,
  handleDeepTextInput,
} = require("./flows/deep_assessment.js");

// ═══════════════════════════════════════════════════════════════
// Bot init
// ═══════════════════════════════════════════════════════════════
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const bot = new Bot(BOT_TOKEN);

bot.use(
  session({
    initial: () => ({ step: 0, answers: {}, deepStep: 0, deepAnswers: {}, deepModuleId: null }),
  })
);

// ═══════════════════════════════════════════════════════════════
// Middleware: save user info
// ═══════════════════════════════════════════════════════════════
bot.use(async (ctx, next) => {
  if (ctx.from) {
    await getOrCreateUser(ctx.from.id, {
      username: ctx.from.username || null,
      firstName: ctx.from.first_name || null,
      lastName: ctx.from.last_name || null,
    });
  }
  await next();
});

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🎯 *به کاندیداتوری هوشمند خوش آمدید!*\n\n" +
      "سامانه تحلیل و مشاوره آمادگی کاندیداتوری\n\n" +
      "از منوی زیر انتخاب کنید:",
    { parse_mode: "Markdown", reply_markup: mainMenuKB() }
  );
});

bot.command("menu", async (ctx) => {
  await ctx.reply("📋 *منوی اصلی:*", {
    parse_mode: "Markdown",
    reply_markup: mainMenuKB(),
  });
});

bot.command("admin", handleAdminPanel);

// ═══════════════════════════════════════════════════════════════
// Callback Queries
// ═══════════════════════════════════════════════════════════════

// ─── Main Menu ───
bot.callbackQuery("menu", async (ctx) => {
  await ctx.editMessageText("📋 *منوی اصلی:*", {
    parse_mode: "Markdown",
    reply_markup: mainMenuKB(),
  });
  await ctx.answerCallbackQuery();
});

// ─── Consultation (Phase 1) ───
bot.callbackQuery("start_consultation", handleStartConsultation);
bot.callbackQuery(/^answer:\d+:/, handleAnswer);
bot.callbackQuery(/^edit_step:\d+$/, handleEdit);
bot.callbackQuery("confirm_final", handleConfirm);
bot.callbackQuery("reset_consultation", handleReset);

// ✅ فیکس: History
bot.callbackQuery("show_history", handleShowHistory);
bot.callbackQuery(/^history_detail:/, handleHistoryDetail);

// ─── Plans ───
bot.callbackQuery("show_plans", handleShowPlans);
bot.callbackQuery(/^select_plan:/, handleSelectPlan);

// ✅ فیکس: Assessments
bot.callbackQuery("show_assessments", handleShowAssessments);
bot.callbackQuery(/^assess:/, handleSelectAssessment);
bot.callbackQuery(/^assess_locked:/, handleAssessmentLocked);

// ─── Educational ───
bot.callbackQuery("show_education", handleShowEducationList);
bot.callbackQuery(/^edu_card:/, handleShowEducationCard);
bot.callbackQuery(/^edu_view:/, handleEducationView);
bot.callbackQuery(/^edu_related:/, handleRelatedCards);

// ✅ فیکس: Deep Assessment (Phase 2)
bot.callbackQuery(/^deep_start:/, handleStartDeepAssessment);
bot.callbackQuery(/^deep_answer:/, handleDeepAnswer);
bot.callbackQuery(/^deep_edit:/, handleDeepEdit);
bot.callbackQuery("deep_confirm", handleDeepConfirm);
bot.callbackQuery("deep_reset", handleDeepReset);

// ─── Contact ───
bot.callbackQuery("about_us", handleAboutUs);
bot.callbackQuery("contact_us", handleContactUs);
bot.callbackQuery("sample_reports", handleSampleReports);

// ═══════════════════════════════════════════════════════════════
// Text Messages
// ═══════════════════════════════════════════════════════════════
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;

  // ✅ فیکس: اولویت اول - deep assessment text input
  if (ctx.session.deepStep > 0 && ctx.session.deepModuleId) {
    return await handleDeepTextInput(ctx);
  }

  // اولویت دوم - consultation text input
  if (ctx.session.step > 0) {
    const { handleTextInput } = require("./flows/consultation.js");
    return await handleTextInput(ctx);
  }

  // پیام پیش‌فرض
  await ctx.reply(
    "لطفاً از منوی زیر استفاده کنید یا /start بزنید.",
    { reply_markup: mainMenuKB() }
  );
});

// ═══════════════════════════════════════════════════════════════
// Error Handler
// ═══════════════════════════════════════════════════════════════
bot.catch((err) => {
  console.error("❌ Bot Error:", err);
});

// ═══════════════════════════════════════════════════════════════
// Export for Appwrite Function
// ═══════════════════════════════════════════════════════════════
module.exports = async ({ req, res, log, error }) => {
  try {
    if (req.method === "POST") {
      const update = JSON.parse(req.body || "{}");
      await bot.handleUpdate(update);
      return res.json({ ok: true });
    }
    return res.json({ status: "Bot is running" });
  } catch (e) {
    error("Function error:", e);
    return res.json({ ok: false, error: e.message }, 500);
  }
};
