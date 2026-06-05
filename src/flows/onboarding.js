// src/flows/onboarding.js — CommonJS
// ─── پروفایل جامع کاندیدا ───
// شامل: مشخصات فردی، سوابق، اهداف، بودجه، حوزه انتخابیه

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser, updateUser } = require("../utils/db.js");
const { requireAccess } = require("../utils/access.js");
const { profileMenuKB, backToCampaignKB, mainMenuKB } = require("../utils/keyboard.js");

// ═══════════════════════════════════════════
// فیلدهای پروفایل
// ═══════════════════════════════════════════
const PROFILE_FIELDS = [
  {
    id: "fullName",
    title: "👤 نام کامل",
    question: "نام و نام خانوادگی کامل خود را وارد کنید:",
    type: "text",
    validation: "min_3",
    required: true,
  },
  {
    id: "age",
    title: "🎂 سن",
    question: "سن شما چند سال است؟",
    type: "choice",
    options: [
      { label: "زیر ۳۰ سال", value: "under30" },
      { label: "۳۰ تا ۴۰ سال", value: "30_40" },
      { label: "۴۰ تا ۵۰ سال", value: "40_50" },
      { label: "۵۰ تا ۶۰ سال", value: "50_60" },
      { label: "بالای ۶۰ سال", value: "over60" },
    ],
    required: true,
  },
  {
    id: "education",
    title: "🎓 تحصیلات",
    question: "بالاترین مدرک تحصیلی شما:",
    type: "choice",
    options: [
      { label: "زیر دیپلم", value: "below_diploma" },
      { label: "دیپلم", value: "diploma" },
      { label: "کاردانی / کارشناسی", value: "bachelor" },
      { label: "کارشناسی ارشد", value: "master" },
      { label: "دکترا", value: "phd" },
    ],
    required: true,
  },
  {
    id: "occupation",
    title: "💼 شغل فعلی",
    question: "شغل یا سمت فعلی خود را بنویسید:\n\n💬 مثال: «معلم»، «کارمند شهرداری»، «پزشک»، «کسب‌وکار آزاد»",
    type: "text",
    validation: "min_2",
    required: true,
  },
  {
    id: "electionType",
    title: "🗳️ نوع انتخابات",
    question: "در کدام انتخابات کاندیدا می‌شوید؟",
    type: "choice",
    options: [
      { label: "🏘️ شورای شهر / روستا", value: "council" },
      { label: "🏛️ مجلس شورای اسلامی", value: "parliament" },
      { label: "🏢 ریاست جمهوری", value: "presidential" },
      { label: "📋 سایر", value: "other" },
    ],
    required: true,
  },
  {
    id: "constituency",
    title: "📍 حوزه انتخابیه",
    question:
      "نام دقیق حوزه انتخابیه خود را بنویسید:\n\n" +
      "📌 شامل: استان، شهرستان، بخش\n" +
      "مثال: «مازندران - ساری - بخش مرکزی»",
    type: "text",
    validation: "min_5",
    required: true,
  },
  {
    id: "residencyYears",
    title: "🏠 سابقه سکونت",
    question: "چند سال است در این حوزه زندگی می‌کنید؟",
    type: "choice",
    options: [
      { label: "کمتر از ۲ سال", value: "under2" },
      { label: "۲ تا ۵ سال", value: "2_5" },
      { label: "۵ تا ۱۰ سال", value: "5_10" },
      { label: "۱۰ تا ۲۰ سال", value: "10_20" },
      { label: "بیش از ۲۰ سال (بومی)", value: "over20" },
    ],
    required: true,
  },
  {
    id: "pastPositions",
    title: "📋 سوابق اجرایی",
    question:
      "مهم‌ترین سوابق اجرایی، سیاسی یا اجتماعی خود را بنویسید:\n\n" +
      "📌 هر سمت را در یک خط بنویسید\n" +
      "مثال:\n" +
      "• عضو شورای شهر دوره قبل\n" +
      "• مدیر خیریه محلی\n" +
      "• مسئول بسیج محله\n\n" +
      "اگر سابقه‌ای ندارید بنویسید: «ندارم»",
    type: "text",
    validation: "min_2",
    required: false,
  },
  {
    id: "electionExperience",
    title: "🗳️ تجربه انتخاباتی",
    question: "آیا قبلاً در انتخابات شرکت کرده‌اید؟",
    type: "choice",
    options: [
      { label: "✅ بله، انتخاب شدم", value: "won" },
      { label: "🔄 بله، شرکت کردم ولی انتخاب نشدم", value: "lost" },
      { label: "❌ خیر، اولین بار است", value: "never" },
    ],
    required: true,
  },
  {
    id: "slogan",
    title: "📢 شعار اصلی",
    question:
      "شعار اصلی انتخاباتی شما چیست؟\n\n" +
      "📌 اگر هنوز نهایی نشده، ایده فعلی‌تان را بنویسید.\n" +
      "اگر ندارید بنویسید: «هنوز تعیین نشده»",
    type: "text",
    validation: "min_2",
    required: false,
  },
  {
    id: "topPriorities",
    title: "🎯 سه اولویت اصلی",
    question:
      "اگر انتخاب شوید، سه اولویت اجرایی شما چیست؟\n\n" +
      "📌 هر اولویت را در یک خط بنویسید:\n" +
      "مثال:\n" +
      "۱. آسفالت معابر فرعی\n" +
      "۲. ایجاد فضای سبز\n" +
      "۳. شفافیت بودجه",
    type: "text",
    validation: "min_10",
    required: true,
  },
  {
    id: "budget",
    title: "💰 بودجه کمپین",
    question: "بودجه تبلیغاتی تخمینی شما برای این انتخابات چقدر است؟",
    type: "choice",
    options: [
      { label: "کمتر از ۵۰ میلیون تومان", value: "under50m" },
      { label: "۵۰ تا ۲۰۰ میلیون تومان", value: "50_200m" },
      { label: "۲۰۰ تا ۵۰۰ میلیون تومان", value: "200_500m" },
      { label: "۵۰۰ میلیون تا ۱ میلیارد", value: "500m_1b" },
      { label: "بیش از ۱ میلیارد تومان", value: "over1b" },
    ],
    required: true,
  },
  {
    id: "mainStrength",
    title: "💪 مهم‌ترین نقطه قوت",
    question:
      "مهم‌ترین نقطه قوت شما نسبت به سایر کاندیداها چیست؟\n\n" +
      "📌 یک مورد — صادقانه و مشخص بنویسید:",
    type: "text",
    validation: "min_5",
    required: true,
  },
  {
    id: "mainWeakness",
    title: "⚠️ مهم‌ترین نقطه ضعف",
    question:
      "مهم‌ترین نقطه ضعف یا چالش شما چیست؟\n\n" +
      "📌 این اطلاعات محرمانه است و فقط برای تحلیل دقیق‌تر استفاده می‌شود.\n" +
      "صادقانه بنویسید:",
    type: "text",
    validation: "min_5",
    required: false,
  },
];

const TOTAL_PROFILE_FIELDS = PROFILE_FIELDS.length;

// ═══════════════════════════════════════════
// State مرحله پروفایل در حال ایجاد
// پیشوند: profile_step_ برای currentStep
// ═══════════════════════════════════════════
const PROFILE_STEP_BASE = 500;

// ═══════════════════════════════════════════
// کیبورد مرحله پروفایل
// ═══════════════════════════════════════════
function profileStepKB(fieldIndex, fieldType) {
  const kb = new InlineKeyboard();

  if (fieldType === "choice") {
    const field = PROFILE_FIELDS[fieldIndex];
    for (const opt of field.options) {
      kb.text(opt.label, `prf:${fieldIndex}:${opt.value}`).row();
    }
  }

  // ناوبری
  if (fieldIndex > 0) {
    kb.text("⬅️ قبلی", `prf_back:${fieldIndex - 1}`);
  }
  if (!PROFILE_FIELDS[fieldIndex].required) {
    kb.text("⏭️ رد شدن", `prf_skip:${fieldIndex}`);
  }
  kb.row();
  kb.text("❌ انصراف", "campaign_menu").row();

  return kb;
}

// ═══════════════════════════════════════════
// نوار پیشرفت پروفایل
// ═══════════════════════════════════════════
function profileProgress(idx) {
  const pct = Math.round(((idx + 1) / TOTAL_PROFILE_FIELDS) * 100);
  const filled = Math.round(pct / 10);
  const bar = "🟢".repeat(filled) + "⚪".repeat(10 - filled);
  return `📋 پروفایل: ${bar} ${idx + 1}/${TOTAL_PROFILE_FIELDS} (${pct}%)`;
}

// ═══════════════════════════════════════════
// نمایش منوی پروفایل
// ═══════════════════════════════════════════
async function handleProfileMenu(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  // بررسی آیا پروفایل وجود دارد
  let profile = {};
  try {
    profile = JSON.parse(user.candidateProfile || "{}");
  } catch {
    profile = {};
  }

  const hasProfile = profile.fullName && profile.electionType;

  let t = "👤 *پروفایل کاندیدا*\n";
  t += "━━━━━━━━━━━━━━━━━━━\n\n";

  if (hasProfile) {
    t += `👤 نام: *${profile.fullName || "—"}*\n`;
    t += `🗳️ انتخابات: ${_electionLabel(profile.electionType)}\n`;
    t += `📍 حوزه: ${profile.constituency || "—"}\n`;
    t += `💼 شغل: ${profile.occupation || "—"}\n`;
    t += `📢 شعار: _${profile.slogan || "تعیین نشده"}_\n\n`;
    t += "✅ پروفایل شما تکمیل شده است.";
  } else {
    t += "⚠️ پروفایل شما هنوز ایجاد نشده است.\n\n";
    t += "📌 با تکمیل پروفایل:\n";
    t += "• تحلیل‌های دقیق‌تری دریافت می‌کنید\n";
    t += "• محتوای شخصی‌سازی‌شده تولید می‌شود\n";
    t += "• داشبورد کمپین فعال می‌شود";
  }

  const kb = profileMenuKB(hasProfile);

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
// شروع ایجاد/ویرایش پروفایل
// ═══════════════════════════════════════════
async function handleProfileCreate(ctx) {
  const userId = String(ctx.from.id);

  await updateUser(userId, {
    currentStep: PROFILE_STEP_BASE,
    tempAnswers: JSON.stringify({ _profileMode: true }),
  });

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  await ctx.reply(
    "📋 *ایجاد پروفایل کاندیدا*\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    `📊 ${TOTAL_PROFILE_FIELDS} سؤال — زمان تقریبی: ۵ دقیقه\n\n` +
    "این اطلاعات پایه تمام تحلیل‌های شما خواهد بود.\n" +
    "بزن بریم! 👇",
    { parse_mode: "Markdown" }
  );

  await showProfileStep(ctx, userId, 0);
}

async function handleProfileEdit(ctx) {
  // ویرایش = همان ایجاد ولی با پر بودن مقادیر قبلی
  await handleProfileCreate(ctx);
}

// ═══════════════════════════════════════════
// نمایش یک مرحله پروفایل
// ═══════════════════════════════════════════
async function showProfileStep(ctx, userId, fieldIndex) {
  if (fieldIndex < 0 || fieldIndex >= TOTAL_PROFILE_FIELDS) return;

  const field = PROFILE_FIELDS[fieldIndex];

  await updateUser(userId, { currentStep: PROFILE_STEP_BASE + fieldIndex });

  let text = `${profileProgress(fieldIndex)}\n\n`;
  text += `*${field.title}*\n`;
  text += "━━━━━━━━━━━━━━━━━━━\n\n";
  text += field.question;
  if (!field.required) text += "\n\n_این فیلد اختیاری است._";

  const kb = profileStepKB(fieldIndex, field.type);

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
// پاسخ گزینه‌ای پروفایل (prf:fieldIndex:value)
// ═══════════════════════════════════════════
async function handleProfileAnswer(ctx, fieldIndex, value) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  let temp = {};
  try { temp = JSON.parse(user.tempAnswers || "{}"); } catch { temp = {}; }

  const field = PROFILE_FIELDS[fieldIndex];
  if (field) temp[field.id] = value;

  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.answerCallbackQuery({ text: "✅ ثبت شد" });

  const next = fieldIndex + 1;
  if (next < TOTAL_PROFILE_FIELDS) {
    await showProfileStep(ctx, userId, next);
  } else {
    await saveProfile(ctx, userId, temp);
  }
}

// ═══════════════════════════════════════════
// پاسخ متنی پروفایل
// ═══════════════════════════════════════════
async function handleProfileTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  // بررسی: آیا در فاز پروفایل هستیم؟
  if (
    user.currentStep === null ||
    user.currentStep === undefined ||
    user.currentStep < PROFILE_STEP_BASE ||
    user.currentStep >= PROFILE_STEP_BASE + TOTAL_PROFILE_FIELDS
  ) {
    return false;
  }

  const fieldIndex = user.currentStep - PROFILE_STEP_BASE;
  if (fieldIndex < 0 || fieldIndex >= TOTAL_PROFILE_FIELDS) return false;

  const field = PROFILE_FIELDS[fieldIndex];
  if (field.type !== "text") return false;

  const input = ctx.message.text.trim();

  // اعتبارسنجی
  if (field.validation === "min_10" && input.length < 10) {
    await ctx.reply("❌ لطفاً حداقل *۱۰ کاراکتر* بنویسید.", { parse_mode: "Markdown" });
    return true;
  }
  if (field.validation === "min_5" && input.length < 5) {
    await ctx.reply("❌ لطفاً حداقل *۵ کاراکتر* بنویسید.", { parse_mode: "Markdown" });
    return true;
  }
  if (field.validation === "min_3" && input.length < 3) {
    await ctx.reply("❌ لطفاً حداقل *۳ کاراکتر* بنویسید.", { parse_mode: "Markdown" });
    return true;
  }
  if (field.validation === "min_2" && input.length < 2) {
    await ctx.reply("❌ لطفاً مقداری وارد کنید.", { parse_mode: "Markdown" });
    return true;
  }

  // ذخیره
  let temp = {};
  try { temp = JSON.parse(user.tempAnswers || "{}"); } catch { temp = {}; }
  temp[field.id] = input;

  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.reply(`✅ *${field.title}* ثبت شد.`, { parse_mode: "Markdown" });

  const next = fieldIndex + 1;
  if (next < TOTAL_PROFILE_FIELDS) {
    await showProfileStep(ctx, userId, next);
  } else {
    await saveProfile(ctx, userId, temp);
  }

  return true;
}

// ═══════════════════════════════════════════
// رد شدن از فیلد اختیاری
// ═══════════════════════════════════════════
async function handleProfileSkip(ctx, fieldIndex) {
  const userId = String(ctx.from.id);
  await ctx.answerCallbackQuery({ text: "⏭️ رد شد" });

  const next = fieldIndex + 1;
  if (next < TOTAL_PROFILE_FIELDS) {
    await showProfileStep(ctx, userId, next);
  } else {
    const user = await getOrCreateUser(userId, ctx.from);
    let temp = {};
    try { temp = JSON.parse(user.tempAnswers || "{}"); } catch { temp = {}; }
    await saveProfile(ctx, userId, temp);
  }
}

// ═══════════════════════════════════════════
// برگشت به مرحله قبل
// ═══════════════════════════════════════════
async function handleProfileBack(ctx, fieldIndex) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showProfileStep(ctx, userId, Math.max(0, fieldIndex));
}

// ═══════════════════════════════════════════
// ذخیره نهایی پروفایل
// ═══════════════════════════════════════════
async function saveProfile(ctx, userId, temp) {
  // حذف کلید داخلی
  const profile = { ...temp };
  delete profile._profileMode;

  // ذخیره پروفایل در فیلد اختصاصی
  await updateUser(userId, {
    candidateProfile: JSON.stringify(profile),
    currentStep: null,
    tempAnswers: "{}",
  });

  const name = profile.fullName || "کاربر";

  let t = `✅ *پروفایل ${name} با موفقیت ذخیره شد!*\n\n`;
  t += "📊 حالا می‌توانید از امکانات زیر استفاده کنید:\n\n";
  t += "• تحلیل SWOT اختصاصی\n";
  t += "• تحلیل رقبا\n";
  t += "• تولید محتوای شخصی‌سازی‌شده\n";
  t += "• داشبورد کمپین";

  const kb = new InlineKeyboard()
    .text("📊 تحلیل SWOT", "swot_analysis").row()
    .text("🚀 ارزیابی آمادگی", "start_consultation").row()
    .text("🗂️ مدیریت کمپین", "campaign_menu").row()
    .text("🔙 منوی اصلی", "menu").row();

  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

// ═══════════════════════════════════════════
// مشاهده پروفایل کامل
// ═══════════════════════════════════════════
async function handleProfileView(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);

  let profile = {};
  try { profile = JSON.parse(user.candidateProfile || "{}"); } catch { profile = {}; }

  if (!profile.fullName) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    return await handleProfileMenu(ctx);
  }

  let t = "👤 *پروفایل کامل کاندیدا*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  const fields = [
    { label: "👤 نام کامل",          key: "fullName" },
    { label: "🎂 سن",               key: "age",       map: _ageLabel },
    { label: "🎓 تحصیلات",          key: "education", map: _eduLabel },
    { label: "💼 شغل فعلی",         key: "occupation" },
    { label: "🗳️ نوع انتخابات",     key: "electionType", map: _electionLabel },
    { label: "📍 حوزه انتخابیه",    key: "constituency" },
    { label: "🏠 سابقه سکونت",      key: "residencyYears", map: _residencyLabel },
    { label: "🗳️ تجربه انتخاباتی",  key: "electionExperience", map: _expLabel },
    { label: "💰 بودجه کمپین",      key: "budget",    map: _budgetLabel },
    { label: "📢 شعار اصلی",        key: "slogan" },
    { label: "💪 نقطه قوت",         key: "mainStrength" },
    { label: "⚠️ نقطه ضعف",         key: "mainWeakness" },
  ];

  for (const f of fields) {
    const val = profile[f.key];
    if (!val) continue;
    const display = f.map ? f.map(val) : val;
    t += `${f.label}: ${display}\n`;
  }

  if (profile.pastPositions && profile.pastPositions !== "ندارم") {
    t += `\n📋 *سوابق اجرایی:*\n${profile.pastPositions}\n`;
  }

  if (profile.topPriorities) {
    t += `\n🎯 *سه اولویت اصلی:*\n${profile.topPriorities}\n`;
  }

  const kb = new InlineKeyboard()
    .text("✏️ ویرایش پروفایل", "profile_edit").row()
    .text("📊 تحلیل SWOT", "swot_analysis").row()
    .text("🔙 مدیریت کمپین", "campaign_menu").row();

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
  } catch {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ═══════════════════════════════════════════
// توابع کمکی نمایش
// ═══════════════════════════════════════════
function _electionLabel(v) {
  const m = { council: "شورای شهر/روستا", parliament: "مجلس", presidential: "ریاست جمهوری", other: "سایر" };
  return m[v] || v;
}
function _ageLabel(v) {
  const m = { under30: "زیر ۳۰", "30_40": "۳۰ تا ۴۰", "40_50": "۴۰ تا ۵۰", "50_60": "۵۰ تا ۶۰", over60: "بالای ۶۰" };
  return m[v] || v;
}
function _eduLabel(v) {
  const m = { below_diploma: "زیر دیپلم", diploma: "دیپلم", bachelor: "کارشناسی", master: "ارشد", phd: "دکترا" };
  return m[v] || v;
}
function _residencyLabel(v) {
  const m = { under2: "کمتر از ۲ سال", "2_5": "۲ تا ۵ سال", "5_10": "۵ تا ۱۰ سال", "10_20": "۱۰ تا ۲۰ سال", over20: "بیش از ۲۰ سال (بومی)" };
  return m[v] || v;
}
function _expLabel(v) {
  const m = { won: "بله، انتخاب شدم", lost: "شرکت کردم، انتخاب نشدم", never: "اولین بار" };
  return m[v] || v;
}
function _budgetLabel(v) {
  const m = {
    under50m:   "کمتر از ۵۰ میلیون",
    "50_200m":  "۵۰ تا ۲۰۰ میلیون",
    "200_500m": "۲۰۰ تا ۵۰۰ میلیون",
    "500m_1b":  "۵۰۰ میلیون تا ۱ میلیارد",
    over1b:     "بیش از ۱ میلیارد",
  };
  return m[v] || v;
}

// export توابع کمکی برای استفاده در سایر ماژول‌ها
module.exports = {
  handleProfileMenu,
  handleProfileCreate,
  handleProfileEdit,
  handleProfileView,
  handleProfileAnswer,
  handleProfileTextInput,
  handleProfileSkip,
  handleProfileBack,
  PROFILE_STEP_BASE,
  TOTAL_PROFILE_FIELDS,
  // توابع کمکی
  _electionLabel,
  _ageLabel,
  _eduLabel,
  _residencyLabel,
  _expLabel,
  _budgetLabel,
};
