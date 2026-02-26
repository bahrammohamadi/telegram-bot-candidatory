// src/constants/deep_assessment.js
// ─── ماژول‌های ارزیابی عمیق کاندیدا (فاز ۲) ───
// این ارزیابی بعد از گزارش رایگان، به صورت اختیاری ارائه می‌شود
// شامل ۶ ماژول تخصصی با مجموع ۶۰۰ امتیاز

export const DEEP_MODULES = [

  // ═══════════════════════════════════════════
  //  ماژول ۱: هویت و روایت شخصی (Story Core)
  // ═══════════════════════════════════════════
  {
    id: "identity",
    emoji: "📖",
    title: "هویت و روایت شخصی",
    description: "تحلیل روایت شما از خودتان — اولین گام برندسازی سیاسی",
    maxScore: 100,
    steps: [
      {
        id: "identity_sentence",
        title: "📖 جمله معرفی",
        question:
          "یک جمله *حداکثر ۱۵ کلمه‌ای* درباره خودتان بنویسید.\n\n" +
          "📌 *نکته:* این جمله باید بتواند شما را به یک غریبه معرفی کند.\n" +
          "مثال: «مهندسی که ۱۰ سال عمرش را صرف آبادانی محله‌اش کرده»\n\n" +
          "💬 جمله خود را بنویسید:",
        type: "text",
        validation: "min_5",
        score: 0, // امتیازدهی توسط AI یا ادمین
      },
      {
        id: "identity_known_trait",
        title: "📖 ویژگی شاخص",
        question:
          "دوست دارید مردم شما را با *چه ویژگی‌ای* بشناسند؟\n\n" +
          "📌 فقط یک ویژگی — مهم‌ترین.\n" +
          "مثال: «صداقت»، «پیگیری»، «تخصص»، «جوانی و انرژی»",
        type: "text",
        validation: "min_2",
        score: 0,
      },
      {
        id: "identity_failure",
        title: "📖 بزرگ‌ترین شکست",
        question:
          "بزرگ‌ترین *شکست یا چالش* زندگی‌تان چه بوده و چه آموختید؟\n\n" +
          "📌 *چرا مهم است:*\n" +
          "رأی‌دهندگان به کسی اعتماد می‌کنند که بتواند از شکست‌هایش صحبت کند.\n" +
          "این نشان‌دهنده صداقت و بلوغ شماست.\n\n" +
          "💬 بنویسید:",
        type: "text",
        validation: "min_10",
        score: 0,
      },
      {
        id: "identity_achievement",
        title: "📖 بزرگ‌ترین دستاورد",
        question:
          "بزرگ‌ترین *دستاورد* زندگی حرفه‌ای یا اجتماعی شما چیست؟\n\n" +
          "📌 ترجیحاً مرتبط با خدمت عمومی باشد.",
        type: "text",
        validation: "min_10",
        score: 0,
      },
      {
        id: "identity_attack_point",
        title: "📖 نقطه حمله رقبا",
        question:
          "اگر رقیب بخواهد به شما *حمله* کند، از *چه نقطه‌ای* استفاده می‌کند؟\n\n" +
          "📌 *خیلی مهم:*\n" +
          "شناخت نقاط آسیب‌پذیر خودتان = آمادگی برای دفاع.\n" +
          "صادقانه بنویسید — این اطلاعات محرمانه‌اند.\n\n" +
          "💬 بنویسید:",
        type: "text",
        validation: "min_5",
        score: 0,
      },

      // ── صداقت روایی (لیکرت) ──
      {
        id: "honesty_q1",
        title: "📖 صداقت سیاسی — سؤال ۱",
        question:
          "📊 *شاخص صداقت سیاسی*\n\n" +
          "لطفاً میزان موافقت خود را با این جمله مشخص کنید:\n\n" +
          "💬 *«من همیشه حقیقت را حتی به ضرر خودم می‌گویم.»*",
        type: "choice",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 25 },
          { label: "4️⃣ موافقم", value: "4", score: 20 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 15 },
          { label: "2️⃣ مخالفم", value: "2", score: 10 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 5 },
        ],
      },
      {
        id: "honesty_q2",
        title: "📖 صداقت سیاسی — سؤال ۲",
        question:
          "💬 *«برای رسیدن به هدف بزرگ، گاهی باید واقعیت را مدیریت کرد.»*",
        type: "choice",
        options: [
          // امتیاز معکوس — موافقت = نشانه عدم صداقت
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 10 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 15 },
          { label: "2️⃣ مخالفم", value: "2", score: 20 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 25 },
        ],
      },
      {
        id: "honesty_q3",
        title: "📖 صداقت سیاسی — سؤال ۳",
        question:
          "💬 *«مردم همیشه ظرفیت شنیدن حقیقت کامل را ندارند.»*",
        type: "choice",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 10 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 15 },
          { label: "2️⃣ مخالفم", value: "2", score: 20 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 25 },
        ],
      },
      {
        id: "honesty_q4",
        title: "📖 صداقت سیاسی — سؤال ۴",
        question:
          "💬 *«تصویر عمومی مهم‌تر از واقعیت شخصی است.»*",
        type: "choice",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 10 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 15 },
          { label: "2️⃣ مخالفم", value: "2", score: 20 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 25 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  //  ماژول ۲: شخصیت انتخاباتی (Candidate Persona Index)
  // ═══════════════════════════════════════════
  {
    id: "personality",
    emoji: "🧠",
    title: "تست شخصیت انتخاباتی",
    description: "شاخص شخصیت کاندیدا — ترکیب ۵ بُعد روان‌شناختی",
    maxScore: 100,
    steps: [
      // ── 2-1: برون‌گرایی سیاسی ──
      {
        id: "ext_q1",
        title: "🧠 برون‌گرایی — ۱",
        question:
          "📊 *بُعد ۱: برون‌گرایی سیاسی*\n\n" +
          "💬 *«در جمع‌های ناآشنا سریع شروع به صحبت می‌کنم.»*",
        type: "choice",
        dimension: "extroversion",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "ext_q2",
        title: "🧠 برون‌گرایی — ۲",
        question: "💬 *«از حضور در مناظره لذت می‌برم.»*",
        type: "choice",
        dimension: "extroversion",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "ext_q3",
        title: "🧠 برون‌گرایی — ۳",
        question: "💬 *«انرژی من از تعامل با مردم تأمین می‌شود.»*",
        type: "choice",
        dimension: "extroversion",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },

      // ── 2-2: ثبات هیجانی ──
      {
        id: "stab_q1",
        title: "🧠 ثبات هیجانی — ۱",
        question:
          "📊 *بُعد ۲: ثبات هیجانی*\n\n" +
          "💬 *«تحت فشار رسانه‌ای تمرکز خود را از دست نمی‌دهم.»*",
        type: "choice",
        dimension: "stability",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "stab_q2",
        title: "🧠 ثبات هیجانی — ۲",
        question: "💬 *«انتقاد تند مرا عصبی نمی‌کند.»*",
        type: "choice",
        dimension: "stability",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "stab_q3",
        title: "🧠 ثبات هیجانی — ۳",
        question: "💬 *«بعد از حمله رسانه‌ای سریع ریکاوری می‌کنم.»*",
        type: "choice",
        dimension: "stability",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },

      // ── 2-3: ریسک‌پذیری ──
      {
        id: "risk_q1",
        title: "🧠 ریسک‌پذیری — ۱",
        question:
          "📊 *بُعد ۳: ریسک‌پذیری*\n\n" +
          "💬 *«تصمیم‌های بزرگ را حتی با اطلاعات ناقص می‌گیرم.»*",
        type: "choice",
        dimension: "risk_taking",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "risk_q2",
        title: "🧠 ریسک‌پذیری — ۲",
        question: "💬 *«از ورود به رقابت‌های پرتنش نمی‌ترسم.»*",
        type: "choice",
        dimension: "risk_taking",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "risk_q3",
        title: "🧠 ریسک‌پذیری — ۳",
        question: "💬 *«گاهی شهودی تصمیم می‌گیرم.»*",
        type: "choice",
        dimension: "risk_taking",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },

      // ── 2-4: خودمحوری (شاخص خطر — معکوس) ──
      {
        id: "ego_q1",
        title: "🧠 خودمحوری — ۱",
        question:
          "📊 *بُعد ۴: خودمحوری سیاسی* ⚠️ شاخص خطر\n\n" +
          "💬 *«معتقدم اکثر افراد توان مدیریت ندارند.»*",
        type: "choice",
        dimension: "ego",
        options: [
          // معکوس: موافقت = خطر بالا
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 1 },
          { label: "4️⃣ موافقم", value: "4", score: 2 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 4 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 5 },
        ],
      },
      {
        id: "ego_q2",
        title: "🧠 خودمحوری — ۲",
        question: "💬 *«من بهتر از اکثر مدیران فکر می‌کنم.»*",
        type: "choice",
        dimension: "ego",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 1 },
          { label: "4️⃣ موافقم", value: "4", score: 2 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 4 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 5 },
        ],
      },
      {
        id: "ego_q3",
        title: "🧠 خودمحوری — ۳",
        question: "💬 *«اگر کنترل کامل نداشته باشم ناراحت می‌شوم.»*",
        type: "choice",
        dimension: "ego",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 1 },
          { label: "4️⃣ موافقم", value: "4", score: 2 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 4 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 5 },
        ],
      },

      // ── 2-5: انعطاف‌پذیری ──
      {
        id: "flex_q1",
        title: "🧠 انعطاف‌پذیری — ۱",
        question:
          "📊 *بُعد ۵: انعطاف‌پذیری*\n\n" +
          "💬 *«اگر استراتژی جواب ندهد سریع تغییر می‌دهم.»*",
        type: "choice",
        dimension: "flexibility",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "flex_q2",
        title: "🧠 انعطاف‌پذیری — ۲",
        question: "💬 *«به تیمم اجازه مخالفت جدی می‌دهم.»*",
        type: "choice",
        dimension: "flexibility",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
      {
        id: "flex_q3",
        title: "🧠 انعطاف‌پذیری — ۳",
        question: "💬 *«نظرم ممکن است با داده جدید تغییر کند.»*",
        type: "choice",
        dimension: "flexibility",
        options: [
          { label: "5️⃣ کاملاً موافقم", value: "5", score: 5 },
          { label: "4️⃣ موافقم", value: "4", score: 4 },
          { label: "3️⃣ نظری ندارم", value: "3", score: 3 },
          { label: "2️⃣ مخالفم", value: "2", score: 2 },
          { label: "1️⃣ کاملاً مخالفم", value: "1", score: 1 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  //  ماژول ۳: رفتار در بحران (سناریو محور)
  // ═══════════════════════════════════════════
  {
    id: "crisis",
    emoji: "🛡️",
    title: "تحلیل رفتار در بحران",
    description: "واکنش شما در ۳ سناریوی واقعی انتخاباتی",
    maxScore: 100,
    steps: [
      {
        id: "crisis_scenario1",
        title: "🛡️ سناریو ۱: ویدیوی ناقص",
        question:
          "🛡️ *سناریوی بحران ۱*\n" +
          "━━━━━━━━━━━━━━━━━━━\n\n" +
          "📹 یک *ویدیو از شما* در فضای مجازی منتشر شده که *ناقص و برش‌خورده* است " +
          "و *برداشت منفی* ایجاد کرده.\n\n" +
          "ویدیو در گروه‌های محلی دست‌به‌دست می‌شود و تعداد زیادی آن را دیده‌اند.\n\n" +
          "*واکنش فوری شما چیست؟*",
        type: "choice",
        options: [
          {
            label: "🅰️ تکذیب کامل — «ویدیو جعلی و مونتاژ است»",
            value: "A",
            score: 10,
            analysis: "ریسک بالا — اگر ویدیو واقعی باشد اعتبار شما نابود می‌شود",
          },
          {
            label: "🅱️ سکوت — واکنش نشان نمی‌دهم",
            value: "B",
            score: 5,
            analysis: "خطرناک — سکوت معمولاً به معنای تأیید تلقی می‌شود",
          },
          {
            label: "🅲 توضیح شفاف — ویدیوی کامل + توضیح زمینه",
            value: "C",
            score: 30,
            analysis: "خوب — شفافیت اعتمادساز است ولی باید سریع اقدام شود",
          },
          {
            label: "🅳 حمله متقابل — افشای ویدیویی از رقیب",
            value: "D",
            score: 3,
            analysis: "خطرناک — جنگ تبلیغاتی معمولاً هر دو طرف را تخریب می‌کند",
          },
          {
            label: "🅴 مشورت تیمی + پاسخ مرحله‌ای و مستند",
            value: "E",
            score: 35,
            analysis: "بهترین — حرفه‌ای‌ترین واکنش ممکن",
          },
        ],
      },
      {
        id: "crisis_scenario2",
        title: "🛡️ سناریو ۲: اتهام بی‌سند",
        question:
          "🛡️ *سناریوی بحران ۲*\n" +
          "━━━━━━━━━━━━━━━━━━━\n\n" +
          "📰 یک کانال محلی پرمخاطب شما را به *فساد مالی* متهم کرده *بدون هیچ سندی*.\n\n" +
          "خبر به سرعت در حال پخش است و مردم سؤال‌هایی می‌پرسند.\n\n" +
          "*واکنش شما چیست؟*\n\n" +
          "💬 لطفاً با جزئیات بنویسید — *حداقل ۲ جمله:*",
        type: "text",
        validation: "min_20",
        score: 0, // امتیازدهی بر اساس کیفیت پاسخ
      },
      {
        id: "crisis_scenario3",
        title: "🛡️ سناریو ۳: حمله شخصی",
        question:
          "🛡️ *سناریوی بحران ۳*\n" +
          "━━━━━━━━━━━━━━━━━━━\n\n" +
          "🎤 در یک جلسه عمومی، رقیب جلوی جمع *به خانواده شما حمله شخصی* می‌کند.\n\n" +
          "همه نگاه‌ها به شماست. باید *همین الان* واکنش نشان دهید.\n\n" +
          "*واکنش فوری شما:*",
        type: "choice",
        options: [
          {
            label: "😡 پاسخ تند و عصبانی — دفاع شدید از خانواده",
            value: "angry",
            score: 5,
            analysis: "ریسک بالا — عصبانیت در جمع = باخت",
          },
          {
            label: "🧊 خونسردی — «بحث ما عملکرد و برنامه‌هاست، نه خانواده»",
            value: "calm_redirect",
            score: 35,
            analysis: "عالی — بلوغ سیاسی بالا و تبدیل حمله به مزیت",
          },
          {
            label: "😢 سکوت و ترک جلسه",
            value: "leave",
            score: 3,
            analysis: "ضعیف — نشان‌دهنده ناتوانی در مدیریت فشار",
          },
          {
            label: "🤝 پاسخ محترمانه + درخواست عذرخواهی عمومی از رقیب",
            value: "polite_demand",
            score: 28,
            analysis: "خوب — ولی ممکن است ضعف تلقی شود",
          },
          {
            label: "📱 فیلم‌برداری + شکایت رسمی بعداً",
            value: "document",
            score: 20,
            analysis: "متوسط — حقوقی درست ولی واکنش لحظه‌ای ندارد",
          },
        ],
      },
      {
        id: "crisis_scenario3_explain",
        title: "🛡️ توضیح واکنش",
        question:
          "💬 لطفاً *دقیقاً چه جمله‌ای* به رقیب می‌گویید را بنویسید:\n\n" +
          "📌 تصور کنید الان جلوی ۲۰۰ نفر ایستاده‌اید.",
        type: "text",
        validation: "min_10",
        score: 0,
      },
    ],
  },

  // ═══════════════════════════════════════════
  //  ماژول ۴: آمادگی رسانه‌ای و مناظره
  // ═══════════════════════════════════════════
  {
    id: "media_readiness",
    emoji: "🎤",
    title: "آمادگی رسانه‌ای و مناظره",
    description: "ارزیابی توانایی حضور رسانه‌ای و مناظره",
    maxScore: 100,
    steps: [
      {
        id: "media_debate_ready",
        title: "🎤 آمادگی مناظره",
        question:
          "🎤 *خودارزیابی آمادگی رسانه‌ای*\n\n" +
          "از ۱ تا ۱۰ چقدر خود را برای *مناظره زنده* آماده می‌دانید؟",
        type: "choice",
        options: [
          { label: "🟢 ۹–۱۰ | کاملاً آماده‌ام", value: "9_10", score: 25 },
          { label: "🔵 ۷–۸ | نسبتاً آماده‌ام", value: "7_8", score: 20 },
          { label: "🟡 ۵–۶ | متوسط", value: "5_6", score: 13 },
          { label: "🟠 ۳–۴ | ضعیف", value: "3_4", score: 6 },
          { label: "🔴 ۱–۲ | اصلاً آماده نیستم", value: "1_2", score: 2 },
        ],
      },
      {
        id: "media_training",
        title: "🎤 تمرین رسانه‌ای",
        question:
          "چند بار *تمرین رسانه‌ای* (مصاحبه تمرینی، تمرین سخنرانی، کلاس فن بیان) داشته‌اید؟",
        type: "choice",
        options: [
          { label: "🏆 بیش از ۱۰ بار", value: "10plus", score: 25 },
          { label: "✅ ۵ تا ۱۰ بار", value: "5_10", score: 18 },
          { label: "👌 ۲ تا ۴ بار", value: "2_4", score: 10 },
          { label: "1️⃣ یک بار", value: "once", score: 5 },
          { label: "❌ هرگز", value: "never", score: 1 },
        ],
      },
      {
        id: "media_live_exp",
        title: "🎤 تجربه زنده",
        question: "آیا سابقه *مصاحبه زنده* (تلویزیون، رادیو، لایو اینستاگرام) دارید؟",
        type: "choice",
        options: [
          { label: "✅ بله، چندین بار", value: "multiple", score: 25 },
          { label: "👌 بله، یکی دو بار", value: "few", score: 15 },
          { label: "❌ خیر", value: "no", score: 3 },
        ],
      },
      {
        id: "media_weakness",
        title: "🎤 ضعف اصلی",
        question:
          "در صحبت عمومی، *بیشترین ضعف* شما کدام است?\n\n" +
          "📌 صادقانه انتخاب کنید — شناخت ضعف = اولین قدم رفع آن:",
        type: "choice",
        options: [
          {
            label: "⏱️ طولانی و بی‌هدف صحبت می‌کنم",
            value: "long_talk",
            score: 10,
          },
          {
            label: "😤 زیر فشار عصبی/هیجانی می‌شوم",
            value: "nervous",
            score: 8,
          },
          {
            label: "☁️ کلی‌گویی می‌کنم و مشخص حرف نمی‌زنم",
            value: "vague",
            score: 12,
          },
          {
            label: "🎯 در برابر حمله، حمله‌پذیر هستم",
            value: "vulnerable",
            score: 5,
          },
          {
            label: "✋ حرف دیگران را قطع می‌کنم",
            value: "interrupting",
            score: 7,
          },
          {
            label: "✅ ضعف خاصی ندارم!",
            value: "no_weakness",
            score: 3, // کسی که ضعف خود را نمی‌شناسد!
          },
        ],
      },
      {
        id: "media_past_mistake",
        title: "🎤 اشتباه گذشته",
        question:
          "آیا قبلاً *جمله‌ای در جمع گفته‌اید* که بعداً علیه شما استفاده شده یا پشیمان شدید؟\n\n" +
          "💬 اگر بله، توضیح دهید. اگر نه، بنویسید «خیر»:",
        type: "text",
        validation: "min_2",
        score: 0,
      },
    ],
  },

  // ═══════════════════════════════════════════
  //  ماژول ۵: استراتژی کمپین
  // ═══════════════════════════════════════════
  {
    id: "campaign_strategy",
    emoji: "🎯",
    title: "ارزیابی استراتژیک کمپین",
    description: "بررسی انسجام پیام، شناخت جامعه هدف و ساختار تیم",
    maxScore: 100,
    steps: [
      // ── شناخت جامعه هدف ──
      {
        id: "strategy_target",
        title: "🎯 جامعه هدف",
        question:
          "🎯 *شناخت جامعه هدف*\n\n" +
          "*جامعه هدف اصلی* شما چه قشری از مردم حوزه هستند؟\n\n" +
          "💬 مشخص بنویسید (مثال: «جوانان ۲۰–۳۵ ساله»، «کشاورزان»، «بانوان»، «بازنشستگان»):",
        type: "text",
        validation: "min_3",
        score: 0,
      },
      {
        id: "strategy_pain",
        title: "🎯 درد اصلی مردم",
        question:
          "*مهم‌ترین مشکل/درد* جامعه هدف شما چیست؟\n\n" +
          "📌 فقط *یک مشکل اصلی* — نه لیست!\n" +
          "💬 بنویسید:",
        type: "text",
        validation: "min_5",
        score: 0,
      },
      {
        id: "strategy_plan",
        title: "🎯 برنامه عملیاتی",
        question:
          "*برنامه مشخص شما* برای حل آن مشکل چیست؟\n\n" +
          "📌 عملیاتی و قابل اجرا بنویسید — نه شعار:\n" +
          "💬 بنویسید:",
        type: "text",
        validation: "min_10",
        score: 0,
      },

      // ── انسجام پیام ──
      {
        id: "strategy_slogan",
        title: "🎯 شعار اصلی",
        question:
          "*شعار اصلی* انتخاباتی شما چیست?\n\n" +
          "📌 اگر هنوز نهایی نشده، شعار فعلی یا ایده‌تان را بنویسید:\n" +
          "💬 بنویسید:",
        type: "text",
        validation: "min_3",
        score: 0,
      },
      {
        id: "strategy_single_issue",
        title: "🎯 تک‌مسئله",
        question:
          "اگر مجبور باشید فقط *یک موضوع* را پیگیری کنید، چیست؟\n\n" +
          "💬 بنویسید:",
        type: "text",
        validation: "min_3",
        score: 0,
      },
      {
        id: "strategy_priorities",
        title: "🎯 سه اولویت",
        question:
          "*سه اولویت اجرایی* شما در صورت انتخاب شدن چیست؟\n\n" +
          "💬 هر کدام را در یک خط بنویسید:\n" +
          "مثال:\n" +
          "1. آسفالت معابر فرعی\n" +
          "2. ساخت فضای سبز\n" +
          "3. شفافیت بودجه شورا",
        type: "text",
        validation: "min_10",
        score: 0,
      },

      // ── تیم و ساختار ──
      {
        id: "strategy_team_size",
        title: "🎯 تعداد تیم",
        question:
          "⚙️ *ساختار تصمیم‌گیری*\n\n" +
          "چند نفر در *هسته تصمیم‌گیری* کمپین شما هستند؟",
        type: "choice",
        options: [
          { label: "👥 ۵+ نفر (تیم کامل)", value: "5plus", score: 25 },
          { label: "👤👤 ۳–۴ نفر", value: "3_4", score: 18 },
          { label: "👤 ۱–۲ نفر", value: "1_2", score: 8 },
          { label: "🙋 فقط خودم", value: "solo", score: 2 },
        ],
      },
      {
        id: "strategy_decision",
        title: "🎯 تصمیم‌گیری",
        question: "*تصمیم نهایی* در کمپین با کیست؟",
        type: "choice",
        options: [
          {
            label: "👥 تیمی — با رأی‌گیری و مشورت",
            value: "team",
            score: 25,
          },
          {
            label: "🤝 مشورتی — ولی تصمیم نهایی با خودم",
            value: "consultative",
            score: 20,
          },
          {
            label: "🙋 فقط خودم تصمیم می‌گیرم",
            value: "solo",
            score: 5,
          },
        ],
      },
      {
        id: "strategy_media_advisor",
        title: "🎯 مشاور رسانه‌ای",
        question: "آیا *مشاور رسانه‌ای حرفه‌ای* دارید؟",
        type: "choice",
        options: [
          { label: "✅ بله، حرفه‌ای و باتجربه", value: "yes_pro", score: 25 },
          { label: "👌 بله، ولی آماتور/دوست", value: "yes_amateur", score: 12 },
          { label: "❌ خیر", value: "no", score: 2 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  //  ماژول ۶: شبیه‌ساز مناظره (۵ سؤال چالشی)
  // ═══════════════════════════════════════════
  {
    id: "debate_sim",
    emoji: "⚔️",
    title: "شبیه‌ساز مناظره",
    description: "۵ سؤال چالشی که رقبا یا خبرنگاران ممکن است بپرسند",
    maxScore: 100,
    steps: [
      {
        id: "debate_q1",
        title: "⚔️ چالش ۱: اعتماد",
        question:
          "⚔️ *شبیه‌ساز مناظره*\n" +
          "━━━━━━━━━━━━━━━━━━━\n\n" +
          "🎤 _یک خبرنگار محلی از شما می‌پرسد:_\n\n" +
          "❓ *«چرا مردم باید به شما اعتماد کنند وقتی هیچ سابقه اجرایی مستقیمی ندارید؟»*\n\n" +
          "💬 پاسخ شما (تصور کنید جلوی دوربین هستید):",
        type: "text",
        validation: "min_15",
        score: 0, // ارزیابی کیفی
      },
      {
        id: "debate_q2",
        title: "⚔️ چالش ۲: وعده‌ها",
        question:
          "🎤 _رقیب شما در مناظره می‌گوید:_\n\n" +
          "❓ *«وعده‌های شما همه شعار است. اگر عملی نشود چه می‌کنید؟ استعفا می‌دهید؟»*\n\n" +
          "💬 پاسخ شما:",
        type: "text",
        validation: "min_15",
        score: 0,
      },
      {
        id: "debate_q3",
        title: "⚔️ چالش ۳: رقیب",
        question:
          "🎤 _مجری از شما می‌پرسد:_\n\n" +
          "❓ *«به‌نظر شما چرا رقیب اصلی‌تان گزینه بهتری نیست؟ بدون تخریب پاسخ دهید.»*\n\n" +
          "💬 پاسخ شما:",
        type: "text",
        validation: "min_15",
        score: 0,
      },
      {
        id: "debate_q4",
        title: "⚔️ چالش ۴: بودجه",
        question:
          "🎤 _یک شهروند می‌پرسد:_\n\n" +
          "❓ *«بودجه شورا محدود است. شما از کجا می‌خواهید پول پروژه‌هایتان را تأمین کنید؟»*\n\n" +
          "💬 پاسخ شما:",
        type: "text",
        validation: "min_15",
        score: 0,
      },
      {
        id: "debate_q5",
        title: "⚔️ چالش ۵: انگیزه",
        question:
          "🎤 _منتقدی می‌پرسد:_\n\n" +
          "❓ *«بعضی‌ها می‌گویند شما برای منافع شخصی کاندیدا شده‌اید نه خدمت. پاسخ شما چیست؟»*\n\n" +
          "💬 پاسخ شما:",
        type: "text",
        validation: "min_15",
        score: 0,
      },
    ],
  },
];

// ═══════════════════════════════════════════
//  ثابت‌ها
// ═══════════════════════════════════════════

// تعداد کل استپ‌های ارزیابی عمیق
export const DEEP_TOTAL_STEPS = DEEP_MODULES.reduce(
  (sum, mod) => sum + mod.steps.length,
  0
);

// حداکثر امتیاز ممکن ارزیابی عمیق
export const DEEP_MAX_SCORE = DEEP_MODULES.reduce(
  (sum, mod) => sum + mod.maxScore,
  0
); // 600

// لیست ابعاد شخصیتی
export const PERSONALITY_DIMENSIONS = [
  { id: "extroversion", title: "برون‌گرایی سیاسی", emoji: "🗣️" },
  { id: "stability", title: "ثبات هیجانی", emoji: "🧊" },
  { id: "risk_taking", title: "ریسک‌پذیری", emoji: "🎲" },
  { id: "ego", title: "خودمحوری (خطر)", emoji: "⚠️" },
  { id: "flexibility", title: "انعطاف‌پذیری", emoji: "🔄" },
];
