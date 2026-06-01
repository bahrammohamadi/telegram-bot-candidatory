// src/main.js — نسخه 2.0
// ═══════════════════════════════════════════════════════════════
// ✅ پاکسازی‌شده از کدهای بلااستفاده
// ✅ اضافه شدن Rate Limiting
// ✅ بهبود Error Handling
// ✅ بهبود Security
// ═══════════════════════════════════════════════════════════════

const { Bot, session } = require("grammy");
const { getOrCreateUser, updateUser } = require("./utils/db.js");
const { mainMenuKB } = require("./utils/keyboard.js");

// ═══════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════
const { rateLimitMiddleware, startCleanup } = require("./middleware/rate-limit.js");

// ═══════════════════════════════════════════════════════════════
// Flows
// ═══════════════════════════════════════════════════════════════
const {
  handleStartConsultation,
  handleAnswer,
  handleEdit,
  handleConfirm,
  handleReset,
  handleTextInput,
} = require("./flows/consultation.js");

const { handleShowPlans, handleSelectPlan } = require("./flows/plans.js");
const { handleAdminPanel } = require("./flows/admin.js");
const { handleAboutUs, handleContactUs, handleSampleReports } = require("./flows/contact.js");
const { handleShowHistory, handleHistoryDetail } = require("./flows/history.js");

const {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
} = require("./flows/educational.js");

// ═══════════════════════════════════════════════════════════════
// Bot init
// ═══════════════════════════════════════════════════════════════
const BOT_TOKEN = process.env.BOT_TOKEN || "";

// ✅ فیکس: botInfo از ENV یا Hardcoded
const HARDCODED_BOT_INFO = {
  id: 8478705530,
  is_bot: true,
  first_name: "کاندیداتوری هوشمند",
  username: "candidatoryiran_bot",
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
};

let botInfo;
try {
  botInfo = process.env.BOT_INFO ? JSON.parse(process.env.BOT_INFO) : HARDCODED_BOT_INFO;
} catch (e) {
  console.warn("⚠️ BOT_INFO parse failed, using hardcoded");
  botInfo = HARDCODED_BOT_INFO;
}

const bot = new Bot(BOT_TOKEN, {
  botInfo: botInfo,
});

// ═══════════════════════════════════════════════════════════════
// Session
// ═══════════════════════════════════════════════════════════════
bot.use(
  session({
    initial: () => ({
      step: 0,
      answers: {},
    }),
  })
);

// ═══════════════════════════════════════════════════════════════
// 🛡️ Rate Limiting (جلوگیری از Spam)
// ═══════════════════════════════════════════════════════════════
bot.use(rateLimitMiddleware());

// شروع پاکسازی خودکار
startCleanup();

// ═══════════════════════════════════════════════════════════════
// Middleware: ذخیره اطلاعات کاربر
// ═══════════════════════════════════════════════════════════════
bot.use(async (ctx, next) => {
  if (ctx.from) {
    try {
      await getOrCreateUser(ctx.from.id, {
        username: ctx.from.username || null,
        firstName: ctx.from.first_name || null,
        lastName: ctx.from.last_name || null,
      });
    } catch (e) {
      console.error("❌ خطا در ذخیره کاربر:", e.message);
    }
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

bot.callbackQuery("menu", async (ctx) => {
  try {
    await ctx.editMessageText("📋 *منوی اصلی:*", {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  } catch {
    await ctx.reply("📋 *منوی اصلی:*", {
      parse_mode: "Markdown",
      reply_markup: mainMenuKB(),
    });
  }
  await ctx.answerCallbackQuery();
});

// Consultation
bot.callbackQuery("start_consultation", handleStartConsultation);
bot.callbackQuery(/^answer:\d+:/, handleAnswer);
bot.callbackQuery(/^edit_step:\d+$/, handleEdit);
bot.callbackQuery("confirm_final", handleConfirm);
bot.callbackQuery("reset_consultation", handleReset);

// History
bot.callbackQuery("show_history", handleShowHistory);
bot.callbackQuery(/^history_detail:/, handleHistoryDetail);

// Plans
bot.callbackQuery("show_plans", handleShowPlans);
bot.callbackQuery(/^select_plan:/, handleSelectPlan);

// Education
bot.callbackQuery("show_education", handleShowEducationList);
bot.callbackQuery(/^edu_card:/, handleShowEducationCard);
bot.callbackQuery(/^edu_view:/, handleEducationView);
bot.callbackQuery(/^edu_related:/, handleRelatedCards);

// Contact
bot.callbackQuery("about_us", handleAboutUs);
bot.callbackQuery("contact_us", handleContactUs);
bot.callbackQuery("sample_reports", handleSampleReports);

// ═══════════════════════════════════════════════════════════════
// Text Messages
// ═══════════════════════════════════════════════════════════════
bot.on("message:text", async (ctx) => {
  // اگر در حال پاسخ به سؤالات است
  if (ctx.session.step > 0) {
    return await handleTextInput(ctx);
  }

  // پیام پیش‌فرض
  await ctx.reply("لطفاً از منوی زیر استفاده کنید یا /start بزنید.", {
    reply_markup: mainMenuKB(),
  });
});

// ═══════════════════════════════════════════════════════════════
// Error Handler
// ═══════════════════════════════════════════════════════════════
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`❌ خطا برای کاربر ${ctx.from?.id}:`, err.error);
  
  // لاگ دقیق‌تر
  if (err.error.stack) {
    console.error(err.error.stack);
  }
});

// ═══════════════════════════════════════════════════════════════
// Export for Appwrite Function
// ═══════════════════════════════════════════════════════════════
module.exports = async ({ req, res, log, error }) => {
  try {
    if (req.method === "POST") {
      const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      log("📨 Received update from Telegram");

      await bot.handleUpdate(update);
      return res.json({ ok: true });
    }

    // GET request - Health Check
    return res.json({
      status: "✅ Bot is running",
      timestamp: new Date().toISOString(),
      botInfo: botInfo,
    });
  } catch (e) {
    error("❌ Function error:", e);
    return res.json({ ok: false, error: e.message }, 500);
  }
};
