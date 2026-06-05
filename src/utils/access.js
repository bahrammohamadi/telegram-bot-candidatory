// src/utils/access.js — CommonJS
// ─── سیستم کنترل دسترسی بر اساس پلن ───

const { PLAN_LEVELS, hasAccess, getPlan } = require("../constants/plans.js");
const { getOrCreateUser, updateUser } = require("./db.js");

// ═══════════════════════════════════════════
// تعریف دسترسی‌های هر فیچر
// ═══════════════════════════════════════════
const FEATURE_ACCESS = {
  // ارزیابی
  basic_assessment:    "free",
  swot_analysis:       "starter",
  health_analysis:     "professional",

  // پروفایل
  basic_profile:       "free",
  full_profile:        "starter",

  // مدیریت کمپین
  rivals_basic:        "free",       // ۱ رقیب
  rivals_full:         "starter",    // ۳ رقیب
  rivals_unlimited:    "professional",
  promises_basic:      "free",       // ۳ وعده
  promises_full:       "starter",
  team_management:     "starter",
  crisis_management:   "professional",

  // محتوا
  content_basic:       "starter",
  content_full:        "professional",

  // آموزش
  edu_basic:           "free",       // ۳ کارت
  edu_full:            "starter",

  // گزارش
  basic_report:        "free",
  detailed_report:     "starter",
  pdf_report:          "professional",

  // داشبورد
  dashboard:           "starter",
  campaign_health:     "professional",

  // تاریخچه
  history:             "free",

  // پشتیبانی
  priority_support:    "vip",
};

// ═══════════════════════════════════════════
// دریافت سطح پلن کاربر
// ═══════════════════════════════════════════
async function getUserPlanLevel(userId) {
  try {
    const user = await getOrCreateUser(String(userId), {});
    if (user.role === "admin") return 99; // ادمین دسترسی کامل
    const plan = user.purchasedPlan || "free";
    return PLAN_LEVELS[plan] ?? 0;
  } catch {
    return 0;
  }
}

// ═══════════════════════════════════════════
// بررسی دسترسی به یک فیچر
// ═══════════════════════════════════════════
async function checkAccess(userId, featureId) {
  try {
    const user        = await getOrCreateUser(String(userId), {});
    const userPlan    = user.role === "admin" ? "vip" : (user.purchasedPlan || "free");
    const requiredPlan = FEATURE_ACCESS[featureId] || "free";

    return {
      hasAccess:     hasAccess(userPlan, requiredPlan),
      userPlan,
      requiredPlan,
      isAdmin:       user.role === "admin",
    };
  } catch {
    return {
      hasAccess:     false,
      userPlan:      "free",
      requiredPlan:  FEATURE_ACCESS[featureId] || "free",
      isAdmin:       false,
    };
  }
}

// ═══════════════════════════════════════════
// Middleware: بررسی دسترسی و پیام قفل
// ═══════════════════════════════════════════
async function requireAccess(ctx, featureId) {
  const userId = String(ctx.from.id);
  const result = await checkAccess(userId, featureId);

  if (!result.hasAccess) {
    const { InlineKeyboard } = require("grammy");
    const planNames = {
      starter:      "🌱 بسته راه‌اندازی",
      professional: "⭐ بسته حرفه‌ای",
      vip:          "💎 بسته VIP",
    };
    const planName = planNames[result.requiredPlan] || "بسته بالاتر";

    const t =
      "🔒 *دسترسی محدود*\n\n" +
      `این بخش نیاز به *${planName}* دارد.\n\n` +
      "💼 برای ارتقای پلن از منوی بسته‌ها اقدام کنید.";

    const kb = new InlineKeyboard()
      .text("💼 مشاهده بسته‌ها", "show_plans").row()
      .text("🔙 منوی اصلی", "menu").row();

    try {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({
          text: `🔒 نیاز به ${planName}`,
          show_alert: true,
        });
        await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
      } else {
        await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
      }
    } catch (e) {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }

    return false;
  }

  return true;
}

// ═══════════════════════════════════════════
// بررسی ادمین بودن
// ═══════════════════════════════════════════
function isAdmin(userId, adminIds) {
  return adminIds.includes(String(userId));
}

// ═══════════════════════════════════════════
// ست کردن پلن کاربر (توسط ادمین)
// ═══════════════════════════════════════════
async function setUserPlan(userId, planId) {
  await updateUser(String(userId), { purchasedPlan: planId });
}

module.exports = {
  FEATURE_ACCESS,
  getUserPlanLevel,
  checkAccess,
  requireAccess,
  isAdmin,
  setUserPlan,
};
