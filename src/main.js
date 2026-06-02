// src/main.js
const { Bot, session } = require("grammy");

// ==================== Utility & Flows ====================
const { getOrCreateUser } = require("./utils/db.js");
const { mainMenuKB } = require("./utils/keyboard.js");
const { rateLimitMiddleware, startCleanup } = require("./middleware/rate-limit.js");

const {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleConfirm,
  handleReset,
  handleTextInput,
} = require("./flows/consultation.js");

const { handleShowPlans, handleSelectPlan } = require("./flows/plans.js");
const { handleAdminPanel, handleAdminLeads } = require("./flows/admin.js");
const {
  handleAboutUs,
  handleContactUs,
  handleSampleReports,
} = require("./flows/contact.js");

const { handleShowHistory, handleHistoryDetail } = require("./flows/history.js");

const {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
  handleShowAssessments,
  handleStartAssessmentTest,
  handleAssessmentAnswer,
} = require("./flows/educational.js");

// ==================== تنظیمات Appwrite ====================
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_INFO_RAW = process.env.BOT_INFO;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN در Environment Variables تنظیم نشده است!");
  process.exit(1);
}

// تنظیم botInfo برای جلوگیری از خطای "Bot not initialized"
let botInfo = null;
if (BOT_INFO_RAW) {
  try {
    botInfo = JSON.parse(BOT_INFO_RAW);
    console.log("✅ BOT_INFO از Environment Variables لود شد.");
  } catch (e) {
    console.warn("⚠️ BOT_INFO معتبر نیست، از حالت fallback استفاده می‌شود.");
  }
}

// ==================== ساخت بات ====================
const bot = new Bot(BOT_TOKEN);

// تنظیم botInfo (خیلی مهم برای Appwrite)
if (botInfo) {
  bot.botInfo = botInfo;
}

// Middleware
bot.use(session({ initial: () => ({ step: null, data: {} }) }));
bot.use(rateLimitMiddleware);

// ==================== Command & Callback Handlers ====================

bot.command("start", async (ctx) => {
  await getOrCreateUser(ctx.from.id, {
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  });

  await ctx.reply(
    `👋 سلام ${ctx.from.first_name}!\n\nبه ربات تحلیل آمادگی کاندیداتوری خوش آمدید.`,
    { reply_markup: mainMenuKB }
  );
});

bot.callbackQuery("main_menu", async (ctx) => {
  await ctx.editMessageText("🏠 منوی اصلی\n\nچه خدماتی نیاز دارید؟", {
    reply_markup: mainMenuKB,
  });
  await ctx.answerCallbackQuery();
});

// Consultation Flow
bot.callbackQuery("start_consultation", handleStartConsultation);
bot.callbackQuery(/^answer:/, handleAnswer);
bot.callbackQuery(/^edit:/, handleEdit);
bot.callbackQuery("confirm_consultation", handleConfirm);
bot.callbackQuery("reset_consultation", handleReset);

// Plans
bot.callbackQuery("show_plans", handleShowPlans);
bot.callbackQuery(/^select_plan:/, handleSelectPlan);

// Admin
bot.callbackQuery("admin_panel", handleAdminPanel);
bot.callbackQuery("admin_leads", handleAdminLeads);

// Static Pages
bot.callbackQuery("about_us", handleAboutUs);
bot.callbackQuery("contact_us", handleContactUs);
bot.callbackQuery("sample_reports", handleSampleReports);

// History
bot.callbackQuery("show_history", handleShowHistory);
bot.callbackQuery(/^history:/, handleHistoryDetail);

// Education & Assessment
bot.callbackQuery("education_list", handleShowEducationList);
bot.callbackQuery(/^edu_card:/, handleShowEducationCard);
bot.callbackQuery(/^edu_view:/, handleEducationView);
bot.callbackQuery(/^related:/, handleRelatedCards);
bot.callbackQuery("assessments", handleShowAssessments);
bot.callbackQuery(/^start_test:/, handleStartAssessmentTest);
bot.callbackQuery(/^assess:/, handleAssessmentAnswer);

// پیام‌های متنی کاربر
bot.on("message:text", handleTextInput);

// ==================== Entry Point برای Appwrite ====================
module.exports = async (req, res) => {
  try {
    console.log("📥 Execution started");

    // برای webhook mode (توصیه‌شده در Appwrite)
    if (req.method === "POST" && req.body) {
      await bot.handleUpdate(req.body);
      return res.status(200).json({ status: "ok" });
    }

    // تست اولیه
    if (req.method === "GET") {
      const me = await bot.api.getMe();
      return res.status(200).json({
        status: "online",
        username: me.username,
        botInfoLoaded: !!bot.botInfo,
      });
    }

    return res.status(200).json({ status: "ready" });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// فقط برای اجرای محلی (اختیاری)
if (require.main === module) {
  console.log("🚀 Running locally...");
  bot.start().then(() => {
    console.log("✅ Bot started locally");
    startCleanup();
  });
}
