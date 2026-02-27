// src/utils/access.js — CommonJS
// ─── سیستم کنترل دسترسی بر اساس پلن ───

const { getOrCreateUser } = require("./db.js");

// سلسله‌مراتب پلن‌ها
var PLAN_LEVELS = {
  none: 0,
  free: 0,
  single_session: 1,
  starter: 2,
  professional: 3,
  vip: 4,
};

// تعریف دسترسی‌های هر فیچر
var FEATURE_ACCESS = {
  // تحلیل‌ها
  basic_assessment: "none",
  social_deep_assessment: "starter",
  competitive_assessment: "starter",
  risk_assessment: "professional",
  media_assessment: "professional",
  full360_assessment: "vip",

  // آموزش‌ها
  edu_summary: "none",
  edu_keypoints: "none",
  edu_mistakes: "starter",
  edu_exercises: "starter",
  edu_tips: "professional",

  // گزارش
  basic_report: "none",
  detailed_report: "starter",
  pdf_report: "professional",
  comparison_report: "professional",
  personalized_report: "vip",

  // سایر
  history: "none",
  unlimited_tests: "starter",
  priority_support: "vip",
};

/**
 * دریافت سطح پلن کاربر
 */
async function getUserPlanLevel(userId) {
  try {
    var user = await getOrCreateUser(userId, {});
    var plan = user.purchasedPlan || user.role || "none";

    // ادمین‌ها دسترسی کامل دارند
    if (user.role === "admin") return 4;

    return PLAN_LEVELS[plan] || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * بررسی دسترسی به یک فیچر
 */
async function checkAccess(userId, featureId) {
  var userLevel = await getUserPlanLevel(userId);
  var requiredPlan = FEATURE_ACCESS[featureId] || "none";
  var requiredLevel = PLAN_LEVELS[requiredPlan] || 0;

  return {
    hasAccess: userLevel >= requiredLevel,
    userLevel: userLevel,
    requiredLevel: requiredLevel,
    requiredPlan: requiredPlan,
  };
}

/**
 * پیام قفل بودن فیچر
 */
function getLockedMessage(featureId) {
  var requiredPlan = FEATURE_ACCESS[featureId] || "starter";
  var planNames = {
    starter: "🌱 بسته راه‌اندازی",
    professional: "⭐ بسته حرفه‌ای",
    vip: "💎 بسته VIP",
  };
  var planName = planNames[requiredPlan] || "بسته بالاتر";

  return (
    "🔒 *دسترسی محدود*\n\n" +
    "این بخش نیاز به *" +
    planName +
    "* دارد.\n\n" +
    "💼 برای ارتقای پلن از منوی بسته‌ها اقدام کنید."
  );
}

/**
 * ست کردن پلن کاربر (توسط ادمین)
 */
async function setUserPlan(userId, planId) {
  var { updateUser } = require("./db.js");
  await updateUser(userId, { purchasedPlan: planId });
}

module.exports = {
  PLAN_LEVELS,
  FEATURE_ACCESS,
  getUserPlanLevel,
  checkAccess,
  getLockedMessage,
  setUserPlan,
};
