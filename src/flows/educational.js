// src/flows/educational.js
// ─── بخش آموزش‌های تخصصی — ۸ کارت با ۵ تب محتوایی ───
// نسخه اصلاح‌شده: ۱۴۰۴/۱۲/۰۸ — اضافه شدن lastInteractionNew + بهبود UX + مدیریت خطا

const { InlineKeyboard } = require("grammy");
const { updateUser } = require("../utils/db.js");

// ─── تعریف تب‌ها ───
const VIEWS = ["summary", "keypoints", "mistakes", "exercises", "tips"];
const VIEW_LABELS = {
  summary: "📄 خلاصه",
  keypoints: "🎯 نکات کلیدی",
  mistakes: "❌ اشتباهات رایج",
  exercises: "📝 تمرین عملی",
  tips: "💡 نکات طلایی",
};

// ─── ۸ کارت آموزشی (محتوا بدون تغییر نگه داشته شد) ───
const CARDS = [ /* همان آرایه CARDS که فرستادی — بدون تغییر */ ];

// تعداد کارت‌ها
const TOTAL_CARDS = CARDS.length;

// ─── ساخت متن کارت بر اساس تب انتخاب‌شده ───
function buildCardText(card, view) {
  let t = `${card.emoji} *${card.title}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  switch (view) {
    case "keypoints":
      t += "🎯 *نکات کلیدی:*\n\n";
      card.keyPoints.forEach((p, i) => {
        t += `${i + 1}. ${p}\n\n`;
      });
      break;

    case "mistakes":
      t += "❌ *اشتباهات رایج که باید اجتناب کنید:*\n\n";
      card.commonMistakes.forEach(m => {
        t += `• ${m}\n\n`;
      });
      break;

    case "exercises":
      t += "📝 *تمرین‌های عملی برای اجرا:*\n\n";
      card.practicalExercises.forEach((e, i) => {
        t += `${i + 1}. ${e}\n\n`;
      });
      break;

    case "tips":
      t += "💡 *نکات طلایی حرفه‌ای‌ها:*\n\n";
      card.proTips.forEach(tip => {
        t += `💎 ${tip}\n\n`;
      });
      break;

    default: // summary
      // حذف عنوان تکراری از content
      const lines = card.content.split("\n");
      t += lines.slice(2).join("\n"); // از خط سوم به بعد
      break;
  }

  return t;
}

// ─── ساخت کیبورد هر کارت ───
function cardKB(cardId, currentView) {
  const kb = new InlineKeyboard();

  // ردیف اول: ۳ تب اول
  VIEWS.slice(0, 3).forEach(v => {
    const label = currentView === v ? `【${VIEW_LABELS[v]}】` : VIEW_LABELS[v];
    kb.text(label, `eduv:${cardId}:${v}`);
  });
  kb.row();

  // ردیف دوم: ۲ تب آخر
  VIEWS.slice(3).forEach(v => {
    const label = currentView === v ? `【${VIEW_LABELS[v]}】` : VIEW_LABELS[v];
    kb.text(label, `eduv:${cardId}:${v}`);
  });
  kb.row();

  // ناوبری کارت‌ها
  const idx = CARDS.findIndex(c => c.id === cardId);
  if (idx > 0) {
    kb.text("⬅️ کارت قبلی", `edu:${CARDS[idx - 1].id}`);
  }
  kb.text(`کارت ${idx + 1} از ${TOTAL_CARDS}`, "edu_noop");
  if (idx < TOTAL_CARDS - 1) {
    kb.text("کارت بعدی ➡️", `edu:${CARDS[idx + 1].id}`);
  }
  kb.row();

  // دکمه‌های ثابت
  kb.text("📚 فهرست همه موضوعات", "edu_list").row();
  kb.text("💼 بسته‌های خدماتی", "show_plans")
    .text("🔙 منوی اصلی", "menu").row();

  return kb;
}

// ─── کیبورد فهرست کارت‌ها ───
function listKB() {
  const kb = new InlineKeyboard();
  CARDS.forEach(c => {
    kb.text(`${c.emoji} ${c.title}`, `edu:${c.id}`).row();
  });
  kb.text("🔙 بازگشت به منوی اصلی", "menu").row();
  return kb;
}

// ─── هندلر نمایش فهرست آموزش‌ها ───
async function handleShowEducationList(ctx) {
  const userId = String(ctx.from.id);

  // آپدیت آخرین تعامل
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  let t = "📚 *آموزش‌های تخصصی کاندیداتوری*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += `🎓 ${TOTAL_CARDS} درس کاربردی و عملی که هر کاندیدای جدی باید بداند.\n\n`;
  t += "هر موضوع شامل:\n";
  t += "• خلاصه کاربردی\n";
  t += "• نکات کلیدی\n";
  t += "• اشتباهات رایج\n";
  t += "• تمرین‌های عملی\n";
  t += "• نکات طلایی حرفه‌ای‌ها\n\n";
  t += "موضوع مورد نظر خود را انتخاب کنید:";

  const kb = listKB();

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("خطا در نمایش لیست آموزش‌ها:", e.message);
    await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره امتحان کنید.");
  }
}

// ─── نمایش یک کارت خاص (ورود اولیه) ───
async function handleShowEducationCard(ctx, cardId) {
  const userId = String(ctx.from.id);
  const card = CARDS.find(c => c.id === cardId);

  if (!card) {
    await ctx.answerCallbackQuery({ text: "❌ موضوع یافت نشد" });
    return;
  }

  // آپدیت آخرین تعامل
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  const t = buildCardText(card, "summary");
  const kb = cardKB(cardId, "summary");

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("خطا در نمایش کارت:", e.message);
    await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره امتحان کنید.");
  }
}

// ─── تغییر تب (view) در یک کارت ───
async function handleEducationView(ctx, cardId, viewMode) {
  const userId = String(ctx.from.id);
  const card = CARDS.find(c => c.id === cardId);

  if (!card) {
    await ctx.answerCallbackQuery({ text: "❌ موضوع یافت نشد" });
    return;
  }

  // آپدیت آخرین تعامل
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  // چک ساده برای تب معتبر
  if (!VIEWS.includes(viewMode)) viewMode = "summary";

  const t = buildCardText(card, viewMode);
  const kb = cardKB(cardId, viewMode);

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("خطا در تغییر تب آموزش:", e.message);
    await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره امتحان کنید.");
  }
}

// ─── بازگشت به فهرست (related یا noop) ───
async function handleRelatedCards(ctx, cardId) {
  await handleShowEducationList(ctx);
}

module.exports = {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
};
