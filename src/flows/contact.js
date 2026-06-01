const { InlineKeyboard } = require("grammy");

async function handleAboutUs(ctx) {
  const text =
    "ℹ️ درباره کاندیداتوری\n\n" +
    "نخستین سامانه تحلیل آمادگی کاندیداتوری در ایران\n\n" +
    "ما کمک می کنیم کاندیداها با ابزارهای هوشمند، شانس موفقیت خود را افزایش دهند.\n\n" +
    "📊 خدمات:\n" +
    "• تحلیل آمادگی\n" +
    "• مشاوره استراتژیک\n" +
    "• آموزش تخصصی\n\n" +
    "تلگرام: @candidatoryiran_bot";

  const kb = new InlineKeyboard()
    .url("🌐 وب سایت", "https://candidatory.ir")
    .row()
    .text("« بازگشت", "menu");

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
}

async function handleContactUs(ctx) {
  const text =
    "📞 راه های ارتباطی\n\n" +
    "📱 تلگرام:\n" +
    "@candidatory_support\n\n" +
    "📧 ایمیل:\n" +
    "support@candidatory.ir\n\n" +
    "⏰ ساعات پاسخگویی:\n" +
    "شنبه تا پنج شنبه: 9 - 18\n\n" +
    "همین الان پیام خود را ارسال کنید.";

  const kb = new InlineKeyboard()
    .url("📱 پشتیبانی", "https://t.me/candidatory_support")
    .row()
    .text("« بازگشت", "menu");

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
}

async function handleSampleReports(ctx) {
  const text =
    "📊 نمونه تحلیل ها\n\n" +
    "🟢 نمونه 1: شورای شهر اصفهان\n" +
    "امتیاز: 105/125\n" +
    "نتیجه: برنده\n\n" +
    "🟢 نمونه 2: شورای روستا\n" +
    "امتیاز: 58/125\n" +
    "نتیجه: برنده با مشاوره\n\n" +
    "شما هم می توانید شانس خود را افزایش دهید.\n\n" +
    "همین حالا شروع کنید!";

  const kb = new InlineKeyboard()
    .text("🎯 شروع", "start_consultation")
    .row()
    .text("« بازگشت", "menu");

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
}

module.exports = {
  handleAboutUs,
  handleContactUs,
  handleSampleReports,
};
