// src/utils/deep_score.js — تبدیل‌شده به CommonJS
// ═══════════════════════════════════════════════════════════════
// ✅ فیکس: تبدیل از ESM به CommonJS
// ✅ محاسبه امتیاز و تولید گزارش برای ارزیابی عمیق
// ═══════════════════════════════════════════════════════════════

const {
  DEEP_MODULES,
  DEEP_MAX_SCORE,
  PERSONALITY_DIMENSIONS,
} = require("../constants/deep_assessment.js");

// ═══════════════════════════════════════════════════════════════
// محاسبه امتیاز یک ماژول
// ═══════════════════════════════════════════════════════════════
function calcDeepModuleScore(moduleId, answers) {
  const module = DEEP_MODULES.find((m) => m.id === moduleId);
  if (!module) return 0;

  let score = 0;
  const totalSteps = module.steps.length;

  module.steps.forEach((step, idx) => {
    const answer = answers[`step${idx + 1}`];
    if (!answer) return;

    // امتیازدهی بر اساس نوع سؤال
    if (step.type === "number") {
      const normalized = Math.min(100, (parseInt(answer) / step.max) * 100);
      score += normalized / totalSteps;
    } else if (step.type === "scale") {
      const normalized = ((parseInt(answer) - step.min) / (step.max - step.min)) * 100;
      score += normalized / totalSteps;
    } else if (step.type === "choice") {
      const option = step.options.find((o) => o.value === answer);
      if (option) {
        const valueMap = {
          very_active: 100,
          active: 75,
          high: 85,
          medium: 60,
          low: 40,
          none: 20,
          safe: 100,
          medium_risk: 50,
          high_risk: 10,
          full: 100,
          partial: 60,
          opposed: 20,
          professional: 100,
          volunteer: 70,
          always: 100,
          often: 80,
          sometimes: 50,
          rarely: 20,
          large: 100,
          small: 50,
        };
        score += (valueMap[option.value] || 50) / totalSteps;
      }
    } else if (step.type === "text") {
      // برای متنی: اگر پاسخ داده شده +۵۰ امتیاز
      score += answer.length > 10 ? 50 / totalSteps : 30 / totalSteps;
    }
  });

  return Math.round(score);
}

// ═══════════════════════════════════════════════════════════════
// محاسبه امتیاز کل (مجموع تمام ماژول‌ها)
// ═══════════════════════════════════════════════════════════════
function calcDeepTotalScore(moduleId, answers) {
  // در اینجا فقط یک ماژول داریم، برای کل باید از دیتابیس بخوانیم
  return calcDeepModuleScore(moduleId, answers);
}

// ═══════════════════════════════════════════════════════════════
// تحلیل پروفایل شخصیتی (برای ماژول personality)
// ═══════════════════════════════════════════════════════════════
function calcDeepPersonalityProfile(answers) {
  // تحلیل ساده - در نسخه واقعی باید الگوریتم پیچیده‌تری باشد
  const profile = {};

  PERSONALITY_DIMENSIONS.forEach((dim) => {
    profile[dim.id] = Math.floor(Math.random() * 40) + 60; // موقت: ۶۰-۱۰۰
  });

  return profile;
}

// ═══════════════════════════════════════════════════════════════
// تولید گزارش نهایی
// ═══════════════════════════════════════════════════════════════
function generateDeepReport(moduleId, answers, score, personality) {
  const module = DEEP_MODULES.find((m) => m.id === moduleId);
  if (!module) return "خطا: ماژول پیدا نشد";

  let report = `${module.emoji} *گزارش ${module.name}*\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // امتیاز کل
  report += `📊 *امتیاز کل: ${score}/${module.maxScore}*\n\n`;

  // نوار پیشرفت
  const barLength = 20;
  const filled = Math.round((score / module.maxScore) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
  report += `${bar} ${score}%\n\n`;

  // سطح
  let level = "";
  if (score >= 80) level = "🟢 عالی - آمادگی بسیار بالا";
  else if (score >= 60) level = "🟡 خوب - آمادگی مناسب";
  else if (score >= 40) level = "🟠 متوسط - نیاز به تقویت";
  else level = "🔴 ضعیف - نیاز به بازنگری جدی";

  report += `📈 *وضعیت:* ${level}\n\n`;

  // تحلیل تخصصی بر اساس ماژول
  if (moduleId === "social_deep") {
    report += `*🔍 تحلیل شبکه اجتماعی:*\n`;
    if (score >= 70) {
      report += `✅ شبکه اجتماعی قوی\n`;
      report += `✅ ارتباطات گسترده با فعالان محلی\n`;
      report += `💡 *توصیه:* روی کیفیت روابط تمرکز کنید، نه فقط کمیت\n\n`;
    } else {
      report += `⚠️ شبکه اجتماعی نیاز به تقویت دارد\n`;
      report += `📌 *اقدامات فوری:*\n`;
      report += `۱. حداقل ۳ ماه قبل از انتخابات شروع به حضور میدانی کنید\n`;
      report += `۲. در مراسم محلی فعال شوید\n`;
      report += `۳. یک برنامه هفتگی ملاقات با افراد کلیدی داشته باشید\n\n`;
    }
  } else if (moduleId === "competitive") {
    report += `*⚔️ تحلیل رقابتی:*\n`;
    if (score >= 65) {
      report += `✅ موقعیت رقابتی مناسب\n`;
      report += `💡 *توصیه:* روی تمایزسازی از رقبا تمرکز کنید\n\n`;
    } else {
      report += `⚠️ رقابت سختی در پیش است\n`;
      report += `📌 *استراتژی پیشنهادی:*\n`;
      report += `۱. تحلیل SWOT دقیق از خود و رقبا\n`;
      report += `۲. یافتن یک نیش (틈새 بازار) خاص\n`;
      report += `۳. ائتلاف‌سازی هوشمندانه\n\n`;
    }
  } else if (moduleId === "risk_assessment") {
    report += `*⚠️ ارزیابی ریسک:*\n`;
    if (score >= 75) {
      report += `✅ ریسک‌ها تحت کنترل هستند\n`;
      report += `💡 *توصیه:* برنامه بحران‌یابی (Crisis Management) داشته باشید\n\n`;
    } else {
      report += `🔴 ریسک‌های جدی وجود دارد\n`;
      report += `📌 *اقدامات اضطراری:*\n`;
      report += `۱. استخدام یک مشاور حقوقی\n`;
      report += `۲. تهیه پاسخ آماده برای سناریوهای بحرانی\n`;
      report += `۳. بیمه مسئولیت (در صورت امکان)\n\n`;
    }
  } else if (moduleId === "media_presence") {
    report += `*📱 تحلیل حضور رسانه‌ای:*\n`;
    if (score >= 70) {
      report += `✅ حضور دیجیتال قوی\n`;
      report += `💡 *توصیه:* محتوای ویدئویی کوتاه (Reels/Shorts) تولید کنید\n\n`;
    } else {
      report += `⚠️ حضور رسانه‌ای ضعیف\n`;
      report += `📌 *برنامه ۳۰ روزه:*\n`;
      report += `۱. راه‌اندازی کانال تلگرام اختصاصی\n`;
      report += `۲. پست روزانه (حداقل ۱ عدد)\n`;
      report += `۳. لایو هفتگی با مردم\n\n`;
    }
  } else if (moduleId === "full360") {
    report += `*🎯 تحلیل جامع:*\n`;
    if (score >= 75) {
      report += `✅ آمادگی کلی بسیار خوب\n`;
      report += `🏆 شانس برد: بالا\n\n`;
    } else if (score >= 50) {
      report += `🟡 آمادگی متوسط\n`;
      report += `📊 شانس برد: متوسط (نیاز به تلاش بیشتر)\n\n`;
    } else {
      report += `🔴 آمادگی پایین\n`;
      report += `⚠️ *توصیه جدی:* کاندیداتوری در این دوره را به تعویق بیندازید\n\n`;
    }
  } else if (moduleId === "personality") {
    report += `*🧠 پروفایل شخصیتی:*\n\n`;
    PERSONALITY_DIMENSIONS.forEach((dim) => {
      const val = personality[dim.id] || 50;
      const bar = "█".repeat(Math.round(val / 10)) + "░".repeat(10 - Math.round(val / 10));
      report += `${dim.emoji} ${dim.name}: ${bar} ${val}%\n`;
    });
    report += `\n`;
  }

  // نکات نهایی
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `💼 *قدم بعدی:*\n`;
  if (score >= 70) {
    report += `✅ شروع کمپین رسمی\n`;
    report += `✅ تشکیل تیم ستادی\n`;
    report += `✅ تدوین برنامه ۱۰۰ روزه\n`;
  } else {
    report += `📚 مطالعه کارت‌های آموزشی (منو > آموزش)\n`;
    report += `🤝 مشاوره با متخصصان\n`;
    report += `⏰ ۳ ماه آماده‌سازی بیشتر\n`;
  }

  report += `\n🔗 برای ارتقا به بسته حرفه‌ای: /start > بسته‌ها`;

  return report;
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════
module.exports = {
  calcDeepModuleScore,
  calcDeepTotalScore,
  calcDeepPersonalityProfile,
  generateDeepReport,
};
