// src/utils/score.js
// ─── محاسبه امتیاز، تحلیل ابعاد، تعیین سطح ریسک و تولید گزارش ───
// سازگار با ساختار دیتابیس فعلی (riskLevel, score, finalReport, ...)

import { STEPS, SCORED_STEP_IDS, MAX_SCORE } from "../constants/questions.js";

// ═══════════════════════════════════════
//  محاسبه امتیاز کل
// ═══════════════════════════════════════

/**
 * محاسبه امتیاز کل از پاسخ‌های کاربر
 * فقط مراحل scored=true محاسبه می‌شوند
 * @param {Object} answers - { stepId: selectedValue }
 * @returns {number} امتیاز ۰ تا MAX_SCORE
 */
export function calcScore(answers) {
  let total = 0;

  for (const stepId of SCORED_STEP_IDS) {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step || step.type !== "choice") continue;

    const selectedValue = answers[stepId];
    if (!selectedValue) continue;

    const option = step.options.find((o) => o.value === selectedValue);
    if (option) total += option.score;
  }

  return total;
}

// ═══════════════════════════════════════
//  سطح ریسک
// ═══════════════════════════════════════

/**
 * تعیین سطح ریسک بر اساس امتیاز
 * مقادیر level سازگار با فیلد riskLevel در consultations
 * @param {number} score
 * @returns {Object}
 */
export function getRiskLevel(score) {
  const pct = Math.round((score / MAX_SCORE) * 100);

  if (pct >= 80) {
    return {
      level: "very_low",    // ← ذخیره در DB
      emoji: "🟢",
      title: "آمادگی عالی",
      subtitle: "ریسک بسیار پایین",
      description:
        "شما در موقعیت بسیار مناسبی قرار دارید. با بهینه‌سازی کمپین، شانس پیروزی بالایی خواهید داشت.",
      recommendation:
        "💡 توصیه: روی استراتژی رسانه‌ای، تثبیت پیام و حفظ انسجام تیم تمرکز کنید.",
      actionItems: [
        "طراحی دقیق تقویم تبلیغاتی",
        "تولید محتوای ویدیویی حرفه‌ای",
        "برنامه‌ریزی روز رأی‌گیری",
      ],
    };
  }
  if (pct >= 60) {
    return {
      level: "low",
      emoji: "🔵",
      title: "آمادگی خوب",
      subtitle: "ریسک پایین",
      description:
        "پتانسیل خوبی دارید ولی نقاط ضعفی وجود دارد که باید تقویت شوند.",
      recommendation:
        "💡 توصیه: نقاط ضعف را شناسایی کنید و حتماً از مشاوره تخصصی بهره ببرید.",
      actionItems: [
        "تقویت شبکه ارتباطات محلی",
        "مشاوره تخصصی برای رفع نقاط ضعف",
        "تمرین سخنرانی و حضور عمومی",
      ],
    };
  }
  if (pct >= 40) {
    return {
      level: "medium",
      emoji: "🟡",
      title: "آمادگی متوسط",
      subtitle: "ریسک متوسط",
      description:
        "چالش‌های جدی وجود دارد. بدون اقدام فوری، شانس موفقیت محدود خواهد بود.",
      recommendation:
        "💡 توصیه: قبل از ثبت‌نام حتماً مشاوره بگیرید و تیم بسازید.",
      actionItems: [
        "ساخت تیم انتخاباتی فوری",
        "تدوین پیام و شعار انتخاباتی",
        "شروع فعالیت‌های اجتماعی در حوزه",
        "تأمین بودجه اولیه",
      ],
    };
  }
  if (pct >= 20) {
    return {
      level: "high",
      emoji: "🟠",
      title: "آمادگی ضعیف",
      subtitle: "ریسک بالا",
      description:
        "در وضعیت فعلی، احتمال موفقیت بسیار کم است. نیاز به آماده‌سازی اساسی دارید.",
      recommendation:
        "💡 توصیه: حداقل ۶ ماه قبل از انتخابات فرآیند آماده‌سازی را شروع کنید.",
      actionItems: [
        "حضور فعال در مراسم‌ها و فعالیت‌های محلی",
        "ساخت شبکه ارتباطی از صفر",
        "شرکت در دوره‌های آموزشی انتخاباتی",
        "مشورت جدی با افراد باتجربه",
      ],
    };
  }
  return {
    level: "very_high",
    emoji: "🔴",
    title: "آمادگی بسیار ضعیف",
    subtitle: "ریسک بسیار بالا",
    description:
      "در شرایط کنونی، ورود به انتخابات توصیه نمی‌شود. ابتدا زیرساخت‌ها را بسازید.",
    recommendation:
      "💡 توصیه: ابتدا در فعالیت‌های اجتماعی و مدنی حضور پیدا کنید و به تدریج شناخته شوید.",
    actionItems: [
      "شروع فعالیت داوطلبانه در حوزه",
      "عضویت در شوراهای محلی / NGOها",
      "ایجاد حضور در شبکه‌های اجتماعی",
      "مطالعه و آموزش در حوزه مدیریت شهری",
    ],
  };
}

// ═══════════════════════════════════════
//  تحلیل ابعاد جزئی
// ═══════════════════════════════════════

/**
 * تحلیل تک‌تک ابعاد امتیازدار
 * @param {Object} answers
 * @returns {Array<Object>}
 */
export function analyzeDimensions(answers) {
  const dims = [];

  for (const stepId of SCORED_STEP_IDS) {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step || step.type !== "choice") continue;

    const selected = answers[stepId];
    let dimScore = 0;
    let label = "پاسخ داده نشده";

    if (selected) {
      const opt = step.options.find((o) => o.value === selected);
      if (opt) {
        dimScore = opt.score;
        label = opt.label;
      }
    }

    const pct = Math.round((dimScore / 25) * 100);
    let icon = "🔴";
    if (pct >= 80) icon = "🟢";
    else if (pct >= 60) icon = "🔵";
    else if (pct >= 40) icon = "🟡";
    else if (pct >= 20) icon = "🟠";

    dims.push({
      stepId,
      title: step.title,
      score: dimScore,
      maxScore: 25,
      percent: pct,
      icon,
      selectedLabel: label,
    });
  }

  return dims;
}

// ═══════════════════════════════════════
//  نوار پیشرفت بصری
// ═══════════════════════════════════════

/**
 * @param {number} pct - درصد ۰–۱۰۰
 * @param {number} len - طول نوار
 * @returns {string}
 */
function bar(pct, len = 10) {
  const f = Math.round((pct / 100) * len);
  return "█".repeat(f) + "░".repeat(len - f);
}

// ═══════════════════════════════════════
//  تولید گزارش کامل
// ═══════════════════════════════════════

/**
 * تولید گزارش حرفه‌ای (Markdown)
 * خروجی به‌عنوان finalReport در consultations ذخیره می‌شود
 * @param {number} score
 * @param {Object} answers
 * @returns {string}
 */
export function generateReport(score, answers) {
  const pct = Math.round((score / MAX_SCORE) * 100);
  const risk = getRiskLevel(score);
  const dims = analyzeDimensions(answers);

  // اطلاعات پایه
  const fullName = answers.fullName || "نامشخص";

  const elStep = STEPS.find((s) => s.id === "electionType");
  const elOpt = elStep?.options?.find((o) => o.value === answers.electionType);
  const elLabel = elOpt?.label || "نامشخص";
  const region = answers.region || "نامشخص";

  // ─── شروع گزارش ───
  let r = "";

  r += "📊 *گزارش تحلیل آمادگی کاندیداتوری*\n";
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  // هدر اطلاعات
  r += `👤 نام: *${fullName}*\n`;
  r += `🗳️ انتخابات: ${elLabel}\n`;
  r += `📍 حوزه: ${region}\n`;
  r += `📅 تاریخ تحلیل: ${new Date().toLocaleDateString("fa-IR")}\n\n`;

  // ─── امتیاز کلی ───
  r += "══════ 🏆 امتیاز کلی ══════\n\n";
  r += `${risk.emoji} *${risk.title}* (${risk.subtitle})\n\n`;
  r += `امتیاز: *${score}* از *${MAX_SCORE}* (${pct}٪)\n`;
  r += `${bar(pct)} ${pct}٪\n\n`;
  r += `📋 ${risk.description}\n\n`;

  // ─── تحلیل ابعاد ───
  r += "══════ 📈 تحلیل ابعاد ══════\n\n";

  for (const d of dims) {
    r += `${d.icon} *${d.title}*\n`;
    r += `   ${bar(d.percent, 8)} ${d.score}/${d.maxScore} (${d.percent}٪)\n`;
    r += `   └ ${d.selectedLabel}\n\n`;
  }

  // ─── نقاط قوت ───
  const strengths = dims.filter((d) => d.percent >= 70);
  if (strengths.length > 0) {
    r += "══════ ✅ نقاط قوت شما ══════\n\n";
    for (const s of strengths) {
      r += `  • ${s.title} (${s.percent}٪)\n`;
    }
    r += "\n";
  }

  // ─── نقاط ضعف ───
  const weaknesses = dims.filter((d) => d.percent < 40);
  if (weaknesses.length > 0) {
    r += "══════ ⚠️ نقاط نیازمند تقویت ══════\n\n";
    for (const w of weaknesses) {
      r += `  • ${w.title} (${w.percent}٪)\n`;
    }
    r += "\n";
  }

  // ─── توصیه نهایی ───
  r += "══════ 💡 توصیه نهایی ══════\n\n";
  r += `${risk.recommendation}\n\n`;

  // ─── اقدامات پیشنهادی ───
  if (risk.actionItems && risk.actionItems.length > 0) {
    r += "══════ 📋 اقدامات پیشنهادی ══════\n\n";
    for (let i = 0; i < risk.actionItems.length; i++) {
      r += `${i + 1}. ${risk.actionItems[i]}\n`;
    }
    r += "\n";
  }

  // ─── پاورقی ───
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += "🤖 _کاندیداتوری هوشمند | @candidatoryiran\\_bot_\n";
  r += "_این گزارش صرفاً جنبه مشاوره‌ای دارد._";

  return r;
}
