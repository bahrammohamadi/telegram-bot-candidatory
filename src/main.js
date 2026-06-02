// src/main.js
const { Bot, session } = require("grammy");
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

// ==================== تنظیمات ====================
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN تنظیم نشده است!");
  process.exit(1);
}

// Hardcoded Bot Info (برای جلوگیری از Bot not initialized)
const HARDCODED_BOT_INFO = {
  id: 8478705530, // ← این رو با بات خودت عوض کن
  is_bot: true,
  first_name: "Candidatory Bot",
  username: "candidatoryiran_bot",
  can_join_groups: false,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
};

let botInfo;
try {
  botInfo = process.env.BOT_INFO
    ? JSON.parse(process.env.BOT_INFO)
    : HARDCODED_BOT_INFO;
} catch (e) {
  console.warn("⚠️ BOT_INFO معتبر نیست، از اطلاعات پیش‌فرض استفاده می‌شود.");
  botInfo = HARDCODED_BOT_INFO;
}

// ==================== ساخت بات ====================
const bot = new Bot(BOT_TOKEN);

// تنظیم bot info برای محیط‌های serverless
bot.botInfo = botInfo;

// Middleware ها
bot.use(session({ initial: () => ({}) }));
bot.use(rateLimitMiddleware);

// ==================== هندلرهای اصلی ====================

// Start
bot.command("start", async (ctx) => {
  const user = await getOrCreateUser(ctx.from.id, {
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  });

  await ctx.reply(
    `👋 سلام ${ctx.from.first_name}!\n\nبه ربات تحلیل آمادگی کاندیداتوری خوش آمدید.`,
    { reply_markup: mainMenuKB }
  );
});

// منوی اصلی
bot.callbackQuery("main_menu", async (ctx) => {
  await ctx.editMessageText(
    "🏠 منوی اصلی\n\nچه خدماتی نیاز دارید؟",
    { reply_markup: mainMenuKB }
  );
  await ctx.answerCallbackQuery();
});

// Flow های مختلف
bot.callbackQuery("start_consultation", handleStartConsultation);
bot.callbackQuery(/^answer:/, handleAnswer);
bot.callbackQuery(/^edit:/, handleEdit);
bot.callbackQuery("confirm_consultation", handleConfirm);
bot.callbackQuery("reset_consultation", handleReset);

bot.callbackQuery("show_plans", handleShowPlans);
bot.callbackQuery(/^select_plan:/, handleSelectPlan);

bot.callbackQuery("admin_panel", handleAdminPanel);
bot.callbackQuery("admin_leads", handleAdminLeads);

bot.callbackQuery("about_us", handleAboutUs);
bot.callbackQuery("contact_us", handleContactUs);
bot.callbackQuery("sample_reports", handleSampleReports);

bot.callbackQuery("show_history", handleShowHistory);
bot.callbackQuery(/^history:/, handleHistoryDetail);

bot.callbackQuery("education_list", handleShowEducationList);
bot.callbackQuery(/^edu_card:/, handleShowEducationCard);
bot.callbackQuery(/^edu_view:/, handleEducationView);
bot.callbackQuery(/^related:/, handleRelatedCards);
bot.callbackQuery("assessments", handleShowAssessments);
bot.callbackQuery(/^start_test:/, handleStartAssessmentTest);
bot.callbackQuery(/^assess:/, handleAssessmentAnswer);

// هندلر متن (برای پاسخ‌های متنی در مراحل)
bot.on("message:text", handleTextInput);

// ==================== راه‌اندازی ====================
async function startBot() {
  try {
    console.log("🤖 بات در حال راه‌اندازی...");

    // تست اتصال
    const me = await bot.api.getMe();
    console.log(`✅ بات متصل شد: @${me.username}`);

    await bot.start();
    startCleanup(); // پاک‌سازی دوره‌ای

  } catch (error) {
    console.error("❌ خطا در راه‌اندازی بات:", error.message);
    process.exit(1);
  }
}

// برای Appwrite Functions و Local
if (require.main === module) {
  startBot();
} else {
  // برای serverless (Appwrite)
  module.exports = { bot, startBot };
}
