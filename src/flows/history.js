// src/flows/history.js — نسخه 2.0 اصلاح‌شده
// ═══════════════════════════════════════════════════════════════
// ✅ فیکس: تمام توابع export شده
// ✅ بهبود: UX بهتر
// ✅ بهبود: نمایش تاریخ فارسی
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const { getUserConsultations } = require("../utils/db.js");

// ═══════════════════════════════════════════════════════════════
// 📜 نمایش لیست تاریخچه تحلیل‌ها
// ═══════════════════════════════════════════════════════════════
async function handleShowHistory(ctx) {
  const userId = String(ctx.from.id);

  try {
    const consultations = await getUserConsultations(userId);

    let text = "📜 *تاریخچه تحلیل‌های شما*\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    if (!consultations || consultations.length === 0) {
      text += "🔍 هیچ تحلیلی یافت نشد.\n\n";
      text += "برای شروع اولین تحلیل خود، از منو استفاده کنید.";

      const kb = new InlineKeyboard()
        .text("🎯 شروع مشاوره", "start_consultation")
        .row()
        .text("🏠 منوی اصلی", "menu");

      if (ctx.callbackQuery) {
        try {
          await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: kb,
          });
        } catch {
          await ctx.reply(text, {
            parse_mode: "Markdown",
            reply_markup: kb,
          });
        }
        await ctx.answerCallbackQuery();
      } else {
        await ctx.reply(text, {
          parse_mode: "Markdown",
          reply_markup: kb,
        });
      }
      return;
    }

    text += `تعداد کل: ${consultations.length} تحلیل\n\n`;
    text += "برای مشاهده جزئیات، روی هر تحلیل کلیک کنید:\n\n";

    const kb = new InlineKeyboard();

    consultations.slice(0, 10).forEach((c, index) => {
      // تبدیل تاریخ
      const dateStr = c.$createdAt || c.createdAt;
      let displayDate = "نامشخص";

      if (dateStr) {
        try {
          const date = new Date(dateStr);
          displayDate = new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(date);
        } catch (e) {
          displayDate = "نامشخص";
        }
      }

      // Emoji بر اساس امتیاز
      let emoji = "📊";
      if (c.score >= 80) emoji = "🟢";
      else if (c.score >= 60) emoji = "🟡";
      else if (c.score >= 40) emoji = "🟠";
      else emoji = "🔴";

      const label = `${emoji} ${c.electionType || "تحلیل"} - ${displayDate}`;
      text += `${index + 1}. ${label}\n`;

      kb.text(label, `history_detail:${c.$id}`).row();
    });

    if (consultations.length > 10) {
      text += `\n... و ${consultations.length - 10} تحلیل دیگر`;
    }

    kb.text("🏠 منوی اصلی", "menu");

    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "Markdown",
          reply_markup: kb,
        });
      } catch {
        await ctx.reply(text, {
          parse_mode: "Markdown",
          reply_markup: kb,
        });
      }
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(text, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    }
  } catch (e) {
    console.error("❌ خطا در دریافت تاریخچه:", e);

    await ctx.reply(
      "❌ متأسفانه خطایی رخ داد.\n\nلطفاً بعداً تلاش کنید.",
      {
        reply_markup: new InlineKeyboard().text("🏠 منوی اصلی", "menu"),
      }
    );

    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 📄 نمایش جزئیات یک تحلیل
// ═══════════════════════════════════════════════════════════════
async function handleHistoryDetail(ctx) {
  const consultationId = ctx.callbackQuery.data.split(":")[1];
  const userId = String(ctx.from.id);

  try {
    const consultations = await getUserConsultations(userId);
    const consultation = consultations.find((c) => c.$id === consultationId);

    if (!consultation) {
      await ctx.answerCallbackQuery("❌ تحلیل پیدا نشد");
      return;
    }

    // نمایش گزارش نهایی
    let text = consultation.finalReport || "گزارش موجود نیست.";

    // اضافه کردن اطلاعات اضافی
    text += "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    text += "📊 *اطلاعات تحلیل:*\n\n";

    
