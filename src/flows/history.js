// src/flows/history.js — CommonJS
// ─── تاریخچه تحلیل‌های کاربر ───

const { InlineKeyboard } = require("grammy");
const { getUserConsultations } = require("../utils/db.js");

/**
 * نمایش لیست تحلیل‌های قبلی
 */
async function handleShowHistory(ctx) {
  var userId = String(ctx.from.id);

  var consults = await getUserConsultations(userId);

  if (!consults || consults.length === 0) {
    var emptyText =
      "📂 *تاریخچه تحلیل‌ها*\n" +
      "━━━━━━━━━━━━━━━━━━━\n\n" +
      "شما هنوز هیچ تحلیلی انجام نداده‌اید.\n\n" +
      "🚀 همین الان اولین تحلیل خود را شروع کنید!";

    var emptyKB = new InlineKeyboard()
      .text("🚀 شروع تحلیل", "start_consultation")
      .row()
      .text("🔙 منو", "menu")
      .row();

    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(emptyText, {
          parse_mode: "Markdown",
          reply_markup: emptyKB,
        });
      } catch (e) {
        await ctx.reply(emptyText, {
          parse_mode: "Markdown",
          reply_markup: emptyKB,
        });
      }
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(emptyText, {
        parse_mode: "Markdown",
        reply_markup: emptyKB,
      });
    }
    return;
  }

  // ─── ساخت لیست تحلیل‌ها ───
  var t =
    "📂 *تاریخچه تحلیل‌های شما*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "📊 تعداد کل: *" +
    consults.length +
    "* تحلیل\n\n";

  // نمایش آخرین ۵ تحلیل
  var showCount = Math.min(consults.length, 5);

  for (var i = 0; i < showCount; i++) {
    var c = consults[i];
    var date = c.createdAt || c.$createdAt || "نامشخص";
    if (date.length > 10) date = date.substring(0, 10);

    var riskEmoji = "⚪";
    if (c.riskLevel === "low") riskEmoji = "🟢";
    else if (c.riskLevel === "medium_low") riskEmoji = "🔵";
    else if (c.riskLevel === "medium") riskEmoji = "🟡";
    else if (c.riskLevel === "high") riskEmoji = "🟠";
    else if (c.riskLevel === "very_high") riskEmoji = "🔴";

    t += "─── تحلیل " + (i + 1) + " ───\n";
    t += "📅 تاریخ: " + date + "\n";
    t += riskEmoji + " امتیاز: *" + (c.score || 0) + "/125*\n";
    t += "🗳️ " + (c.electionType || "نامشخص") + "\n";
    t += "📍 " + (c.region || "نامشخص") + "\n\n";
  }

  // مقایسه اگر بیش از ۱ تحلیل داشته باشد
  if (consults.length >= 2) {
    var latest = consults[0].score || 0;
    var previous = consults[1].score || 0;
    var diff = latest - previous;

    t += "─── 📈 *مقایسه آخرین دو تحلیل* ───\n\n";
    if (diff > 0) {
      t += "✅ پیشرفت: *+" + diff + " امتیاز* نسبت به تحلیل قبلی\n";
      t += "🎉 آفرین! در مسیر درستی هستید.\n\n";
    } else if (diff < 0) {
      t +=
        "⚠️ کاهش: *" + diff + " امتیاز* نسبت به تحلیل قبلی\n";
      t += "💡 توصیه: نقاط ضعف جدید را بررسی کنید.\n\n";
    } else {
      t += "➡️ بدون تغییر نسبت به تحلیل قبلی.\n\n";
    }
  }

  // دکمه‌ها
  var kb = new InlineKeyboard()
    .text("🚀 تحلیل جدید", "start_consultation")
    .row();

  // دکمه مشاهده جزئیات هر تحلیل
  for (var j = 0; j < showCount; j++) {
    kb.text(
      "📄 جزئیات تحلیل " + (j + 1),
      "history_detail:" + consults[j].$id
    ).row();
  }

  kb.text("💼 بسته‌ها", "show_plans").row();
  kb.text("🔙 منو", "menu").row();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(t, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    } catch (e) {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

/**
 * نمایش جزئیات یک تحلیل خاص
 */
async function handleHistoryDetail(ctx, consultId) {
  try {
    // مستقیم document را بخوان
    var { Databases } = require("node-appwrite");
    // از طریق getUserConsultations فیلتر می‌کنیم
    var userId = String(ctx.from.id);
    var consults = await getUserConsultations(userId);

    var consult = null;
    for (var i = 0; i < consults.length; i++) {
      if (consults[i].$id === consultId) {
        consult = consults[i];
        break;
      }
    }

    if (!consult) {
      if (ctx.callbackQuery)
        await ctx.answerCallbackQuery({ text: "❌ تحلیل یافت نشد" });
      return;
    }

    // نمایش گزارش ذخیره‌شده
    var report = consult.finalReport || "گزارشی ذخیره نشده.";

    // اگر گزارش خیلی طولانی بود، خلاصه نمایش بده
    if (report.length > 4000) {
      report = report.substring(0, 4000) + "\n\n... (ادامه دارد)";
    }

    var kb = new InlineKeyboard()
      .text("📂 بازگشت به تاریخچه", "show_history")
      .row()
      .text("🚀 تحلیل جدید", "start_consultation")
      .row()
      .text("🔙 منو", "menu")
      .row();

    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(report, {
          parse_mode: "Markdown",
          reply_markup: kb,
        });
      } catch (e) {
        await ctx.reply(report, {
          parse_mode: "Markdown",
          reply_markup: kb,
        });
      }
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(report, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    }
  } catch (e) {
    console.error("خطا در handleHistoryDetail:", e.message);
    if (ctx.callbackQuery)
      await ctx.answerCallbackQuery({ text: "❌ خطا" });
  }
}

module.exports = {
  handleShowHistory,
  handleHistoryDetail,
};
