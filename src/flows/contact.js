// src/flows/contact.js
// ─── درباره ما، ارتباط، نمونه تحلیل‌ها ───

import { aboutUsKB, contactUsKB } from "../utils/keyboard.js";
import { InlineKeyboard } from "grammy";

export async function handleAboutUs(ctx) {
  const t = "ℹ️ *درباره کاندیداتوری هوشمند*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "🏛️ نخستین سامانه تخصصی تحلیل آمادگی کاندیداتوری در ایران.\n\n" +
    "*خدمات:*\n├ 📊 تحلیل علمی آمادگی\n├ 🎓 آموزش تخصصی\n├ 💼 مشاوره حرفه‌ای\n└ 📢 مدیریت کمپین\n\n" +
    "🤖 @candidatoryiran\\_bot";
  const kb = aboutUsKB();
  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

export async function handleContactUs(ctx) {
  const t = "📞 *ارتباط با ما*\n━━━━━━━━━━━━━━━━━━━\n\n" +
    "📱 تماس: *۰۹۱۲-XXX-XXXX*\n📧 ایمیل: *info@candidatory.ir*\n" +
    "💬 تلگرام: @candidatory\\_support\n🌐 وب: *candidatory.ir*\n\n" +
    "⏰ شنبه تا پنجشنبه ۹–۱۸";
  const kb = contactUsKB();
  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

export async function handleSampleReports(ctx) {
  let t = "📄 *نمونه تحلیل‌ها*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "─── *نمونه ۱: کاندیدای قوی* ───\n🟢 ۱۰۵/۱۲۵ (۸۴٪) | شورای شهر اصفهان\n\n";
  t += "─── *نمونه ۲: کاندیدای متوسط* ───\n🟡 ۵۸/۱۲۵ (۴۶٪) | شورای روستا مازندران\n\n";
  t += "─── *نمونه ۳: ضعیف → موفق!* ───\n🟠→🟢 ۳۰→۸۵/۱۲۵ | با ۳ ماه آماده‌سازی برنده شد!\n\n";
  t += "🚀 _شما هم شروع کنید!_";

  const kb = new InlineKeyboard()
    .text("🚀 شروع تحلیل", "start_consultation").row()
    .text("💼 بسته‌ها", "show_plans").row()
    .text("🔙 منو", "menu").row();

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}
