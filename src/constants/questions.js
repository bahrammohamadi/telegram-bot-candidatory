// src/constants/questions.js
// ─── سؤالات ۹ مرحله‌ای — فرمت CommonJS ───

const STEPS = [
  // مرحله ۰: کد ملی
  {
    id: "national_id",
    title: "🪪 کد ملی",
    question:
      "لطفاً *کد ملی ۱۰ رقمی* خود را وارد کنید:\n\n" +
      "⚠️ این اطلاعات کاملاً محرمانه است.\n🔒 اطلاعات شما نزد ما امانت است.",
    type: "text",
    required: true,
    placeholder: "مثال: 0012345678",
    validation: "national_id",
    score: 0,
    fieldInDB: "nationalId",
  },

  // مرحله ۱: شماره تماس
  {
    id: "phone",
    title: "📱 شماره تماس",
    question:
      "لطفاً *شماره موبایل* خود را وارد کنید:\n\n" +
      "📌 برای هماهنگی مشاوره استفاده می‌شود.\n✅ فرمت: ۰۹XXXXXXXXX",
    type: "text",
    required: true,
    placeholder: "مثال: 09121234567",
    validation: "phone",
    score: 0,
    fieldInDB: "phone",
  },

  // مرحله ۲: نوع انتخابات
  {
    id: "election_type",
    title: "🗳️ نوع انتخابات",
    question: "در کدام انتخابات قصد کاندیداتوری دارید؟",
    type: "choice",
    required: true,
    options: [
      { label: "🏘️ شورای شهر / روستا", value: "council", score: 0, isDefault: true },
      { label: "🏛️ مجلس شورای اسلامی", value: "parliament", score: 0 },
      { label: "📜 مجلس خبرگان رهبری", value: "experts", score: 0 },
      { label: "🏢 ریاست جمهوری", value: "presidential", score: 0 },
      { label: "📋 سایر", value: "other", score: 0 },
    ],
  },

  // مرحله ۳: حوزه انتخابیه
  {
    id: "constituency",
    title: "📍 حوزه انتخابیه",
    question:
      "لطفاً *نام دقیق حوزه انتخابیه* را بنویسید:\n\n" +
      "📌 استان، شهرستان، بخش و منطقه\n" +
      "مثال: «اصفهان - شهرستان اصفهان - منطقه ۵»",
    type: "text",
    required: true,
    placeholder: "استان - شهرستان - بخش/منطقه",
    validation: "min_5",
    score: 0,
  },

  // مرحله ۴: سابقه محلی (0-25)
  {
    id: "local_background",
    title: "🏠 سابقه محلی و شناخته‌شدگی",
    question:
      "سابقه حضور و فعالیت اجتماعی شما در حوزه انتخابیه چگونه است؟\n\n" +
      "📌 «بومی بودن» و «سابقه خدمت» دو عامل تعیین‌کننده هستند.",
    type: "choice",
    required: true,
    options: [
      { label: "🌟 بومی + سابقه خدمت رسمی", value: "native_official", score: 25 },
      { label: "🏡 بومی + شناخته‌شده و فعال", value: "native_known", score: 20 },
      { label: "🏠 بومی بدون فعالیت شاخص", value: "native_passive", score: 13 },
      { label: "🚗 غیربومی ولی ۵+ سال ساکن", value: "resident_long", score: 8 },
      { label: "🆕 تازه‌وارد", value: "newcomer", score: 2 },
    ],
  },

  // مرحله ۵: سرمایه اجتماعی (0-25)
  {
    id: "social_capital",
    title: "👥 سرمایه اجتماعی",
    question:
      "قدرت شبکه ارتباطی شما در حوزه انتخابیه چقدر است؟\n\n" +
      "📌 ارتباط با معتمدین، اصناف، جوانان، بانوان و تشکل‌ها",
    type: "choice",
    required: true,
    options: [
      { label: "💎 شبکه بسیار قوی (همه گروه‌ها)", value: "very_strong", score: 25 },
      { label: "💪 شبکه قوی (۲–۳ گروه کلیدی)", value: "strong", score: 19 },
      { label: "👌 شبکه متوسط", value: "moderate", score: 12 },
      { label: "🤏 شبکه محدود (خانواده و دوستان)", value: "limited", score: 6 },
      { label: "😐 تقریباً شبکه‌ای ندارم", value: "none", score: 1 },
    ],
  },

  // مرحله ۶: تیم و منابع (0-25)
  {
    id: "team_resources",
    title: "⚙️ تیم و منابع",
    question:
      "وضعیت تیم انتخاباتی و بودجه تبلیغاتی شما چگونه است؟\n\n" +
      "📊 کمپین حداقلی: ۳–۵ نفر تیم + بودجه تبلیغات + ستاد",
    type: "choice",
    required: true,
    options: [
      { label: "🏆 تیم حرفه‌ای + بودجه کافی + ستاد", value: "professional", score: 25 },
      { label: "✅ تیم نیمه‌حرفه‌ای + بودجه متوسط", value: "semi_pro", score: 18 },
      { label: "🔧 چند داوطلب + بودجه محدود", value: "basic", score: 10 },
      { label: "🙋 تقریباً تنها + بودجه کم", value: "solo_low", score: 4 },
      { label: "❌ نه تیم نه بودجه", value: "nothing", score: 1 },
    ],
  },

  // مرحله ۷: تاب‌آوری (0-25)
  {
    id: "resilience",
    title: "🧠 تاب‌آوری و روحیه",
    question:
      "توانایی شما در مواجهه با فشار، شایعه و حملات رقبا چقدر است؟\n\n" +
      "📌 شایعه‌پراکنی و حملات شخصی در انتخابات محلی رایج است.",
    type: "choice",
    required: true,
    options: [
      { label: "🛡️ تجربه بحران + خونسردی بالا", value: "battle_tested", score: 25 },
      { label: "💪 تحمل بالا ولی بدون تجربه عملی", value: "high_tolerance", score: 18 },
      { label: "😐 نسبتاً آرام ولی شایعات اذیتم می‌کند", value: "moderate", score: 10 },
      { label: "😰 آسیب‌پذیر در برابر فشار", value: "vulnerable", score: 3 },
    ],
  },

  // مرحله ۸: مزیت رقابتی (0-25)
  {
    id: "competitive_edge",
    title: "🎯 پیام و مزیت رقابتی",
    question:
      "آیا *پیام انتخاباتی مشخص* و *مزیت رقابتی* دارید؟\n\n" +
      "📌 «چرا مردم باید به من رأی بدهند؟»",
    type: "choice",
    required: true,
    options: [
      { label: "🎯 پیام شفاف + مزیت + برنامه مکتوب", value: "clear_unique_plan", score: 25 },
      { label: "📝 پیام نسبتاً مشخص + یک مزیت", value: "has_message", score: 17 },
      { label: "🤔 ایده دارم ولی شعار مشخصی ندارم", value: "ideas_only", score: 8 },
      { label: "❓ هنوز فکر نکردم", value: "not_thought", score: 2 },
    ],
  },
];

// ثابت‌ها
const SCORED_STEP_IDS = [
  "local_background",
  "social_capital",
  "team_resources",
  "resilience",
  "competitive_edge",
];

const MAX_SCORE = 125;
const TOTAL_STEPS = STEPS.length;
const STEP_EMOJIS = ["🪪", "📱", "🗳️", "📍", "🏠", "👥", "⚙️", "🧠", "🎯"];
const IDENTITY_FIELDS = ["national_id", "phone"];

const WELCOME_MESSAGE =
  "🏛️ *کاندیداتوری هوشمند*\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "سلام! 👋\n" +
  "به *اولین سامانه هوشمند تحلیل آمادگی کاندیداتوری* خوش آمدید.\n\n" +
  "📊 *امکانات:*\n" +
  "├ تحلیل آمادگی کاندیداتوری (۹ سؤال)\n" +
  "├ گزارش تخصصی با امتیازدهی علمی\n" +
  "├ آموزش‌های تخصصی انتخاباتی\n" +
  "├ مشاوره و خدمات حرفه‌ای\n" +
  "└ نمونه تحلیل‌های واقعی\n\n" +
  "از منوی زیر شروع کنید 👇";

module.exports = {
  STEPS,
  SCORED_STEP_IDS,
  MAX_SCORE,
  TOTAL_STEPS,
  STEP_EMOJIS,
  IDENTITY_FIELDS,
  WELCOME_MESSAGE,
};
