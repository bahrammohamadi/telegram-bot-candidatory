// src/flows/contact.js
// ─── درباره ما / ارتباط با ما / نمونه تحلیل‌ها ───

import { aboutUsKB, contactUsKB, samplesKB } from "../utils/keyboard.js";

// ═══════════════════════════════════════
//  درباره ما
// ═══════════════════════════════════════

export async function handleAboutUs(ctx) {
  let t = "";
  t += "ℹ️ *درباره کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "🏛️ *کاندیداتوری هوشمند* اولین سامانه هوشمند تحلیل آمادگی ";
  t += "کاندیداتوری در ایران است.\n\n";
  t += "*ما چه می‌کنیم:*\n\n";
  t += "📊 تحلیل علمی آمادگی کاندیداتوری (۵ بُعد کلیدی)\n";
  t += "📋 مشاوره تخصصی انتخاباتی\n";
  t += "🎯 طراحی استراتژی و مدیریت کمپین\n";
  t += "📢 تبلیغات و تولید محتوای انتخاباتی\n";
  t += "🎓 آموزش‌های تخصصی کاندیداها\n\n";
  t += "*تیم ما:*\n\n";
  t += "متخصصان علوم سیاسی، مدیریت کمپین، ارتباطات و بازاریابی سیاسی ";
  t += "با سال‌ها تجربه در انتخابات محلی و ملی.\n\n";
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

// ═══════════════════════════════════════
//  ارتباط با ما
// ═══════════════════════════════════════

export async function handleContactUs(ctx) {
  let t = "";
  t += "📞 *ارتباط با ما*\n";
  t += "━━━━━━━━━━━━━━━━━━━\n\n";
  t += "📱 تماس / واتساپ: *۰۹۱۲-XXX-XXXX*\n";
  t += "📧 ایمیل: *info@candidatory.ir*\n";
  t += "💬 تلگرام: @candidatory\\_support\n";
  t += "🌐 وب‌سایت: *candidatory.ir*\n\n";
  t += "⏰ ساعات پاسخگویی: شنبه تا پنجشنبه ۹ صبح تا ۶ عصر\n\n";
  t += "💡 _برای مشاوره فوری پیام بگذارید — حداکثر ۲ ساعته پاسخ می‌دهیم._";

  const kb = contactUsKB();

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════
//  نمونه تحلیل‌ها
// ═══════════════════════════════════════

export async function handleShowSamples(ctx) {
  let t = "";
  t += "📄 *نمونه تحلیل‌های انجام‌شده*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  t += "🟢 *نمونه ۱ — آمادگی عالی (امتیاز ۱۰۸/۱۲۵)*\n";
  t += "├ عضو سابق شورا + سابقه ۱۲ ساله\n";
  t += "├ تیم حرفه‌ای ۲۰ نفره + بودجه کافی\n";
  t += "├ شعار: «شفافیت در عمل»\n";
  t += "└ توصیه: تمرکز بر حفظ انسجام تیم\n\n";

  t += "🟡 *نمونه ۲ — آمادگی متوسط (امتیاز ۵۵/۱۲۵)*\n";
  t += "├ بومی + شناخته‌شده ولی بدون تیم\n";
  t += "├ ارتباطات محلی متوسط\n";
  t += "├ بدون شعار مشخص\n";
  t += "└ توصیه: ساخت تیم فوری + تدوین پیام\n\n";

  t += "🔴 *نمونه ۳ — آمادگی ضعیف (امتیاز ۲۲/۱۲۵)*\n";
  t += "├ تازه‌وارد حوزه + شبکه ارتباطی ضعیف\n";
  t += "├ تنها و بدون بودجه\n";
  t += "├ آسیب‌پذیر در برابر فشار\n";
  t += "└ توصیه: حداقل ۶ ماه آماده‌سازی\n\n";

  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  t += "🚀 آیا می‌خواهید وضعیت خود را تحلیل کنید؟";

  const kb = samplesKB();

  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}
