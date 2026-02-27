// src/flows/educational.js — CommonJS
// ۸ کارت آموزشی با ۶ تب

const { InlineKeyboard } = require("grammy");

const CARDS = [
  {
    id: 0, emoji: "📢", title: "ساخت شعار انتخاباتی",
    keyPoints: ["حداکثر ۷ کلمه", "ملموس نه انتزاعی", "احساسی", "باورپذیر", "متمایز از رقبا"],
    commonMistakes: ["کلی و تکراری: «توسعه و پیشرفت»", "کپی از سیاست ملی", "خیلی طولانی", "وعده غیرممکن"],
    practicalExercises: ["شعار بنویسید و به ۱۰ نفر نشان دهید", "شعار رقبا را بررسی کنید", "۳ نسخه مختلف بنویسید"],
    proTips: ["شعار درباره مردم باشد نه خودتان", "اگر نیاز به توضیح دارد، خوب نیست"],
    content: "📢 *ساخت شعار*\n━━━━━━━━━━━━━━━━━━━\n\n✅ «هر محله، یک پارک»\n❌ «تلاش برای آبادانی»\n\n💡 ۷ کلمه | ملموس | احساسی | باورپذیر",
  },
  {
    id: 1, emoji: "🎤", title: "سخنرانی و مناظره",
    keyPoints: ["با داستان شروع کنید", "فقط ۳ پیام", "ساده حرف بزنید", "تماس چشمی", "مکث بعد از جملات مهم", "قوی تمام کنید"],
    commonMistakes: ["خواندن از روی کاغذ", "بیش از ۱۵ دقیقه", "عصبانیت در مناظره"],
    practicalExercises: ["۳ دقیقه تمرین کنید ۱۰ بار", "خود را فیلم بگیرید", "از دوست نقد بخواهید"],
    proTips: ["در مناظره هرگز عصبانی نشوید", "۵ دقیقه تنفس عمیق قبل از سخنرانی"],
    content: "🎤 *سخنرانی مؤثر*\n━━━━━━━━━━━━━━━━━━━\n\n1️⃣ داستان\n2️⃣ ۳ پیام\n3️⃣ ساده\n4️⃣ تماس چشمی\n5️⃣ مکث\n6️⃣ پایان قوی",
  },
  {
    id: 2, emoji: "👥", title: "ساخت تیم انتخاباتی",
    keyPoints: ["هیچ‌کس تنها برنده نمی‌شود", "۱۰ متعهد > ۱۰۰ بی‌تفاوت", "نقش‌ها مکتوب باشند"],
    commonMistakes: ["فامیل بدون صلاحیت", "بدون جلسات منظم", "اعتماد بی‌حد به یک نفر"],
    practicalExercises: ["لیست ۲۰ نفر قابل اعتماد", "برای هر نفر نقش تعیین کنید", "جلسه آزمایشی ۳۰ دقیقه"],
    proTips: ["مدیر ستاد مهم‌ترین انتخاب شماست", "محرمانگی اطلاعات حیاتی است"],
    content: "👥 *تیم انتخاباتی*\n━━━━━━━━━━━━━━━━━━━\n\n🎯 مدیر ستاد\n📱 مسئول فضای مجازی\n🤝 رابطین محلی\n📊 مسئول اطلاعات",
  },
  {
    id: 3, emoji: "🛡️", title: "مدیریت بحران و شایعات",
    keyPoints: ["سکوت = تأیید", "آرام و مستند پاسخ دهید", "از معتمدین استفاده کنید"],
    commonMistakes: ["واکنش عصبانی", "سکوت طولانی", "حمله متقابل"],
    practicalExercises: ["لیست ۱۰ حمله احتمالی بنویسید", "پاسخ مستند آماده کنید", "۳ معتمد آماده‌باش داشته باشید"],
    proTips: ["هرگز اول حمله نکنید", "بحران‌ها ۴۸–۷۲ ساعت عمر دارند"],
    content: "🛡️ *مدیریت بحران*\n━━━━━━━━━━━━━━━━━━━\n\n1️⃣ شناسایی سریع\n2️⃣ ارزیابی\n3️⃣ پاسخ مستند\n4️⃣ انتشار از معتمدین\n5️⃣ پیگیری حقوقی\n6️⃣ بازگشت به پیام اصلی",
  },
  {
    id: 4, emoji: "📍", title: "استراتژی تبلیغات محلی",
    keyPoints: ["حضوری > آنلاین > چاپی", "هر دیدار خانگی ≈ ۲–۳ رأی", "هفته آخر = ۱۰۰٪ حضوری"],
    commonMistakes: ["فقط فضای مجازی", "اسپم گروه‌ها", "تراکت شلوغ"],
    practicalExercises: ["نقشه حوزه بکشید", "بودجه تقسیم کنید", "برنامه هفتگی بنویسید"],
    proTips: ["بنر فقط در ۵ نقطه اصلی", "کارت ویزیت بهتر از تراکت"],
    content: "📍 *تبلیغات محلی*\n━━━━━━━━━━━━━━━━━━━\n\n├ ۵۰٪ حضوری\n├ ۳۰٪ آنلاین\n└ ۲۰٪ چاپی\n\n💡 هفته آخر = فقط حضوری",
  },
  {
    id: 5, emoji: "⚔️", title: "تحلیل رقبا",
    keyPoints: ["بدون شناخت رقبا پیروزی شانسی است", "مزیت رقابتی = چیزی که فقط شما دارید"],
    commonMistakes: ["تخریب شخصی", "دست‌کم‌گرفتن رقبا", "تقلید از رقیب"],
    practicalExercises: ["جدول رقبا پر کنید", "مزیت خود را در یک جمله بنویسید"],
    proTips: ["روی ۱–۲ رقیب اصلی تمرکز کنید", "غیرمستقیم تفاوت نشان دهید"],
    content: "⚔️ *تحلیل رقبا*\n━━━━━━━━━━━━━━━━━━━\n\n«چه چیزی فقط من دارم؟»\n\n✅ مزیت خود تمرکز\n❌ هرگز تخریب شخصی",
  },
  {
    id: 6, emoji: "📊", title: "روز رأی‌گیری و شمارش",
    keyPoints: ["هر شعبه ۱ نماینده آموزش‌دیده", "تخلفات را مستند کنید", "صورتجلسه را دقیق بخوانید"],
    commonMistakes: ["شعبه بدون نماینده", "درگیری فیزیکی", "امضا بدون خواندن"],
    practicalExercises: ["لیست شعب بنویسید", "برای هر شعبه نماینده تعیین کنید", "جلسه توجیهی برگزار کنید"],
    proTips: ["پاوربانک فراموش نشود", "از صورتجلسه عکس بگیرید"],
    content: "📊 *روز رأی‌گیری*\n━━━━━━━━━━━━━━━━━━━\n\n☐ نمایندگان ۱ ساعت قبل\n☐ بررسی صندوق خالی\n☐ گزارش ساعتی\n☐ مستندسازی تخلف\n☐ عکس صورتجلسه",
  },
  {
    id: 7, emoji: "🧠", title: "روانشناسی رأی‌دهنده",
    keyPoints: ["اعتماد ۴۰٪ | قومیت ۲۵٪ | معتمدین ۲۰٪ | برنامه ۱۰٪ | ظاهر ۵٪"],
    commonMistakes: ["فقط وعده بدون اعتمادسازی", "نادیده‌گرفتن بافت قومی", "لباس نامتناسب"],
    practicalExercises: ["لیست ۱۰ معتمد کلیدی بنویسید", "بافت قومی حوزه تحلیل کنید"],
    proTips: ["اسم افراد را حفظ کنید", "گوش بدهید بیشتر از حرف‌زدن"],
    content: "🧠 *روانشناسی رأی‌دهنده*\n━━━━━━━━━━━━━━━━━━━\n\n🥇 اعتماد ۴۰٪\n🥈 قومیت ۲۵٪\n🥉 معتمدین ۲۰٪\n4️⃣ برنامه ۱۰٪\n5️⃣ ظاهر ۵٪\n\n💡 اعتمادسازی > وعده‌دادن",
  },
];

const TOTAL_CARDS = CARDS.length;
const VIEWS = ["summary", "keypoints", "mistakes", "exercises", "tips"];
const VIEW_LABELS = { summary: "📄 خلاصه", keypoints: "🎯 نکات", mistakes: "❌ اشتباهات", exercises: "📝 تمرین", tips: "💡 طلایی" };

function buildCardText(card, view) {
  let t = `${card.emoji} *${card.title}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  switch (view) {
    case "keypoints": t += "🎯 *نکات کلیدی:*\n\n"; card.keyPoints.forEach((p, i) => { t += `${i + 1}. ${p}\n`; }); break;
    case "mistakes": t += "❌ *اشتباهات رایج:*\n\n"; card.commonMistakes.forEach((m) => { t += `• ${m}\n`; }); break;
    case "exercises": t += "📝 *تمرین عملی:*\n\n"; card.practicalExercises.forEach((e, i) => { t += `${i + 1}. ${e}\n`; }); break;
    case "tips": t += "💡 *نکات طلایی:*\n\n"; card.proTips.forEach((tip) => { t += `💎 ${tip}\n\n`; }); break;
    default: t += card.content.split("\n").slice(2).join("\n"); break;
  }
  return t;
}

function cardKB(cardId, currentView) {
  const kb = new InlineKeyboard();
  // تب‌ها
  for (const v of VIEWS) {
    const label = currentView === v ? `[${VIEW_LABELS[v]}]` : VIEW_LABELS[v];
    kb.text(label, `eduv:${cardId}:${v}`);
    if (v === "mistakes") kb.row(); // شکستن ردیف
  }
  kb.row();
  // ناوبری
  const idx = CARDS.findIndex((c) => c.id === cardId);
  if (idx > 0) kb.text("⬅️ قبلی", `edu:${CARDS[idx - 1].id}`);
  kb.text(`${idx + 1}/${TOTAL_CARDS}`, "edu_noop");
  if (idx < TOTAL_CARDS - 1) kb.text("بعدی ➡️", `edu:${CARDS[idx + 1].id}`);
  kb.row();
  kb.text("📚 فهرست", "edu_list").row();
  kb.text("💼 بسته‌ها", "show_plans").text("🔙 منو", "menu").row();
  return kb;
}

function listKB() {
  const kb = new InlineKeyboard();
  for (const c of CARDS) kb.text(`${c.emoji} ${c.title}`, `edu:${c.id}`).row();
  kb.text("🔙 منو", "menu").row();
  return kb;
}

async function handleShowEducationList(ctx) {
  let t = "📚 *آموزش‌های تخصصی*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  for (const c of CARDS) t += `${c.emoji} ${c.title}\n`;
  t += "\n💡 _هر کارت: خلاصه + نکات + اشتباهات + تمرین + نکات طلایی_";
  const kb = listKB();
  if (ctx.callbackQuery) { try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } await ctx.answerCallbackQuery(); }
  else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleShowEducationCard(ctx, cardId) {
  const card = CARDS.find((c) => c.id === cardId);
  if (!card) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }
  const t = buildCardText(card, "summary"); const kb = cardKB(cardId, "summary");
  if (ctx.callbackQuery) { try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } await ctx.answerCallbackQuery(); }
  else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleEducationView(ctx, cardId, viewMode) {
  const card = CARDS.find((c) => c.id === cardId);
  if (!card) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }
  const t = buildCardText(card, viewMode); const kb = cardKB(cardId, viewMode);
  if (ctx.callbackQuery) { try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } await ctx.answerCallbackQuery(); }
  else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleRelatedCards(ctx, cardId) {
  // ساده — فقط لیست نمایش بده
  await handleShowEducationList(ctx);
}

module.exports = { handleShowEducationList, handleShowEducationCard, handleEducationView, handleRelatedCards };
