export const STEPS = [
  // ═══════════════════════════════════════
  // بخش A — پروفایل فردی (۱ تا ۱۰)
  // ═══════════════════════════════════════
  {
    key: "fullName",
    section: "A",
    question: "👤 بخش A — پروفایل فردی (۱/۱۰)\n\nنام و نام خانوادگی کامل خود را وارد کنید:",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "nationalId",
    section: "A",
    question: "🆔 بخش A — پروفایل فردی (۲/۱۰)\n\nکد ملی ۱۰ رقمی خود را وارد کنید:",
    type: "text",
    options: [],
    scoreWeight: 0,
    validation: "nationalId",
  },
  {
    key: "phone",
    section: "A",
    question: "📱 بخش A — پروفایل فردی (۳/۱۰)\n\nشماره تماس خود را وارد کنید:\n(مثال: ۰۹۱۲۱۲۳۴۵۶۷)",
    type: "text",
    options: [],
    scoreWeight: 0,
    validation: "phone",
  },
  {
    key: "age",
    section: "A",
    question: "🎂 بخش A — پروفایل فردی (۴/۱۰)\n\nسن شما چند سال است؟",
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
    question: "📍 بخش A — پروفایل فردی (۵/۱۰)\n\nحوزه انتخابیه خود را بنویسید:\n(استان + شهر)\n\nمثال: فارس، شیراز",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "residencyYears",
    section: "A",
    question: "🏠 بخش A — پروفایل فردی (۶/۱۰)\n\nچند سال در حوزه انتخابیه خود سکونت دارید؟",
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
    question: "🎓 بخش A — پروفایل فردی (۷/۱۰)\n\nتحصیلات خود را بنویسید:\n(مدرک + رشته + دانشگاه)\n\nمثال: کارشناسی ارشد مدیریت، دانشگاه تهران",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "currentJob",
    section: "A",
    question: "💼 بخش A — پروفایل فردی (۸/۱۰)\n\nشغل فعلی خود را بنویسید:",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "pastPositions",
    section: "A",
    question: "📜 بخش A — پروفایل فردی (۹/۱۰)\n\nسه شغل یا مسئولیت مهم گذشته خود را بنویسید:\n(هر کدام در یک خط)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "politicalAffiliation",
    section: "A",
    question: "🏛️ بخش A — پروفایل فردی (۱۰/۱۰)\n\nآیا وابستگی سیاسی رسمی دارید؟",
    type: "inline",
    options: [
      { text: "خیر، مستقل هستم", data: "independent", score: 10 },
      { text: "بله، عضو حزب/جریان", data: "affiliated", score: 8 },
      { text: "سابقا بله، الان خیر", data: "former", score: 6 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // بخش B — سرمایه اجتماعی (۱۱ تا ۱۵)
  // ═══════════════════════════════════════
  {
    key: "recognition",
    section: "B",
    question: "👁️ بخش B — سرمایه اجتماعی (۱/۵)\n\nمیزان شناخته شده بودن شما در حوزه انتخابیه؟",
    type: "inline",
    options: [
      { text: "🔴 تقریبا ناشناخته", data: "unknown", score: 2 },
      { text: "🟠 شناخته شده محدود", data: "limited", score: 8 },
      { text: "🟡 تا حدی شناخته شده", data: "moderate", score: 15 },
      { text: "🟢 بسیار شناخته شده", data: "well_known", score: 25 },
    ],
    scoreWeight: 2,
  },
  {
    key: "firstWeekSupporters",
    section: "B",
    question: "🤝 بخش B — سرمایه اجتماعی (۲/۵)\n\nدر صورت اعلام کاندیداتوری، چند نفر در ۷ روز اول علنا حمایت میکنند؟",
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
    question: "🏘️ بخش B — سرمایه اجتماعی (۳/۵)\n\nآیا پایگاه رای سنتی دارید؟\n(قوم، صنف، مسجد، شبکه اقتصادی...)",
    type: "inline",
    options: [
      { text: "خیر، ندارم", data: "none", score: 0 },
      { text: "بله، محدود و کوچک", data: "small", score: 8 },
      { text: "بله، قوی و گسترده", data: "strong", score: 18 },
    ],
    scoreWeight: 1,
  },
  {
    key: "volunteers",
    section: "B",
    question: "👥 بخش B — سرمایه اجتماعی (۴/۵)\n\nچند نفر نیروی داوطلب فعال دارید؟",
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
    question: "🗳️ بخش B — سرمایه اجتماعی (۵/۵)\n\nآیا قبلا در انتخابات شرکت کرده اید؟",
    type: "inline",
    options: [
      { text: "هرگز", data: "never", score: 0 },
      { text: "بله، اما رای نیاوردم", data: "lost", score: 8 },
      { text: "بله، و رای آوردم", data: "won", score: 20 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // بخش C — منابع و زیرساخت (۱۶ تا ۲۰)
  // ═══════════════════════════════════════
  {
    key: "budget",
    section: "C",
    question: "💰 بخش C — منابع و زیرساخت (۱/۵)\n\nبودجه تقریبی کمپین انتخاباتی شما؟",
    type: "inline",
    options: [
      { text: "کمتر از ۵۰۰ میلیون", data: "under500m", score: 3 },
      { text: "۵۰۰ میلیون تا ۱ میلیارد", data: "500m-1b", score: 8 },
      { text: "۱ تا ۵ میلیارد", data: "1-5b", score: 18 },
      { text: "بیش از ۵ میلیارد", data: "5b+", score: 25 },
    ],
    scoreWeight: 2,
  },
  {
    key: "mediaTeam",
    section: "C",
    question: "📱 بخش C — منابع و زیرساخت (۲/۵)\n\nآیا تیم رسانه ای دارید؟",
    type: "inline",
    options: [
      { text: "ندارم", data: "none", score: 0 },
      { text: "محدود و غیرحرفه ای", data: "basic", score: 5 },
      { text: "حرفه ای و فعال", data: "professional", score: 15 },
    ],
    scoreWeight: 1,
  },
  {
    key: "campaignManager",
    section: "C",
    question: "👔 بخش C — منابع و زیرساخت (۳/۵)\n\nآیا مدیر کمپین مشخص دارید؟",
    type: "inline",
    options: [
      { text: "خیر", data: "no", score: 0 },
      { text: "در حال بررسی", data: "considering", score: 5 },
      { text: "بله، مشخص شده", data: "yes", score: 12 },
    ],
    scoreWeight: 1,
  },
  {
    key: "headquarters",
    section: "C",
    question: "🏢 بخش C — منابع و زیرساخت (۴/۵)\n\nآیا ستاد مرکزی مشخص کرده اید؟",
    type: "inline",
    options: [
      { text: "خیر", data: "no", score: 0 },
      { text: "در حال آماده سازی", data: "preparing", score: 5 },
      { text: "بله، فعال است", data: "yes", score: 10 },
    ],
    scoreWeight: 1,
  },
  {
    key: "fieldPresence",
    section: "C",
    question: "🚶 بخش C — منابع و زیرساخت (۵/۵)\n\nتوانایی حضور مستمر میدانی روزانه دارید؟",
    type: "inline",
    options: [
      { text: "خیر، محدود", data: "limited", score: 3 },
      { text: "چند روز در هفته", data: "partial", score: 8 },
      { text: "بله، تمام وقت", data: "fulltime", score: 15 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // بخش D — شخصیت و رهبری (۲۱ تا ۲۴)
  // ═══════════════════════════════════════
  {
    key: "criticismReaction",
    section: "D",
    question: "🎭 بخش D — شخصیت و رهبری (۱/۴)\n\nدر مواجهه با انتقاد شدید چه واکنشی نشان میدهید؟",
    type: "inline",
    options: [
      { text: "سریع پاسخ میدهم", data: "quick_response", score: 5 },
      { text: "سکوت میکنم", data: "silence", score: 3 },
      { text: "مشورت میکنم و بعد پاسخ", data: "consult", score: 12 },
      { text: "عصبی میشوم", data: "angry", score: 0 },
    ],
    scoreWeight: 1,
  },
  {
    key: "biggestWeakness",
    section: "D",
    question: "🪞 بخش D — شخصیت و رهبری (۲/۴)\n\nبزرگترین ضعف شخصیتی خود را صادقانه بنویسید:\n(این اطلاعات محرمانه باقی میماند)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "failureExperience",
    section: "D",
    question: "📉 بخش D — شخصیت و رهبری (۳/۴)\n\nتا به حال شکست بزرگی داشته اید؟ چگونه مدیریت کردید؟\n(مختصر بنویسید)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "decisionStyle",
    section: "D",
    question: "🧠 بخش D — شخصیت و رهبری (۴/۴)\n\nتصمیم گیری شما بیشتر مبتنی بر چیست؟",
    type: "inline",
    options: [
      { text: "داده و تحلیل", data: "data", score: 12 },
      { text: "احساس و شهود", data: "emotion", score: 5 },
      { text: "فشار اطرافیان", data: "pressure", score: 2 },
      { text: "تحلیل سیاسی", data: "political", score: 10 },
    ],
    scoreWeight: 1,
  },

  // ═══════════════════════════════════════
  // بخش E — پیام و رقابت (۲۵ تا ۲۹)
  // ═══════════════════════════════════════
  {
    key: "slogan",
    section: "E",
    question: "📢 بخش E — پیام و رقابت (۱/۵)\n\nشعار احتمالی کمپین شما چیست؟\n(یک جمله کوتاه بنویسید)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "topProblems",
    section: "E",
    question: "🔍 بخش E — پیام و رقابت (۲/۵)\n\nسه مشکل اصلی حوزه انتخابیه از نگاه شما چیست؟\n(هر مشکل در یک خط)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "whyVoteForYou",
    section: "E",
    question: "🏆 بخش E — پیام و رقابت (۳/۵)\n\nچرا مردم باید به شما رای بدهند نه رقیب؟\n(مختصر و قانع کننده بنویسید)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "biggestCompetitor",
    section: "E",
    question: "⚔️ بخش E — پیام و رقابت (۴/۵)\n\nبزرگترین رقیب شما کیست؟\n(نام یا توصیف)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "competitorWeakness",
    section: "E",
    question: "🎯 بخش E — پیام و رقابت (۵/۵)\n\nنقطه ضعف اصلی رقیب شما چیست؟",
    type: "text",
    options: [],
    scoreWeight: 0,
  },

  // ═══════════════════════════════════════
  // بخش F — ریسک ها (۳۰ تا ۳۲)
  // ═══════════════════════════════════════
  {
    key: "vulnerabilities",
    section: "F",
    question: "⚠️ بخش F — ریسک ها (۱/۳)\n\nآیا پرونده، حاشیه یا نقطه آسیب پذیر دارید؟",
    type: "inline",
    options: [
      { text: "خیر، کاملا پاک", data: "clean", score: 15 },
      { text: "موارد جزئی", data: "minor", score: 7 },
      { text: "بله، موارد جدی", data: "serious", score: 0 },
    ],
    scoreWeight: 2,
  },
  {
    key: "mediaAttackAngle",
    section: "F",
    question: "📰 بخش F — ریسک ها (۲/۳)\n\nاگر علیه شما موج رسانه ای ساخته شود، از کدام زاویه خواهد بود؟\n(مختصر بنویسید)",
    type: "text",
    options: [],
    scoreWeight: 0,
  },
  {
    key: "stressTolerance",
    section: "F",
    question: "💪 بخش F — ریسک ها (۳/۳)\n\nمیزان تحمل فشار روانی شما چقدر است؟",
    type: "inline",
    options: [
      { text: "۱-۳ (پایین)", data: "low", score: 3 },
      { text: "۴-۶ (متوسط)", data: "medium", score: 8 },
      { text: "۷-۸ (بالا)", data: "high", score: 13 },
      { text: "۹-۱۰ (فوق العاده)", data: "extreme", score: 18 },
    ],
    scoreWeight: 1,
  },
];

export const SECTION_LABELS = {
  A: "👤 پروفایل فردی",
  B: "🤝 سرمایه اجتماعی",
  C: "💰 منابع و زیرساخت",
  D: "🎭 شخصیت و رهبری",
  E: "📢 پیام و رقابت",
  F: "⚠️ ریسک ها",
};

export const OPTION_LABELS = {
  "25-35": "۲۵ تا ۳۵", "36-45": "۳۶ تا ۴۵", "46-55": "۴۶ تا ۵۵",
  "56-65": "۵۶ تا ۶۵", "65+": "بالای ۶۵",
  "under5": "کمتر از ۵ سال", "5-10": "۵ تا ۱۰ سال", "10-20": "۱۰ تا ۲۰ سال", "20+": "بیش از ۲۰ سال",
  "independent": "مستقل", "affiliated": "عضو حزب", "former": "سابقا وابسته",
  "unknown": "ناشناخته", "limited": "محدود", "moderate": "تا حدی", "well_known": "شناخته شده",
  "under50": "کمتر از ۵۰", "50-200": "۵۰ تا ۲۰۰", "200-1000": "۲۰۰ تا ۱۰۰۰", "1000+": "بیش از ۱۰۰۰",
  "none": "ندارم", "small": "محدود", "strong": "قوی",
  "1-10": "۱ تا ۱۰", "10-50": "۱۰ تا ۵۰", "50+": "بیش از ۵۰",
  "never": "هرگز", "lost": "رای نیاورده", "won": "رای آورده",
  "under500m": "کمتر از ۵۰۰م", "500m-1b": "۵۰۰م تا ۱ میلیارد", "1-5b": "۱ تا ۵ میلیارد", "5b+": "بیش از ۵ میلیارد",
  "basic": "محدود", "professional": "حرفه ای",
  "no": "خیر", "considering": "در حال بررسی", "yes": "بله",
  "preparing": "در حال آماده سازی",
  "partial": "چند روز در هفته", "fulltime": "تمام وقت",
  "quick_response": "پاسخ سریع", "silence": "سکوت", "consult": "مشورت", "angry": "عصبی",
  "data": "داده و تحلیل", "emotion": "احساس", "pressure": "فشار اطرافیان", "political": "تحلیل سیاسی",
  "clean": "پاک", "minor": "موارد جزئی", "serious": "موارد جدی",
  "low": "پایین", "medium": "متوسط", "high": "بالا", "extreme": "فوق العاده",
};

export const TOTAL_STEPS = STEPS.length;
