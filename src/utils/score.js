// ============================================================
// 📊 محاسبه امتیاز + تولید گزارش رایگان + تعیین وضعیت
// ============================================================

import { STEPS, OPTION_LABELS, SECTION_LABELS } from "../constants/questions.js";

/**
 * محاسبه امتیاز کل از جواب‌ها
 * فقط سوالات inline با scoreWeight > 0 حساب میشن
 * @param {object} answers
 * @returns {number}
 */
export function calcScore(answers) {
  let total = 0;

  STEPS.forEach((step) => {
    if (step.type === "text") return;
    if (!step.scoreWeight) return;

    const userVal = answers[step.key];
    if (!userVal) return;

    const opt = step.options.find((o) => o.data === userVal);
    if (opt) {
      total += opt.score * step.scoreWeight;
    }
  });

  return total;
}

/**
 * حداکثر امتیاز ممکن
 */
export function maxScore() {
  let max = 0;
  STEPS.forEach((step) => {
    if (step.type === "text") return;
    if (!step.scoreWeight) return;
    const highest = Math.max(...step.options.map((o) => o.score));
    max += highest * step.scoreWeight;
  });
  return max;
}

/**
 * سطح آمادگی بر اساس درصد امتیاز
 */
export function getReadinessLevel(score) {
  const max = maxScore();
  const percent = (score / max) * 100;

  if (percent < 30) return { level: "critical", label: "بحرانی 🔴", percent };
  if (percent < 50) return { level: "weak", label: "ضعیف 🟠", percent };
  if (percent < 70) return { level: "moderate", label: "متوسط 🟡", percent };
  if (percent < 85) return { level: "good", label: "خوب 🟢", percent };
  return { level: "excellent", label: "عالی 🏆", percent };
}

/**
 * سطح ریسک
 */
export function getRiskLevel(score) {
  const { percent } = getReadinessLevel(score);
  if (percent < 40) return "high";
  if (percent <= 65) return "medium";
  return "low";
}

/**
 * دمای لید برای CRM
 */
export function getLeadTemp(score) {
  const { percent } = getReadinessLevel(score);
  if (percent >= 60) return "hot";
  if (percent >= 35) return "warm";
  return "cold";
}

/**
 * برچسب فارسی یک جواب
 */
export function answerLabel(val) {
  return OPTION_LABELS[val] || val || "—";
}

/**
 * تولید گزارش رایگان
 * ۴ سطح: بحرانی / ضعیف / متوسط / خوب-عالی
 */
export function generateReport(score, answers) {
  const max = maxScore();
  const readiness = getReadinessLevel(score);
  const fullName = answers.fullName || "کاربر گرامی";
  const region = answers.region || "—";

  let r = `
📊 *گزارش تحلیل آمادگی کاندیداتوری*
━━━━━━━━━━━━━━━━━━━━━

👤 نام: *${fullName}*
📍 حوزه: *${region}*
📈 امتیاز: *${score} از ${max}* (${Math.round(readiness.percent)}٪)
🎯 سطح آمادگی: *${readiness.label}*

━━━━━━━━━━━━━━━━━━━━━
`;

  // === امتیاز هر بخش ===
  r += "\n📋 *امتیاز به تفکیک بخش:*\n\n";

  const sections = ["A", "B", "C", "D", "E", "F"];
  for (const sec of sections) {
    const secSteps = STEPS.filter((s) => s.section === sec && s.scoreWeight > 0);
    let secScore = 0;
    let secMax = 0;

    secSteps.forEach((step) => {
      const userVal = answers[step.key];
      const opt = step.options.find((o) => o.data === userVal);
      if (opt) secScore += opt.score * step.scoreWeight;
      secMax += Math.max(...step.options.map((o) => o.score)) * step.scoreWeight;
    });

    if (secMax > 0) {
      const pct = Math.round((secScore / secMax) * 100);
      const bar = pct >= 70 ? "🟢" : pct >= 40 ? "🟡" : "🔴";
      r += `${bar} ${SECTION_LABELS[sec]}: ${secScore}/${secMax} (${pct}٪)\n`;
    }
  }

  r += "\n━━━━━━━━━━━━━━━━━━━━━\n";

  // === تحلیل بر اساس سطح ===
  if (readiness.percent < 30) {
    r += `
🔴 *وضعیت: نیازمند آمادگی جدی*

تحلیل اولیه نشان می‌دهد فاصله قابل‌توجهی تا آستانه رقابتی وجود دارد.

📋 *اقدامات فوری پیشنهادی:*
• تقویت شبکه ارتباطی و شناخته‌شدگی
• تشکیل تیم حداقلی
• تعیین پیام محوری کمپین
• واقع‌بینانه کردن انتظارات

🔒 *در تحلیل حرفه‌ای (پلن Pro) دریافت می‌کنید:*
✦ تحلیل SWOT شخصی‌سازی‌شده
✦ نقشه راه ۶۰ روزه
✦ استراتژی شناخته‌شدگی از صفر
✦ تحلیل رقبای حوزه شما
`;
  } else if (readiness.percent < 50) {
    r += `
🟠 *وضعیت: پتانسیل اولیه — نیاز به تقویت*

شما پایه‌هایی دارید اما برای رقابت جدی نیاز به اقدامات اصلاحی مهمی هست.

📋 *نقاط قابل بهبود:*
• تقویت پایگاه رأی
• حرفه‌ای‌تر کردن تیم
• شفاف‌سازی پیام رقابتی

🔒 *در تحلیل حرفه‌ای (پلن Pro):*
✦ شناسایی دقیق نقاط ضعف
✦ برنامه تقویت پایگاه اجتماعی
✦ استراتژی رقابتی شخصی‌سازی‌شده
`;
  } else if (readiness.percent < 70) {
    r += `
🟡 *وضعیت: آمادگی متوسط — با بهینه‌سازی برنده شوید*

تبریک! زیرساخت‌های مناسبی دارید. با اقدامات هدفمند می‌توانید شانس پیروزی را افزایش دهید.

📋 *فرصت‌های کلیدی:*
• بهینه‌سازی استراتژی تبلیغاتی
• تمایز از رقبا
• مدیریت ریسک‌های شناسایی‌شده

🔒 *در تحلیل حرفه‌ای (پلن Pro):*
✦ تحلیل SWOT پیشرفته
✦ زمان‌بندی دقیق کمپین
✦ سناریوهای مدیریت بحران
`;
  } else {
    r += `
🟢 *وضعیت: آمادگی بالا — کاندیدای جدی!*

🏆 تبریک ویژه! شما از آمادگی قابل‌توجهی برخوردارید.

📋 *نقاط قوت:*
• پایگاه اجتماعی قوی
• زیرساخت‌های آماده
• ظرفیت بالای رقابت

🔒 *در پلن Pro/VIP:*
✦ استراتژی پیروزی اختصاصی
✦ مدیریت بحران حرفه‌ای
✦ رصد لحظه‌ای رقبا
✦ تیم مشاوره ۲۴/۷
`;
  }

  r += `
━━━━━━━━━━━━━━━━━━━━━
⚠️ _این گزارش خلاصه و محدود است._
_تحلیل کامل و شخصی‌سازی‌شده در پلن حرفه‌ای ارائه می‌شود._
`;

  return r;
}
