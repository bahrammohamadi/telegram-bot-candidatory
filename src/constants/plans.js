// src/constants/plans.js — CommonJS
// ─── تعریف پلن‌های اشتراک ───

const PLANS = {
  free: {
    id: "free",
    emoji: "🆓",
    name: "رایگان",
    price: 0,
    priceLabel: "رایگان",
    level: 0,
    features: [
      "پروفایل پایه کاندیدا",
      "ارزیابی آمادگی کامل (۹ سؤال)",
      "گزارش با امتیاز کلی + نمودار ۵ بُعدی",
      "نمایش ۱ نقطه قوت و ۱ نقطه ضعف",
      "ثبت تا ۱ رقیب و ۳ وعده",
      "۳ کارت آموزشی (تب خلاصه)",
      "تاریخچه تحلیل‌ها",
    ],
    limits: {
      analysisPerMonth: 1,
      eduCards: 3,
      teamMembers: 0,
      rivals: 1,
      promises: 3,
    },
  },

  starter: {
    id: "starter",
    emoji: "🌱",
    name: "راه‌اندازی",
    price: 2800000,
    priceLabel: "۲,۸۰۰,۰۰۰ تومان",
    level: 1,
    features: [
      "همه امکانات رایگان",
      "پروفایل کامل کاندیدا",
      "تحلیل SWOT کامل",
      "تحلیل نامحدود",
      "مدیریت تا ۳ رقیب",
      "مدیریت تا ۱۰ وعده انتخاباتی",
      "برنامه‌ریز روزانه",
      "همه کارت‌های آموزشی",
      "گزارش PDF",
    ],
    limits: {
      analysisPerMonth: -1, // نامحدود
      eduCards: -1,
      teamMembers: 3,
      rivals: 3,
      promises: 10,
    },
  },

  professional: {
    id: "professional",
    emoji: "⭐",
    name: "حرفه‌ای",
    price: 8500000,
    priceLabel: "۸,۵۰۰,۰۰۰ تومان",
    level: 2,
    badge: "🔥 پرفروش",
    features: [
      "همه امکانات راه‌اندازی",
      "داشبورد سلامت کمپین",
      "مدیریت تیم کامل (تا ۱۰ نفر)",
      "مدیریت نامحدود رقبا",
      "مدیریت نامحدود وعده‌ها",
      "تولید محتوای هوشمند",
      "شبیه‌ساز مناظره",
      "مدیریت بحران",
      "برنامه‌ریز هفتگی و ماهانه",
      "گزارش‌های مدیریتی کامل",
      "مشاوره تلفنی ۳ جلسه",
    ],
    limits: {
      analysisPerMonth: -1,
      eduCards: -1,
      teamMembers: 10,
      rivals: -1,
      promises: -1,
    },
  },

  vip: {
    id: "vip",
    emoji: "💎",
    name: "VIP",
    price: 28000000,
    priceLabel: "۲۸,۰۰۰,۰۰۰ تومان",
    level: 3,
    features: [
      "همه امکانات حرفه‌ای",
      "مدیر کمپین اختصاصی",
      "تیم نامحدود",
      "مدیریت چند حوزه انتخابیه",
      "گزارش اختصاصی تحلیلگر",
      "پشتیبانی ۲۴/۷",
      "مشاوره حضوری",
    ],
    limits: {
      analysisPerMonth: -1,
      eduCards: -1,
      teamMembers: -1,
      rivals: -1,
      promises: -1,
    },
  },
};

// سلسله‌مراتب سطوح
const PLAN_LEVELS = {
  free: 0,
  none: 0,
  starter: 1,
  professional: 2,
  vip: 3,
};

// بررسی دسترسی
function hasAccess(userPlan, requiredPlan) {
  const userLevel = PLAN_LEVELS[userPlan] ?? 0;
  const reqLevel  = PLAN_LEVELS[requiredPlan] ?? 0;
  return userLevel >= reqLevel;
}

// دریافت اطلاعات پلن
function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

// بررسی محدودیت
function checkLimit(userPlan, limitKey, currentCount) {
  const plan = getPlan(userPlan);
  const limit = plan.limits[limitKey];
  if (limit === -1) return true; // نامحدود
  return currentCount < limit;
}

module.exports = {
  PLANS,
  PLAN_LEVELS,
  hasAccess,
  getPlan,
  checkLimit,
};
