const { SCORED_STEP_IDS, MAX_SCORE } = require("../constants/questions.js");

function calcScore(answers) {
  let total = 0;
  let count = 0;

  SCORED_STEP_IDS.forEach((stepId) => {
    const answer = answers[stepId];
    if (answer !== undefined && answer !== null) {
      let score = 0;

      if (stepId === 3) {
        const eduMap = { phd: 25, masters: 20, bachelor: 15, diploma: 10 };
        score = eduMap[answer] || 10;
      } else if (stepId === 4) {
        score = Math.min(parseInt(answer) * 2, 20);
      } else if (stepId === 5) {
        const num = parseInt(answer);
        if (num >= 1000) score = 20;
        else if (num >= 500) score = 15;
        else if (num >= 100) score = 10;
        else if (num >= 50) score = 5;
        else score = 2;
      } else if (stepId === 6) {
        const budget = parseInt(answer);
        if (budget >= 100) score = 15;
        else if (budget >= 50) score = 12;
        else if (budget >= 20) score = 8;
        else if (budget >= 5) score = 5;
        else score = 2;
      } else if (stepId === 7) {
        score = parseInt(answer) * 1.5;
      } else if (stepId === 8) {
        const followers = parseInt(answer);
        if (followers >= 10000) score = 10;
        else if (followers >= 5000) score = 8;
        else if (followers >= 1000) score = 5;
        else if (followers >= 500) score = 3;
        else score = 1;
      } else if (stepId === 9) {
        const rivals = parseInt(answer);
        if (rivals === 0) score = 10;
        else if (rivals <= 3) score = 8;
        else if (rivals <= 5) score = 5;
        else if (rivals <= 10) score = 3;
        else score = 1;
      }

      total += score;
      count++;
    }
  });

  return Math.min(Math.round(total), MAX_SCORE);
}

function getRiskLevel(score) {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

function generateReport(answers, score, riskLevel) {
  let report = "📊 گزارش تحلیل آمادگی کاندیداتوری\n";
  report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  report += `امتیاز کل: ${score}/100\n\n`;

  const barLength = 20;
  const filled = Math.round((score / 100) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
  report += `${bar} ${score}%\n\n`;

  if (score >= 80) {
    report += "🟢 وضعیت: عالی\n";
    report += "شما آمادگی بسیار خوبی دارید.\n\n";
  } else if (score >= 60) {
    report += "🟡 وضعیت: خوب\n";
    report += "با کمی تقویت می توانید موفق شوید.\n\n";
  } else if (score >= 40) {
    report += "🟠 وضعیت: متوسط\n";
    report += "نیاز به تقویت جدی دارید.\n\n";
  } else {
    report += "🔴 وضعیت: ضعیف\n";
    report += "توصیه می شود قبل از کاندیداتوری آماده تر شوید.\n\n";
  }

  report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  report += "برای دریافت گزارش تفصیلی و مشاوره تخصصی،\n";
  report += "بسته های ویژه ما را بررسی کنید.\n\n";
  report += "/start > بسته های خدماتی";

  return report;
}

module.exports = {
  calcScore,
  getRiskLevel,
  generateReport,
};
