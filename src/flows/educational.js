const { InlineKeyboard } = require("grammy");

const EDUCATION_CARDS = [
  {
    id: "card1",
    emoji: "🎯",
    title: "آمادگی ذهنی",
    summary: "پایه موفقیت در کاندیداتوری",
    content: "کاندیداتوری یک مسیر پرچالش است. باید بدانید چرا می خواهید کاندیدا شوید.",
    keyPoints: ["انگیزه خود را بنویسید", "با خانواه مشورت کنید"],
    commonMistakes: ["تصمیم هیجانی", "نادیده گرفتن فشارها"],
    practicalExercises: ["یک پاراگراف بنویسید: چرا من؟"],
    proTips: ["انگیزه تان را مرور کنید"],
    relatedCards: ["card2"],
  },
  {
    id: "card2",
    emoji: "👥",
    title: "شناخت حوزه",
    summary: "قبل از کاندیداتوری، حوزه را بشناسید",
    content: "حوزه انتخابیه میدان نبرد شماست.",
    keyPoints: ["نقشه جمعیت شناسی تهیه کنید"],
    commonMistakes: ["تکیه صرف بر محبوبیت"],
    practicalExercises: ["لیست 10 مشکل حوزه"],
    proTips: ["از داده های رسمی استفاده کنید"],
    relatedCards: ["card1"],
  },
];

async function handleShowEducationList(ctx) {
  let text = "📚 آموزش کاندیداتوری\n\n";

  const kb = new InlineKeyboard();

  EDUCATION_CARDS.forEach((card) => {
    kb.text(`${card.emoji} ${card.title}`, `edu_card:${card.id}`).row();
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
}

async function handleShowEducationCard(ctx) {
  const cardId = ctx.callbackQuery.data.split(":")[1];
  const card = EDUCATION_CARDS.find((c) => c.id === cardId);

  if (!card) {
    await ctx.answerCallbackQuery("کارت پیدا نشد");
    return;
  }

  let text = `${card.emoji} ${card.title}\n\n`;
  text += `${card.summary}\n\n`;
  text += "برای مطالعه کامل، یکی از بخش ها را انتخاب کنید:";

  const kb = new InlineKeyboard()
    .text("📖 محتوا", `edu_view:${cardId}:content`)
    .row()
    .text("✅ نکات", `edu_view:${cardId}:keyPoints`)
    .row()
    .text("« لیست", "show_education")
    .text("🏠 منو", "menu");

  try {
    await ctx.editMessageText(text, { reply_markup: kb });
  } catch {
    await ctx.reply(text, { reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

async function handleEducationView(ctx) {
  const parts = ctx.callbackQuery.data.split(":");
  const cardId = parts[1];
  const view = parts[2];

  const card = EDUCATION_CARDS.find((c) => c.id === cardId);
  if (!card) {
    await ctx.answerCallbackQuery("خطا");
    return;
  }

  let text = `${card.emoji} ${card.title}\n\n`;

  if (view === "content") {
    text += card.content;
  } else if (view === "keyPoints") {
    text += "✅ نکات کلیدی:\n\n";
    card.keyPoints.forEach((p) => (text += `${p}\n`));
  }

  const kb = new InlineKeyboard()
    .text("« بازگشت", `edu_card:${cardId}`)
    .row()
    .text("🏠 منو", "menu");

  try {
    await ctx.editMessageText(text, { reply_markup: kb });
  } catch {
    await ctx.reply(text, { reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

async function handleRelatedCards(ctx) {
  await ctx.answerCallbackQuery("به زودی");
}

module.exports = {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
};
