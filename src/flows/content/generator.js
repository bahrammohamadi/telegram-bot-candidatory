// src/flows/content/generator.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// مرحله ۸ — تولید محتوای انتخاباتی (Content Generator)
// ═══════════════════════════════════════════════════════════════
// قابلیت‌ها:
//   ۱) تولید پست تبلیغاتی (شبکه‌های اجتماعی)
//   ۲) متن سخنرانی (افتتاحیه/جمع‌بندی/مناظره)
//   ۳) شعار انتخاباتی
//   ۴) متن پیامک تبلیغاتی (SMS کوتاه ۱۶۰ کاراکتری)
//   ۵) بیانیه رسمی (پاسخ به خبر/بحران/موضع‌گیری)
//   ۶) متن بنر و پوستر
//
// State اختصاصی: currentStep از 950 تا 999 برای جلوگیری از تداخل
// با onboarding (500+), readiness (600+), swot (700+), rivals (800+),
// promises (850+) و crisis (900+).
//
// دسترسی: نیاز به پلن starter (با درجه‌بندی برای انواع پیشرفته‌تر)
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser, updateUser } = require("../../utils/db.js");
const { requireAccess } = require("../../utils/access.js");
const { contentMenuKB } = require("../../utils/keyboard.js");
const { generateAI, isAIConfigured } = require("../../utils/ai.js");
const {
  postPrompt, speechPrompt, sloganPrompt,
  smsPrompt, statementPrompt, bannerPrompt,
} = require("../../utils/ai-prompts.js");

// نگاشت نوع محتوا → سازنده‌ی prompt
const AI_PROMPT_BUILDERS = {
  post:      postPrompt,
  speech:    speechPrompt,
  slogan:    sloganPrompt,
  sms:       smsPrompt,
  statement: statementPrompt,
  banner:    bannerPrompt,
};

// ───────────────────────────────────────────────────────────────
// محدوده‌ی State
// ───────────────────────────────────────────────────────────────
const STATE_BASE = 950;
const STATE_RANGE = { min: 950, max: 999 };

// نقشه‌ی currentStep ← (type, stepIndex)
//   950..959  → post           (پست شبکه اجتماعی)   ۵ سؤال
//   960..969  → speech         (سخنرانی)            ۵ سؤال
//   970..974  → slogan         (شعار)               ۳ سؤال
//   975..979  → sms            (پیامک)              ۳ سؤال
//   980..989  → statement      (بیانیه رسمی)        ۴ سؤال
//   990..999  → banner         (بنر و پوستر)        ۴ سؤال
const STATE_MAP = {
  post:      { start: 950, count: 5 },
  speech:    { start: 960, count: 5 },
  slogan:    { start: 970, count: 3 },
  sms:       { start: 975, count: 3 },
  statement: { start: 980, count: 4 },
  banner:    { start: 990, count: 4 },
};

// ───────────────────────────────────────────────────────────────
// تعریف انواع محتوا
// ───────────────────────────────────────────────────────────────
const CONTENT_TYPES = {
  post: {
    id: "post",
    emoji: "📱",
    title: "پست شبکه اجتماعی",
    feature: "content_post",
    description: "پست حرفه‌ای برای اینستاگرام، توییتر، تلگرام",
    questions: [
      {
        key: "platform",
        text: "📍 *پلتفرم مقصد*\nمحتوا برای کدام شبکه ساخته شود؟",
        options: [
          { id: "instagram", label: "📷 اینستاگرام" },
          { id: "twitter",   label: "🐦 توییتر / X" },
          { id: "telegram",  label: "✈️ تلگرام" },
          { id: "all",       label: "🌐 همه (نسخه عمومی)" },
        ],
      },
      {
        key: "topic",
        text: "📝 *موضوع پست*\nموضوع اصلی را در یک جمله بنویسید:\n_مثال: معرفی برنامه اشتغال جوانان_",
        type: "text",
        validate: (v) => v.length >= 3 && v.length <= 200,
        error: "موضوع باید بین ۳ تا ۲۰۰ کاراکتر باشد.",
      },
      {
        key: "tone",
        text: "🎭 *لحن محتوا*",
        options: [
          { id: "formal",      label: "🎩 رسمی و متین" },
          { id: "friendly",    label: "🤝 صمیمی و مردمی" },
          { id: "passionate",  label: "🔥 پرشور و انگیزشی" },
          { id: "analytical",  label: "📊 تحلیلی و مستند" },
        ],
      },
      {
        key: "cta",
        text: "🎯 *فراخوان (Call-to-Action)*\nاز مخاطب چه می‌خواهید؟",
        options: [
          { id: "follow",   label: "👥 دنبال کردن" },
          { id: "share",    label: "🔁 بازنشر" },
          { id: "comment",  label: "💬 نظر دادن" },
          { id: "join",     label: "🤝 پیوستن به ستاد" },
          { id: "vote",     label: "🗳 رأی دادن" },
        ],
      },
      {
        key: "hashtags",
        text: "🏷 *هشتگ‌های دلخواه*\nهشتگ‌های خود را با فاصله جدا کنید\n_مثال: انتخابات کاندیدای_مردم تغییر_\n(یا «-» اگر هشتگ نمی‌خواهید)",
        type: "text",
        validate: (v) => v.length >= 1 && v.length <= 300,
        error: "حداکثر ۳۰۰ کاراکتر.",
      },
    ],
  },
  speech: {
    id: "speech",
    emoji: "🎤",
    title: "متن سخنرانی",
    feature: "content_speech",
    description: "سخنرانی افتتاحیه، جمع‌بندی، مناظره",
    questions: [
      {
        key: "kind",
        text: "🎤 *نوع سخنرانی*",
        options: [
          { id: "opening",    label: "🚀 افتتاحیه کمپین" },
          { id: "rally",      label: "📢 گردهمایی مردمی" },
          { id: "debate",     label: "⚔️ مناظره" },
          { id: "closing",    label: "🏁 جمع‌بندی پایانی" },
          { id: "victory",    label: "🏆 پیروزی" },
        ],
      },
      {
        key: "audience",
        text: "👥 *مخاطب اصلی*",
        options: [
          { id: "youth",      label: "🎓 جوانان" },
          { id: "workers",    label: "🔧 کارگران و کسبه" },
          { id: "women",      label: "💗 بانوان" },
          { id: "elders",     label: "🌳 پیشکسوتان" },
          { id: "general",    label: "👨‍👩‍👧‍👦 عموم مردم" },
        ],
      },
      {
        key: "duration",
        text: "⏱ *مدت زمان سخنرانی*",
        options: [
          { id: "short",   label: "⚡ کوتاه (۲–۳ دقیقه)" },
          { id: "medium",  label: "🕐 متوسط (۵–۷ دقیقه)" },
          { id: "long",    label: "📜 بلند (۱۰–۱۵ دقیقه)" },
        ],
      },
      {
        key: "mainMessage",
        text: "💡 *پیام اصلی*\nمهم‌ترین جمله‌ای که می‌خواهید در ذهن مخاطب بماند:",
        type: "text",
        validate: (v) => v.length >= 10 && v.length <= 300,
        error: "بین ۱۰ تا ۳۰۰ کاراکتر بنویسید.",
      },
      {
        key: "promises",
        text: "✅ *۳ وعده‌ی کلیدی*\nوعده‌های اصلی را با خط جدید جدا کنید:\n_مثال:_\n_۱) اشتغال جوانان_\n_۲) مسکن ارزان_\n_۳) سلامت رایگان_",
        type: "text",
        validate: (v) => v.length >= 10 && v.length <= 500,
        error: "بین ۱۰ تا ۵۰۰ کاراکتر.",
      },
    ],
  },
  slogan: {
    id: "slogan",
    emoji: "💬",
    title: "شعار انتخاباتی",
    feature: "content_slogan",
    description: "شعار کوتاه و ماندگار برای کمپین",
    questions: [
      {
        key: "value",
        text: "💎 *ارزش محوری شما*\nمهم‌ترین ارزشی که نماینده‌اش هستید چیست؟",
        options: [
          { id: "change",      label: "🌅 تغییر و نوسازی" },
          { id: "experience",  label: "🎓 تجربه و دانش" },
          { id: "trust",       label: "🤝 اعتماد و صداقت" },
          { id: "progress",    label: "🚀 پیشرفت و توسعه" },
          { id: "justice",     label: "⚖️ عدالت و انصاف" },
          { id: "unity",       label: "🇮🇷 وحدت و همدلی" },
        ],
      },
      {
        key: "style",
        text: "🎨 *سبک شعار*",
        options: [
          { id: "short",       label: "⚡ ضربه‌ای (۲–۳ کلمه)" },
          { id: "rhythmic",    label: "🎵 وزنی و آهنگین" },
          { id: "promise",     label: "🎯 وعده‌محور" },
          { id: "question",    label: "❓ پرسشی" },
        ],
      },
      {
        key: "keyword",
        text: "🔑 *کلیدواژه دلخواه*\nاگر کلمه‌ای هست که حتماً باید در شعار باشد بنویسید\n_مثال: نام منطقه، نام خودتان، یا کلمه‌ای خاص_\n(یا «-» اگر مهم نیست)",
        type: "text",
        validate: (v) => v.length >= 1 && v.length <= 80,
        error: "حداکثر ۸۰ کاراکتر.",
      },
    ],
  },
  sms: {
    id: "sms",
    emoji: "📨",
    title: "پیامک تبلیغاتی",
    feature: "content_sms",
    description: "متن کوتاه ۱۶۰ کاراکتری برای ارسال انبوه",
    questions: [
      {
        key: "purpose",
        text: "🎯 *هدف پیامک*",
        options: [
          { id: "intro",       label: "👋 معرفی اولیه" },
          { id: "invite",      label: "📅 دعوت به جلسه" },
          { id: "reminder",    label: "🔔 یادآوری رأی‌گیری" },
          { id: "thanks",      label: "🙏 تشکر" },
          { id: "answer",      label: "💬 پاسخ به ابهام" },
        ],
      },
      {
        key: "detail",
        text: "📝 *جزئیات کلیدی*\nاطلاعات ضروری (مثل تاریخ، مکان، نام، شماره)\n_مثال: شنبه ۲۰ تیر، مسجد جامع_",
        type: "text",
        validate: (v) => v.length >= 3 && v.length <= 120,
        error: "بین ۳ تا ۱۲۰ کاراکتر.",
      },
      {
        key: "signature",
        text: "✍️ *امضای انتها*\nچه چیزی در انتها بیاید؟",
        options: [
          { id: "name",        label: "👤 فقط نام" },
          { id: "name_code",   label: "🔢 نام + کد انتخاباتی" },
          { id: "campaign",    label: "📛 نام ستاد" },
          { id: "none",        label: "🚫 بدون امضا" },
        ],
      },
    ],
  },
  statement: {
    id: "statement",
    emoji: "📜",
    title: "بیانیه رسمی",
    feature: "content_statement",
    description: "پاسخ به خبر، موضع‌گیری، اطلاعیه",
    questions: [
      {
        key: "occasion",
        text: "📌 *موضوع بیانیه*",
        options: [
          { id: "response",    label: "💬 پاسخ به انتقاد/خبر" },
          { id: "position",    label: "🧭 موضع‌گیری سیاسی" },
          { id: "crisis",      label: "🚨 پاسخ به بحران" },
          { id: "announce",    label: "📣 اعلام تصمیم/برنامه" },
          { id: "condolence",  label: "🕊 تسلیت/تبریک" },
        ],
      },
      {
        key: "subject",
        text: "📝 *موضوع دقیق*\nموضوع را در یک پاراگراف توضیح دهید:",
        type: "text",
        validate: (v) => v.length >= 10 && v.length <= 500,
        error: "بین ۱۰ تا ۵۰۰ کاراکتر.",
      },
      {
        key: "stance",
        text: "🎯 *موضع شما*",
        options: [
          { id: "support",     label: "✅ حمایت / تأیید" },
          { id: "oppose",      label: "❌ مخالفت / رد" },
          { id: "neutral",     label: "⚖️ بی‌طرف / تحلیلی" },
          { id: "clarify",     label: "💡 شفاف‌سازی" },
        ],
      },
      {
        key: "tone",
        text: "🎭 *لحن بیانیه*",
        options: [
          { id: "calm",        label: "🧘 آرام و متین" },
          { id: "firm",        label: "💪 قاطع و محکم" },
          { id: "emotional",   label: "❤️ احساسی و انسانی" },
          { id: "legal",       label: "⚖️ حقوقی و رسمی" },
        ],
      },
    ],
  },
  banner: {
    id: "banner",
    emoji: "🖼",
    title: "متن بنر و پوستر",
    feature: "content_banner",
    description: "متن کوتاه و چشم‌گیر برای بنر فیزیکی یا دیجیتال",
    questions: [
      {
        key: "kind",
        text: "🖼 *نوع بنر*",
        options: [
          { id: "street",      label: "🛣 بنر خیابانی بزرگ" },
          { id: "poster",      label: "📄 پوستر کوچک" },
          { id: "digital",     label: "💻 بنر دیجیتال (وب)" },
          { id: "stage",       label: "🎤 بک‌دراپ سن" },
        ],
      },
      {
        key: "headline",
        text: "🔠 *تیتر اصلی*\nمتنی که از دور باید خوانده شود\n_مثال: «صدای واقعی مردم»_",
        type: "text",
        validate: (v) => v.length >= 3 && v.length <= 60,
        error: "بین ۳ تا ۶۰ کاراکتر.",
      },
      {
        key: "subline",
        text: "📋 *زیرتیتر / توضیح کوتاه*\nیک خط توضیحی (یا «-»)",
        type: "text",
        validate: (v) => v.length >= 1 && v.length <= 100,
        error: "حداکثر ۱۰۰ کاراکتر.",
      },
      {
        key: "contact",
        text: "📞 *اطلاعات تماس*\nچه چیزی در پایین بنر بیاید؟",
        options: [
          { id: "code",        label: "🔢 کد انتخاباتی" },
          { id: "social",      label: "📱 آی‌دی شبکه اجتماعی" },
          { id: "phone",       label: "☎️ شماره ستاد" },
          { id: "all",         label: "📚 همه (کامل)" },
        ],
      },
    ],
  },
};

// ───────────────────────────────────────────────────────────────
// کمکی‌ها
// ───────────────────────────────────────────────────────────────

/** نوع محتوای فعلی کاربر را از روی currentStep تشخیص می‌دهد */
function detectTypeFromStep(step) {
  if (typeof step !== "number") return null;
  for (const [type, cfg] of Object.entries(STATE_MAP)) {
    if (step >= cfg.start && step < cfg.start + cfg.count) {
      return { type, index: step - cfg.start };
    }
  }
  return null;
}

/** آیا currentStep در محدوده تولید محتواست؟ */
function isInContentRange(step) {
  return typeof step === "number" && step >= STATE_RANGE.min && step <= STATE_RANGE.max;
}

/** پارس امن tempAnswers */
function parseAnswers(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** ساخت کیبورد گزینه‌ها */
function buildOptionsKB(typeId, qKey, options) {
  const kb = new InlineKeyboard();
  options.forEach((opt, i) => {
    kb.text(opt.label, `content:ans:${typeId}:${qKey}:${opt.id}`);
    if ((i + 1) % 1 === 0) kb.row();
  });
  kb.text("❌ انصراف", "content:cancel").row();
  return kb;
}

/** کیبورد بعد از تولید نهایی */
function buildAfterFinalKB(typeId) {
  return new InlineKeyboard()
    .text("🔁 تولید دوباره (نسخه جدید)", `content:start:${typeId}`).row()
    .text("📝 نوع دیگر محتوا", "content:menu").row()
    .text("🏠 منوی اصلی", "menu");
}

// ───────────────────────────────────────────────────────────────
// نمایش منوی اصلی تولید محتوا
// ───────────────────────────────────────────────────────────────
async function handleContentMenu(ctx) {
  // منو همیشه نمایش داده می‌شود؛ آیتم‌های قفل با برچسب پلنِ لازم مشخص می‌شوند
  // تا کاربر بداند هر مورد به کدام بسته نیاز دارد و چرا قفل است.
  const { featureLockInfo } = require("../../utils/access.js");

  const items = [
    { feature: "content_post",      label: "📱 پست شبکه اجتماعی" },
    { feature: "content_speech",    label: "🎤 متن سخنرانی" },
    { feature: "content_slogan",    label: "💬 شعار انتخاباتی" },
    { feature: "content_sms",       label: "📨 پیامک تبلیغاتی" },
    { feature: "content_statement", label: "📜 بیانیه رسمی" },
    { feature: "content_banner",    label: "🖼 متن بنر و پوستر" },
  ];
  const typeOf = {
    content_post: "post", content_speech: "speech", content_slogan: "slogan",
    content_sms: "sms", content_statement: "statement", content_banner: "banner",
  };

  const text =
    "✍️ *تولید محتوای انتخاباتی*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "با کمک هوش مصنوعی، محتوای حرفه‌ای برای کمپین خود بسازید.\n\n" +
    "_موارد دارای 🔒 با ارتقای بسته فعال می‌شوند._\n\n" +
    "یکی را انتخاب کنید:";

  const kb = new InlineKeyboard();
  for (const it of items) {
    const lock = await featureLockInfo(ctx, it.feature);
    kb.text(`${it.label}${lock.badge}`, `content:start:${typeOf[it.feature]}`).row();
  }
  kb.text("💼 مشاهده بسته‌ها", "show_plans").row();
  kb.text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// شروع یک نوع محتوا
// ───────────────────────────────────────────────────────────────
async function handleStartType(ctx, typeId) {
  const cfg = CONTENT_TYPES[typeId];
  if (!cfg) {
    await ctx.answerCallbackQuery({ text: "نوع نامعتبر", show_alert: true });
    return;
  }

  // بررسی دسترسی اختصاصی این نوع
  const access = await requireAccess(ctx, cfg.feature);
  if (!access) return;

  const userId = String(ctx.from.id);
  const state = STATE_MAP[typeId];

  // پاک کردن پاسخ‌های قبلی این نوع و ست کردن state اول
  await updateUser(userId, {
    currentStep: state.start,
    tempAnswers: JSON.stringify({ __contentType: typeId }),
  });

  await showQuestion(ctx, typeId, 0);
}

// ───────────────────────────────────────────────────────────────
// نمایش سؤال بر اساس index
// ───────────────────────────────────────────────────────────────
async function showQuestion(ctx, typeId, index) {
  const cfg = CONTENT_TYPES[typeId];
  if (!cfg) return;
  const q = cfg.questions[index];
  if (!q) return finalizeContent(ctx, typeId);

  const header =
    `${cfg.emoji} *${cfg.title}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📍 سؤال ${index + 1} از ${cfg.questions.length}\n\n`;

  const body = header + q.text;

  let kb;
  if (q.options) {
    kb = buildOptionsKB(typeId, q.key, q.options);
  } else {
    // سؤال متنی → فقط دکمه انصراف
    kb = new InlineKeyboard().text("❌ انصراف", "content:cancel");
  }

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(body, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(body, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(body, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// ذخیره پاسخ گزینه‌ای و رفتن به سؤال بعد
// ───────────────────────────────────────────────────────────────
async function handleAnswer(ctx, typeId, qKey, optionId) {
  const userId = String(ctx.from.id);
  const cfg = CONTENT_TYPES[typeId];
  if (!cfg) {
    await ctx.answerCallbackQuery({ text: "نوع نامعتبر", show_alert: true });
    return;
  }

  const qIndex = cfg.questions.findIndex((q) => q.key === qKey);
  if (qIndex === -1) {
    await ctx.answerCallbackQuery({ text: "سؤال نامعتبر", show_alert: true });
    return;
  }

  const opt = cfg.questions[qIndex].options?.find((o) => o.id === optionId);
  if (!opt) {
    await ctx.answerCallbackQuery({ text: "گزینه نامعتبر", show_alert: true });
    return;
  }

  const user = await getOrCreateUser(userId, {});
  const answers = parseAnswers(user.tempAnswers);
  answers[qKey] = { id: opt.id, label: opt.label };
  answers.__contentType = typeId;

  const nextStep = STATE_MAP[typeId].start + qIndex + 1;
  await updateUser(userId, {
    currentStep: nextStep,
    tempAnswers: JSON.stringify(answers),
  });

  await showQuestion(ctx, typeId, qIndex + 1);
}

// ───────────────────────────────────────────────────────────────
// دریافت پاسخ متنی (از onMessage در main.js صدا زده می‌شود)
// خروجی: true یعنی پیام را خوردیم؛ false یعنی به فلوهای دیگر بدهید.
// ───────────────────────────────────────────────────────────────
async function handleTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const step = user.currentStep;

  if (!isInContentRange(step)) return false;

  const detected = detectTypeFromStep(step);
  if (!detected) return false;

  const { type: typeId, index } = detected;
  const cfg = CONTENT_TYPES[typeId];
  if (!cfg) return false;

  const q = cfg.questions[index];
  if (!q || q.options) {
    // باید گزینه می‌زد، نه متن
    await ctx.reply("⚠️ لطفاً از دکمه‌های زیر پیام قبلی استفاده کنید.");
    return true;
  }

  const text = (ctx.message?.text || "").trim();
  if (!text) {
    await ctx.reply("⚠️ متن خالی است. لطفاً پاسخ خود را بنویسید.");
    return true;
  }

  if (typeof q.validate === "function" && !q.validate(text)) {
    await ctx.reply(`⚠️ ${q.error || "ورودی نامعتبر است."}`);
    return true;
  }

  const answers = parseAnswers(user.tempAnswers);
  answers[q.key] = text;
  answers.__contentType = typeId;

  const nextStep = STATE_MAP[typeId].start + index + 1;
  await updateUser(userId, {
    currentStep: nextStep,
    tempAnswers: JSON.stringify(answers),
  });

  await showQuestion(ctx, typeId, index + 1);
  return true;
}

// ───────────────────────────────────────────────────────────────
// انصراف
// ───────────────────────────────────────────────────────────────
async function handleCancel(ctx) {
  const userId = String(ctx.from.id);
  await updateUser(userId, { currentStep: null, tempAnswers: "{}" });

  const text = "❌ تولید محتوا لغو شد.";
  const kb = new InlineKeyboard()
    .text("✍️ شروع دوباره", "content:menu").row()
    .text("🏠 منوی اصلی", "menu");

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

// ───────────────────────────────────────────────────────────────
// تولید نهایی متن (نسخه قاعده‌محور — بدون نیاز به API خارجی)
// در صورت اتصال LLM، فقط همین تابع را عوض کنید.
// ───────────────────────────────────────────────────────────────
function generatePost(a, profile) {
  const platform = a.platform?.id || "all";
  const tone     = a.tone?.id || "friendly";
  const cta      = a.cta?.id || "share";
  const topic    = a.topic || "موضوع کمپین";
  const tags     = (a.hashtags && a.hashtags !== "-") ? a.hashtags : "";

  const opener = {
    formal:     "🎩 هم‌میهنان گرامی،",
    friendly:   "🤝 دوستان عزیز،",
    passionate: "🔥 امروز روز تغییر است!",
    analytical: "📊 بر اساس آخرین داده‌ها،",
  }[tone];

  const ctaText = {
    follow:  "👥 ما را در [پلتفرم] دنبال کنید.",
    share:   "🔁 اگر شما هم باور دارید، این پست را برای دوستانتان بفرستید.",
    comment: "💬 نظر شما برای ما ارزشمند است؛ در کامنت بنویسید.",
    join:    "🤝 به ستاد ما بپیوندید و بخشی از تغییر باشید.",
    vote:    "🗳 رأی شما، صدای فردای ماست.",
  }[cta];

  const platformNote = {
    instagram: "📷 (بهینه‌شده برای اینستاگرام؛ ۱۲۰۰×۱۲۰۰ پیشنهاد می‌شود)",
    twitter:   "🐦 (در صورت بلند بودن، به Thread تبدیل کنید)",
    telegram:  "✈️ (برای کانال تلگرام، با عکس بنر همراه کنید)",
    all:       "🌐 (قابل استفاده در همه پلتفرم‌ها)",
  }[platform];

  const candidateName = profile?.fullName || "کاندیدای شما";

  const body =
    `${opener}\n\n` +
    `موضوع امروز ما «${topic}» است.\n\n` +
    `ما باور داریم که با همراهی شما، می‌توان مسیر تازه‌ای گشود. ` +
    `این مسیر، نه با شعار، که با برنامه و عمل ساخته می‌شود.\n\n` +
    `${ctaText}\n\n` +
    `— ${candidateName}\n` +
    (tags ? `\n${tags.split(/\s+/).map(t => t.startsWith("#") ? t : "#" + t).join(" ")}` : "");

  return { body, note: platformNote };
}

function generateSpeech(a, profile) {
  const kind     = a.kind?.id || "rally";
  const audience = a.audience?.id || "general";
  const duration = a.duration?.id || "medium";
  const message  = a.mainMessage || "زمان تغییر فرارسیده است";
  const promises = (a.promises || "").split("\n").map(s => s.trim()).filter(Boolean);
  const name     = profile?.fullName || "خدمتگزار شما";

  const greeting = {
    youth:   "✊ جوانان عزیز و آینده‌ساز این سرزمین،",
    workers: "🛠 خواهران و برادران زحمت‌کش،",
    women:   "🌹 بانوان گرامی و سرمایه‌های واقعی جامعه،",
    elders:  "🌳 پیشکسوتان و بزرگان محترم،",
    general: "🇮🇷 سلام بر هم‌میهنان عزیز،",
  }[audience];

  const kindIntro = {
    opening: "امروز، روز آغاز یک سفر مشترک است.",
    rally:   "ایستادن من اینجا، در کنار شما، افتخار من است.",
    debate:  "خوشحالم که فرصت گفت‌وگوی شفاف فراهم شده.",
    closing: "امروز، در پایان این مسیر، نگاهی به آغاز می‌اندازم.",
    victory: "این پیروزی، پیروزی همه‌ی ماست.",
  }[kind];

  const length = duration === "short" ? "کوتاه" : duration === "long" ? "بلند" : "متوسط";

  const promisesText = promises.length
    ? promises.map((p, i) => `   ${i + 1}) ${p}`).join("\n")
    : "   ۱) ...\n   ۲) ...\n   ۳) ...";

  const body =
    `🎤 *سخنرانی — نسخه ${length}*\n\n` +
    `${greeting}\n\n` +
    `${kindIntro}\n\n` +
    `[مقدمه — ۳۰ ثانیه]\n` +
    `همه‌ی ما امروز یک پرسش مشترک داریم: آینده‌ای که می‌خواهیم چیست؟\n\n` +
    `[پیام اصلی]\n` +
    `«${message}»\n\n` +
    `[۳ وعده‌ی کلیدی]\n` +
    `${promisesText}\n\n` +
    `[داستان شخصی — اختیاری]\n` +
    `چند روز پیش، یکی از شما به من گفت... [یک خاطره کوتاه از مردم منطقه]\n\n` +
    `[جمع‌بندی و فراخوان]\n` +
    `این تنها یک کاندیداتوری نیست؛ یک تعهد است. تعهد به شما، به این شهر، به این مردم.\n` +
    `من ${name} هستم، و در کنار شما خواهم ماند. متشکرم 🌹`;

  return { body };
}

function generateSlogan(a) {
  const value   = a.value?.id || "change";
  const style   = a.style?.id || "short";
  const keyword = (a.keyword && a.keyword !== "-") ? a.keyword.trim() : "";

  const banks = {
    change:     ["تغییر، حق ماست", "زمانِ نو، صدای نو", "آینده در دستان ماست"],
    experience: ["تجربه، اعتماد می‌سازد", "دانش در خدمت مردم", "راهی که می‌شناسم"],
    trust:      ["صداقت، سرمایه ماست", "حرف‌مان، عمل‌مان", "اعتماد بر پایه عمل"],
    progress:   ["پیشرفت، حق فرزندان ماست", "هر روز، یک گام جلوتر", "ساختن، با هم"],
    justice:    ["عدالت برای همه", "حق هر کس، در جای خود", "ترازوی برابر"],
    unity:      ["با هم، می‌توانیم", "یک صدا، یک هدف", "همدلی، قدرت ماست"],
  };

  const base = banks[value] || banks.change;

  let variants;
  if (style === "short") {
    variants = base.map(s => s.split("،")[0].trim()).filter(Boolean);
  } else if (style === "rhythmic") {
    variants = base.map(s => `${s} — ${s.split(" ").slice(-1)[0]}، ${s.split(" ")[0]}`);
  } else if (style === "promise") {
    variants = base.map(s => `${s}؛ این وعده‌ی ماست.`);
  } else if (style === "question") {
    variants = base.map(s => `${s}؟ پاسخ، با شماست.`);
  } else {
    variants = base;
  }

  if (keyword) {
    variants = variants.map(s => s.includes(keyword) ? s : `${keyword} — ${s}`);
  }

  const body =
    `💬 *۳ پیشنهاد شعار برای شما:*\n\n` +
    variants.slice(0, 3).map((s, i) => `${i + 1}) « ${s} »`).join("\n\n") +
    `\n\n_می‌توانید با زدن «تولید دوباره» نسخه‌های متفاوت بگیرید._`;

  return { body };
}

function generateSms(a, profile) {
  const purpose   = a.purpose?.id || "intro";
  const detail    = a.detail || "";
  const signature = a.signature?.id || "name";
  const name      = profile?.fullName || "کاندیدای شما";
  const code      = profile?.electionCode || "—";

  const templates = {
    intro:    `سلام. ${name} هستم، کاندیدای ${profile?.electionType || "انتخابات"}. ${detail}`,
    invite:   `با سلام، شما را به ${detail} دعوت می‌کنیم. حضورتان مایه دلگرمی است.`,
    reminder: `هم‌میهن گرامی، روز رأی‌گیری نزدیک است. ${detail} — رأی شما، آینده ماست.`,
    thanks:   `از همراهی صمیمانه شما سپاسگزاریم. ${detail}`,
    answer:   `در پاسخ به ${detail}: موضع ما شفاف و مکتوب است. جزئیات در کانال ما.`,
  };

  let text = templates[purpose] || templates.intro;

  const sigText = {
    name:      ` — ${name}`,
    name_code: ` — ${name} (کد ${code})`,
    campaign:  ` — ستاد ${name}`,
    none:      "",
  }[signature];

  text += sigText;

  // محدودیت ۱۶۰ کاراکتر
  if (text.length > 160) text = text.slice(0, 157) + "...";

  const body =
    `📨 *پیامک پیشنهادی* (${text.length}/۱۶۰ کاراکتر)\n\n` +
    `\`${text}\`\n\n` +
    (text.length > 160
      ? "⚠️ متن از حد مجاز فراتر رفت و خلاصه شد."
      : "✅ در محدوده‌ی استاندارد پیامک تک‌بخشی است.");

  return { body };
}

function generateStatement(a, profile) {
  const occasion = a.occasion?.id || "position";
  const subject  = a.subject || "";
  const stance   = a.stance?.id || "neutral";
  const tone     = a.tone?.id || "calm";
  const name     = profile?.fullName || "اینجانب";

  const title = {
    response:   "بیانیه در پاسخ به",
    position:   "بیانیه موضع‌گیری در خصوص",
    crisis:     "بیانیه درباره",
    announce:   "اطلاعیه",
    condolence: "پیام",
  }[occasion];

  const stanceText = {
    support:  "ضمن حمایت قاطع از این موضوع،",
    oppose:   "ضمن مخالفت صریح با این موضوع،",
    neutral:  "با نگاهی منصفانه و تحلیلی،",
    clarify:  "برای رفع ابهامات احتمالی،",
  }[stance];

  const closing = {
    calm:      "امید است این شفاف‌سازی، راه‌گشای گفت‌وگوی سازنده باشد.",
    firm:      "بر مواضع خود استوار خواهم ماند و از حقوق مردم کوتاه نخواهم آمد.",
    emotional: "دل من با تک‌تک شما عزیزان است؛ پایان این مسیر روشن خواهد بود.",
    legal:     "حقوق قانونی خود و موکلین خویش را در مراجع ذی‌صلاح پیگیری خواهم کرد.",
  }[tone];

  const today = new Date().toLocaleDateString("fa-IR");

  const body =
    `📜 *${title} ${subject.slice(0, 60)}${subject.length > 60 ? "..." : ""}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `بسمه تعالی\n\n` +
    `هم‌میهنان گرامی،\n\n` +
    `${stanceText} لازم می‌دانم نکات زیر را به استحضار برسانم:\n\n` +
    `۱) ${subject}\n\n` +
    `۲) موضع رسمی اینجانب بر اساس اصول کمپین و در راستای منافع مردم تنظیم شده است.\n\n` +
    `۳) از همه‌ی ذی‌نفعان دعوت می‌کنم با گفت‌وگوی صادقانه، در مسیر حل موضوع همراه شوند.\n\n` +
    `${closing}\n\n` +
    `${name}\n` +
    `${today}`;

  return { body };
}

function generateBanner(a, profile) {
  const kind     = a.kind?.id || "street";
  const headline = a.headline || "صدای واقعی مردم";
  const subline  = (a.subline && a.subline !== "-") ? a.subline : "";
  const contact  = a.contact?.id || "all";
  const name     = profile?.fullName || "کاندیدای منتخب شما";
  const code     = profile?.electionCode || "—";
  const social   = profile?.socialId || "@candidatoryiran_bot";
  const phone    = profile?.campaignPhone || "—";

  const sizeNote = {
    street:  "📐 پیشنهاد: ۳×۶ متر — فونت تیتر حداقل ۲۰ سانتی‌متر",
    poster:  "📐 پیشنهاد: A3 یا A2 — تیتر ۸۰pt به بالا",
    digital: "📐 پیشنهاد: ۱۹۲۰×۱۰۸۰ — فرمت PNG/SVG",
    stage:   "📐 پیشنهاد: ۴×۲ متر — متن قابل خواندن از ۲۰ متری",
  }[kind];

  let contactLine;
  switch (contact) {
    case "code":   contactLine = `کد انتخاباتی: ${code}`; break;
    case "social": contactLine = `${social}`; break;
    case "phone":  contactLine = `☎️ ${phone}`; break;
    default:       contactLine = `کد ${code}  |  ${social}  |  ☎️ ${phone}`;
  }

  const body =
    `🖼 *طرح متنی بنر*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `┌─────────────────────────────┐\n` +
    `│                             │\n` +
    `│   *${headline}*\n` +
    (subline ? `│   ${subline}\n` : `│\n`) +
    `│                             │\n` +
    `│   👤 ${name}\n` +
    `│   ${contactLine}\n` +
    `│                             │\n` +
    `└─────────────────────────────┘\n\n` +
    `${sizeNote}\n` +
    `🎨 رنگ‌بندی پیشنهادی: پس‌زمینه روشن، تیتر تیره، لهجه‌رنگ گرم (نارنجی/قرمز کم‌رنگ).`;

  return { body };
}

// ───────────────────────────────────────────────────────────────
// تولید نهایی و نمایش
// ───────────────────────────────────────────────────────────────
// نمایش پیام خطای تولید + دکمه‌ی تلاش مجدد (state حفظ می‌شود تا دوباره امتحان شود)
async function showContentError(ctx, typeId, reason) {
  const cfg = CONTENT_TYPES[typeId] || { emoji: "✍️", title: "محتوا" };
  const text =
    `⚠️ *تولید ${cfg.emoji} ${cfg.title} ناموفق بود*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${reason}\n\n` +
    `_می‌توانید دوباره تلاش کنید._`;

  const kb = new InlineKeyboard()
    .text("🔁 تلاش مجدد", `content:retry:${typeId}`).row()
    .text("📝 نوع دیگر محتوا", "content:menu").row()
    .text("🏠 منوی اصلی", "menu");

  try {
    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
      } catch {
        await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
      }
      try { await ctx.answerCallbackQuery(); } catch {}
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch (e) {
    console.error("[content] showContentError:", e?.message || e);
  }
}

async function finalizeContent(ctx, typeId) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const answers = parseAnswers(user.tempAnswers);

  // پروفایل کاندیدا برای شخصی‌سازی متن
  let profile = user.profile || user; // سازگار با هر دو ساختار
  if (typeof profile === "string") {
    try { profile = JSON.parse(profile); } catch { profile = user; }
  }

  const cfg = CONTENT_TYPES[typeId];

  // ───────────────────────────────────────────────────────────
  // تولید با هوش مصنوعی (AI-first)
  // اگر AI پیکربندی نشده یا خطا داد → پیام خطا + دکمه‌ی تلاش مجدد
  // ───────────────────────────────────────────────────────────
  const promptBuilder = AI_PROMPT_BUILDERS[typeId];

  if (!isAIConfigured() || !promptBuilder) {
    return showContentError(
      ctx, typeId,
      !promptBuilder ? "نوع محتوای نامعتبر." :
        "سرویس هوش مصنوعی هنوز پیکربندی نشده است. لطفاً بعداً تلاش کنید."
    );
  }

  // نشان دادن حالت «در حال تولید...» تا کاربر منتظر بماند
  try {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "🤖 در حال تولید با هوش مصنوعی…" });
      try {
        await ctx.editMessageText(
          `🤖 *در حال تولید ${cfg.emoji} ${cfg.title} با هوش مصنوعی…*\n\n_چند لحظه صبر کنید…_`,
          { parse_mode: "Markdown" }
        );
      } catch {}
    } else {
      await ctx.reply("🤖 در حال تولید با هوش مصنوعی…");
    }
  } catch {}

  let aiText;
  try {
    const { system, prompt } = promptBuilder(answers, profile);
    aiText = await generateAI({ system, prompt });
  } catch (e) {
    console.error("[content][AI] error:", e?.message || e);
    return showContentError(
      ctx, typeId,
      "تولید با هوش مصنوعی موقتاً ناموفق بود. لطفاً دوباره تلاش کنید."
    );
  }

  const out = { body: aiText, note: "✨ تولیدشده با هوش مصنوعی — قبل از انتشار بازبینی کنید." };

  // پاک کردن state (فقط پس از موفقیت)
  await updateUser(userId, { currentStep: null, tempAnswers: "{}" });

  const header =
    `✅ *${cfg.emoji} ${cfg.title} — آماده شد*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const noteLine = out.note ? `\n\n_${out.note}_` : "";

  const text = header + out.body + noteLine;

  const kb = buildAfterFinalKB(typeId);

  // متن ممکن است طولانی باشد → اگر بیش از ۴۰۰۰ کاراکتر، بشکن
  if (text.length > 3900) {
    const part1 = text.slice(0, 3900);
    const part2 = text.slice(3900);
    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(part1, { parse_mode: "Markdown" });
      } catch {
        await ctx.reply(part1, { parse_mode: "Markdown" });
      }
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(part1, { parse_mode: "Markdown" });
    }
    await ctx.reply(part2, { parse_mode: "Markdown", reply_markup: kb });
  } else {
    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
      } catch {
        await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
      }
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
  }
}

// ───────────────────────────────────────────────────────────────
// روتر callback های مربوط به content:*
// در main.js: bot.callbackQuery(/^content:/, handleContentCallback)
// ───────────────────────────────────────────────────────────────
async function handleContentCallback(ctx) {
  const data = ctx.callbackQuery?.data || "";
  const parts = data.split(":"); // content:action:...

  if (parts[0] !== "content") return;

  try {
    const action = parts[1];

    if (action === "menu") {
      return handleContentMenu(ctx);
    }
    if (action === "cancel") {
      return handleCancel(ctx);
    }
    if (action === "start") {
      const typeId = parts[2];
      return handleStartType(ctx, typeId);
    }
    if (action === "retry") {
      // تلاش مجدد تولید: اگر پاسخ‌های فرم هنوز موجودند مستقیماً تولید کن،
      // در غیر این صورت فرم را از نو شروع کن.
      const typeId = parts[2];
      const u = await getOrCreateUser(String(ctx.from.id), {});
      const ans = parseAnswers(u.tempAnswers);
      if (ans && Object.keys(ans).length > 0) {
        return finalizeContent(ctx, typeId);
      }
      return handleStartType(ctx, typeId);
    }
    if (action === "ans") {
      const [, , typeId, qKey, optionId] = parts;
      return handleAnswer(ctx, typeId, qKey, optionId);
    }

    await ctx.answerCallbackQuery({ text: "عملیات نامعتبر", show_alert: false });
  } catch (e) {
    console.error("[content] callback error:", e);
    try {
      await ctx.answerCallbackQuery({ text: "خطا در پردازش", show_alert: true });
    } catch {}
  }
}

// ───────────────────────────────────────────────────────────────
// Exports
// ───────────────────────────────────────────────────────────────
module.exports = {
  // هندلرهای اصلی
  handleContentMenu,
  handleContentCallback,
  handleTextInput,
  // کمکی‌ها (برای استفاده‌ی main.js در تشخیص state)
  isInContentRange,
  detectTypeFromStep,
  CONTENT_TYPES,
  STATE_RANGE,
  STATE_MAP,
  STATE_BASE,
};
