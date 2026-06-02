// src/utils/score.js — موتور هوش مصنوعی سبک داخلی (بدون API)
const { SCORED_STEP_IDS, MAX_SCORE } = require("../constants/questions.js");

// ═══════════════════════════════════════════════════════════
// موتور امتیازدهی پیشرفته
// ═══════════════════════════════════════════════════════════
function calcScore(answers) {
  let total = 0;

  // تحصیلات (حداکثر ۲۵)
  const eduMap = { phd: 25, masters: 20, bachelor: 15, diploma: 10 };
  if (answers[3]) total += eduMap[answers[3]] || 10;

  // سابقه اجتماعی (حداکثر ۲۰)
  const exp = parseInt(answers[4]) || 0;
  total += Math.min(exp * 2.5, 20);

  // شبکه اجتماعی (حداکثر ۱۵)
  const network = parseInt(answers[5]) || 0;
  if (network >= 1000) total += 15;
  else if (network >= 500) total += 12;
  else if (network >= 200) total += 9;
  else if (network >= 100) total += 6;
  else if (network >= 50) total += 3;
  else total += 1;

  // بودجه (حداکثر ۱۵)
  const budget = parseInt(answers[6]) || 0;
  if (budget >= 100) total += 15;
  else if (budget >= 50) total += 12;
  else if (budget >= 20) total += 8;
  else if (budget >= 10) total += 5;
  else if (budget >= 5) total += 3;
  else total += 1;

  // سخنرانی (حداکثر ۱۰)
  const speech = parseInt(answers[7]) || 0;
  total += Math.round(speech * 1.0);

  // شبکه مجازی (حداکثر ۱۰)
  const followers = parseInt(answers[8]) || 0;
  if (followers >= 10000) total += 10;
  else if (followers >= 5000) total += 8;
  else if (followers >= 1000) total += 6;
  else if (followers >= 500) total += 4;
  else total += 1;

  // رقبا (حداکثر ۵)
  const rivals = parseInt(answers[9]) || 0;
  if (rivals === 0) total += 5;
  else if (rivals <= 3) total += 4;
  else if (rivals <= 7) total += 3;
  else if (rivals <= 15) total += 2;
  else total += 1;

  return Math.min(Math.round(total), MAX_SCORE);
}

function getRiskLevel(score) {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

// ═══════════════════════════════════════════════════════════
// موتور هوش مصنوعی سبک — تحلیل چندبعدی
// ═══════════════════════════════════════════════════════════
function analyzeWeakPoints(answers, score) {
  const weakPoints = [];
  const strengths = [];

  const exp = parseInt(answers[4]) || 0;
  const network = parseInt(answers[5]) || 0;
  const budget = parseInt(answers[6]) || 0;
  const speech = parseInt(answers[7]) || 0;
  const followers = parseInt(answers[8]) || 0;
  const rivals = parseInt(answers[9]) || 0;

  // تشخیص نقاط ضعف
  if (exp < 3) weakPoints.push("⚠️ سابقه اجتماعی کم — نیاز به تقویت حضور میدانی");
  if (network < 200) weakPoints.push("⚠️ شبکه اجتماعی محدود — باید گسترش یابد");
  if (budget < 20) weakPoints.push("⚠️ بودجه پایین — ریسک اجرای کمپین بالاست");
  if (speech < 6) weakPoints.push("⚠️ مهارت سخنرانی متوسط — تمرین بیشتر لازم است");
  if (followers < 1000) weakPoints.push("⚠️ حضور رسانه‌ای ضعیف — نیاز به تقویت دیجیتال");
  if (rivals > 10) weakPoints.push("⚠️ رقابت بسیار شدید — استراتژی تمایز لازم است");

  // تشخیص نقاط قوت
  if (exp >= 5) strengths.push("✅ سابقه اجتماعی خوب");
  if (network >= 500) strengths.push("✅ شبکه اجتماعی قوی");
  if (budget >= 50) strengths.push("✅ بودجه مناسب");
  if (speech >= 8) strengths.push("✅ مهارت سخنرانی عالی");
  if (followers >= 5000) strengths.push("✅ حضور رسانه‌ای قوی");

  return { weakPoints, strengths };
}

function getElectionTypeLabel(value) {
  const map = {
    city_council: "شورای شهر",
    village_council: "شورای روستا",
    parliament: "مجلس شورای اسلامی",
    other: "سایر",
  };
  return map[value] || value;
}

function getEduLabel(value) {
  const map = { phd: "دکتری", masters: "کارشناسی ارشد", bachelor: "کارشناسی", diploma: "دیپلم" };
  return map[value] || value;
}

// ═══════════════════════════════════════════════════════════
// تولید گزارش تحلیلی حرفه‌ای
// ═══════════════════════════════════════════════════════════
function generateReport(answers, score, riskLevel) {
  const { weakPoints, strengths } = analyzeWeakPoints(answers, score);
  const electionType = getElectionTypeLabel(answers[1] || "");
  const region = answers[2] || "نامشخص";
  const edu = getEduLabel(answers[3] || "");
  const exp = parseInt(answers[4]) || 0;
  const network = parseInt(answers[5]) || 0;
  const budget = parseInt(answers[6]) || 0;
  const speech = parseInt(answers[7]) || 0;
  const followers = parseInt(answers[8]) || 0;
  const rivals = parseInt(answers[9]) || 0;

  // نوار امتیاز
  const barLength = 15;
  const filled = Math.round((score / 100) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

  // وضعیت و پیشنهاد
  let statusEmoji = "";
  let statusText = "";
  let mainAdvice = "";

  if (score >= 80) {
    statusEmoji = "🟢";
    statusText = "عالی — آمادگی بالا";
    mainAdvice = "شما در موقعیت بسیار خوبی هستید. با کمپین منظم و هدفمند شانس بردتان بالاست.";
  } else if (score >= 60) {
    statusEmoji = "🟡";
    statusText = "خوب — نیاز به تقویت";
    mainAdvice = "پایه مناسبی دارید. با رفع نقاط ضعف و برنامه‌ریزی دقیق می‌توانید موفق شوید.";
  } else if (score >= 40) {
    statusEmoji = "🟠";
    statusText = "متوسط — نیاز به آمادگی بیشتر";
    mainAdvice = "قبل از کاندیداتوری جدی، باید روی تقویت شبکه و منابع تمرکز کنید.";
  } else {
    statusEmoji = "🔴";
    statusText = "ضعیف — آمادگی کافی ندارید";
    mainAdvice = "توصیه می‌شود ۶ ماه تا یک سال آمادگی بیشتری کسب کنید.";
  }

  // احتمال برد
  const winChance = Math.min(Math.max(score - 10 + Math.floor(Math.random() * 10), 5), 95);

  let report = `📊 *گزارش تحلیل آمادگی کاندیداتوری*\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // اطلاعات کلی
  report += `👤 *اطلاعات کلی:*\n`;
  report += `🗳️ نوع انتخابات: ${electionType}\n`;
  report += `📍 منطقه: ${region}\n`;
  report += `🎓 تحصیلات: ${edu}\n\n`;

  // امتیاز کل
  report += `🏆 *امتیاز کل:*\n`;
  report += `${bar} ${score}/100\n`;
  report += `${statusEmoji} وضعیت: *${statusText}*\n\n`;

  // احتمال برد
  report += `🎯 *احتمال تخمینی برد: ${winChance}%*\n`;
  report += `⚔️ تعداد رقبا: ${rivals} نفر\n\n`;

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // تحلیل چندبعدی
  report += `📈 *تحلیل ابعاد کمپین:*\n\n`;
  report += `👥 شبکه اجتماعی: ${network} نفر ${network >= 500 ? "✅" : "⚠️"}\n`;
  report += `💰 بودجه: ${budget} میلیون ${budget >= 20 ? "✅" : "⚠️"}\n`;
  report += `🎤 سخنرانی: ${speech}/10 ${speech >= 7 ? "✅" : "⚠️"}\n`;
  report += `📱 رسانه‌ای: ${followers.toLocaleString()} فالوور ${followers >= 2000 ? "✅" : "⚠️"}\n`;
  report += `⏳ تجربه: ${exp} سال ${exp >= 3 ? "✅" : "⚠️"}\n\n`;

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // نقاط قوت
  if (strengths.length > 0) {
    report += `💪 *نقاط قوت شما:*\n`;
    strengths.forEach((s) => (report += `${s}\n`));
    report += `\n`;
  }

  // نقاط ضعف
  if (weakPoints.length > 0) {
    report += `🎯 *نقاط نیازمند تقویت:*\n`;
    weakPoints.forEach((w) => (report += `${w}\n`));
    report += `\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // مشاوره اصلی
  report += `💡 *تحلیل هوشمند:*\n`;
  report += `${mainAdvice}\n\n`;

  // توصیه‌های عملی
  report += `📋 *۳ اقدام فوری پیشنهادی:*\n`;
  if (network < 300) report += `1️⃣ گسترش شبکه: هفته‌ای ۲۰ نفر جدید\n`;
  else report += `1️⃣ تعمیق ارتباط با شبکه فعلی\n`;

  if (speech < 7) report += `2️⃣ تمرین سخنرانی: روزی ۱۵ دقیقه\n`;
  else report += `2️⃣ تهیه متن‌های کلیدی کمپین\n`;

  if (followers < 2000) report += `3️⃣ تقویت رسانه: روزی ۱ پست هدفمند\n`;
  else report += `3️⃣ تولید محتوای ویدیویی کوتاه\n`;

  report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `🚀 برای تحلیل عمیق‌تر و مشاوره 
