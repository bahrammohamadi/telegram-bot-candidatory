// src/constants/deep_assessment.js — تبدیل‌شده به CommonJS
// ═══════════════════════════════════════════════════════════════
// ✅ فیکس: تبدیل از ESM به CommonJS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// ۶ ماژول ارزیابی عمیق (فاز ۲)
// ═══════════════════════════════════════════════════════════════
const DEEP_MODULES = [
  {
    id: "social_deep",
    emoji: "👥",
    name: "تحلیل عمیق شبکه اجتماعی",
    description: "ارزیابی دقیق نفوذ و کیفیت شبکه اجتماعی شما",
    maxScore: 100,
    requiredPlan: "starter",
    steps: [
      {
        question: "چند نفر از دوستان نزدیک شما در حوزه انتخابیه‌تان ساکن هستند؟",
        type: "number",
        min: 0,
        max: 1000,
        hint: "افرادی که با آن‌ها حداقل ماهی یک‌بار تماس دارید",
      },
      {
        question: "چند درصد از این افراد فعال اجتماعی هستند (عضو انجمن، باشگاه، مسجد، ...)?",
        type: "scale",
        min: 0,
        max: 100,
      },
      {
        question: "آیا در ۶ ماه اخیر در مراسم عمومی محلی شرکت کرده‌اید؟",
        type: "choice",
        options: [
          { label: "بله، بیش از ۵ بار", value: "very_active" },
          { label: "بله، ۲-۵ بار", value: "active" },
          { label: "فقط ۱ بار", value: "low" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "چند نفر از اعضای خانواده‌تان (خویشاوندان درجه یک) در حوزه رأی می‌دهند؟",
        type: "number",
        min: 0,
        max: 200,
      },
      {
        question: "آیا با رهبران محلی (ائمه جماعت، معلمان، پزشکان، ...) ارتباط دارید؟",
        type: "choice",
        options: [
          { label: "بله، با بیش از ۵ نفر", value: "high" },
          { label: "بله، با ۲-۵ نفر", value: "medium" },
          { label: "فقط ۱ نفر", value: "low" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "چند عضو در کانال‌/گروه‌های تلگرامی محلی شما هستند؟",
        type: "number",
        min: 0,
        max: 50000,
        hint: "مجموع اعضای تمام کانال‌ها/گروه‌هایی که مدیر یا ادمین هستید",
      },
    ],
  },
  {
    id: "competitive",
    emoji: "⚔️",
    name: "تحلیل رقابتی",
    description: "بررسی موقعیت شما در برابر رقبا",
    maxScore: 100,
    requiredPlan: "starter",
    steps: [
      {
        question: "چند نفر به‌احتمال‌زیاد در این دوره کاندیدا می‌شوند؟",
        type: "number",
        min: 1,
        max: 50,
      },
      {
        question: "چند نفر از رقبای احتمالی سابقه انتخاباتی دارند؟",
        type: "number",
        min: 0,
        max: 20,
      },
      {
        question: "قوی‌ترین رقیب شما در کدام بخش برتری دارد؟",
        type: "choice",
        options: [
          { label: "شبکه اجتماعی", value: "network" },
          { label: "امکانات مالی", value: "money" },
          { label: "سابقه سیاسی", value: "experience" },
          { label: "محبوبیت رسانه‌ای", value: "media" },
        ],
      },
      {
        question: "آیا رقیب قوی از حمایت جریان سیاسی/حزبی خاصی برخوردار است؟",
        type: "choice",
        options: [
          { label: "بله، حزب قدرتمند ملی", value: "high" },
          { label: "بله، گروه محلی", value: "medium" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "بودجه تخمینی قوی‌ترین رقیب شما چقدر است (میلیون تومان)?",
        type: "number",
        min: 0,
        max: 10000,
      },
      {
        question: "نقطه ضعف اصلی رقیب اصلی شما کدام است؟",
        type: "text",
        hint: "مثال: فاصله طبقاتی، سابقه منفی، ضعف ارتباطی",
      },
    ],
  },
  {
    id: "risk_assessment",
    emoji: "⚠️",
    name: "ارزیابی ریسک",
    description: "شناسایی و مدیریت ریسک‌های کمپین",
    maxScore: 100,
    requiredPlan: "professional",
    steps: [
      {
        question: "آیا سابقه قضایی یا پرونده حقوقی دارید؟",
        type: "choice",
        options: [
          { label: "بله، محکومیت قطعی", value: "high_risk" },
          { label: "بله، پرونده در جریان", value: "medium_risk" },
          { label: "خیر", value: "safe" },
        ],
      },
      {
        question: "آیا در گذشته اظهارنظر جنجالی در رسانه داشته‌اید؟",
        type: "choice",
        options: [
          { label: "بله، چندین بار", value: "high" },
          { label: "یک‌بار", value: "low" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "چند درصد بودجه کمپین شما از منابع شخصی تأمین می‌شود؟",
        type: "scale",
        min: 0,
        max: 100,
        hint: "هرچه بیشتر، ریسک مالی کمتر",
      },
      {
        question: "آیا مدیر/مشاور حقوقی برای کمپین دارید؟",
        type: "choice",
        options: [
          { label: "بله، وکیل تمام‌وقت", value: "high" },
          { label: "بله، مشاور پاره‌وقت", value: "medium" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "آیا خانواده شما از کاندیداتوری‌تان حمایت می‌کنند؟",
        type: "choice",
        options: [
          { label: "بله، کاملاً", value: "full" },
          { label: "تا حدی", value: "partial" },
          { label: "مخالف هستند", value: "opposed" },
        ],
      },
      {
        question: "بزرگ‌ترین تهدید برای کمپین شما چیست؟",
        type: "text",
        hint: "مثال: فشار رقبا، کمبود بودجه، ضعف تیم",
      },
    ],
  },
  {
    id: "media_presence",
    emoji: "📱",
    name: "حضور رسانه‌ای و دیجیتال",
    description: "ارزیابی قدرت رسانه‌ای و دیجیتال شما",
    maxScore: 100,
    requiredPlan: "professional",
    steps: [
      {
        question: "چند فالوور واقعی در شبکه‌های اجتماعی دارید (مجموع)?",
        type: "number",
        min: 0,
        max: 1000000,
      },
      {
        question: "میانگین لایک/کامنت پست‌های شما چقدر است؟",
        type: "number",
        min: 0,
        max: 10000,
        hint: "میانگین ۱۰ پست اخیر",
      },
      {
        question: "آیا وب‌سایت/وبلاگ شخصی دارید؟",
        type: "choice",
        options: [
          { label: "بله، فعال و به‌روز", value: "active" },
          { label: "بله، غیرفعال", value: "inactive" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "چند بار در رسانه‌های محلی (رادیو/تلویزیون/روزنامه) حضور داشته‌اید؟",
        type: "choice",
        options: [
          { label: "بیش از ۱۰ بار", value: "very_high" },
          { label: "۵-۱۰ بار", value: "high" },
          { label: "۱-۵ بار", value: "medium" },
          { label: "هیچ", value: "none" },
        ],
      },
      {
        question: "آیا تیم رسانه‌ای (عکاس، فیلمبردار، گرافیست) دارید؟",
        type: "choice",
        options: [
          { label: "بله، تیم حرفه‌ای", value: "professional" },
          { label: "بله، داوطلبان", value: "volunteer" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "استراتژی محتوای شما در فضای مجازی چیست؟",
        type: "text",
        hint: "مثال: پست‌های روزانه، ویدئوهای کوتاه، لایو",
      },
    ],
  },
  {
    id: "full360",
    emoji: "🎯",
    name: "ارزیابی ۳۶۰ درجه",
    description: "جامع‌ترین تحلیل از تمام ابعاد",
    maxScore: 100,
    requiredPlan: "vip",
    steps: [
      {
        question: "تجربه مدیریتی شما (سال):",
        type: "number",
        min: 0,
        max: 50,
      },
      {
        question: "تحصیلات:",
        type: "choice",
        options: [
          { label: "دکتری", value: "phd" },
          { label: "کارشناسی ارشد", value: "master" },
          { label: "کارشناسی", value: "bachelor" },
          { label: "دیپلم", value: "diploma" },
        ],
      },
      {
        question: "سابقه فعالیت اجتماعی (سال):",
        type: "number",
        min: 0,
        max: 50,
      },
      {
        question: "آیا عضو حزب/تشکل سیاسی هستید؟",
        type: "choice",
        options: [
          { label: "بله، عضو رسمی", value: "member" },
          { label: "همکار", value: "associate" },
          { label: "خیر", value: "independent" },
        ],
      },
      {
        question: "درآمد ماهانه خانواده (میلیون تومان):",
        type: "number",
        min: 0,
        max: 1000,
        hint: "برای محاسبه توانایی مالی کمپین",
      },
      {
        question: "ارزیابی خودتان از شانس بردتان (۰-۱۰۰):",
        type: "scale",
        min: 0,
        max: 100,
      },
      {
        question: "مهم‌ترین دستاورد شما در خدمت به مردم:",
        type: "text",
      },
      {
        question: "برنامه اصلی شما در یک جمله:",
        type: "text",
      },
    ],
  },
  {
    id: "personality",
    emoji: "🧠",
    name: "پروفایل شخصیتی رهبری",
    description: "تحلیل ویژگی‌های شخصیتی برای رهبری سیاسی",
    maxScore: 100,
    requiredPlan: "vip",
    steps: [
      {
        question: "در مواجهه با انتقاد شدید، معمولاً چه واکنشی نشان می‌دهید؟",
        type: "choice",
        options: [
          { label: "آرام گوش می‌دهم و پاسخ منطقی می‌دهم", value: "calm" },
          { label: "دفاع می‌کنم ولی محترمانه", value: "defensive" },
          { label: "عصبانی می‌شوم", value: "angry" },
        ],
      },
      {
        question: "از ۱ تا ۱۰، توانایی سخنرانی عمومی خود را چند می‌دهید؟",
        type: "scale",
        min: 1,
        max: 10,
      },
      {
        question: "آیا می‌توانید در شرایط فشار زیاد تصمیم درست بگیرید؟",
        type: "choice",
        options: [
          { label: "بله، همیشه", value: "always" },
          { label: "اغلب", value: "often" },
          { label: "گاهی", value: "sometimes" },
          { label: "به‌ندرت", value: "rarely" },
        ],
      },
      {
        question: "چقدر به نظرات دیگران اهمیت می‌دهید (۰-۱۰۰)?",
        type: "scale",
        min: 0,
        max: 100,
      },
      {
        question: "آیا تجربه مدیریت تیم را دارید؟",
        type: "choice",
        options: [
          { label: "بله، تیم‌های +۲۰ نفره", value: "large" },
          { label: "بله، تیم‌های ۵-۲۰ نفره", value: "medium" },
          { label: "بله، تیم‌های کوچک", value: "small" },
          { label: "خیر", value: "none" },
        ],
      },
      {
        question: "سبک رهبری شما کدام است؟",
        type: "choice",
        options: [
          { label: "دموکراتیک (مشورتی)", value: "democratic" },
          { label: "تحول‌گرا", value: "transformational" },
          { label: "قاطع", value: "authoritative" },
          { label: "حمایتگر", value: "supportive" },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// ابعاد شخصیتی (برای ماژول personality)
// ═══════════════════════════════════════════════════════════════
const PERSONALITY_DIMENSIONS = [
  { id: "leadership", name: "رهبری", emoji: "👑" },
  { id: "communication", name: "ارتباطات", emoji: "💬" },
  { id: "resilience", name: "تاب‌آوری", emoji: "💪" },
  { id: "empathy", name: "همدلی", emoji: "❤️" },
  { id: "decisiveness", name: "قاطعیت", emoji: "⚡" },
];

const DEEP_MAX_SCORE = 600; // مجموع امتیاز ۶ ماژول
const DEEP_TOTAL_STEPS = DEEP_MODULES.reduce((sum, m) => sum + m.steps.length, 0);

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════
module.exports = {
  DEEP_MODULES,
  PERSONALITY_DIMENSIONS,
  DEEP_MAX_SCORE,
  DEEP_TOTAL_STEPS,
};
