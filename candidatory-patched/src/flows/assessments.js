// src/flows/assessments.js — CommonJS
// ─── فهرست تحلیل‌های تخصصی ───

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser } = require("../utils/db.js");

// ─── تعریف انواع تحلیل ───
var ASSESSMENT_TYPES = [
  {
    id: "basic",
    emoji: "📊",
    name: "تحلیل آمادگی پایه",
    description: "ارزیابی کلی آمادگی شما برای کاندیداتوری",
    questionCount: 9,
    access: "free",
    requiredPlan: null,
    badge: "🆓 رایگان",
    dimensions: [
      "سابقه محلی",
      "سرمایه اجتماعی",
      "تیم و منابع",
      "تاب‌آوری",
      "مزیت رقابتی",
    ],
  },
  {
    id: "social_deep",
    emoji: "👥",
    name: "تحلیل عمیق سرمایه اجتماعی",
    description:
      "بررسی دقیق شبکه ارتباطی، نفوذ اجتماعی و پایگاه رأی شما",
    questionCount: 8,
    access: "paid",
    requiredPlan: "starter",
    badge: "⭐ بسته راه‌اندازی",
    dimensions: [
      "شبکه معتمدین",
      "نفوذ در اصناف",
      "ارتباط با جوانان",
      "ارتباط با بانوان",
      "حضور در تشکل‌ها",
      "شناخته‌شدگی عمومی",
    ],
  },
  {
    id: "competitive",
    emoji: "⚔️",
    name: "تحلیل قدرت رقابتی",
    description:
      "مقایسه شما با رقبای احتمالی و شناسایی مزیت‌های منحصربه‌فرد",
    questionCount: 6,
    access: "paid",
    requiredPlan: "starter",
    badge: "⭐ بسته راه‌اندازی",
    dimensions: [
      "تمایز از رقبا",
      "قدرت پیام",
      "منابع رقابتی",
      "پایگاه رأی متمایز",
    ],
  },
  {
    id: "risk",
    emoji: "⚠️",
    name: "تحلیل ریسک شکست",
    description:
      "شناسایی تهدیدها، نقاط آسیب‌پذیر و ریسک‌های پنهان کمپین شما",
    questionCount: 7,
    access: "paid",
    requiredPlan: "professional",
    badge: "🔥 بسته حرفه‌ای",
    dimensions: [
      "ریسک شایعه",
      "ریسک مالی",
      "ریسک تیمی",
      "ریسک حقوقی",
      "ریسک زمانی",
    ],
  },
  {
    id: "media",
    emoji: "📱",
    name: "تحلیل آمادگی رسانه‌ای",
    description:
      "ارزیابی توانایی شما در فضای مجازی، سخنرانی و مدیریت رسانه",
    questionCount: 5,
    access: "paid",
    requiredPlan: "professional",
    badge: "🔥 بسته حرفه‌ای",
    dimensions: [
      "حضور آنلاین",
      "فن بیان",
      "مدیریت بحران رسانه‌ای",
      "تولید محتوا",
    ],
  },
  {
    id: "full360",
    emoji: "🏆",
    name: "تحلیل جامع ۳۶۰°",
    description:
      "تمام تحلیل‌های بالا + گزارش اختصاصی PDF + توصیه‌های عملیاتی",
    questionCount: 35,
    access: "paid",
    requiredPlan: "vip",
    badge: "💎 بسته VIP",
    dimensions: ["تمام ابعاد ۵ تحلیل بالا"],
  },
];

// سلسله‌مراتب پلن‌ها (برای بررسی دسترسی)
var PLAN_HIERARCHY = {
  none: 0,
  single_session: 1,
  starter: 2,
  professional: 3,
  vip: 4,
};

/**
 * بررسی دسترسی کاربر به یک تحلیل
 */
function hasAccess(userPlan, requiredPlan) {
  if (!requiredPlan) return true; // رایگان
  var userLevel = PLAN_HIERARCHY[userPlan] || 0;
  var requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;
  return userLevel >= requiredLevel;
}

/**
 * نمایش لیست تحلیل‌های موجود
 */
async function handleShowAssessments(ctx) {
  var userId = String(ctx.from.id);
  var user = await getOrCreateUser(userId, ctx.from);

  // پلن فعلی کاربر (از leads_status یا users)
  var userPlan = user.purchasedPlan || "none";

  var t =
    "📊 *تحلیل‌های تخصصی کاندیداتوری*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "با انجام هر تحلیل، یک بُعد خاص از آمادگی شما " +
    "بررسی و امتیازدهی می‌شود.\n\n";

  for (var i = 0; i < ASSESSMENT_TYPES.length; i++) {
    var a = ASSESSMENT_TYPES[i];
    var canAccess = hasAccess(userPlan, a.requiredPlan);
    var lockIcon = canAccess ? "🔓" : "🔒";

    t += lockIcon + " " + a.emoji + " *" + a.name + "*\n";
    t += "   " + a.badge + " | " + a.questionCount + " سؤال\n";
    t += "   " + a.description + "\n";
    t += "   📐 ابعاد: " + a.dimensions.join("، ") + "\n\n";
  }

  t +=
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "🔓 = دسترسی دارید | 🔒 = نیاز به ارتقای پلن\n\n" +
    "تحلیل مورد نظر را انتخاب کنید:";

  // ساخت کیبورد
  var kb = new InlineKeyboard();

  for (var j = 0; j < ASSESSMENT_TYPES.length; j++) {
    var at = ASSESSMENT_TYPES[j];
    var accessible = hasAccess(userPlan, at.requiredPlan);

    if (accessible) {
      kb.text(
        at.emoji + " " + at.name,
        "assess:" + at.id
      ).row();
    } else {
      kb.text(
        "🔒 " + at.name + " ← " + at.badge,
        "assess_locked:" + at.id
      ).row();
    }
  }

  kb.text("💼 ارتقای پلن", "show_plans").row();
  kb.text("📂 تاریخچه تحلیل‌ها", "show_history").row();
  kb.text("🔙 منو", "menu").row();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(t, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    } catch (e) {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

/**
 * کاربر تحلیل قفل‌شده را انتخاب کرده
 */
async function handleLockedAssessment(ctx, assessId) {
  var assess = null;
  for (var i = 0; i < ASSESSMENT_TYPES.length; i++) {
    if (ASSESSMENT_TYPES[i].id === assessId) {
      assess = ASSESSMENT_TYPES[i];
      break;
    }
  }

  if (!assess) {
    if (ctx.callbackQuery)
      await ctx.answerCallbackQuery({ text: "❌ یافت نشد" });
    return;
  }

  var t =
    "🔒 *دسترسی محدود*\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    "تحلیل *«" + assess.name + "»* نیاز به " + assess.badge + " دارد.\n\n" +
    "📐 *ابعادی که بررسی می‌شود:*\n";

  for (var j = 0; j < assess.dimensions.length; j++) {
    t += "• " + assess.dimensions[j] + "\n";
  }

  t +=
    "\n💡 با ارتقای پلن، به این تحلیل و خدمات بیشتری دسترسی پیدا می‌کنید.\n";

  var kb = new InlineKeyboard()
    .text("💼 مشاهده بسته‌ها و ارتقا", "show_plans")
    .row()
    .text("📊 بازگشت به تحلیل‌ها", "show_assessments")
    .row()
    .text("🔙 منو", "menu")
    .row();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(t, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    } catch (e) {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery({
      text: "🔒 نیاز به " + assess.badge,
      show_alert: true,
    });
  }
}

/**
 * شروع یک تحلیل خاص
 */
async function handleStartAssessment(ctx, assessId) {
  if (assessId === "basic") {
    // تحلیل پایه = همان consultation فعلی
    var { handleStartConsultation } = require("./consultation.js");
    return await handleStartConsultation(ctx);
  }

  // برای تحلیل‌های دیگر فعلاً پیام "به زودی"
  var assess = null;
  for (var i = 0; i < ASSESSMENT_TYPES.length; i++) {
    if (ASSESSMENT_TYPES[i].id === assessId) {
      assess = ASSESSMENT_TYPES[i];
      break;
    }
  }

  var t =
    assess.emoji +
    " *" +
    assess.name +
    "*\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    "🔧 این تحلیل به زودی فعال می‌شود.\n\n" +
    "📞 برای اطلاعات بیشتر با ما تماس بگیرید.\n" +
    "💬 @candidatory\\_support";

  var kb = new InlineKeyboard()
    .text("📊 تحلیل‌های دیگر", "show_assessments")
    .row()
    .text("🚀 تحلیل پایه (رایگان)", "start_consultation")
    .row()
    .text("🔙 منو", "menu")
    .row();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(t, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    } catch (e) {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  }
}

module.exports = {
  ASSESSMENT_TYPES,
  PLAN_HIERARCHY,
  hasAccess,
  handleShowAssessments,
  handleLockedAssessment,
  handleStartAssessment,
};
