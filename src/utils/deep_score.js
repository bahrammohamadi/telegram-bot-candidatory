// src/utils/deep_score.js
// ─── موتور امتیازدهی ارزیابی عمیق (فاز ۲) ───

import {
  DEEP_MODULES,
  DEEP_MAX_SCORE,
  PERSONALITY_DIMENSIONS,
} from "../constants/deep_assessment.js";

/**
 * محاسبه امتیاز هر ماژول
 * @param {string} moduleId
 * @param {Object} answers - { stepId: value }
 * @returns {Object} { score, maxScore, percent, details }
 */
export function calcModuleScore(moduleId, answers) {
  const mod = DEEP_MODULES.find((m) => m.id === moduleId);
  if (!mod) return { score: 0, maxScore: 0, percent: 0, details: [] };

  let totalScore = 0;
  const details = [];

  for (const step of mod.steps) {
    const ans = answers[step.id];
    let stepScore = 0;
    let selectedLabel = "پاسخ داده نشده";

    if (ans && step.type === "choice") {
      const opt = step.options.find((o) => o.value === ans);
      if (opt) {
        stepScore = opt.score;
        selectedLabel = opt.label;
      }
    } else if (ans && step.type === "text") {
      // متنی: امتیاز ثابت بر اساس طول + کیفیت ساده
      const len = String(ans).length;
      if (len > 100) stepScore = 20;
      else if (len > 50) stepScore = 15;
      else if (len > 20) stepScore = 10;
      else stepScore = 5;
      selectedLabel = `${len} کاراکتر`;
    }

    totalScore += stepScore;
    details.push({
      stepId: step.id,
      title: step.title,
      score: stepScore,
      selectedLabel,
    });
  }

  // نرمال‌سازی به maxScore ماژول
  const normalizedScore = Math.min(
    Math.round((totalScore / getModuleRawMax(mod)) * mod.maxScore),
    mod.maxScore
  );

  return {
    score: normalizedScore,
    maxScore: mod.maxScore,
    percent: Math.round((normalizedScore / mod.maxScore) * 100),
    details,
  };
}

/**
 * حداکثر امتیاز خام ممکن برای یک ماژول
 */
function getModuleRawMax(mod) {
  let max = 0;
  for (const step of mod.steps) {
    if (step.type === "choice" && step.options) {
      max += Math.max(...step.options.map((o) => o.score || 0));
    } else if (step.type === "text") {
      max += 20; // حداکثر برای متنی
    }
  }
  return max || 1;
}

/**
 * تحلیل ابعاد شخصیتی (Candidate Persona Index)
 * @param {Object} answers
 * @returns {Array<Object>}
 */
export function analyzePersonality(answers) {
  const results = [];

  for (const dim of PERSONALITY_DIMENSIONS) {
    // پیدا کردن سؤالات مرتبط با این بعد
    const personalityMod = DEEP_MODULES.find((m) => m.id === "personality");
    if (!personalityMod) continue;

    const dimSteps = personalityMod.steps.filter(
      (s) => s.dimension === dim.id
    );
    if (dimSteps.length === 0) continue;

    let total = 0;
    let maxPossible = 0;

    for (const step of dimSteps) {
      const ans = answers[step.id];
      if (ans && step.options) {
        const opt = step.options.find((o) => o.value === ans);
        if (opt) total += opt.score;
      }
      maxPossible += 5; // حداکثر هر سؤال = 5
    }

    const pct = Math.round((total / maxPossible) * 100);
    let status, statusEmoji;
    if (pct >= 80) { status = "عالی"; statusEmoji = "🟢"; }
    else if (pct >= 60) { status = "خوب"; statusEmoji = "🔵"; }
    else if (pct >= 40) { status = "متوسط"; statusEmoji = "🟡"; }
    else if (pct >= 20) { status = "ضعیف"; statusEmoji = "🟠"; }
    else { status = "بحرانی"; statusEmoji = "🔴"; }

    results.push({
      id: dim.id,
      title: dim.title,
      emoji: dim.emoji,
      score: total,
      maxScore: maxPossible,
      percent: pct,
      status,
      statusEmoji,
    });
  }

  return results;
}

/**
 * محاسبه امتیاز کل ارزیابی عمیق
 * @param {Object} answers
 * @returns {Object}
 */
export function calcDeepTotalScore(answers) {
  let totalScore = 0;
  const moduleScores = {};

  for (const mod of DEEP_MODULES) {
    const result = calcModuleScore(mod.id, answers);
    moduleScores[mod.id] = result;
    totalScore += result.score;
  }

  const pct = Math.round((totalScore / DEEP_MAX_SCORE) * 100);

  // تعیین تیپ شخصیت انتخاباتی
  let personaType, personaEmoji;
  if (pct >= 80) {
    personaType = "رهبر ذاتی";
    personaEmoji = "🦁";
  } else if (pct >= 65) {
    personaType = "استراتژیست محتاط";
    personaEmoji = "🦊";
  } else if (pct >= 50) {
    personaType = "فعال اجتماعی";
    personaEmoji = "🦅";
  } else if (pct >= 35) {
    personaType = "محافظه‌کار پایدار";
    personaEmoji = "🐢";
  } else {
    personaType = "نیازمند آماده‌سازی";
    personaEmoji = "🌱";
  }

  // احتمال موفقیت
  let successProb;
  if (pct >= 75) successProb = "بالا (High)";
  else if (pct >= 55) successProb = "متوسط (Medium)";
  else if (pct >= 35) successProb = "متوسط-پایین";
  else successProb = "پایین (Low)";

  return {
    totalScore,
    maxScore: DEEP_MAX_SCORE,
    percent: pct,
    moduleScores,
    personaType,
    personaEmoji,
    successProb,
  };
}

/**
 * تولید نوار بصری
 */
function bar(percent, len = 10) {
  const filled = Math.round((percent / 100) * len);
  return "█".repeat(filled) + "░".repeat(len - filled);
}

/**
 * تولید گزارش کامل ارزیابی عمیق
 * @param {Object} answers
 * @param {Object} basicReport - اطلاعات از فاز 1
 * @returns {string}
 */
export function generateDeepReport(answers, basicReport = {}) {
  const total = calcDeepTotalScore(answers);
  const personality = analyzePersonality(answers);

  let r = "";

  // ═══ هدر ═══
  r += "🧠 *گزارش ارزیابی عمیق کاندیداتوری*\n";
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += `📅 تاریخ: ${new Date().toLocaleDateString("fa-IR")}\n\n`;

  // ═══ تیپ شخصیت ═══
  r += "═══════════════════════\n";
  r += `${total.personaEmoji} *تیپ شخصیت: ${total.personaType}*\n`;
  r += "═══════════════════════\n\n";

  r += `🏆 امتیاز کل: *${total.totalScore}* از *${total.maxScore}* (*${total.percent}%*)\n`;
  r += `${bar(total.percent, 15)} ${total.percent}%\n`;
  r += `📈 احتمال موفقیت: *${total.successProb}*\n\n`;

  // ═══ امتیاز ماژول‌ها ═══
  r += "─── 📊 *امتیاز بخش‌ها* ───\n\n";

  for (const mod of DEEP_MODULES) {
    const ms = total.moduleScores[mod.id];
    if (!ms) continue;

    let statusEmoji = "🔴";
    if (ms.percent >= 80) statusEmoji = "🟢";
    else if (ms.percent >= 60) statusEmoji = "🔵";
    else if (ms.percent >= 40) statusEmoji = "🟡";
    else if (ms.percent >= 20) statusEmoji = "🟠";

    r += `${statusEmoji} *${mod.emoji} ${mod.title}*\n`;
    r += `   ${bar(ms.percent)} ${ms.score}/${ms.maxScore} (${ms.percent}%)\n\n`;
  }

  // ═══ پروفایل شخصیتی ═══
  if (personality.length > 0) {
    r += "─── 🧠 *پروفایل شخصیت انتخاباتی* ───\n\n";

    for (const p of personality) {
      r += `${p.statusEmoji} *${p.emoji} ${p.title}* — ${p.status}\n`;
      r += `   ${bar(p.percent, 8)} ${p.percent}%\n`;
    }
    r += "\n";

    // هشدارهای شخصیتی
    const egoResult = personality.find((p) => p.id === "ego");
    if (egoResult && egoResult.percent < 40) {
      r += "⚠️ *هشدار:* شاخص خودمحوری بالاست. این می‌تواند در تعاملات تیمی ";
      r += "و پذیرش انتقاد مشکل‌ساز شود.\n\n";
    }

    const stabResult = personality.find((p) => p.id === "stability");
    if (stabResult && stabResult.percent < 50) {
      r += "⚠️ *هشدار:* ثبات هیجانی پایین — آمادگی برای فشار رسانه‌ای ";
      r += "و حملات انتخاباتی کم است.\n\n";
    }
  }

  // ═══ نقاط قوت ═══
  const strongMods = DEEP_MODULES.filter(
    (m) => total.moduleScores[m.id]?.percent >= 70
  );
  if (strongMods.length > 0) {
    r += "─── ✅ *نقاط قوت* ───\n\n";
    for (const m of strongMods) {
      r += `• ${m.emoji} ${m.title} (${total.moduleScores[m.id].percent}%)\n`;
    }
    r += "\n";
  }

  // ═══ نقاط آسیب‌پذیر ═══
  const weakMods = DEEP_MODULES.filter(
    (m) => total.moduleScores[m.id]?.percent < 45
  );
  if (weakMods.length > 0) {
    r += "─── 🔴 *نقاط آسیب‌پذیر* ───\n\n";
    for (const m of weakMods) {
      r += `• ${m.emoji} ${m.title} (${total.moduleScores[m.id].percent}%)\n`;
    }
    r += "\n";
  }

  // ═══ تحلیل بحران ═══
  const crisisAns = answers.crisis_scenario1;
  if (crisisAns) {
    const crisisMod = DEEP_MODULES.find((m) => m.id === "crisis");
    const s1 = crisisMod?.steps.find((s) => s.id === "crisis_scenario1");
    const opt = s1?.options?.find((o) => o.value === crisisAns);
    if (opt?.analysis) {
      r += "─── 🛡️ *تحلیل رفتار بحرانی* ───\n\n";
      r += `واکنش شما: ${opt.label}\n`;
      r += `📋 تحلیل: _${opt.analysis}_\n\n`;
    }
  }

  // ═══ توصیه‌های فوری ═══
  r += "─── 🚀 *توصیه‌های فوری* ───\n\n";

  if (total.percent >= 75) {
    r += "1. روی متمایزسازی پیام تمرکز کنید\n";
    r += "2. نمایندگان شعب را آماده کنید\n";
    r += "3. استراتژی رسانه‌ای نهایی را اجرا کنید\n";
  } else if (total.percent >= 50) {
    r += "1. نقاط ضعف شناسایی‌شده را فوری اصلاح کنید\n";
    r += "2. حتماً مشاور حرفه‌ای بگیرید\n";
    r += "3. تمرین مناظره و فن بیان انجام دهید\n";
    r += "4. تیم خود را تقویت کنید\n";
  } else {
    r += "1. بدون مشاوره حرفه‌ای وارد انتخابات نشوید\n";
    r += "2. حداقل ۳ ماه زمان آماده‌سازی نیاز دارید\n";
    r += "3. از بسته‌های آموزشی ما استفاده کنید\n";
    r += "4. اگر زمان کافی ندارید، برای دوره بعدی برنامه‌ریزی کنید\n";
  }

  r += "\n";

  // ═══ فوتر ═══
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  r += "🤖 _کاندیداتوری هوشمند | @candidatoryiran\\_bot_\n";
  r += "💼 _برای مشاوره و گزارش کامل‌تر → منوی بسته‌ها_";

  return r;
}
