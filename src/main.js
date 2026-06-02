const { Bot, session } = require("grammy");
const { getOrCreateUser } = require("./utils/db.js");
const { mainMenuKB } = require("./utils/keyboard.js");
const { rateLimitMiddleware, startCleanup } = require("./middleware/rate-limit.js");
const { handleStartConsultation, handleAnswer, handleEdit, handleConfirm, handleReset, handleTextInput } = require("./flows/consultation.js");
const { handleShowPlans, handleSelectPlan } = require("./flows/plans.js");
const { handleAdminPanel, handleAdminLeads } = require("./flows/admin.js");
const { handleAboutUs, handleContactUs, handleSampleReports } = require("./flows/contact.js");
const { handleShowHistory, handleHistoryDetail } = require("./flows/history.js");
const { handleShowEducationList, handleShowEducationCard, handleEducationView, handleRelatedCards, handleShowAssessments, handleStartAssessmentTest, handleAssessmentAnswer } = require("./flows/educational.js");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const HB = { id: 847870553, is_bot: true, first_name: "کاندیداتوری", username: "candidatoryiran_bot", can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false };
let botInfo;
try { botInfo = process.env.BOT_INFO ? JSON.parse(process.env.BOT_INFO) : HB; } catch(e) { botInfo = HB; }

const bot = new Bot(BOT_TOKEN, { botInfo });
bot.use(session({ initial: () => ({ step: 0, answers: {}, currentTest: null, testStep: 0, testAnswers: {} }) }));
bot.use(rateLimitMiddleware());
startCleanup();

bot.use(async (ctx, next) => {
  if (ctx.from) {
    try { await getOrCreateUser(ctx.from.id, { username: ctx.from.username || null, firstName: ctx.from.first_name || null, lastName: ctx.from.last_name || null }); } catch(e) {}
  }
  await next();
});

bot.command("start", async (ctx) => {
  await ctx.reply("🎯 *به کاندیداتوری هوشمند خوش آمدید!*\n\nاز منوی زیر شروع کنید:", { parse_mode: "Markdown", reply_markup: mainMenuKB() });
});

bot.command("menu", async (ctx) => {
  await ctx.reply("🏠 منوی اصلی:", { reply_markup: mainMenuKB() });
});

bot.command("admin", handleAdminPanel);

bot.callbackQuery("menu", async (ctx) => {
  try { await ctx.editMessageText("🏠 منوی اصلی:", { reply_markup: mainMenuKB() }); }
  catch { await ctx.reply("🏠 منوی اصلی:", { reply_markup: mainMenuKB() }); }
  await ctx.answerCallbackQuery();
});

bot.callbackQuery("start_consultation", handleStartConsultation);
bot.callbackQuery(/^answer:\d+:/, handleAnswer);
bot.callbackQuery(/^edit_step:\d+$/, handleEdit);
bot.callbackQuery("confirm_final", handleConfirm);
bot.callbackQuery("reset_consultation", handleReset);
bot.callbackQuery("show_history", handleShowHistory);
bot.callbackQuery(/^history_detail:/, handleHistoryDetail);
bot.callbackQuery("show_plans", handleShowPlans);
bot.callbackQuery(/^select_plan:/, handleSelectPlan);
bot.callbackQuery("show_education", handleShowEducationList);
bot.callbackQuery(/^edu_card:/, handleShowEducationCard);
bot.callbackQuery(/^edu_view:/, handleEducationView);
bot.callbackQuery(/^edu_related:/, handleRelatedCards);
bot.callbackQuery("show_assessments", handleShowAssessments);
bot.callbackQuery(/^assess_start:/, handleStartAssessmentTest);
bot.callbackQuery(/^assess_answer:/, handleAssessmentAnswer);
bot.callbackQuery("about_us", handleAboutUs);
bot.callbackQuery("contact_us", handleContactUs);
bot.callbackQuery("sample_reports", handleSampleReports);
bot.callbackQuery("admin_leads", handleAdminLeads);

bot.on("message:text", async (ctx) => {
  if (ctx.session.step > 0) return await handleTextInput(ctx);
  await ctx.reply("🏠 از منوی زیر استفاده کنید یا /start بزنید.", { reply_markup: mainMenuKB() });
});

bot.catch((err) => { console.error("Bot error:", err.error); });

module.exports = async ({ req, res, log, error }) => {
  try {
    if (req.method === "POST") {
      const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      log("update received");
      await bot.handleUpdate(update);
      return res.json({ ok: true });
    }
    return res.json({ status: "running", timestamp: new Date().toISOString() });
  } catch(e) {
    error("Error:", e);
    return res.json({ ok: false, error: e.message }, 500);
  }
};
