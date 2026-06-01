const { InlineKeyboard } = require("grammy");
const { getUserConsultations } = require("../utils/db.js");

async function handleShowHistory(ctx) {
  const userId = String(ctx.from.id);

  try {
    const consultations = await getUserConsultations(userId);

    let text = "📜 تاریخچه تحلیل ها\n\n";

    if (!consultations || consultations.length === 0) {
      text += "هیچ تحلیلی یافت نشد.\n\n";

      const kb = new InlineKeyboard()
        .text("🎯 شروع", "start_consultation")
        .row()
        .text("🏠 منو", "menu");

      if (ctx.callbackQuery) {
        try {
          await ctx.editMessageText(text, { reply_markup: kb });
        } catch {
          await ctx.reply(text, { reply_markup: kb });
        }
        await ctx.answerCallbackQuery();
      } else {
        await ctx.reply(text, { reply_markup: kb });
      }
      return;
    }

    text += `تعداد: ${consultations.length}\n\n`;

    const kb = new InlineKeyboard();

    consultations.slice(0, 10).forEach((c) => {
      const label = `📊 ${c.electionType || 'تحلیل'}`;
      kb.text(label, `history_detail:${c.$id}`).row();
    });

    kb.text("🏠 منو", "menu");

    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(text, { reply_markup: kb });
      } catch {
        await ctx.reply(text, { reply_markup: kb });
      }
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(text, { reply_markup: kb });
    }
  } catch (e) {
    console.error("خطا:", e);
    await ctx.reply("خطا در بارگذاری", {
      reply_markup: new InlineKeyboard().text("🏠 منو", "menu"),
    });
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery();
    }
  }
}

async function handleHistoryDetail(ctx) {
  const consultationId = ctx.callbackQuery.data.split(":")[1];
  const userId = String(ctx.from.id);

  try {
    const consultations = await getUserConsultations(userId);
    const consultation = consultations.find((c) => c.$id === consultationId);

    if (!consultation) {
      await ctx.answerCallbackQuery("پیدا نشد");
      return;
    }

    let text = consultation.finalReport || "گزارش موجود نیست.";

    const kb = new InlineKeyboard()
      .text("« لیست", "show_history")
      .row()
      .text("🏠 منو", "menu");

    try {
      await ctx.editMessageText(text, { reply_markup: kb });
    } catch {
      await ctx.reply(text, { reply_markup: kb });
    }

    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("خطا:", e);
    await ctx.answerCallbackQuery("خطا");
  }
}

module.exports = {
  handleShowHistory,
  handleHistoryDetail,
};
