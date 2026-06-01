// src/flows/admin.js — نسخه 2.0 بهبودیافته
// ═══════════════════════════════════════════════════════════════
// ✅ بهبود: آمار کامل‌تر
// ✅ بهبود: نمایش بهتر
// ✅ بهبود: Export شده
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const {
  getStats,
  listLeads,
  findByNationalId,
  findByPhone,
  getUser,
} = require("../utils/db.js");

// لیست ادمین‌ها (از ENV)
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((id) => parseInt(id.trim()))
  .filter((id) => !isNaN(id));

// ═══════════════════════════════════════════════════════════════
// 👑 پنل ادمین
// ═══════════════════════════════════════════════════════════════
async function handleAdminPanel(ctx) {
  const userId = ctx.from.id;

  // بررسی دسترسی
  if (!ADMIN_IDS.includes(userId)) {
    await ctx.reply("❌ شما دسترسی به پنل ادمین ندارید.");
    return;
  }

  try {
    const stats = await getStats();

    let text = "👑 *پنل مدیریت*\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "📊 *آمار کلی سیستم:*\n\n";
    text += `👥 تعداد کاربران: ${stats.totalUsers || 0}\n`;
    text += `📋 تعداد تحلیل‌ها: ${stats.totalConsultations || 0}\n`;
    text += `🔥 لیدهای فعال: ${stats.totalLeads || 0}\n\n`;

    // محاسبه نرخ تبدیل
    const conversionRate =
      stats.totalUsers > 0
        ? ((stats.totalConsultations / stats.totalUsers) * 100).toFixed(1)
        : 0;

    text += `📈 نرخ تبدیل: ${conversionRate}%\n\n`;

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "🔍 *عملیات مدیریتی:*";

    const kb = new InlineKeyboard()
      .text("📊 آمار تفصیلی", "admin_stats")
      .row()
      .text("🔥 لیست لیدها", "admin_leads")
      .row()
      .text("🔍 جستجو کاربر", "admin_search")
      .row()
      .text("🏠 منوی اصلی", "menu");

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: kb,
    });
  } catch (e) {
    console.error("❌ خطا در پنل ادمین:", e);
    await ctx.reply("❌ خطا در دریافت آمار.");
  }
}

// ═══════════════════════════════════════════════════════════════
// 📊 آمار تفصیلی
// ═══════════════════════════════════════════════════════════════
async function handleAdminStats(ctx) {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    await ctx.answerCallbackQuery("❌ دسترسی غیرمجاز");
    return;
  }

  try {
    const stats = await getStats();

    let text = "📊 *آمار تفصیلی سیستم*\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += `👥 کل کاربران: ${stats.totalUsers || 0}\n`;
    text += `📋 کل تحلیل‌ها: ${stats.totalConsultations || 0}\n`;
    text += `🔥 کل لیدها: ${stats.totalLeads || 0}\n\n`;

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "_آمار بیشتر به زودی..._";

    const kb = new InlineKeyboard().text("« بازگشت", "admin_panel");

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: kb,
    });

    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("❌ خطا:", e);
    await ctx.answerCallbackQuery("❌ خطا");
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔥 لیست لیدها
// ═══════════════════════════════════════════════════════════════
async function handleAdminLeads(ctx) {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    await ctx.answerCallbackQuery("❌ دسترسی غیرمجاز");
    return;
  }

  try {
    const leads = await listLeads(20);

    let text = "🔥 *لیست لیدهای اخیر*\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    if (!leads || leads.length === 0) {
      text += "هیچ لیدی یافت 
