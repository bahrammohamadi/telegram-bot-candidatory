// ============================================================
// 📞 فلو ارتباط با ما + درباره ما + نمونه تحلیل‌ها
// ============================================================

import { InlineKeyboard } from "grammy";
import { backKB } from "../utils/keyboard.js";

export const CONTACT_TEXT = `
📞 *ارتباط با تیم کاندیداتوری هوشمند*

━━━━━━━━━━━━━━━━━━━━━

📱 تلفن: ۰۲۱-XXXXXXXX
📲 واتساپ: ۰۹۱۲XXXXXXX
📧 ایمیل: info@kandidatory.ir
🌐 وبسایت: kandidatory.ir
💬 تلگرام: @kandidatory\\_support

⏰ ساعات پاسخگویی:
شنبه تا پنجشنبه | ۹ صبح تا ۶ عصر

━━━━━━━━━━━━━━━━━━━━━

💡 می‌توانید پیام خود را همینجا ارسال کنید
تا کارشناسان ما در اولین فرصت پاسخ دهند.
`;

export const ABOUT_TEXT = `
ℹ️ *درباره کاندیداتوری هوشمند*

━━━━━━━━━━━━━━━━━━━━━

🗳️ سامانه هوشمند مشاوره انتخاباتی با الگوریتم‌های تحلیلی پیشرفته

🎯 *ماموریت ما:*
کمک به کاندیداها برای تصمیم‌گیری آگاهانه و حرفه‌ای

📊 *خدمات:*
• تحلیل شانس کاندیداتوری
• مشاوره استراتژی انتخاباتی
• مدیریت کمپین تبلیغاتی
• تحلیل رقبا و حوزه انتخابیه

👨‍💼 *تیم ما:*
متخصصین با تجربه در مشاوره کمپین‌های انتخاباتی موفق

━━━━━━━━━━━━━━━━━━━━━

🌐 kandidatory.ir
📧 info@kandidatory.ir
🤖 @candidatoryiran\\_bot
`;

export const SAMPLES_TEXT = `
📊 *نمونه تحلیل‌های انجام شده*

━━━━━━━━━━━━━━━━━━━━━

📌 *نمونه ۱ — شورای شهر تهران*
• امتیاز: ۶۸ / ۸۵
• ریسک: متوسط 🟡
• نتیجه: با اصلاح استراتژی تبلیغاتی شانس بالایی دارد ✅

━━━━━━━━━━━━━━━━━━━━━

📌 *نمونه ۲ — مجلس اصفهان*
• امتیاز: ۴۲ / ۸۵
• ریسک: بالا 🔴
• نتیجه: نیاز به تقویت شناخته‌شدگی و تیم ⚠️

━━━━━━━━━━━━━━━━━━━━━

📌 *نمونه ۳ — شورای شهر شیراز*
• امتیاز: ۷۵ / ۸۵
• ریسک: پایین 🟢
• نتیجه: آمادگی کامل برای حضور موفق 🏆

━━━━━━━━━━━━━━━━━━━━━

🧠 برای دریافت تحلیل اختصاصی خود
«مشاوره هوشمند» را از منوی اصلی بزنید.
`;

export async function handleContact(ctx) {
  await ctx.editMessageText(CONTACT_TEXT, {
    parse_mode: "Markdown",
    reply_markup: backKB(),
  });
  await ctx.answerCallbackQuery();
}

export async function handleAbout(ctx) {
  await ctx.editMessageText(ABOUT_TEXT, {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard()
      .text("🧠 شروع مشاوره", "start_consult")
      .row()
      .text("🏠 منوی اصلی", "main_menu"),
  });
  await ctx.answerCallbackQuery();
}

export async function handleSamples(ctx) {
  await ctx.editMessageText(SAMPLES_TEXT, {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard()
      .text("🧠 شروع مشاوره اختصاصی", "start_consult")
      .row()
      .text("🏠 منوی اصلی", "main_menu"),
  });
  await ctx.answerCallbackQuery();
}