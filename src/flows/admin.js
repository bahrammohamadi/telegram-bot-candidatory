const { InlineKeyboard } = require("grammy");
const { getStats, listLeads } = require("../utils/db.js");

const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((id) => parseInt(id.trim()))
  .filter((id) => !isNaN(id));

async function handleAdminPanel(ctx) {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    await ctx.reply("شما دسترسی ندارید.");
    return;
  }

  try {
    const stats = await getStats();

    let text = "👑 پنل مدیریت\n\n";
    text += "📊 آمار:\n\n";
    text += `👥 کاربران: ${stats.totalUsers || 0}\n`;
    text += `📋 تحلیل ها: ${stats.totalConsultations || 0}\n`;
    text += `🔥 لیدها: ${stats.totalLeads || 0}\n`;

    const kb = new InlineKeyboard()
      .text("🔥 لیدها", "admin_leads")
      .row()
      .text("🏠 منو", "menu");

    await ctx.reply(text, { reply_markup: kb });
  } catch (e) {
    console.error("خطا:", e);
    await ctx.reply("خطا در دریافت آمار.");
  }
}

async function handleAdminLeads(ctx) {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    await ctx.answerCallbackQuery("دسترسی غیرمجاز");
    return;
  }

  try {
    const leads = await listLeads(20);

    let text = "🔥 لیست لیدها\n\n";

    if (!leads || leads.length === 0) {
      text += "هیچ لیدی یافت نشد.";
    } else {
      leads.forEach((lead, index) => {
        const temp = lead.leadTemperature === "hot" ? "🔴" : "🟡";
        text += `${index + 1}. ${temp} ${lead.userId}\n`;
      });
    }

    const kb = new InlineKeyboard().text("« بازگشت", "menu");

    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("خطا:", e);
    await ctx.answerCallbackQuery("خطا");
  }
}

module.exports = {
  handleAdminPanel,
  handleAdminLeads,
};
