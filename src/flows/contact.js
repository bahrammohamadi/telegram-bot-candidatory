// src/flows/contact.js
// ─── درباره ما، ارتباط با ما، نمونه تحلیل‌ها ───

import { aboutUsKB, contactUsKB } from "../utils/keyboard.js";
import { InlineKeyboard } from "grammy";

/**
 * درباره ما
 */
export async function handleAboutUs(ctx) {
  let t = "";
  t += "ℹ️ *درباره کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "🏛️ *کاندیداتوری هوشمند* نخستین سامانه تخصصی تحلیل آمادگی ";
  t += "کاندیداتوری در ایران است.\n\n";
  t += "*🎯 مأموریت ما:*\n";
  t += "کمک به کاندیداهای جدی برای ورود حرفه‌ای و آگاهانه به عرصه انتخابات.\n\n";
  t += "*📋 خدمات:*\n";
  t += "├ 📊 تحلیل علمی آمادگی (رایگان)\n";
  t += "├ 🎓 آموزش تخصصی انتخاباتی\n";
  t += "├ 💼 مشاوره حرفه‌ای\n";
  t += "├ 🎯 طراحی استراتژی کمپین\n";
  t += "└ 📢 مدیریت تبلیغات انتخاباتی\n\n";
  t += "*👥 تیم ما:*\n";
  t += "تیمی از متخصصان علوم سیاسی، ارتباطات، مدیریت کمپین و ";
  t += "روانشناسی اجتماعی با تجربه عملی در انتخابات.\n\n";
  t += "🤖 @candidatoryiran\\_bot";

  const kb = aboutUsKB();

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

/**
 * ارتباط با ما
 */
export async function handleContactUs(ctx) {
  let t = "";
  t += "📞 *ارتباط با ما*\n";
  t += "━━━━━━━━━━━━━━━━━━━\n\n";
  t += "📱 تماس: *۰۹۱۲-XXX-XXXX*\n";
  t += "📧 ایمیل: *info@candidatory.ir*\n";
  t += "💬 تلگرام: @candidatory\\_support\n";
  t += "🌐 وب‌سایت: *candidatory.ir*\n\n";
  t += "⏰ ساعات پاسخگویی: شنبه تا پنجشنبه ۹ الی ۱۸\n\n";
  t += "💡 _برای مشاوره فوری پیام بگذارید._";

  const kb = contactUsKB();

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

/**
 * نمونه تحلیل‌ها
 */
export async function handleSampleReports(ctx) {
  let t = "";
  t += "📄 *نمونه تحلیل‌های انجام شده*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  t += "─── *نمونه ۱: کاندیدای قوی* ───\n\n";
  t += "🟢 امتیاز: ۱۰۵/۱۲۵ (۸۴٪)\n";
  t += "📍 شورای شهر — اصفهان\n";
  t += "💪 نقاط قوت: سابقه ۸ ساله خدمت محلی، تیم ۱۵ نفره\n";
  t += "⚠️ نقطه ضعف: شعار مشخصی نداشت → بعد از مشاوره اصلاح شد\n\n";

  t += "─── *نمونه ۲: کاندیدای متوسط* ───\n\n";
  t += "🟡 امتیاز: ۵۸/۱۲۵ (۴۶٪)\n";
  t += "📍 شورای روستا — مازندران\n";
  t += "💪 نقاط قوت: بومی و شناخته‌شده\n";
  t += "⚠️ نقاط ضعف: بدون تیم و بودجه → بسته حرفه‌ای ما را تهیه کرد\n\n";

  t += "─── *نمونه ۳: کاندیدای ضعیف → موفق!* ───\n\n";
  t += "🟠 امتیاز اولیه: ۳۰/۱۲۵ (۲۴٪)\n";
  t += "🟢 امتیاز بعد از مشاوره: ۸۵/۱۲۵ (۶۸٪)\n";
  t += "📍 شورای شهر — فارس\n";
  t += "💡 با ۳ ماه آماده‌سازی و بسته VIP، وارد شورا شد!\n\n";

  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  t += "🚀 _شما هم تحلیل خود را شروع کنید!_";

  const kb = new InlineKeyboard()
    .text("🚀 شروع تحلیل", "start_consultation")
    .row()
    .text("💼 بسته‌ها و خدمات", "show_plans")
    .row()
    .text("🔙 منو", "menu")
    .row();

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}
