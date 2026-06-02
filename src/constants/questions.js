// src/constants/questions.js — نسخه نهایی حرفه‌ای
const STEPS = [
  {
    id: 1,
    emoji: "🗳️",
    question: "نوع انتخاباتی که قصد شرکت در آن را دارید چیست؟",
    shortTitle: "نوع انتخابات",
    type: "choice",
    options: [
      { label: "🏙️ شورای شهر", value: "city_council", score: 10 },
      { label: "🌾 شورای روستا", value: "village_council", score: 8 },
      { label: "🏛️ مجلس شورای اسلامی", value: "parliament", score: 15 },
      { label: "📋 سایر", value: "other", score: 5 },
    ],
  },
  {
    id: 2,
    emoji: "📍",
    question: "نام شهر یا منطقه انتخابیه خود را وارد کنید:",
    shortTitle: "منطقه",
    type: "text",
    hint: "🔍 مثال: تهران - منطقه ۵ یا شیراز",
  },
  {
    id: 3,
    emoji: "🎓",
    question: "میزان تحصیلات شما چیست؟",
    shortTitle: "تحصیلات",
    type: "choice",
    options: [
      { label: "🔬 دکتری", value: "phd", score: 25 },
      { label: "📚 کارشناسی ارشد", value: "masters", score: 20 },
      { label: "🎓 کارشناسی", value: "bachelor", score: 15 },
      { label: "📄 دیپلم", value: "diploma", score: 10 },
    ],
  },
  {
    id: 4,
    emoji: "⏳",
    question: "سابقه فعالیت اجتماعی شما چند سال است؟",
    shortTitle: "سابقه اجتماعی",
    type: "number",
    min: 0,
    max: 50,
    hint: "📝 تعداد سال را وارد کنید",
  },
  {
    id: 5,
    emoji: "🤝",
    question: "تعداد افراد شبکه اجتماعی فعال شما در منطقه چقدر است؟",
    shortTitle: "شبکه اجتماعی",
    type: "number",
    min: 0,
    max: 10000,
    hint: "👥 افرادی که می‌توانند به شما کمک کنند",
  },
  {
    id: 6,
    emoji: "💰",
    question: "بودجه تخمینی کمپین شما چقدر است؟ (میلیون تومان)",
    shortTitle: "بودجه",
    type: "number",
    min: 0,
    max: 10000,
    hint: "💡 بودجه واقع‌بینانه وارد کنید",
  },
  {
    id: 7,
    emoji: "🎤",
    question: "توانایی سخنرانی عمومی خود را از ۱ تا ۱۰ ارزیابی کنید:",
    shortTitle: "سخنرانی",
    type: "scale",
    min: 1,
    max: 10,
  },
  {
    id: 8,
    emoji: "📱",
    question: "تعداد دنبال‌کنندگان شما در شبکه‌های اجتماعی چقدر است؟",
    shortTitle: "فالوور",
    type: "number",
    min: 0,
    max: 1000000,
    hint: "📊 مجموع تمام پلتفرم‌ها",
  },
  {
    id: 9,
    emoji: "⚔️",
    question: "تعداد رقبای جدی شما چند نفر است؟",
    shortTitle: "رقبا",
    type: "number",
    min: 0,
    max: 50,
  },
];

const TOTAL_STEPS = STEPS.length;
const SCORED_STEP_IDS = [3, 4, 5, 6, 7, 8, 9];
const MAX_SCORE = 100;

module.exports = { STEPS, TOTAL_STEPS, SCORED_STEP_IDS, MAX_SCORE };
