// ============================================================
// 📞 ارتباط + درباره ما + نمونه تحلیل
// ============================================================

import { InlineKeyboard } from "grammy";
import { backKB } from "../utils/keyboard.js";

// ============================================================
// 📞 ارتباط با ما
// ============================================================

export const CONTACT_TEXT =
  "📞 ارتباط با تیم کاندیداتوری هوشمند\n" +
  "━━━━━━━━━━━━━━━━━━━━━\n\n" +
  "📱 تلفن: ۰۲۱-XXXXXXXX\n" +
  "📲 واتساپ: ۰۹۱۲XXXXXXX\n" +
  "📧 ایمیل: info@candidatory.ir\n\n" +
  "⏰ ساعات پاسخگویی:\n" +
  "شنبه تا پنجشنبه | ۹ صبح تا ۶ عصر\n\n" +
  "━━━━━━━━━━━━━━━━━━━━━\n\n" +
  "💡 میتوانید پیام خود را همینجا ارسال کنید\n" +
  "تا کارشناسان ما در اولین فرصت پاسخ دهند.";

// ============================================================
// ℹ️ درباره ما — نسخه جذاب
// ============================================================

export const ABOUT_TEXT =
  "ℹ️ درباره کاندیداتوری هوشمند\n" +
  "━━━━━━━━━━━━━━━━━━━━━\n\n" +
  "🗳️ سامانه هوشمند مشاوره انتخاباتی\n" +
  "با الگوریتم‌های تحلیلی پیشرفته\n\n" +
  "🎯 ماموریت ما:\n" +
  "کمک به کاندیداها برای تصمیم‌گیری\n" +
  "آگاهانه و حرفه‌ای\n\n" +
  "📊 خدمات:\n" +
  "• تحلیل شانس کاندیداتوری\n" +
  "• مشاوره استراتژی انتخاباتی\n" +
  "• مدیریت کمپین تبلیغاتی\n" +
  "• تحلیل رقبا و حوزه انتخابیه\n\n" +
  "👨‍💼 تیم ما:\n" +
  "متخصصین با تجربه در مشاوره\n" +
  "کمپین‌های انتخاباتی موفق\n\n" +
  "━━━━━━━━━━━━━━━━━━━━━\n\n" +
  "🌐 وب سایت:\n" +
  "candidatory.ir\n\n" +
  "📧 ایمیل:\n" +
  "info@candidatory.ir\n\n" +
  "🤖 ربات تلگرام:\n" +
  "https://t.me/candidatoryiran_bot\n\n" +
  "📢 کانال خبری تلگرام:\n" +
  "https://t.me/candidatoryiran\n\n" +
  "📢 کانال خبری بله:\n" +
  "https://ble.ir/candidatoryiran\n\n" +
  "━━━━━━━━━━━━━━━━━━━━━";

// ============================================================
// هندلرها
// ============================================================

export async function handleContact(ctx) {
  await ctx.editMessageText(CONTACT_TEXT, {
    reply_markup: backKB(),
  });
  await ctx.answerCallbackQuery();
}

export async function handleAbout(ctx) {
  await ctx.editMessageText(ABOUT_TEXT, {
    reply_markup: new InlineKeyboard()
      .text("🧠 شروع مشاوره", "start_consult")
      .row()
      .text("🏠 منوی اصلی", "main_menu"),
  });
  await ctx.answerCallbackQuery();
}

// نمونه تحلیل از دیتابیس واقعی
export async function handleSamples(ctx) {
  try {
    const { listConsultations } = await import("../utils/db.js");
    const result = await listConsultations(0, 3);
    const docs = result.documents;

    let txt = "📊 نمونه تحلیل‌های اخیر\n";
    txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";

    if (docs.length === 0) {
      txt += "هنوز تحلیلی ثبت نشده.\n";
      txt += "اولین نفری باشید که تحلیل میگیرد!\n";
    } else {
      docs.forEach((doc, i) => {
        let answers = {};
        try {
          answers = JSON.parse(doc.answers || "{}");
        } catch {}

        const name = doc.fullName || answers.fullName || "کاربر";
        const region = doc.region || answers.region || "---";
        const score = doc.score || 0;
        const risk = doc.riskLevel || "---";

        // فقط اسم کوچک (حفظ حریم خصوصی)
        const firstName = name.split(" ")[0] || "کاربر";

        const riskIcon =
          risk === "high" ? "🔴" :
          risk === "medium" ? "🟡" :
          risk === "low" ? "🟢" : "⚪";

        txt += "📌 نمونه " + (i + 1) + "\n";
        txt += "نام: " + firstName + "\n";
        txt += "حوزه: " + region + "\n";
        txt += "امتیاز: " + score + "\n";
        txt += "ریسک: " + riskIcon + " " + risk + "\n";
        txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";
      });
    }

    txt += "🧠 برای دریافت تحلیل اختصاصی\n";
    txt += "مشاوره هوشمند را بزنید.";

    await ctx.editMessageText(txt, {
      reply_markup: new InlineKeyboard()
        .text("🧠 شروع مشاوره اختصاصی", "start_consult")
        .row()
        .text("🏠 منوی اصلی", "main_menu"),
    });
  } catch (e) {
    console.error("samples error:", e.message);
    await ctx.editMessageText(
      "خطا در دریافت نمونه ها. لطفا بعدا تلاش کنید.",
      { reply_markup: backKB() }
    );
  }
  await ctx.answerCallbackQuery();
}
