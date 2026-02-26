// src/constants/questions.js
// ─── سؤالات ۹ مرحله‌ای حرفه‌ای تحلیل آمادگی کاندیداتوری ───
// سازگار با ساختار دیتابیس فعلی (userId, tempAnswers, currentStep)

/**
 * ساختار هر مرحله:
 * - id          : شناسه یکتا (کلید در tempAnswers)
 * - title       : عنوان فارسی
 * - question    : متن سؤال
 * - type        : "choice" | "text"
 * - options     : فقط برای choice → [{ label, value, score }]
 * - required    : اجباری بودن
 * - placeholder : راهنما (برای text)
 * - validation  : نوع اعتبارسنجی (برای text)
 * - scored      : آیا در محاسبه امتیاز لحاظ شود
 */

export const STEPS = [
  // ─── مرحله ۰: نام و نام‌خانوادگی ───
  {
    id: "fullName",
    title: "👤 نام و نام‌خانوادگی",
    question:
      "لطفاً نام و نام‌خانوادگی کامل خود را وارد کنید:\n\n" +
      "📌 این اطلاعات برای ثبت پروفایل شما استفاده می‌شود.",
    type: "text",
    required: true,
    placeholder: "مثال: علی احمدی",
    validation: "min_3",
    scored: false,
  },

  // ─── مرحله ۱: کد ملی ───
  {
    id: "nationalId",
    title: "🪪 کد ملی",
    question:
      "لطفاً کد ملی ۱۰ رقمی خود را وارد کنید:\n\n" +
      "🔒 اطلاعات شما کاملاً محرمانه است و فقط جهت شناسایی استفاده می‌شود.",
    type: "text",
    required: true,
    placeholder: "مثال: 0012345678",
    validation: "national_id",
    scored: false,
  },

  // ─── مرحله ۲: شماره تماس ───
  {
    id: "phone",
    title: "📱 شماره تماس",
    question:
      "لطفاً شماره موبایل خود را وارد کنید:\n\n" +
      "📌 برای هماهنگی‌های بعدی و ارسال گزارش تکمیلی استفاده خواهد شد.",
    type: "text",
    required: true,
    placeholder: "مثال: 09121234567",
    validation: "phone",
    scored: false,
  },

  // ─── مرحله ۳: نوع انتخابات ───
  {
    id: "electionType",
    title: "🗳️ نوع انتخابات",
    question:
      "در کدام انتخابات قصد نامزدی دارید؟\n\n" +
      "📌 گزینه مناسب را انتخاب کنید:",
    type: "choice",
    required: true,
    scored: false,
    options: [
      {
        label: "🏘️ شورای اسلامی شهر / روستا",
        value: "council",
        score: 0,
      },
      {
        label: "🏛️ مجلس شورای اسلامی",
        value: "parliament",
        score: 0,
      },
      {
        label: "📜 مجلس خبرگان رهبری",
        value: "experts",
        score: 0,
      },
      {
        label: "🏅 ریاست جمهوری",
        value: "presidency",
        score: 0,
      },
      {
        label: "📋 سایر",
        value: "other",
        score: 0,
      },
    ],
  },

  // ─── مرحله ۴: حوزه انتخابیه ───
  {
    id: "region",
    title: "📍 حوزه انتخابیه",
    question:
      "نام دقیق حوزه انتخابیه خود را بنویسید:\n\n" +
      "📌 مثال: «اصفهان - منطقه ۳» یا «شهرستان لنجان - بخش مرکزی»\n\n" +
      "💡 هرچه دقیق‌تر بنویسید، تحلیل دقیق‌تری دریافت خواهید کرد.",
    type: "text",
    required: true,
    placeholder: "نام شهر / شهرستان / بخش / روستا",
    validation: "min_3",
    scored: false,
  },

  // ─── مرحله ۵: سابقه محلی و شناخته‌شدگی ───
  {
    id: "localBackground",
    title: "🏠 سابقه محلی و شناخته‌شدگی",
    question:
      "سابقه حضور و فعالیت شما در حوزه انتخابیه چگونه است؟\n\n" +
      "📌 شناخته‌شدگی محلی یکی از مهم‌ترین عوامل پیروزی در انتخابات شوراست.\n" +
      "گزینه‌ای که بیشترین تطابق را با وضعیت شما دارد انتخاب کنید:",
    type: "choice",
    required: true,
    scored: true,
    options: [
      {
        label: "🌟 بومی + سابقه خدمت عمومی (شورا/دهیاری/خیریه/هیئت‌امنا)",
        value: "native_public_service",
        score: 25,
      },
      {
        label: "🏡 بومی + شناخته‌شده در سطح محله/منطقه",
        value: "native_known",
        score: 20,
      },
      {
        label: "🏠 بومی هستم ولی فعالیت عمومی مشخصی نداشته‌ام",
        value: "native_passive",
        score: 12,
      },
      {
        label: "🚗 بومی نیستم ولی سال‌ها ساکنم و ارتباطاتی دارم",
        value: "long_resident",
        score: 8,
      },
      {
        label: "🆕 تازه وارد حوزه شده‌ام / شناختی از من وجود ندارد",
        value: "newcomer",
        score: 3,
      },
    ],
  },

  // ─── مرحله ۶: سرمایه اجتماعی و شبکه ارتباطی ───
  {
    id: "socialCapital",
    title: "👥 سرمایه اجتماعی",
    question:
      "قدرت شبکه ارتباطی و سرمایه اجتماعی شما در حوزه انتخابیه چقدر است؟\n\n" +
      "📌 منظور: ارتباط با معتمدین، ریش‌سفیدان، روحانیون، اصناف، جوانان، بانوان، فرهنگیان و...\n" +
      "این بُعد تعیین‌کننده‌ترین عامل در انتخابات محلی است:",
    type: "choice",
    required: true,
    scored: true,
    options: [
      {
        label: "💎 بسیار قوی (حمایت فعال معتمدین + اصناف + نهادها)",
        value: "very_strong",
        score: 25,
      },
      {
        label: "💪 قوی (ارتباط خوب با ۲–۳ گروه کلیدی جامعه)",
        value: "strong",
        score: 19,
      },
      {
        label: "👌 متوسط (شناخت عمومی دارم ولی حمایت سازمان‌یافته ندارم)",
        value: "moderate",
        score: 12,
      },
      {
        label: "🤏 ضعیف (ارتباطاتم محدود به دوستان و خویشاوندان است)",
        value: "weak",
        score: 5,
      },
    ],
  },

  // ─── مرحله ۷: تیم انتخاباتی و بودجه ───
  {
    id: "teamResources",
    title: "⚙️ تیم و منابع",
    question:
      "وضعیت تیم انتخاباتی و بودجه تبلیغاتی شما چگونه است؟\n\n" +
      "📌 بدون تیم مستحکم و بودجه مناسب، حتی بهترین کاندیداها هم شانس کمی دارند.\n" +
      "صادقانه‌ترین گزینه را انتخاب کنید:",
    type: "choice",
    required: true,
    scored: true,
    options: [
      {
        label: "🏆 تیم حرفه‌ای + ستاد سازمان‌یافته + بودجه کافی",
        value: "professional_team",
        score: 25,
      },
      {
        label: "✅ تیم نیمه‌حرفه‌ای + بودجه متوسط",
        value: "semi_pro",
        score: 18,
      },
      {
        label: "🔧 چند نفر داوطلب + بودجه محدود",
        value: "basic_team",
        score: 10,
      },
      {
        label: "🙋 تنها و بدون تیم / بودجه مشخص",
        value: "solo",
        score: 3,
      },
    ],
  },

  // ─── مرحله ۸: تاب‌آوری و آمادگی روانی ───
  {
    id: "resilience",
    title: "🧠 تاب‌آوری روانی",
    question:
      "در مواجهه با فشار، شایعه، انتقاد و حملات رقبا چه واکنشی نشان می‌دهید؟\n\n" +
      "📌 انتخابات محلی اغلب با شایعه‌پراکنی، تخریب شخصیت و فشارهای خانوادگی همراه است.\n" +
      "گزینه واقعی‌ترین را انتخاب کنید:",
    type: "choice",
    required: true,
    scored: true,
    options: [
      {
        label: "🛡️ تجربه عملی مدیریت بحران دارم، خونسرد و راهبردی عمل می‌کنم",
        value: "crisis_experienced",
        score: 25,
      },
      {
        label: "💪 تحمل فشار بالایی دارم ولی تجربه عملی در انتخابات ندارم",
        value: "high_tolerance",
        score: 18,
      },
      {
        label: "😐 نسبتاً آرامم ولی شایعات و حملات اذیتم می‌کند",
        value: "moderate_tolerance",
        score: 10,
      },
      {
        label: "😰 در برابر انتقاد و فشار خیلی آسیب‌پذیرم",
        value: "vulnerable",
        score: 3,
      },
    ],
  },

  // ─── مرحله ۹: پیام و مزیت رقابتی ───
  {
    id: "competitiveEdge",
    title: "🎯 مزیت رقابتی",
    question:
      "آیا پیام (شعار) انتخاباتی شفاف و مزیت رقابتی مشخص نسبت به رقبا دارید؟\n\n" +
      "📌 پیام انتخاباتی = پاسخ به سؤال: «چرا مردم باید به من رأی بدهند؟»\n" +
      "این بُعد در تمایز شما از سایر کاندیداها نقش حیاتی دارد:",
    type: "choice",
    required: true,
    scored: true,
    options: [
      {
        label: "🎯 پیام شفاف + مزیت منحصربه‌فرد + برنامه عملیاتی مدون",
        value: "clear_unique_plan",
        score: 25,
      },
      {
        label: "📝 پیام نسبتاً مشخص دارم ولی تمایز واضحی با رقبا ندارم",
        value: "has_message",
        score: 16,
      },
      {
        label: "🤔 ایده‌هایی دارم ولی هنوز شعار و برنامه‌ای تدوین نکردم",
        value: "ideas_only",
        score: 8,
      },
      {
        label: "❓ هنوز فکری نکرده‌ام / نمی‌دانم پیامم چیست",
        value: "no_message",
        score: 2,
      },
    ],
  },
];

// ─── ثابت‌ها ───

/** شناسه مراحلی که امتیازدهی می‌شوند */
export const SCORED_STEP_IDS = STEPS
  .filter((s) => s.scored === true)
  .map((s) => s.id);
// → ["localBackground","socialCapital","teamResources","resilience","competitiveEdge"]

/** حداکثر امتیاز کل (۵ بُعد × ۲۵) */
export const MAX_SCORE = SCORED_STEP_IDS.length * 25; // 125

/** تعداد کل مراحل */
export const TOTAL_STEPS = STEPS.length; // 10

/** اموجی هر مرحله */
export const STEP_EMOJIS = STEPS.map((s) => {
  const m = s.title.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u);
  return m ? m[0] : "📝";
});

/** پیام خوش‌آمدگویی اصلی */
export const WELCOME_MESSAGE =
  "🏛️ *به ربات کاندیداتوری هوشمند خوش آمدید!*\n" +
  "━━━━━━━━━━━━━━━━━━━━━\n\n" +
  "این ربات با *۱۰ سؤال تخصصی*، میزان آمادگی شما را برای شرکت " +
  "در انتخابات تحلیل می‌کند و یک *گزارش جامع* ارائه می‌دهد.\n\n" +
  "📊 *امکانات ربات:*\n" +
  "├ تحلیل علمی آمادگی کاندیداتوری\n" +
  "├ گزارش تخصصی با امتیازدهی ۵ بُعدی\n" +
  "├ آموزش‌های تخصصی انتخاباتی\n" +
  "├ بسته‌های مشاوره حرفه‌ای\n" +
  "└ نمونه تحلیل‌های انجام‌شده\n\n" +
  "👇 از منوی زیر شروع کنید:";
