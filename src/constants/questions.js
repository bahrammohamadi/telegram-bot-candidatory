// ============================================================
// 📋 سوالات ۳۰ مرحله‌ای مشاوره کاندیداتوری
// ۶ بخش: A پروفایل | B سرمایه اجتماعی | C منابع | D شخصیت | E رقابت | F ریسک
// ============================================================

export const STEPS = [
  // ═══════════════════════════════════════
  // 🔹 بخش A — پروفایل فردی (سوال ۱ تا ۸)
  // ═══════════════════════════════════════
  {
    key: "fullName",
    section: "A",
    question: "👤 *بخش A — پروفایل فردی (۱/۸)*\n\nلطفاً *نام و نام خانوادگی کامل* خود را وارد کنید:",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "age",
    section: "A",
    question: "🎂 *بخش A — پروفایل فردی (۲/۸)*\n\nسن شما چند سال است؟",
    type: "inline",
    options: [
      { text: "۲۵ تا ۳۵ سال", data: "25-35", score: 5 },
      { text: "۳۶ تا ۴۵ سال", data: "36-45", score: 10 },
      { text: "۴۶ تا ۵۵ سال", data: "46-55", score: 15 },
      { text: "۵۶ تا ۶۵ سال", data: "56-65", score: 10 },
      { text: "بالای ۶۵ سال", data: "65+", score: 5 },
    ],
    scoreWeight: 1,
  },
  {
    key: "region",
    section: "A",
    question: "📍 *بخش A — پروفایل فردی (۳/۸)*\n\nحوزه انتخابیه خود را بنویسید:\n_(استان + شهر دقیق)_\n\nمثال: _فارس، شیراز_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "residencyYears",
    section: "A",
    question: "🏠 *بخش A — پروفایل فردی (۴/۸)*\n\nچند سال در حوزه انتخابیه خود سکونت دارید؟",
    type: "inline",
    options: [
      { text: "کمتر از ۵ سال", data: "under5", score: 3 },
      { text: "۵ تا ۱۰ سال", data: "5-10", score: 7 },
      { text: "۱۰ تا ۲۰ سال", data: "10-20", score: 12 },
      { text: "بیش از ۲۰ سال (بومی)", data: "20+", score: 18 },
    ],
    scoreWeight: 1,
  },
  {
    key: "education",
    section: "A",
    question: "🎓 *بخش A — پروفایل فردی (۵/۸)*\n\nتحصیلات خود را بنویسید:\n_(مدرک + رشته + دانشگاه)_\n\nمثال: _کارشناسی ارشد مدیریت، دانشگاه تهران_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "currentJob",
    section: "A",
    question: "💼 *بخش A — پروفایل فردی (۶/۸)*\n\nشغل فعلی خود را بنویسید:",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "pastPositions",
    section: "A",
    question: "📜 *بخش A — پروفایل فردی (۷/۸)*\n\nسه شغل یا مسئولیت مهم گذشته خود را بنویسید:\n_(هر کدام در یک خط)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "politicalAffiliation",
    section: "A",
    question: "🏛️ *بخش A — پروفایل فردی (۸/۸)*\n\nآیا وابستگی سیاسی رسمی دارید؟",
    type: "inline",
    options: [
      { text: "❌ خیر، مستقل هستم", data: "independent", score: 10 },
      { text: "✅ بله، عضو حزب/جریان", data: "affiliated", score: 8 },
      { text: "🔄 سابقاً بله، الان خیر", data: "former", score: 6 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // 🔹 بخش B — سرمایه اجتماعی (سوال ۹ تا ۱۳)
  // ═══════════════════════════════════════
  {
    key: "recognition",
    section: "B",
    question: "👁️ *بخش B — سرمایه اجتماعی (۱/۵)*\n\nمیزان شناخته‌شده بودن شما در حوزه انتخابیه؟",
    type: "inline",
    options: [
      { text: "🔴 تقریباً ناشناخته", data: "unknown", score: 2 },
      { text: "🟠 شناخته‌شده محدود", data: "limited", score: 8 },
      { text: "🟡 تا حدی شناخته‌شده", data: "moderate", score: 15 },
      { text: "🟢 بسیار شناخته‌شده", data: "well_known", score: 25 },
    ],
    scoreWeight: 2,
  },
  {
    key: "firstWeekSupporters",
    section: "B",
    question: "🤝 *بخش B — سرمایه اجتماعی (۲/۵)*\n\nدر صورت اعلام کاندیداتوری، چند نفر در *۷ روز اول* علناً حمایت می‌کنند؟",
    type: "inline",
    options: [
      { text: "کمتر از ۵۰ نفر", data: "under50", score: 3 },
      { text: "۵۰ تا ۲۰۰ نفر", data: "50-200", score: 8 },
      { text: "۲۰۰ تا ۱۰۰۰ نفر", data: "200-1000", score: 15 },
      { text: "بیش از ۱۰۰۰ نفر", data: "1000+", score: 22 },
    ],
    scoreWeight: 2,
  },
  {
    key: "traditionalBase",
    section: "B",
    question: "🏘️ *بخش B — سرمایه اجتماعی (۳/۵)*\n\nآیا پایگاه رأی سنتی دارید؟\n_(قوم، صنف، مسجد، شبکه اقتصادی...)_",
    type: "inline",
    options: [
      { text: "❌ خیر، ندارم", data: "none", score: 0 },
      { text: "📝 بله، محدود و کوچک", data: "small", score: 8 },
      { text: "✅ بله، قوی و گسترده", data: "strong", score: 18 },
    ],
    scoreWeight: 1,
  },
  {
    key: "volunteers",
    section: "B",
    question: "👥 *بخش B — سرمایه اجتماعی (۴/۵)*\n\nچند نفر نیروی *داوطلب فعال* دارید؟",
    type: "inline",
    options: [
      { text: "هیچ نیرویی ندارم", data: "none", score: 0 },
      { text: "۱ تا ۱۰ نفر", data: "1-10", score: 5 },
      { text: "۱۰ تا ۵۰ نفر", data: "10-50", score: 12 },
      { text: "بیش از ۵۰ نفر", data: "50+", score: 20 },
    ],
    scoreWeight: 1,
  },
  {
    key: "electionExperience",
    section: "B",
    question: "🗳️ *بخش B — سرمایه اجتماعی (۵/۵)*\n\nآیا قبلاً در انتخابات شرکت کرده‌اید؟",
    type: "inline",
    options: [
      { text: "❌ هرگز", data: "never", score: 0 },
      { text: "📝 بله، اما رأی نیاوردم", data: "lost", score: 8 },
      { text: "✅ بله، و رأی آوردم", data: "won", score: 20 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // 🔹 بخش C — منابع و زیرساخت (سوال ۱۴ تا ۱۸)
  // ═══════════════════════════════════════
  {
    key: "budget",
    section: "C",
    question: "💰 *بخش C — منابع و زیرساخت (۱/۵)*\n\nبودجه تقریبی کمپین انتخاباتی شما؟",
    type: "inline",
    options: [
      { text: "💵 کمتر از ۵۰۰ میلیون", data: "under500m", score: 3 },
      { text: "💰 ۵۰۰ میلیون تا ۱ میلیارد", data: "500m-1b", score: 8 },
      { text: "💎 ۱ تا ۵ میلیارد", data: "1-5b", score: 18 },
      { text: "🏦 بیش از ۵ میلیارد", data: "5b+", score: 25 },
    ],
    scoreWeight: 2,
  },
  {
    key: "mediaTeam",
    section: "C",
    question: "📱 *بخش C — منابع و زیرساخت (۲/۵)*\n\nآیا تیم رسانه‌ای دارید؟",
    type: "inline",
    options: [
      { text: "❌ ندارم", data: "none", score: 0 },
      { text: "📝 محدود و غیرحرفه‌ای", data: "basic", score: 5 },
      { text: "✅ حرفه‌ای و فعال", data: "professional", score: 15 },
    ],
    scoreWeight: 1,
  },
  {
    key: "campaignManager",
    section: "C",
    question: "👔 *بخش C — منابع و زیرساخت (۳/۵)*\n\nآیا مدیر کمپین مشخص دارید؟",
    type: "inline",
    options: [
      { text: "❌ خیر", data: "no", score: 0 },
      { text: "🔄 در حال بررسی", data: "considering", score: 5 },
      { text: "✅ بله، مشخص شده", data: "yes", score: 12 },
    ],
    scoreWeight: 1,
  },
  {
    key: "headquarters",
    section: "C",
    question: "🏢 *بخش C — منابع و زیرساخت (۴/۵)*\n\nآیا ستاد مرکزی مشخص کرده‌اید؟",
    type: "inline",
    options: [
      { text: "❌ خیر", data: "no", score: 0 },
      { text: "🔄 در حال آماده‌سازی", data: "preparing", score: 5 },
      { text: "✅ بله، فعال است", data: "yes", score: 10 },
    ],
    scoreWeight: 1,
  },
  {
    key: "fieldPresence",
    section: "C",
    question: "🚶 *بخش C — منابع و زیرساخت (۵/۵)*\n\nتوانایی حضور مستمر میدانی *روزانه* دارید؟",
    type: "inline",
    options: [
      { text: "❌ خیر، محدود", data: "limited", score: 3 },
      { text: "🔄 چند روز در هفته", data: "partial", score: 8 },
      { text: "✅ بله، تمام‌وقت", data: "fulltime", score: 15 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // 🔹 بخش D — شخصیت و رهبری (سوال ۱۹ تا ۲۲)
  // ═══════════════════════════════════════
  {
    key: "criticismReaction",
    section: "D",
    question: "🎭 *بخش D — شخصیت و رهبری (۱/۴)*\n\nدر مواجهه با *انتقاد شدید* چه واکنشی نشان می‌دهید؟",
    type: "inline",
    options: [
      { text: "⚡ سریع پاسخ می‌دهم", data: "quick_response", score: 5 },
      { text: "🤫 سکوت می‌کنم", data: "silence", score: 3 },
      { text: "🤝 مشورت می‌کنم و بعد پاسخ", data: "consult", score: 12 },
      { text: "😤 عصبی می‌شوم", data: "angry", score: 0 },
    ],
    scoreWeight: 1,
  },
  {
    key: "biggestWeakness",
    section: "D",
    question: "🪞 *بخش D — شخصیت و رهبری (۲/۴)*\n\n*بزرگ‌ترین ضعف شخصیتی* خود را صادقانه بنویسید:\n_(این اطلاعات محرمانه باقی می‌ماند)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "failureExperience",
    section: "D",
    question: "📉 *بخش D — شخصیت و رهبری (۳/۴)*\n\nتا به حال *شکست بزرگی* داشته‌اید؟ چگونه مدیریت کردید؟\n_(مختصر بنویسید)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "decisionStyle",
    section: "D",
    question: "🧠 *بخش D — شخصیت و رهبری (۴/۴)*\n\nتصمیم‌گیری شما بیشتر مبتنی بر چیست؟",
    type: "inline",
    options: [
      { text: "📊 داده و تحلیل", data: "data", score: 12 },
      { text: "❤️ احساس و شهود", data: "emotion", score: 5 },
      { text: "👥 فشار اطرافیان", data: "pressure", score: 2 },
      { text: "🏛️ تحلیل سیاسی", data: "political", score: 10 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // 🔹 بخش E — پیام و جایگاه رقابتی (سوال ۲۳ تا ۲۷)
  // ═══════════════════════════════════════
  {
    key: "slogan",
    section: "E",
    question: "📢 *بخش E — پیام و رقابت (۱/۵)*\n\nشعار احتمالی کمپین شما چیست؟\n_(یک جمله کوتاه بنویسید)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "topProblems",
    section: "E",
    question: "🔍 *بخش E — پیام و رقابت (۲/۵)*\n\n*سه مشکل اصلی* حوزه انتخابیه از نگاه شما چیست؟\n_(هر مشکل در یک خط)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "whyVoteForYou",
    section: "E",
    question: "🏆 *بخش E — پیام و رقابت (۳/۵)*\n\n*چرا مردم باید به شما رأی بدهند* نه رقیب؟\n_(مختصر و قانع‌کننده بنویسید)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "biggestCompetitor",
    section: "E",
    question: "⚔️ *بخش E — پیام و رقابت (۴/۵)*\n\nبزرگ‌ترین رقیب شما کیست؟\n_(نام یا توصیف)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "competitorWeakness",
    section: "E",
    question: "🎯 *بخش E — پیام و رقابت (۵/۵)*\n\nنقطه ضعف اصلی رقیب شما چیست؟",
    type: "text",
    options: [],
    scoreWeight: 0,
  },

  // ═══════════════════════════════════════
  // 🔹 بخش F — ریسک‌ها (سوال ۲۸ تا ۳۰)
  // ═══════════════════════════════════════
  {
    key: "vulnerabilities",
    section: "F",
    question: "⚠️ *بخش F — ریسک‌ها (۱/۳)*\n\nآیا پرونده، حاشیه یا *نقطه آسیب‌پذیر* دارید؟",
    type: "inline",
    options: [
      { text: "✅ خیر، کاملاً پاک", data: "clean", score: 15 },
      { text: "⚠️ موارد جزئی", data: "minor", score: 7 },
      { text: "🔴 بله، موارد جدی", data: "serious", score: 0 },
    ],
    scoreWeight: 2,
  },
  {
    key: "mediaAttackAngle",
    section: "F",
    question: "📰 *بخش F — ریسک‌ها (۲/۳)*\n\nاگر علیه شما *موج رسانه‌ای* ساخته شود، از کدام زاویه خواهد بود؟\n_(مختصر بنویسید)_",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "stressTolerance",
    section: "F",
    question: "💪 *بخش F — ریسک‌ها (۳/۳)*\n\nمیزان تحمل فشار روانی شما چقدر است؟",
    type: "inline",
    options: [
      { text: "۱-۳ (پایین)", data: "low", score: 3 },
      { text: "۴-۶ (متوسط)", data: "medium", score: 8 },
      { text: "۷-۸ (بالا)", data: "high", score: 13 },
      { text: "۹-۱۰ (فوق‌العاده)", data: "extreme", score: 18 },
    ],
    scoreWeight: 1,
  },
];

// ایموجی بخش‌ها
export const SECTION_LABELS = {
  A: "👤 پروفایل فردی",
  B: "🤝 سرمایه اجتماعی",
  C: "💰 منابع و زیرساخت",
  D: "🎭 شخصیت و رهبری",
  E: "📢 پیام و رقابت",
  F: "⚠️ ریسک‌ها",
};

// لیبل فارسی گزینه‌ها
export const OPTION_LABELS = {
  // Age
  "25-35": "۲۵ تا ۳۵ سال", "36-45": "۳۶ تا ۴۵ سال", "46-55": "۴۶ تا ۵۵ سال",
  "56-65": "۵۶ تا ۶۵ سال", "65+": "بالای ۶۵",
  // Residency
  "under5": "کمتر از ۵ سال", "5-10": "۵ تا ۱۰ سال", "10-20": "۱۰ تا ۲۰ سال", "20+": "بیش از ۲۰ سال",
  // Political
  "independent": "مستقل", "affiliated": "عضو حزب/جریان", "former": "سابقاً وابسته",
  // Recognition
  "unknown": "ناشناخته", "limited": "محدود", "moderate": "تا حدی", "well_known": "بسیار شناخته‌شده",
  // Supporters
  "under50": "کمتر از ۵۰", "50-200": "۵۰ تا ۲۰۰", "200-1000": "۲۰۰ تا ۱۰۰۰", "1000+": "بیش از ۱۰۰۰",
  // Traditional base
  "none": "ندارم", "small": "محدود", "strong": "قوی و گسترده",
  // Volunteers
  "1-10": "۱ تا ۱۰ نفر", "10-50": "۱۰ تا ۵۰ نفر", "50+": "بیش از ۵۰ نفر",
  // Election experience
  "never": "هرگز", "lost": "شرکت کرده، رأی نیاورده", "won": "رأی آورده",
  // Budget
  "under500m": "کمتر از ۵۰۰ میلیون", "500m-1b": "۵۰۰م تا ۱ میلیارد", "1-5b": "۱ تا ۵ میلیارد", "5b+": "بیش از ۵ میلیارد",
  // Media team
  "basic": "محدود", "professional": "حرفه‌ای",
  // Campaign manager
  "no": "خیر", "considering": "در حال بررسی", "yes": "بله",
  // HQ
  "preparing": "در حال آماده‌سازی",
  // Field
  "limited": "محدود", "partial": "چند روز در هفته", "fulltime": "تمام‌وقت",
  // Criticism
  "quick_response": "پاسخ سریع", "silence": "سکوت", "consult": "مشورت و بعد پاسخ", "angry": "عصبی می‌شوم",
  // Decision
  "data": "داده و تحلیل", "emotion": "احساس", "pressure": "فشار اطرافیان", "political": "تحلیل سیاسی",
  // Vulnerabilities
  "clean": "پاک", "minor": "موارد جزئی", "serious": "موارد جدی",
  // Stress
  "low": "پایین", "medium": "متوسط", "high": "بالا", "extreme": "فوق‌العاده",
};

// تعداد کل سوالات
export const TOTAL_STEPS = STEPS.length;
