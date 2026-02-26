import { InlineKeyboard } from "grammy";
import { backKB } from "../utils/keyboard.js";

export const CONTACT_TEXT =
  "📞 ارتباط با تیم کاندیداتوری هوشمند\n" +
  "━━━━━━━━━━━━━━━━━━━━━\n\n" +
  "📱 تلفن: ۰۲۱-XXXXXXXX\n" +
  "📲 واتساپ: ۰۹۱۲XXXXXXX\n" +
  "📧 ایمیل: info@kandidatory.ir\n\n" +
  "ساعات پاسخگویی:\n" +
  "شنبه تا پنجشنبه | ۹ صبح تا ۶ عصر";

export const ABOUT_TEXT =
  "ℹ️ درباره کاندیداتوری هوشمند\n" +
  "━━━━━━━━━━━━━━━━━━━━━\n\n" +
  "سامانه هوشمند مشاوره انتخاباتی\n\n" +
  "خدمات ما:\n" +
  "• تحلیل شانس کاندیداتوری\n" +
  "• مشاوره استراتژی انتخاباتی\n" +
  "• مدیریت کمپین تبلیغاتی\n" +
  "• تحلیل رقبا و حوزه انتخابیه";

export async function handleContact(ctx) {
  await ctx.editMessageText(CONTACT_TEXT, { reply_markup: backKB() });
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

// نمونه تحلیل‌ها — از دیتابیس واقعی
export async function handleSamples(ctx) {
  try {
    const { listConsultations } = await import("../utils/db.js");
    const result = await listConsultations(0, 3);
    const docs = result.documents;

    let txt = "📊 نمونه تحلیل های اخیر\n";
    txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";

    if (docs.length === 0) {
      txt += "هنوز تحلیلی ثبت نشده.\n";
    } else {
      docs.forEach((doc, i) => {
        let answers = {};
        try { answers = JSON.parse(doc.answers || "{}"); } catch {}

        const name = doc.fullName || answers.fullName || "کاربر " + (i + 1);
        const region = doc.region || answers.region || "---";
        const score = doc.score || 0;

        // فقط نام کوچک نشون بده (حریم خصوصی)
        const firstName = name.split(" ")[0] || "کاربر";

        txt += "📌 نمونه " + (i + 1) + " — " + firstName + " از " + region + "\n";
        txt += "امتیاز: " + score + " | ریسک: " + (doc.riskLevel || "---") + "\n\n";
      });
    }

    txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";
    txt += "🧠 برای دریافت تحلیل اختصاصی، مشاوره هوشمند را بزنید.";

    await ctx.editMessageText(txt, {
      reply_markup: new InlineKeyboard()
        .text("🧠 شروع مشاوره", "start_consult")
        .row()
        .text("🏠 منوی اصلی", "main_menu"),
    });
  } catch (e) {
    await ctx.editMessageText("خطا در دریافت نمونه ها.", {
      reply_markup: backKB(),
    });
  }
  await ctx.answerCallbackQuery();
}
