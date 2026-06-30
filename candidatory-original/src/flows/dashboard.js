// src/flows/dashboard.js — CommonJS
// ─── داشبورد مدیریت کمپین ───
// نمایش خلاصه وضعیت کمپین، هشدارها و اقدامات فوری

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser } = require("../utils/db.js");
const { requireAccess } = require("../utils/access.js");
const { getUserConsultations } = require("../utils/db.js");
const { getRiskLevel } = require("../utils/score.js");
const { bar } = require("../utils/score.js");

// ═══════════════════════════════════════════
// محاسبه سلامت کمپین (0 تا 100)
// ═══════════════════════════════════════════
function calcCampaignHealth(profile, consultations, rivals, promises, team) {
  let score   = 0;
  let max     = 0;
  const items = [];

  // ─── پروفایل (20 امتیاز) ───
  max += 20;
  if (profile.fullName && profile.electionType) {
    const profileFields = [
      "fullName", "electionType", "constituency",
      "occupation", "slogan", "topPriorities",
      "mainStrength", "budget",
    ];
    const filled = profileFields.filter(f => profile[f]).length;
    const ps     = Math.round((filled / profileFields.length) * 20);
    score += ps;
    items.push({
      title:  "👤 پروفایل کاندیدا",
      score:  ps,
      max:    20,
      status: ps >= 16 ? "✅" : ps >= 10 ? "🟡" : "🔴",
      action: ps < 16 ? "تکمیل پروفایل" : null,
    });
  } else {
    items.push({
      title:  "👤 پروفایل کاندیدا",
      score:  0,
      max:    20,
      status: "🔴",
      action: "ایجاد پروفایل",
    });
  }

  // ─── ارزیابی آمادگی (25 امتیاز) ───
  max += 25;
  if (consultations.length > 0) {
    const lastScore = consultations[0].score || 0;
    const cs        = Math.round((lastScore / 125) * 25);
    score += cs;
    items.push({
      title:  "📊 ارزیابی آمادگی",
      score:  cs,
      max:    25,
      status: cs >= 20 ? "✅" : cs >= 12 ? "🟡" : "🔴",
      action: cs < 12 ? "بهبود آمادگی" : null,
    });
  } else {
    items.push({
      title:  "📊 ارزیابی آمادگی",
      score:  0,
      max:    25,
      status: "🔴",
      action: "انجام ارزیابی",
    });
  }

  // ─── تحلیل رقبا (15 امتیاز) ───
  max += 15;
  const rs = Math.min(rivals.length * 5, 15);
  score += rs;
  items.push({
    title:  "⚔️ تحلیل رقبا",
    score:  rs,
    max:    15,
    status: rs >= 10 ? "✅" : rs >= 5 ? "🟡" : "🔴",
    action: rs < 10 ? "ثبت رقبا" : null,
  });

  // ─── وعده‌های انتخاباتی (15 امتیاز) ───
  max += 15;
  const ps2 = Math.min(promises.length * 3, 15);
  score += ps2;
  items.push({
    title:  "📋 وعده‌های انتخاباتی",
    score:  ps2,
    max:    15,
    status: ps2 >= 12 ? "✅" : ps2 >= 6 ? "🟡" : "🔴",
    action: ps2 < 6 ? "ثبت وعده‌ها" : null,
  });

  // ─── تیم کمپین (15 امتیاز) ───
  max += 15;
  const ts = Math.min(team.length * 3, 15);
  score += ts;
  items.push({
    title:  "👥 تیم کمپین",
    score:  ts,
    max:    15,
    status: ts >= 12 ? "✅" : ts >= 6 ? "🟡" : "🔴",
    action: ts < 6 ? "تشکیل تیم" : null,
  });

  // ─── شعار و پیام (10 امتیاز) ───
  max += 10;
  const slogan = profile.slogan && profile.slogan !== "هنوز تعیین نشده";
  const ss     = slogan ? 10 : 0;
  score += ss;
  items.push({
    title:  "📢 شعار و پیام",
    score:  ss,
    max:    10,
    status: ss >= 8 ? "✅" : "🔴",
    action: ss < 8 ? "تدوین شعار" : null,
  });

  const totalPct = Math.round((score / max) * 100);

  return { score, max, percent: totalPct, items };
}

// ═══════════════════════════════════════════
// تولید هشدارهای فوری
// ═══════════════════════════════════════════
function generateAlerts(profile, consultations, health) {
  const alerts = [];

  // هشدار پروفایل ناقص
  if (!profile.fullName) {
    alerts.push({
      level: "critical",
      emoji: "🚨",
      text:  "پروفایل کاندیدا ایجاد نشده — تمام تحلیل‌ها بدون پروفایل ناقص هستند",
      action: "profile_create",
      actionLabel: "ایجاد پروفایل",
    });
  }

  // هشدار عدم ارزیابی
  if (consultations.length === 0) {
    alerts.push({
      level: "high",
      emoji: "⚠️",
      text:  "هنوز هیچ ارزیابی آمادگی انجام نشده",
      action: "start_consultation",
      actionLabel: "شروع ارزیابی",
    });
  }

  // هشدار امتیاز پایین
  if (consultations.length > 0 && (consultations[0].score || 0) < 50) {
    alerts.push({
      level: "high",
      emoji: "⚠️",
      text:  `امتیاز آمادگی پایین است (${consultations[0].score}/125) — نیاز به اقدام فوری`,
      action: "start_consultation",
      actionLabel: "ارزیابی مجدد",
    });
  }

  // هشدار بدون شعار
  if (profile.fullName && (!profile.slogan || profile.slogan === "هنوز تعیین نشده")) {
    alerts.push({
      level: "medium",
      emoji: "📢",
      text:  "شعار انتخاباتی هنوز تعیین نشده",
      action: "profile_edit",
      actionLabel: "تدوین شعار",
    });
  }

  // هشدار سلامت کمپین پایین
  if (health.percent < 40) {
    alerts.push({
      level: "high",
      emoji: "🔴",
      text:  `سلامت کمپین در وضعیت بحرانی است (${health.percent}%)`,
      action: "campaign_menu",
      actionLabel: "مشاهده کمپین",
    });
  }

  return alerts;
}

// ═══════════════════════════════════════════
// نمایش داشبورد
// ═══════════════════════════════════════════
async function handleDashboard(ctx) {
  const userId = String(ctx.from.id);

  // بررسی دسترسی
  const ok = await requireAccess(ctx, "dashboard");
  if (!ok) return;

  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "⏳ در حال بارگذاری..." });

  const user = await getOrCreateUser(userId, ctx.from);

  // دریافت داده‌ها
  let profile = {};
  try { profile = JSON.parse(user.candidateProfile || "{}"); } catch { profile = {}; }

  const consultations = await getUserConsultations(userId);

  // داده‌های موقت (تا زمانی که جداول اختصاصی ساخته شن)
  let rivals   = [];
  let promises = [];
  let team     = [];
  try {
    const temp = JSON.parse(user.tempAnswers || "{}");
    rivals   = temp._rivals   || [];
    promises = temp._promises || [];
    team     = temp._team     || [];
  } catch {}

  // محاسبه سلامت کمپین
  const health = calcCampaignHealth(profile, consultations, rivals, promises, team);

  // هشدارها
  const alerts = generateAlerts(profile, consultations, health);

  // ─── ساخت متن داشبورد ───
  let t = "📊 *داشبورد کمپین*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  // اطلاعات کاندیدا
  if (profile.fullName) {
    t += `👤 *${profile.fullName}*\n`;
    t += `🗳️ ${_electionLabel(profile.electionType)} | 📍 ${profile.constituency || "—"}\n\n`;
  } else {
    t += "👤 *کاندیدا نامشخص*\n\n";
  }

  // سلامت کمپین
  t += "─── 🏥 *سلامت کمپین* ───\n\n";

  let healthEmoji = "🔴";
  if (health.percent >= 75)      healthEmoji = "🟢";
  else if (health.percent >= 50) healthEmoji = "🟡";
  else if (health.percent >= 30) healthEmoji = "🟠";

  t += `${healthEmoji} *${health.percent}%*\n`;
  t += `${bar(health.percent, 15)}\n\n`;

  // جزئیات هر بخش
  for (const item of health.items) {
    const itemPct = Math.round((item.score / item.max) * 100);
    t += `${item.status} ${item.title}: ${bar(itemPct, 8)} ${item.score}/${item.max}\n`;
  }
  t += "\n";

  // آخرین ارزیابی
  if (consultations.length > 0) {
    const last     = consultations[0];
    const lastRisk = getRiskLevel(last.score || 0);
    t += "─── 📈 *آخرین ارزیابی* ───\n\n";
    t += `${lastRisk.emoji} امتیاز: *${last.score}/125* — ${lastRisk.title}\n`;

    // مقایسه با قبلی
    if (consultations.length >= 2) {
      const diff = (last.score || 0) - (consultations[1].score || 0);
      if (diff > 0)       t += `📈 پیشرفت: *+${diff}* نسبت به دفعه قبل\n`;
      else if (diff < 0)  t += `📉 کاهش: *${diff}* نسبت به دفعه قبل\n`;
      else                t += `➡️ بدون تغییر نسبت به دفعه قبل\n`;
    }
    t += "\n";
  }

  // هشدارها
  if (alerts.length > 0) {
    t += "─── 🚨 *هشدارهای فوری* ───\n\n";
    for (const alert of alerts.slice(0, 3)) {
      t += `${alert.emoji} ${alert.text}\n`;
    }
    t += "\n";
  }

  // آمار سریع
  t += "─── 📋 *آمار کمپین* ───\n\n";
  t += `⚔️ رقبا ثبت‌شده: ${rivals.length}\n`;
  t += `📋 وعده‌های انتخاباتی: ${promises.length}\n`;
  t += `👥 اعضای تیم: ${team.length}\n`;
  t += `📊 تعداد ارزیابی‌ها: ${consultations.length}\n\n`;

  t += `🕐 آخرین بروزرسانی: ${new Date().toLocaleTimeString("fa-IR")}`;

  // ─── کیبورد با اقدامات فوری ───
  const kb = new InlineKeyboard();

  // دکمه‌های هشدارهای مهم
  for (const alert of alerts.slice(0, 2)) {
    if (alert.action && alert.actionLabel) {
      kb.text(`${alert.emoji} ${alert.actionLabel}`, alert.action).row();
    }
  }

  kb.text("🔄 بروزرسانی", "dashboard").row();
  kb.text("🗂️ مدیریت کمپین", "campaign_menu").row();
  kb.text("🚀 ارزیابی آمادگی", "start_consultation").row();
  kb.text("🔙 منوی اصلی", "menu").row();

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
// تابع کمکی
// ═══════════════════════════════════════════
function _electionLabel(v) {
  const m = {
    council:      "شورای شهر/روستا",
    parliament:   "مجلس",
    presidential: "ریاست جمهوری",
    other:        "سایر",
  };
  return m[v] || v || "نامشخص";
}

module.exports = {
  handleDashboard,
  calcCampaignHealth,
};
