// src/flows/plans.js
// ─── پلن‌های خدماتی حرفه‌ای، فروش‌محور و متقاعدکننده ───

import { InlineKeyboard } from "grammy";
import { upsertLead } from "../utils/db.js";

// ═══════════════════════════════════════════
//  تعریف بسته‌های خدماتی
// ═══════════════════════════════════════════
const PLANS = [
  {
    id: "free_report",
    emoji: "📊",
    name: "گزارش رایگان",
    subtitle: "همین الان دریافت کنید",
    price: "رایگان",
    priceNote: "",
    features: [
      "✅ تحلیل اولیه آمادگی کاندیداتوری",
      "✅ امتیازدهی ۵ بُعدی",
      "✅ شناسایی نقاط قوت و ضعف",
      "✅ توصیه‌های کلی",
    ],
    badge: "",
    cta: "شما همین الان این گزارش را دریافت کردید!",
  },
  {
    id: "starter",
    emoji: "🌱",
    name: "بسته راه‌اندازی",
    subtitle: "اولین قدم حرفه‌ای | مناسب تازه‌واردها",
    price: "۲,۸۰۰,۰۰۰ تومان",
    priceNote: "(امکان پرداخت اقساطی)",
    features: [
      "✅ گزارش تحلیلی کامل و اختصاصی (PDF ۱۵+ صفحه)",
      "✅ یک جلسه مشاوره تلفنی ۴۵ دقیقه‌ای با کارشناس",
      "✅ راهنمای کامل ثبت‌نام + مدارک مورد نیاز",
      "✅ چک‌لیست ۳۰ اقدام ضروری قبل از انتخابات",
      "✅ دسترسی به گروه تلگرامی پشتیبانی",
    ],
    badge: "",
    cta: "📞 برای ثبت سفارش تماس بگیرید یا پیام دهید",
  },
  {
    id: "professional",
    emoji: "⭐",
    name: "بسته حرفه‌ای",
    subtitle: "🔥 پرفروش‌ترین | مناسب کاندیداهای جدی",
    price: "۸,۵۰۰,۰۰۰ تومان",
    priceNote: "(امکان پرداخت ۳ قسطی)",
    features: [
      "✅ تمام خدمات بسته راه‌اندازی",
      "✅ طراحی *استراتژی کمپین اختصاصی* (متناسب با حوزه شما)",
      "✅ *۳ جلسه مشاوره تخصصی* (هر جلسه ۶۰ دقیقه)",
      "✅ طراحی *پیام و شعار انتخاباتی* توسط متخصص",
      "✅ برنامه تبلیغات محلی (آفلاین + آنلاین + حضوری)",
      "✅ آموزش فن بیان و سخنرانی (۲ جلسه)",
      "✅ تحلیل رقبای حوزه انتخابیه",
    ],
    badge: "🔥 پیشنهاد ویژه",
    cta: "📞 همین الان رزرو کنید — ظرفیت محدود",
  },
  {
    id: "vip",
    emoji: "💎",
    name: "بسته VIP مدیریت کمپین",
    subtitle: "برای کسانی که می‌خواهند *برنده* شوند",
    price: "۲۸,۰۰۰,۰۰۰ تومان",
    priceNote: "(قابل مذاکره بسته به حوزه)",
    features: [
      "✅ تمام خدمات بسته حرفه‌ای",
      "✅ *مدیر کمپین اختصاصی* (تمام‌وقت تا روز انتخابات)",
      "✅ *تیم اجرایی* (مشاور رسانه + طراح + ویدیوگراف)",
      "✅ طراحی تمام محتوای تبلیغاتی (بنر، کلیپ، پوستر، تراکت)",
      "✅ *مدیریت شبکه‌های اجتماعی* (اینستاگرام + تلگرام)",
      "✅ مدیریت بحران و *پاسخ فوری به حملات رقبا*",
      "✅ برنامه‌ریزی دیدارهای حضوری و جلسات محلی",
      "✅ آموزش مناظره و مدیریت سؤالات خبرنگاران",
      "✅ *پشتیبانی ۲۴/۷* تا پایان شمارش آرا",
    ],
    badge: "💎 تضمین رقابتی",
    cta: "📞 برای هماهنگی جلسه حضوری تماس بگیرید",
  },
  {
    id: "single_session",
    emoji: "🎓",
    name: "مشاوره تکی",
    subtitle: "فقط یک جلسه تخصصی و کاربردی",
    price: "۱,۵۰۰,۰۰۰ تومان",
    priceNote: "",
    features: [
      "✅ یک جلسه مشاوره آنلاین/تلفنی ۶۰ دقیقه‌ای",
      "✅ تحلیل اختصاصی وضعیت فعلی شما",
      "✅ پاسخ به تمام سؤالات و ابهامات",
      "✅ ارائه نقشه راه اولیه و اقدامات فوری",
      "✅ ارسال خلاصه جلسه (PDF)",
    ],
    badge: "",
    cta: "📞 رزرو جلسه مشاوره",
  },
];

/**
 * متن معرفی صفحه پلن‌ها
 */
function buildPlansIntro() {
  let t = "";
  t += "💼 *خدمات تخصصی کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  t += "🏆 *چرا خدمات حرفه‌ای ضروری است؟*\n\n";
  t += "📌 *آمار واقعی:*\n";
  t += "├ ۷۵٪ کاندیداهای ناموفق بدون مشاور وارد شدند\n";
  t += "├ ۶۸٪ شکست‌خورده‌ها شعار مشخصی نداشتند\n";
  t += "├ ۸۲٪ برنده‌ها تیم حرفه‌ای داشتند\n";
  t += "└ مشاوره تخصصی شانس موفقیت را تا *۳ برابر* افزایش می‌دهد\n\n";

  t += "💡 _سرمایه‌گذاری روی مشاوره، کم‌هزینه‌ترین و پربازده‌ترین اقدام شماست._\n\n";
  t += "─── بسته مورد نظر را انتخاب کنید: ───";
  return t;
}

/**
 * متن جزئیات هر پلن
 */
function buildPlanDetail(plan) {
  let t = "";

  if (plan.badge) {
    t += `${plan.badge}\n`;
  }
  t += `${plan.emoji} *${plan.name}*\n`;
  t += `_${plan.subtitle}_\n`;
  t += `━━━━━━━━━━━━━━━━━━━\n\n`;

  t += `💰 قیمت: *${plan.price}*\n`;
  if (plan.priceNote) {
    t += `   ${plan.priceNote}\n`;
  }
  t += "\n";

  t += "📋 *شامل:*\n\n";
  for (const f of plan.features) {
    t += `  ${f}\n`;
  }
  t += "\n";

  t += `━━━━━━━━━━━━━━━━━━━\n\n`;
  t += `🎯 *${plan.cta}*\n\n`;
  t += "📱 تماس: *۰۹۱۲-XXX-XXXX*\n";
  t += "💬 تلگرام: @candidatory\\_support\n\n";
  t += "⏰ _کارشناسان ما در اسرع وقت پاسخگو هستند._";

  return t;
}

/**
 * کیبورد لیست پلن‌ها
 */
function plansListKB() {
  const kb = new InlineKeyboard();

  for (const plan of PLANS) {
    // بسته رایگان را نشان نمی‌دهیم (خودشان دریافت کردند)
    if (plan.id === "free_report") continue;

    let label = `${plan.emoji} ${plan.name}`;
    if (plan.badge) label = `${plan.badge} ${label}`;
    label += ` — ${plan.price}`;
    kb.text(label, `plan:${plan.id}`).row();
  }

  kb.text("🔙 بازگشت به منو", "menu").row();
  return kb;
}

/**
 * کیبورد جزئیات پلن
 */
function planDetailKB(planId) {
  return new InlineKeyboard()
    .text("📞 ثبت درخواست مشاوره", `plan_request:${planId}`)
    .row()
    .text("📋 مشاهده همه بسته‌ها", "show_plans")
    .row()
    .text("🔙 بازگشت به منو", "menu")
    .row();
}

/**
 * هندلر نمایش صفحه پلن‌ها
 */
export async function handleShowPlans(ctx) {
  const text = buildPlansIntro();
  const kb = plansListKB();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

/**
 * هندلر انتخاب پلن → نمایش جزئیات
 */
export async function handleSelectPlan(ctx, planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    await ctx.answerCallbackQuery({ text: "❌ بسته یافت نشد." });
    return;
  }

  const text = buildPlanDetail(plan);
  const kb = planDetailKB(planId);

  try {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: kb,
    });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

/**
 * هندلر ثبت درخواست پلن (ذخیره لید + تایید)
 */
export async function handlePlanRequest(ctx, planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    await ctx.answerCallbackQuery({ text: "❌ بسته یافت نشد." });
    return;
  }

  const userId = String(ctx.from.id);

  // ذخیره علاقه‌مندی در leads_status
  try {
    await upsertLead(userId, {
      purchasedPlan: plan.id,
      leadTemperature: "hot",
      notes: `علاقه‌مند به بسته «${plan.name}» — ${new Date().toLocaleDateString("fa-IR")}`,
    });
  } catch (e) {
    console.error("خطا در ذخیره لید:", e.message);
  }

  const text =
    `✅ *درخواست شما برای بسته «${plan.name}» ثبت شد!*\n\n` +
    `📞 کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت.\n\n` +
    `💬 برای پیگیری سریع‌تر:\n` +
    `├ تلگرام: @candidatory\\_support\n` +
    `└ تماس: ۰۹۱۲-XXX-XXXX\n\n` +
    `⏰ ساعات پاسخگویی: شنبه تا پنجشنبه ۹–۱۸`;

  const kb = new InlineKeyboard()
    .text("📋 مشاهده بسته‌ها", "show_plans")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();

  try {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: kb,
    });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }

  await ctx.answerCallbackQuery({
    text: `✅ درخواست بسته «${plan.name}» ثبت شد!`,
    show_alert: true,
  });
}
