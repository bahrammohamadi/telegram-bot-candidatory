// src/utils/score.js — CommonJS
// ─── موتور امتیازدهی و تولید گزارش ───

const { STEPS, SCORED_STEP_IDS, MAX_SCORE } = require("../constants/questions.js");

// ═══════════════════════════════════════════
// محاسبه امتیاز کل (۰ تا ۱۲۵)
// ═══════════════════════════════════════════
function calcScore(answers) {
  let total = 0;

  for (const stepId of SCORED_STEP_IDS) {
    const step = STEPS.find(s => s.id === stepId);
    if (!step || step.type !== "choice") continue;

    const selected = answers[stepId];
    if (!selected) continue;

    const opt = step.options.find(o => o.value === selected);
    if (opt) total += opt.score;
  }

  return total;
}

// ═══════════════════════════════════════════
// تعیین سطح ریسک و توصیه‌ها
// ═══════════════════════════════════════════
function getRiskLevel(score) {
  const pct = Math.round((score / MAX_SCORE) * 100);

  if (pct >= 80) {
    return {
      level: "excellent",
      emoji: "🟢",
      title: "آمادگی عالی",
      riskText: "low",
      description:
        "شما در وضعیت بسیار مناسبی قرار دارید. با اجرای یک کمپین هدفمند، شانس بالایی برای موفقیت خواهید داشت.",
      recommendation:
        "💡 تمرکز اصلی: استراتژی رسانه‌ای، متمایزسازی پیام و آماده‌سازی نمایندگان شعب.",
      actionItems: [
        "تدوین برنامه تبلیغاتی هفتگی",
        "آماده‌سازی نمایندگان شعب رأی‌گیری",
        "تقویت حضور هدفمند در شبکه‌های اجتماعی",
      ],
    };
  }

  if (pct >= 60) {
    return {
      level: "good",
      emoji: "🔵",
      title: "آمادگی خوب",
      riskText: "medium_low",
      description:
        "پتانسیل خوبی دارید، اما چند نقطه ضعف قابل اصلاح وجود دارد. با برنامه‌ریزی دقیق می‌توانید رقابتی جدی باشید.",
      recommendation:
        "💡 نقاط ضعف شناسایی‌شده را اولویت‌بندی کنید و با مشاور تخصصی مشورت نمایید.",
      actionItems: [
        "تقویت نقاط ضعف کلیدی",
        "مشاوره تخصصی انتخاباتی",
        "تشکیل تیم حداقلی فعال",
      ],
    };
  }

  if (pct >= 40) {
    return {
      level: "moderate",
      emoji: "🟡",
      title: "آمادگی متوسط",
      riskText: "medium",
      description:
        "نیاز به کار جدی در چند حوزه اصلی دارید. بدون اقدام فوری، ریسک شکست قابل توجه است.",
      recommendation:
        "💡 قبل از ثبت‌نام رسمی حتماً مشاوره بگیرید. ساخت تیم و پیام انتخاباتی اولویت اول است.",
      actionItems: [
        "مشاوره فوری تخصصی",
        "تشکیل تیم انتخاباتی",
        "تدوین پیام و شعار متمایز",
        "برنامه‌ریزی بودجه تبلیغات",
      ],
    };
  }

  if (pct >= 20) {
    return {
      level: "weak",
      emoji: "🟠",
      title: "آمادگی ضعیف",
      riskText: "high",
      description:
        "ریسک شکست در شرایط فعلی بسیار بالاست. شرکت بدون آماده‌سازی اساسی توصیه نمی‌شود.",
      recommendation:
        "💡 حداقل ۶ ماه زمان برای آماده‌سازی نیاز است. از بسته‌های آموزشی و مشاوره شروع کنید.",
      actionItems: [
        "ثبت‌نام در دوره آموزشی جامع",
        "شروع فعالیت اجتماعی محلی",
        "ساخت شبکه ارتباطی",
        "مشورت با افراد باتجربه انتخاباتی",
      ],
    };
  }

  return {
    level: "critical",
    emoji: "🔴",
    title: "آمادگی بسیار ضعیف",
    riskText: "very_high",
    description:
      "در وضعیت فعلی، کاندیداتوری اصلاً توصیه نمی‌شود. ابتدا باید زیرساخت‌های پایه را بسازید.",
    recommendation:
      "💡 ابتدا در فعالیت‌های اجتماعی محلی حضور فعال پیدا کنید و برای دوره بعدی برنامه‌ریزی نمایید.",
    actionItems: [
      "حضور فعال در مراسم‌ها و رویدادهای محلی",
      "عضویت و فعالیت در تشکل‌ها",
      "ساخت اعتبار اجتماعی طی ۱–۲ سال",
      "برنامه‌ریزی بلندمدت برای انتخابات بعدی",
    ],
  };
}

// ═══════════════════════════════════════════
// تحلیل تفصیلی هر بعد
// ═══════════════════════════════════════════
function analyzeDimensions(answers) {
  const dims = [];

  for (const stepId of SCORED_STEP_IDS) {
    const step = STEPS.find(s => s.id === stepId);
    if (!step || step.type !== "choice") continue;

    const selectedVal = answers[stepId];
    let stepScore = 0;
    let selectedLabel = "پاسخ داده نشده";

    if (selectedVal) {
      const opt = step.options.find(o => o.value === selectedVal);
      if (opt) {
        stepScore = opt.score;
        selectedLabel = opt.label;
      }
    }

    const pct = Math.round((stepScore / 25) * 100);

    let statusEmoji = "🔴";
    let statusText  = "بحرانی";

    if (pct >= 80)      { statusEmoji = "🟢"; statusText = "عالی"; }
    else if (pct >= 60) { statusEmoji = "🔵"; statusText = "خوب"; }
    else if (pct >= 40) { statusEmoji = "🟡"; statusText = "متوسط"; }
    else if (pct >= 20) { statusEmoji = "🟠"; statusText = "ضعیف"; }

    dims.push({
      stepId,
      title: step.title,
      score: stepScore,
      maxScore: 25,
      percent: pct,
      statusEmoji,
      statusText,
      selectedLabel,
    });
  }

  return dims;
}

// ═══════════════════════════════════════════
// تولید نوار پیشرفت بصری
// ═══════════════════════════════════════════
function bar(percent, len = 10) {
  const filled = Math.round((percent / 100) * len);
  return "█".repeat(filled) + "░".repeat(len - filled);
}

// ═══════════════════════════════════════════
// تولید گزارش نهایی
// ═══════════════════════════════════════════
function generateReport(score, answers) {
  const pct  = Math.round((score / MAX_SCORE) * 100);
  const risk = getRiskLevel(score);
  const dims = analyzeDimensions(answers);

  // اطلاعات پایه
  const elecStep  = STEPS.find(s => s.id === "election_type");
  const elecOpt   = elecStep?.options.find(o => o.value === answers.election_type);
  const elecLabel = elecOpt?.label || "نامشخص";
  const constituency = answers.constituency || "نامشخص";

  const reportDate = new Date().toLocaleString("fa-IR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  let r = "";

  r += "📊 *گزارش تحلیل آمادگی کاندیداتوری*\n";
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  r += "📋 *اطلاعات عمومی*\n";
  r += `├ 🗳️ نوع انتخابات: ${elecLabel}\n`;
  r += `├ 📍 حوزه انتخابیه: ${constituency}\n`;
  r += `└ 📅 تاریخ گزارش: ${reportDate}\n\n`;

  r += "═══════════════════════════════════════════\n";
  r += `${risk.emoji} *${risk.title}*\n`;
  r += "═══════════════════════════════════════════\n\n";

  r += `🏆 امتیاز کل: *${score}* از *${MAX_SCORE}*  (${pct}%)\n`;
  r += `${bar(pct, 15)}  ${pct}%\n\n`;

  r += `${risk.description}\n\n`;

  // تحلیل ابعاد
  r += "─── 📈 *تحلیل تفصیلی هر بعد* ───\n\n";
  for (const d of dims) {
    r += `${d.statusEmoji} *${d.title}* — ${d.statusText}\n`;
    r += ` ${bar(d.percent, 10)}  ${d.score}/${d.maxScore} (${d.percent}%)\n`;
    r += ` 📌 _${d.selectedLabel}_\n\n`;
  }

  // نقاط قوت
  const strengths = dims.filter(d => d.percent >= 70);
  if (strengths.length > 0) {
    r += "─── ✅ *نقاط قوت شما* ───\n\n";
    for (const s of strengths) {
      r += `• ${s.title} (${s.percent}%)\n`;
    }
    r += "\n";
  }

  // نقاط ضعف
  const weaknesses = dims.filter(d => d.percent < 45);
  if (weaknesses.length > 0) {
    r += "─── ⚠️ *نقاط نیاز به تقویت فوری* ───\n\n";
    for (const w of weaknesses) {
      r += `• ${w.title} (${w.percent}%) — ${w.statusText}\n`;
    }
    r += "\n";
  }

  // توصیه اصلی
  r += "─── 💡 *توصیه اصلی* ───\n\n";
  r += `${risk.recommendation}\n\n`;

  // اقدامات فوری
  if (risk.actionItems?.length > 0) {
    r += "─── 🚀 *اقدامات پیشنهادی فوری* ───\n\n";
    risk.actionItems.forEach((item, i) => {
      r += `${i + 1}. ${item}\n`;
    });
    r += "\n";
  }

  r += "─── 🎯 *مسیر پیشنهادی بعدی برای شما* ───\n\n";
  r += "۱. 🤖 *تحلیل هوشمند (AI)* — دکمه‌ی زیر را بزنید تا هوش مصنوعی استراتژی اختصاصی و توصیه‌های تکمیلی‌تان را تدوین کند.\n\n";
  r += "۲. 🏛 *مدیریت کمپین* — وارد ستاد مجازی شوید و «پروفایل کاندیدا»، رقبا و وعده‌هایتان را ثبت کنید.\n\n";
  r += "۳. 📊 *داشبورد کمپین* — جهت رصد مداوم درصد سلامت ستاد و کمپین خود، داشبورد را ببینید.\n\n";
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += "🤖 _کاندیداتوری هوشمند_\n";
  r += "📞 جهت ارتباط با مشاوران → منوی خدمات";

  return r;
}

module.exports = {
  calcScore,
  getRiskLevel,
  analyzeDimensions,
  generateReport,
  bar,
};
