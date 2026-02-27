// src/utils/score.js — CommonJS

const { STEPS, SCORED_STEP_IDS, MAX_SCORE } = require("../constants/questions.js");

function calcScore(answers) {
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

function getRiskLevel(score) {
  const pct = Math.round((score / MAX_SCORE) * 100);
  if (pct >= 80) return { level: "excellent", emoji: "🟢", title: "آمادگی عالی", riskText: "low", description: "وضعیت بسیار مناسب.", recommendation: "💡 روی استراتژی رسانه‌ای تمرکز کنید.", actionItems: ["تبلیغات هفته‌ای", "نمایندگان شعب", "شبکه‌های اجتماعی"] };
  if (pct >= 60) return { level: "good", emoji: "🔵", title: "آمادگی خوب", riskText: "medium_low", description: "پتانسیل خوب با نقاط ضعف قابل اصلاح.", recommendation: "💡 نقاط ضعف را با مشاور برطرف کنید.", actionItems: ["تقویت نقاط ضعف", "مشاوره تخصصی", "تشکیل تیم"] };
  if (pct >= 40) return { level: "moderate", emoji: "🟡", title: "آمادگی متوسط", riskText: "medium", description: "نیاز به تقویت جدی.", recommendation: "💡 قبل از ثبت‌نام مشاوره بگیرید.", actionItems: ["مشاوره فوری", "ساخت تیم", "تدوین پیام", "بودجه"] };
  if (pct >= 20) return { level: "weak", emoji: "🟠", title: "آمادگی ضعیف", riskText: "high", description: "ریسک شکست بالا.", recommendation: "💡 ۶ ماه قبل آماده‌سازی کنید.", actionItems: ["دوره آموزشی", "فعالیت اجتماعی", "شبکه‌سازی"] };
  return { level: "critical", emoji: "🔴", title: "آمادگی بسیار ضعیف", riskText: "very_high", description: "کاندیداتوری توصیه نمی‌شود.", recommendation: "💡 ابتدا فعالیت اجتماعی کنید.", actionItems: ["حضور در مراسم‌ها", "عضویت در تشکل‌ها", "اعتبار اجتماعی"] };
}

function analyzeDimensions(answers) {
  const dims = [];
  for (const stepId of SCORED_STEP_IDS) {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step || step.type !== "choice") continue;
    const val = answers[stepId];
    let sc = 0, lbl = "پاسخ داده نشده";
    if (val) { const o = step.options.find((x) => x.value === val); if (o) { sc = o.score; lbl = o.label; } }
    const pct = Math.round((sc / 25) * 100);
    let se = "🔴", st = "بحرانی";
    if (pct >= 80) { se = "🟢"; st = "عالی"; }
    else if (pct >= 60) { se = "🔵"; st = "خوب"; }
    else if (pct >= 40) { se = "🟡"; st = "متوسط"; }
    else if (pct >= 20) { se = "🟠"; st = "ضعیف"; }
    dims.push({ stepId, title: step.title, score: sc, maxScore: 25, percent: pct, statusEmoji: se, statusText: st, selectedLabel: lbl });
  }
  return dims;
}

function bar(pct, len = 10) {
  const f = Math.round((pct / 100) * len);
  return "█".repeat(f) + "░".repeat(len - f);
}

function generateReport(score, answers) {
  const pct = Math.round((score / MAX_SCORE) * 100);
  const risk = getRiskLevel(score);
  const dims = analyzeDimensions(answers);
  const elS = STEPS.find((s) => s.id === "election_type");
  const elO = elS ? elS.options.find((o) => o.value === answers.election_type) : null;
  const elL = elO ? elO.label : "نامشخص";

  let r = "📊 *گزارش تحلیل آمادگی کاندیداتوری*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  r += `🗳️ ${elL} | 📍 ${answers.constituency || "نامشخص"}\n📅 ${new Date().toLocaleDateString("fa-IR")}\n\n`;
  r += `═══════════════════════\n${risk.emoji} *${risk.title}*\n═══════════════════════\n\n`;
  r += `🏆 امتیاز: *${score}*/*${MAX_SCORE}* (*${pct}%*)\n${bar(pct, 15)} ${pct}%\n\n`;
  r += `📋 ${risk.description}\n\n─── 📈 *تحلیل ابعاد* ───\n\n`;
  for (const d of dims) {
    r += `${d.statusEmoji} *${d.title}* — ${d.statusText}\n   ${bar(d.percent, 10)} ${d.score}/${d.maxScore}\n   📌 _${d.selectedLabel}_\n\n`;
  }
  const str = dims.filter((d) => d.percent >= 70);
  if (str.length) { r += "─── ✅ *نقاط قوت* ───\n\n"; str.forEach((s) => { r += `• ${s.title} (${s.percent}%)\n`; }); r += "\n"; }
  const wk = dims.filter((d) => d.percent < 45);
  if (wk.length) { r += "─── ⚠️ *نقاط ضعف* ───\n\n"; wk.forEach((w) => { r += `• ${w.title} (${w.percent}%)\n`; }); r += "\n"; }
  r += `─── 💡 *توصیه* ───\n\n${risk.recommendation}\n\n`;
  if (risk.actionItems && risk.actionItems.length) { r += "─── 🚀 *اقدامات فوری* ───\n\n"; risk.actionItems.forEach((a, i) => { r += `${i + 1}. ${a}\n`; }); r += "\n"; }
  r += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🤖 _@candidatoryiran\\_bot_";
  return r;
}

module.exports = { calcScore, getRiskLevel, analyzeDimensions, generateReport };
