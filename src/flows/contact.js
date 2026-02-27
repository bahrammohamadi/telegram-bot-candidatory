// src/flows/contact.js — CommonJS

const { InlineKeyboard } = require("grammy");
const { aboutUsKB, contactUsKB } = require("../utils/keyboard.js");

async function handleAboutUs(ctx) {
  const t = "ℹ️ *درباره کاندیداتوری هوشمند*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nنخستین سامانه تحلیل آمادگی کاندیداتوری.\n\n🤖 @candidatoryiran\\_bot";
  const kb = aboutUsKB();
  if (ctx.callbackQuery) { try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } await ctx.answerCallbackQuery(); }
  else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleContactUs(ctx) {
  const t = "📞 *ارتباط با ما*\n━━━━━━━━━━━━━━━━━━━\n\n📱 ۰۹۱۲-XXX-XXXX\n💬 @candidatory\\_support\n⏰ شنبه–پنجشنبه ۹–۱۸";
  const kb = contactUsKB();
  if (ctx.callbackQuery) { try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } await ctx.answerCallbackQuery(); }
  else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleSampleReports(ctx) {
  const t = "📄 *نمونه تحلیل‌ها*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🟢 ۱۰۵/۱۲۵ — شورای شهر اصفهان\n🟡 ۵۸/۱۲۵ — شورای روستا مازندران\n🟠→🟢 ۳۰→۸۵ — با مشاوره برنده شد!\n\n🚀 _شما هم شروع کنید!_";
  const kb = new InlineKeyboard().text("🚀 شروع", "start_consultation").row().text("💼 بسته‌ها", "show_plans").row().text("🔙 منو", "menu").row();
  if (ctx.callbackQuery) { try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } await ctx.answerCallbackQuery(); }
  else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

module.exports = { handleAboutUs, handleContactUs, handleSampleReports };
