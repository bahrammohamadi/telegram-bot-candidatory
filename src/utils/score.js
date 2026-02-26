import { STEPS, OPTION_LABELS, SECTION_LABELS } from "../constants/questions.js";

export function calcScore(answers) {
  let total = 0;
  STEPS.forEach((step) => {
    if (step.type === "text") return;
    if (!step.scoreWeight) return;
    const userVal = answers[step.key];
    if (!userVal) return;
    const opt = step.options.find((o) => o.data === userVal);
    if (opt) total += opt.score * step.scoreWeight;
  });
  return total;
}

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

export function getReadinessLevel(score) {
  const max = maxScore();
  const percent = max > 0 ? (score / max) * 100 : 0;
  if (percent < 30) return { level: "critical", label: "بحرانی 🔴", percent };
  if (percent < 50) return { level: "weak", label: "ضعیف 🟠", percent };
  if (percent < 70) return { level: "moderate", label: "متوسط 🟡", percent };
  if (percent < 85) return { level: "good", label: "خوب 🟢", percent };
  return { level: "excellent", label: "عالی 🏆", percent };
}

export function getRiskLevel(score) {
  const { percent } = getReadinessLevel(score);
  if (percent < 40) return "high";
  if (percent <= 65) return "medium";
  return "low";
}

export function getLeadTemp(score) {
  const { percent } = getReadinessLevel(score);
  if (percent >= 60) return "hot";
  if (percent >= 35) return "warm";
  return "cold";
}

export function answerLabel(val) {
  return OPTION_LABELS[val] || val || "---";
}

// گزارش بدون Markdown مشکل‌دار
export function generateReport(score, answers) {
  const max = maxScore();
  const readiness = getReadinessLevel(score);
  const fullName = answers.fullName || "کاربر گرامی";
  const region = answers.region || "---";

  let r = "";
  r += "📊 گزارش تحلیل آمادگی کاندیداتوری\n";
  r += "━━━━━━━━━━━━━━━━━━━━━\n\n";
  r += "👤 نام: " + fullName + "\n";
  r += "📍 حوزه: " + region + "\n";
  r += "📈 امتیاز: " + score + " از " + max + " (" + Math.round(readiness.percent) + "%)\n";
  r += "🎯 سطح آمادگی: " + readiness.label + "\n\n";
  r += "━━━━━━━━━━━━━━━━━━━━━\n\n";

  // امتیاز هر بخش
  r += "📋 امتیاز به تفکیک بخش:\n\n";

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
      r += bar + " " + SECTION_LABELS[sec] + ": " + secScore + "/" + secMax + " (" + pct + "%)\n";
    }
  }

  r += "\n━━━━━━━━━━━━━━━━━━━━━\n\n";

  // تحلیل
  if (readiness.percent < 30) {
    r += "🔴 وضعیت: نیازمند آمادگی جدی\n\n";
    r += "تحلیل اولیه نشان میدهد فاصله قابل توجهی تا آستانه رقابتی وجود دارد.\n\n";
    r += "📋 اقدامات فوری پیشنهادی:\n";
    r += "• تقویت شبکه ارتباطی و شناخته شدگی\n";
    r += "• تشکیل تیم حداقلی\n";
    r += "• تعیین پیام محوری کمپین\n";
    r += "• واقع بینانه کردن انتظارات\n\n";
    r += "🔒 در تحلیل حرفه ای (پلن Pro) دریافت میکنید:\n";
    r += "- تحلیل SWOT شخصی سازی شده\n";
    r += "- نقشه راه ۶۰ روزه\n";
    r += "- استراتژی شناخته شدگی از صفر\n";
    r += "- تحلیل رقبای حوزه شما\n";
  } else if (readiness.percent < 50) {
    r += "🟠 وضعیت: پتانسیل اولیه، نیاز به تقویت\n\n";
    r += "شما پایه هایی دارید اما برای رقابت جدی نیاز به اقدامات اصلاحی مهمی هست.\n\n";
    r += "📋 نقاط قابل بهبود:\n";
    r += "• تقویت پایگاه رای\n";
    r += "• حرفه ای تر کردن تیم\n";
    r += "• شفاف سازی پیام رقابتی\n\n";
    r += "🔒 در تحلیل حرفه ای (پلن Pro):\n";
    r += "- شناسایی دقیق نقاط ضعف\n";
    r += "- برنامه تقویت پایگاه اجتماعی\n";
    r += "- استراتژی رقابتی شخصی سازی شده\n";
  } else if (readiness.percent < 70) {
    r += "🟡 وضعیت: آمادگی متوسط، با بهینه سازی برنده شوید\n\n";
    r += "تبریک! زیرساخت های مناسبی دارید.\n\n";
    r += "📋 فرصت های کلیدی:\n";
    r += "• بهینه سازی استراتژی تبلیغاتی\n";
    r += "• تمایز از رقبا\n";
    r += "• مدیریت ریسک های شناسایی شده\n\n";
    r += "🔒 در تحلیل حرفه ای (پلن Pro):\n";
    r += "- تحلیل SWOT پیشرفته\n";
    r += "- زمان بندی دقیق کمپین\n";
    r += "- سناریوهای مدیریت بحران\n";
  } else {
    r += "🟢 وضعیت: آمادگی بالا، کاندیدای جدی!\n\n";
    r += "🏆 تبریک ویژه! شما از آمادگی قابل توجهی برخوردارید.\n\n";
    r += "📋 نقاط قوت:\n";
    r += "• پایگاه اجتماعی قوی\n";
    r += "• زیرساخت های آماده\n";
    r += "• ظرفیت بالای رقابت\n\n";
    r += "🔒 در پلن Pro/VIP:\n";
    r += "- استراتژی پیروزی اختصاصی\n";
    r += "- مدیریت بحران حرفه ای\n";
    r += "- رصد لحظه ای رقبا\n";
  }

  r += "\n━━━━━━━━━━━━━━━━━━━━━\n";
  r += "⚠️ این گزارش خلاصه و محدود است.\n";
  r += "تحلیل کامل در پلن حرفه ای ارائه میشود.\n";

  return r;
}
