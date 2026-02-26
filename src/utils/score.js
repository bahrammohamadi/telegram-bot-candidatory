// src/utils/score.js
// ═══════════════════════════════════════════════════════════════
//  سیستم امتیازدهی، تحلیل ابعاد و تولید گزارش حرفه‌ای
// ═══════════════════════════════════════════════════════════════

import { STEPS, SCORED_STEP_IDS, MAX_SCORE } from "../constants/questions.js";

/**
 * محاسبه امتیاز کل (فقط مراحل SCORED)
 */
export function calcScore(answers) {
  let total = 0;
  for (const stepId of SCORED_STEP_IDS) {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step || step.type !== "choice") continue;
    const selected = answers[stepId];
    if (!selected) continue;
    const opt = step.options.find((o) => o.value === selected);
    if (opt) total += opt.score;
  }
  return total;
}

/**
 * سطح ریسک / آمادگی
 */
export function getRiskLevel(score) {
  const pct = Math.round((score / MAX_SCORE) * 100);

  if (pct >= 80)
    return {
      level: "excellent", emoji: "🟢", title: "آمادگی عالی", riskText: "low",
      description: "شما در وضعیت بسیار مناسبی قرار دارید. با بهینه‌سازی کمپین، شانس بالایی برای موفقیت دارید.",
      recommendation: "💡 توصیه: روی استراتژی رسانه‌ای و متمایزسازی پیام تمرکز کنید.",
      actionItems: ["تدوین برنامه تبلیغاتی هفته‌ای", "آماده‌سازی نمایندگان شعب", "تقویت حضور در شبکه‌های اجتماعی"],
    };
  if (pct >= 60)
    return {
      level: "good", emoji: "🔵", title: "آمادگی خوب", riskText: "medium_low",
      description: "پتانسیل خوبی دارید ولی نقاط ضعفی قابل اصلاح وجود دارد.",
      recommendation: "💡 توصیه: نقاط ضعف شناسایی‌شده را با مشاور تخصصی برطرف کنید.",
      actionItems: ["شناسایی و تقویت نقاط ضعف", "مشاوره تخصصی", "تشکیل تیم حداقلی"],
    };
  if (pct >= 40)
    return {
      level: "moderate", emoji: "🟡", title: "آمادگی متوسط", riskText: "medium",
      description: "نیاز به تقویت جدی در چند حوزه کلیدی دارید.",
      recommendation: "💡 توصیه: قبل از ثبت‌نام حتماً مشاوره بگیرید.",
      actionItems: ["مشاوره فوری تخصصی", "ساخت تیم", "تدوین پیام و شعار", "برنامه‌ریزی بودجه"],
    };
  if (pct >= 20)
    return {
      level: "weak", emoji: "🟠", title: "آمادگی ضعیف", riskText: "high",
      description: "ریسک شکست بسیار بالاست.",
      recommendation: "💡 توصیه: حداقل ۶ ماه قبل از انتخابات آماده‌سازی کنید.",
      actionItems: ["ثبت‌نام در دوره آموزشی", "شروع فعالیت اجتماعی محلی", "ساخت شبکه ارتباطی"],
    };
  return {
    level: "critical", emoji: "🔴", title: "آمادگی بسیار ضعیف", riskText: "very_high",
    description: "در شرایط فعلی کاندیداتوری توصیه نمی‌شود.",
    recommendation: "💡 توصیه: ابتدا در فعالیت‌های اجتماعی محلی حضور پیدا کنید.",
    actionItems: ["حضور فعال در مراسم‌ها", "عضویت در تشکل‌ها", "ساخت اعتبار اجتماعی"],
  };
}

/**
 * تحلیل جزئی هر بُعد
 */
export function analyzeDimensions(answers) {
  const dims = [];
  for (const stepId of SCORED_STEP_IDS) {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step || step.type !== "choice") continue;
    const selectedVal = answers[stepId];
    let stepScore = 0;
    let selectedLabel = "پاسخ داده نشده";
    if (selectedVal) {
      const opt = step.options.find((o) => o.value === selectedVal);
      if (opt) { stepScore = opt.score; selectedLabel = opt.label; }
    }
    const pct = Math.round((stepScore / 25) * 100);
    let statusEmoji = "🔴", statusText = "بحرانی";
    if (pct >= 80) { statusEmoji = "🟢"; statusText = "عالی"; }
    else if (pct >= 60) { statusEmoji = "🔵"; statusText = "خوب"; }
    else if (pct >= 40) { statusEmoji = "🟡"; statusText = "متوسط"; }
    else if (pct >= 20) { statusEmoji = "🟠"; statusText = "ضعیف"; }
    dims.push({ stepId, title: step.title, score: stepScore, maxScore: 25, percent: pct, statusEmoji, statusText, selectedLabel });
  }
  return dims;
}

/** نوار پیشرفت ASCII */
function bar(percent, len = 10) {
  const filled = Math.round((percent / 100) * len);
  return "█".repeat(filled) + "░".repeat(len - filled);
}

/**
 * تولید گزارش حرفه‌ای
 */
export function generateReport(score, answers) {
  const pct = Math.round((score / MAX_SCORE) * 100);
  const risk = getRiskLevel(score);
  const dims = analyzeDimensions(answers);

  const elecStep = STEPS.find((s) => s.id === "election_type");
  const elecOpt = elecStep?.options?.find((o) => o.value === answers.election_type);
  const elecLabel = elecOpt?.label || "نامشخص";
  const constituency = answers.constituency || "نامشخص";

  let r = "";
  r += "📊 *گزارش تحلیل آمادگی کاندیداتوری*\n";
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  r += "📋 *اطلاعات عمومی:*\n";
  r += `├ 🗳️ انتخابات: ${elecLabel}\n`;
  r += `├ 📍 حوزه: ${constituency}\n`;
  r += `└ 📅 تاریخ: ${new Date().toLocaleDateString("fa-IR")}\n\n`;

  r += "═══════════════════════\n";
  r += `${risk.emoji} *${risk.title}*\n`;
  r += "═══════════════════════\n\n";
  r += `🏆 امتیاز: *${score}* از *${MAX_SCORE}* (*${pct}%*)\n`;
  r += `${bar(pct, 15)} ${pct}%\n\n`;
  r += `📋 ${risk.description}\n\n`;

  r += "─── 📈 *تحلیل ابعاد* ───\n\n";
  for (const d of dims) {
    r += `${d.statusEmoji} *${d.title}* — ${d.statusText}\n`;
    r += `   ${bar(d.percent, 10)} ${d.score}/${d.maxScore} (${d.percent}%)\n`;
    r += `   📌 _${d.selectedLabel}_\n\n`;
  }

  const strengths = dims.filter((d) => d.percent >= 70);
  if (strengths.length > 0) {
    r += "─── ✅ *نقاط قوت* ───\n\n";
    for (const s of strengths) r += `• ${s.title} (${s.percent}%)\n`;
    r += "\n";
  }

  const weaknesses = dims.filter((d) => d.percent < 45);
  if (weaknesses.length > 0) {
    r += "─── ⚠️ *نقاط ضعف* ───\n\n";
    for (const w of weaknesses) r += `• ${w.title} (${w.percent}%) — ${w.statusText}\n`;
    r += "\n";
  }

  r += "─── 💡 *توصیه* ───\n\n";
  r += `${risk.recommendation}\n\n`;

  if (risk.actionItems?.length > 0) {
    r += "─── 🚀 *اقدامات فوری* ───\n\n";
    risk.actionItems.forEach((item, i) => { r += `${i + 1}. ${item}\n`; });
    r += "\n";
  }

  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += "🤖 _کاندیداتوری هوشمند | @candidatoryiran\\_bot_\n";
  r += "📞 _برای مشاوره: منوی خدمات و بسته‌ها_";

  return r;
}
