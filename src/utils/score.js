// src/utils/score.js — CommonJS
// ═══════════════════════════════════════════════════════════════
//  سیستم امتیازدهی، تحلیل ابعاد و تولید گزارش
// ═══════════════════════════════════════════════════════════════

const {
  STEPS,
  SCORED_STEP_IDS,
  MAX_SCORE,
} = require("../constants/questions.js");

/**
 * محاسبه امتیاز کل
 */
function calcScore(answers) {
  var total = 0;
  for (var i = 0; i < SCORED_STEP_IDS.length; i++) {
    var stepId = SCORED_STEP_IDS[i];
    var step = STEPS.find(function (s) {
      return s.id === stepId;
    });
    if (!step || step.type !== "choice") continue;
    var selected = answers[stepId];
    if (!selected) continue;
    var opt = step.options.find(function (o) {
      return o.value === selected;
    });
    if (opt) total += opt.score;
  }
  return total;
}

/**
 * سطح ریسک / آمادگی
 */
function getRiskLevel(score) {
  var pct = Math.round((score / MAX_SCORE) * 100);

  if (pct >= 80) {
    return {
      level: "excellent",
      emoji: "🟢",
      title: "آمادگی عالی",
      riskText: "low",
      description:
        "شما در وضعیت بسیار مناسبی قرار دارید. با بهینه‌سازی کمپین، شانس بالایی برای موفقیت دارید.",
      recommendation:
        "💡 توصیه: روی استراتژی رسانه‌ای و متمایزسازی پیام تمرکز کنید. نمایندگان شعب را از الان آماده کنید.",
      actionItems: [
        "تدوین برنامه تبلیغاتی هفته‌ای",
        "آماده‌سازی نمایندگان شعب رأی‌گیری",
        "تقویت حضور در شبکه‌های اجتماعی",
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
        "پتانسیل خوبی دارید ولی نقاط ضعفی قابل اصلاح وجود دارد. با برنامه‌ریزی می‌توانید رقابتی جدی داشته باشید.",
      recommendation:
        "💡 توصیه: نقاط ضعف شناسایی‌شده را با کمک مشاور تخصصی برطرف کنید.",
      actionItems: [
        "شناسایی و تقویت نقاط ضعف",
        "مشاوره تخصصی انتخاباتی",
        "تشکیل تیم حداقلی",
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
        "نیاز به تقویت جدی در چند حوزه کلیدی دارید. بدون اقدام فوری، ریسک شکست بالاست.",
      recommendation:
        "💡 توصیه: قبل از ثبت‌نام حتماً مشاوره بگیرید. ساخت تیم و تدوین پیام اولویت اول شماست.",
      actionItems: [
        "مشاوره فوری تخصصی",
        "ساخت تیم انتخاباتی",
        "تدوین پیام و شعار انتخاباتی",
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
        "ریسک شکست بسیار بالاست. شرکت در انتخابات بدون آماده‌سازی اساسی توصیه نمی‌شود.",
      recommendation:
        "💡 توصیه: حداقل ۶ ماه قبل از انتخابات شروع به آماده‌سازی کنید. از بسته آموزشی استفاده کنید.",
      actionItems: [
        "ثبت‌نام در دوره آموزشی جامع",
        "شروع فعالیت اجتماعی محلی",
        "ساخت شبکه ارتباطی",
        "مشاوره با افراد باتجربه",
      ],
    };
  }

  return {
    level: "critical",
    emoji: "🔴",
    title: "آمادگی بسیار ضعیف",
    riskText: "very_high",
    description:
      "در شرایط فعلی، کاندیداتوری به هیچ عنوان توصیه نمی‌شود. ابتدا باید زیرساخت‌های لازم را بسازید.",
    recommendation:
      "💡 توصیه: ابتدا در فعالیت‌های اجتماعی و خیریه محلی حضور فعال پیدا کنید. برای دوره بعدی برنامه‌ریزی کنید.",
    actionItems: [
      "حضور فعال در مراسم‌ها و رویدادهای محلی",
      "عضویت در تشکل‌ها و NGOها",
      "ساخت اعتبار اجتماعی طی ۱–۲ سال",
      "برنامه‌ریزی بلندمدت برای دوره بعدی انتخابات",
    ],
  };
}

/**
 * تحلیل جزئی هر بُعد
 */
function analyzeDimensions(answers) {
  var dims = [];

  for (var i = 0; i < SCORED_STEP_IDS.length; i++) {
    var stepId = SCORED_STEP_IDS[i];
    var step = STEPS.find(function (s) {
      return s.id === stepId;
    });
    if (!step || step.type !== "choice") continue;

    var selectedVal = answers[stepId];
    var stepScore = 0;
    var selectedLabel = "پاسخ داده نشده";

    if (selectedVal) {
      var opt = step.options.find(function (o) {
        return o.value === selectedVal;
      });
      if (opt) {
        stepScore = opt.score;
        selectedLabel = opt.label;
      }
    }

    var pct = Math.round((stepScore / 25) * 100);
    var statusEmoji = "🔴";
    var statusText = "بحرانی";

    if (pct >= 80) {
      statusEmoji = "🟢";
      statusText = "عالی";
    } else if (pct >= 60) {
      statusEmoji = "🔵";
      statusText = "خوب";
    } else if (pct >= 40) {
      statusEmoji = "🟡";
      statusText = "متوسط";
    } else if (pct >= 20) {
      statusEmoji = "🟠";
      statusText = "ضعیف";
    }

    dims.push({
      stepId: stepId,
      title: step.title,
      score: stepScore,
      maxScore: 25,
      percent: pct,
      statusEmoji: statusEmoji,
      statusText: statusText,
      selectedLabel: selectedLabel,
    });
  }

  return dims;
}

/**
 * نوار پیشرفت بصری
 */
function bar(percent, len) {
  if (!len) len = 10;
  var filled = Math.round((percent / 100) * len);
  var empty = len - filled;
  var result = "";
  for (var i = 0; i < filled; i++) result += "█";
  for (var j = 0; j < empty; j++) result += "░";
  return result;
}

/**
 * تولید گزارش حرفه‌ای
 */
function generateReport(score, answers) {
  var pct = Math.round((score / MAX_SCORE) * 100);
  var risk = getRiskLevel(score);
  var dims = analyzeDimensions(answers);

  // اطلاعات پایه
  var elecStep = STEPS.find(function (s) {
    return s.id === "election_type";
  });
  var elecOpt = null;
  if (elecStep) {
    elecOpt = elecStep.options.find(function (o) {
      return o.value === answers.election_type;
    });
  }
  var elecLabel = elecOpt ? elecOpt.label : "نامشخص";
  var constituency = answers.constituency || "نامشخص";

  // ─── ساخت گزارش ───
  var r = "";

  r += "📊 *گزارش تحلیل آمادگی کاندیداتوری*\n";
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  // اطلاعات عمومی
  r += "📋 *اطلاعات عمومی:*\n";
  r += "├ 🗳️ انتخابات: " + elecLabel + "\n";
  r += "├ 📍 حوزه: " + constituency + "\n";
  r += "└ 📅 تاریخ: " + new Date().toLocaleDateString("fa-IR") + "\n\n";

  // امتیاز کلی
  r += "═══════════════════════\n";
  r += risk.emoji + " *" + risk.title + "*\n";
  r += "═══════════════════════\n\n";
  r +=
    "🏆 امتیاز: *" +
    score +
    "* از *" +
    MAX_SCORE +
    "* (*" +
    pct +
    "%*)\n";
  r += bar(pct, 15) + " " + pct + "%\n\n";
  r += "📋 " + risk.description + "\n\n";

  // تحلیل ابعاد
  r += "─── 📈 *تحلیل تفصیلی ابعاد* ───\n\n";

  for (var i = 0; i < dims.length; i++) {
    var d = dims[i];
    r += d.statusEmoji + " *" + d.title + "* — " + d.statusText + "\n";
    r +=
      "   " +
      bar(d.percent, 10) +
      " " +
      d.score +
      "/" +
      d.maxScore +
      " (" +
      d.percent +
      "%)\n";
    r += "   📌 _" + d.selectedLabel + "_\n\n";
  }

  // نقاط قوت
  var strengths = dims.filter(function (d) {
    return d.percent >= 70;
  });
  if (strengths.length > 0) {
    r += "─── ✅ *نقاط قوت شما* ───\n\n";
    for (var s = 0; s < strengths.length; s++) {
      r += "• " + strengths[s].title + " (" + strengths[s].percent + "%)\n";
    }
    r += "\n";
  }

  // نقاط ضعف
  var weaknesses = dims.filter(function (d) {
    return d.percent < 45;
  });
  if (weaknesses.length > 0) {
    r += "─── ⚠️ *نقاط نیاز به تقویت فوری* ───\n\n";
    for (var w = 0; w < weaknesses.length; w++) {
      r +=
        "• " +
        weaknesses[w].title +
        " (" +
        weaknesses[w].percent +
        "%) — " +
        weaknesses[w].statusText +
        "\n";
    }
    r += "\n";
  }

  // توصیه
  r += "─── 💡 *توصیه اصلی* ───\n\n";
  r += risk.recommendation + "\n\n";

  // اقدامات فوری
  if (risk.actionItems && risk.actionItems.length > 0) {
    r += "─── 🚀 *اقدامات فوری پیشنهادی* ───\n\n";
    for (var a = 0; a < risk.actionItems.length; a++) {
      r += (a + 1) + ". " + risk.actionItems[a] + "\n";
    }
    r += "\n";
  }

  // فوتر
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += "🤖 _کاندیداتوری هوشمند | @candidatoryiran\\_bot_\n";
  r += "📞 _برای مشاوره تخصصی: منوی خدمات و بسته‌ها_";

  return r;
}

module.exports = {
  calcScore,
  getRiskLevel,
  analyzeDimensions,
  generateReport,
};
