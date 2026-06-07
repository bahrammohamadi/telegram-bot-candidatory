// src/utils/access.js — CommonJS
// ─── سیستم کنترل دسترسی بر اساس پلن ───

const { PLAN_LEVELS, hasAccess, getPlan, checkLimit } = require("../constants/plans.js");
const { getOrCreateUser, updateUser } = require("./db.js");
const { isAdminUserSync } = require("./admin-auth.js");

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
  // تولید محتوا (نام‌های واقعی استفاده‌شده در flows/content/generator.js)
  content_generator:   "starter",   // ورود به منوی تولید محتوا
  content_post:        "starter",   // پست شبکه اجتماعی
  content_slogan:      "starter",   // شعار
  content_sms:         "starter",   // پیامک
  content_speech:      "professional", // متن سخنرانی
  content_statement:   "professional", // بیانیه/اطلاعیه
  content_banner:      "professional", // بنر/طرح

  // آموزش
  edu_basic:           "free",       // ۳ کارت
  edu_full:            "starter",
  // تب‌های کارت آموزشی (نام‌های واقعی استفاده‌شده در flows/educational.js)
  edu_summary:         "free",        // خلاصه — رایگان (نمونه‌برداری)
  edu_keypoints:       "starter",     // نکات کلیدی
  edu_content:         "starter",     // محتوای کامل
  edu_tips:            "starter",     // نکات کاربردی
  edu_mistakes:        "professional",// اشتباهات رایج
  edu_exercises:       "professional",// تمرین‌ها

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
    if (isAdminUserSync(user)) return 99; // ادمین دسترسی کامل
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
    const admin       = isAdminUserSync(user);
    const userPlan    = admin ? "vip" : (user.purchasedPlan || "free");
    // fail-safe: اگر featureId در FEATURE_ACCESS تعریف نشده باشد،
    // به‌جای «free» آن را «starter» در نظر می‌گیریم تا قابلیتِ
    // فراموش‌شده‌ای به‌اشتباه برای کاربر رایگان باز نشود.
    const requiredPlan = FEATURE_ACCESS[featureId] || "starter";

    return {
      hasAccess:     hasAccess(userPlan, requiredPlan),
      userPlan,
      requiredPlan,
      isAdmin:       admin,
    };
  } catch {
    return {
      hasAccess:     false,
      userPlan:      "free",
      requiredPlan:  FEATURE_ACCESS[featureId] || "starter",
      isAdmin:       false,
    };
  }
}

// ═══════════════════════════════════════════
// نام فارسی هر فیچر (برای پیام شفافِ قفل)
// ═══════════════════════════════════════════
const FEATURE_NAMES = {
  basic_assessment:  "ارزیابی آمادگی",
  swot_analysis:     "تحلیل SWOT",
  health_analysis:   "تحلیل سلامت کمپین",
  full_profile:      "پروفایل کامل کاندیدا",
  rivals_basic:      "مدیریت رقبا",
  rivals_full:       "مدیریت رقبا",
  promises_basic:    "مدیریت وعده‌ها",
  promises_full:     "مدیریت وعده‌ها",
  team_management:   "مدیریت تیم",
  crisis_management: "مدیریت بحران",
  content_generator: "تولید محتوا",
  content_post:      "پست شبکه اجتماعی",
  content_slogan:    "شعار انتخاباتی",
  content_sms:       "پیامک تبلیغاتی",
  content_speech:    "متن سخنرانی",
  content_statement: "بیانیه رسمی",
  content_banner:    "متن بنر و پوستر",
  edu_summary:       "خلاصه‌ی آموزشی",
  edu_keypoints:     "نکات کلیدی آموزشی",
  edu_content:       "محتوای کامل آموزشی",
  edu_tips:          "نکات کاربردی آموزشی",
  edu_mistakes:      "اشتباهات رایج",
  edu_exercises:     "تمرین‌های آموزشی",
  dashboard:         "داشبورد کمپین",
  campaign_health:   "سلامت کمپین",
  detailed_report:   "گزارش تفصیلی",
  pdf_report:        "گزارش PDF",
};

// ═══════════════════════════════════════════
// برچسب فارسی + ایموجی هر پلن (برای نمایش روی دکمه‌های قفل)
// ═══════════════════════════════════════════
const PLAN_LABELS = {
  free:         "🆓 رایگان",
  starter:      "🌱 راه‌اندازی",
  professional: "⭐ حرفه‌ای",
  vip:          "💎 VIP",
};

function planLabelOf(planId) {
  return PLAN_LABELS[planId] || planId || "—";
}

// برچسب کوتاهِ قفل برای کنار دکمه‌ها، مثل: « 🔒 حرفه‌ای»
function lockBadge(requiredPlan) {
  const short = {
    starter:      "راه‌اندازی",
    professional: "حرفه‌ای",
    vip:          "VIP",
  }[requiredPlan];
  return short ? ` 🔒 ${short}` : "";
}

// برای ساخت دکمه‌های منو: می‌گوید این feature برای کاربر قفل است یا نه،
// و برچسب پلن لازم را برمی‌گرداند. (سنکرون نیست چون به DB نیاز دارد.)
async function featureLockInfo(ctx, featureId) {
  const info = await checkAccess(String(ctx.from.id), featureId);
  return {
    locked: !info.hasAccess,
    requiredPlan: info.requiredPlan,
    badge: info.hasAccess ? "" : lockBadge(info.requiredPlan),
    requiredLabel: planLabelOf(info.requiredPlan),
  };
}

// ═══════════════════════════════════════════
// Middleware: بررسی دسترسی و پیام قفل
// ═══════════════════════════════════════════
async function requireAccess(ctx, featureId) {
  const userId = String(ctx.from.id);
  const result = await checkAccess(userId, featureId);

  if (!result.hasAccess) {
    const { InlineKeyboard } = require("grammy");
    const { getPlan } = require("../constants/plans.js");
    const planNames = {
      starter:      "🌱 بسته راه‌اندازی",
      professional: "⭐ بسته حرفه‌ای",
      vip:          "💎 بسته VIP",
    };
    const planName = planNames[result.requiredPlan] || "بسته بالاتر";
    const featureName = FEATURE_NAMES[featureId] || "این قابلیت";
    const reqPlanObj  = getPlan(result.requiredPlan);
    const priceLine   = reqPlanObj?.priceLabel ? `\n💰 *قیمت بسته:* ${reqPlanObj.priceLabel}` : "";
    const yourPlan    = planLabelOf(result.userPlan);

    const t =
      "🔒 *دسترسی محدود*\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `بخش «*${featureName}*» در بسته‌ی فعلی شما (*${yourPlan}*) فعال نیست.\n\n` +
      `✅ این قابلیت با *${planName}* فعال می‌شود.${priceLine}\n\n` +
      "💡 با ارتقای بسته، این بخش و امکانات بیشتری برایتان باز می‌شود.";

    const kb = new InlineKeyboard()
      .text(`💼 ارتقا به ${planName.replace(/^[^ ]+ بسته /, "").trim() || "بسته بالاتر"}`, `plans:view:${result.requiredPlan}`).row()
      .text("📋 مشاهده همه بسته‌ها", "show_plans").row()
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
// بررسی محدودیت تعداد (limit) + پیام ارتقا
// مثال: requireLimit(ctx, "rivals", currentRivalsCount)
// خروجی true یعنی هنوز ظرفیت دارد؛ false یعنی به سقف رسیده و پیام نمایش داده شد.
// ═══════════════════════════════════════════
async function requireLimit(ctx, limitKey, currentCount) {
  const userId = String(ctx.from.id);
  let user;
  try {
    user = await getOrCreateUser(userId, {});
  } catch {
    user = {};
  }

  // ادمین = نامحدود
  if (isAdminUserSync(user)) return true;

  const userPlan = user.purchasedPlan || "free";
  if (checkLimit(userPlan, limitKey, currentCount)) return true;

  // به سقف رسیده → پیام ارتقا
  const { InlineKeyboard } = require("grammy");
  const plan  = getPlan(userPlan);
  const limit = plan.limits?.[limitKey];

  const labels = {
    rivals:   "رقیب",
    promises: "وعده",
    teamMembers: "عضو تیم",
    eduCards: "کارت آموزشی",
    analysisPerMonth: "تحلیل در این ماه",
  };
  const itemLabel = labels[limitKey] || "مورد";

  const t =
    "🔒 *به سقف بسته‌ی فعلی رسیدید*\n\n" +
    `در بسته‌ی *${plan.emoji} ${plan.name}* فقط می‌توانید *${limit}* ${itemLabel} ثبت کنید.\n\n` +
    "💼 برای ثبت نامحدود، بسته‌ی خود را ارتقا دهید.";

  const kb = new InlineKeyboard()
    .text("💼 مشاهده بسته‌ها", "show_plans").row()
    .text("🔙 منوی اصلی", "menu").row();

  try {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: `🔒 سقف ${itemLabel} در بسته‌ی فعلی: ${limit}`,
        show_alert: true,
      });
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    try { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } catch {}
  }

  return false;
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
  FEATURE_NAMES,
  PLAN_LABELS,
  getUserPlanLevel,
  checkAccess,
  requireAccess,
  requireLimit,
  featureLockInfo,
  planLabelOf,
  lockBadge,
  isAdmin,
  setUserPlan,
};
