// src/flows/plans.js
// ─── بسته‌های خدماتی حرفه‌ای و فروش‌محور ───
// سازگار با leads_status (purchasedPlan, leadTemperature, ...)

import { InlineKeyboard } from "grammy";
import { upsertLead } from "../utils/db.js";

// ═══════════════════════════════════════
//  تعریف بسته‌ها
// ═══════════════════════════════════════

const PLANS = [
  {
    id: "consultation_single",
    emoji: "🎓",
    name: "مشاوره تکی",
    subtitle: "یک جلسه مشاوره تخصصی ۶۰ دقیقه‌ای",
    price: "۱,۸۰۰,۰۰۰ تومان",
    tag: "مناسب شروع",
    features: [
      "✅ یک جلسه ویدیویی ۶۰ دقیقه با مشاور ارشد",
      "✅ تحلیل دقیق وضعیت فعلی شما",
      "✅ پاسخ به تمام سؤالات و ابهامات",
      "✅ ارائه نقشه راه اولیه کاندیداتوری",
      "✅ فایل صوتی جلسه برای مرور مجدد",
    ],
    highlight: false,
  },
  {
    id: "starter",
    emoji: "🌱",
    name: "بسته آغازین",
    subtitle: "بسته پایه برای شروع حرفه‌ای",
    price: "۴,۵۰۰,۰۰۰ تومان",
    tag: "اقتصادی",
    features: [
      "✅ گزارش تحلیل آمادگی جامع (PDF ۲۰+ صفحه)",
      "✅ ۲ جلسه مشاوره تخصصی (هر جلسه ۶۰ دقیقه)",
      "✅ راهنمای کامل ثبت‌نام و مدارک",
      "✅ چک‌لیست اقدامات ضروری ماه به ماه",
      "✅ طراحی پیام و شعار انتخاباتی اولیه",
    ],
    highlight: false,
  },
  {
    id: "professional",
    emoji: "⭐",
    name: "بسته حرفه‌ای",
    subtitle: "🔥 پرفروش‌ترین | برای کاندیداهای جدی",
    price: "۱۲,۰۰۰,۰۰۰ تومان",
    tag: "پیشنهاد ویژه",
    features: [
      "✅ تمام خدمات بسته آغازین",
      "✅ طراحی استراتژی کامل کمپین",
      "✅ ۵ جلسه مشاوره تخصصی",
      "✅ طراحی هویت بصری (لوگو + رنگ‌بندی)",
      "✅ آموزش سخنرانی و مناظره (۲ جلسه عملی)",
      "✅ برنامه تبلیغات آفلاین + آنلاین",
      "✅ تحلیل رقبا و ساخت مزیت رقابتی",
    ],
    highlight: true,
  },
  {
    id: "vip",
    emoji: "💎",
    name: "بسته VIP مدیریت کمپین",
    subtitle: "مدیریت تمام‌عیار | برای کسی که می‌خواهد ببرد",
    price: "تماس بگیرید",
    tag: "جامع‌ترین",
    features: [
      "✅ تمام خدمات بسته حرفه‌ای",
      "✅ مدیر کمپین اختصاصی (تمام‌وقت)",
      "✅ تیم تولید محتوا (بنر، کلیپ، پوستر، موشن)",
      "✅ مدیریت شبکه‌های اجتماعی",
      "✅ مدیریت بحران و پاسخ به حملات",
      "✅ هماهنگی با رسانه‌های محلی",
      "✅ استقرار نمایندگان شعب رأی‌گیری",
      "✅ پشتیبانی ۲۴/۷ تا پایان انتخابات",
    ],
    highlight: false,
  },
];

// ═══════════════════════════════════════
//  متن صفحه پلن‌ها
// ═══════════════════════════════════════

function buildPlansText() {
  let t = "";

  t += "💼 *بسته‌های خدمات تخصصی کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  t += "📌 *چرا مشاوره تخصصی لازم است؟*\n\n";
  t += "• بیش از *۷۰٪* کاندیداهای ناموفق، بدون برنامه وارد رقابت شده‌اند\n";
  t += "• داشتن مشاور حرفه‌ای شانس پیروزی را تا *۳ برابر* افزایش می‌دهد\n";
  t += "• هزینه مشاوره، *کمتر از ۵٪* هزینه یک کمپین ناموفق است\n";
  t += "• رقبای شما احتمالاً از مشاور استفاده می‌کنند — شما هم باید!\n\n";

  t += "─── 📋 بسته‌ها ───\n\n";

  for (const p of PLANS) {
    if (p.highlight) {
      t += `🔥 *${p.emoji} ${p.name}* — _${p.tag}_ 🔥\n`;
    } else {
      t += `*${p.emoji} ${p.name}* — _${p.tag}_\n`;
    }
    t += `   _${p.subtitle}_\n`;
    t += `   💰 *${p.price}*\n\n`;
    for (const f of p.features) {
      t += `   ${f}\n`;
    }
    t += "\n";
  }

  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  t += "👇 بسته مورد نظر خود را انتخاب کنید:";

  return t;
}

// ═══════════════════════════════════════
//  کیبورد پلن‌ها
// ═══════════════════════════════════════

function plansKeyboard() {
  const kb = new InlineKeyboard();
  for (const p of PLANS) {
    const lbl = p.highlight
      ? `🔥 ${p.emoji} ${p.name} — ${p.price}`
      : `${p.emoji} ${p.name} — ${p.price}`;
    kb.text(lbl, `plan:${p.id}`).row();
  }
  kb.text("🔙 بازگشت به منو", "menu").row();
  return kb;
}

// ═══════════════════════════════════════
//  هندلرها
// ═══════════════════════════════════════

/** نمایش صفحه پلن‌ها */
export async function handleShowPlans(ctx) {
  const text = buildPlansText();
  const kb = plansKeyboard();

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

/** انتخاب یک پلن → ذخیره لید + نمایش جزئیات */
export async function handleSelectPlan(ctx, planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    await ctx.answerCallbackQuery({ text: "❌ بسته یافت نشد." });
    return;
  }

  // ذخیره علاقه‌مندی در leads_status
  try {
    const uid = String(ctx.from.id);
    await upsertLead(uid, {
      purchasedPlan: plan.id,
      leadTemperature: "warm",
      notes: `علاقه‌مند به بسته «${plan.name}» — ${new Date().toISOString()}`,
    });
  } catch (e) {
    console.error("خطا در ذخیره علاقه‌مندی:", e.message);
  }

  let t = "";
  t += `${plan.emoji} *${plan.name}*\n`;
  t += "━━━━━━━━━━━━━━━━━━━\n\n";
  t += `_${plan.subtitle}_\n\n`;
  t += `💰 قیمت: *${plan.price}*\n\n`;
  t += "📋 *خدمات این بسته:*\n\n";
  for (const f of plan.features) {
    t += `${f}\n`;
  }
  t += "\n━━━━━━━━━━━━━━━━━━━\n\n";
  t += "✅ *برای ثبت سفارش یا اطلاعات بیشتر:*\n\n";
  t += "📱 واتساپ / تلگرام: *۰۹۱۲-XXX-XXXX*\n";
  t += "📧 پشتیبانی: @candidatory\\_support\n\n";
  t += "⏰ _تیم ما در اسرع وقت با شما تماس خواهد گرفت._";

  const kb = new InlineKeyboard()
    .text("📞 تماس با مشاور", "contact_us")
    .row()
    .text("📋 مشاهده همه بسته‌ها", "show_plans")
    .row()
    .text("🔙 منوی اصلی", "menu")
    .row();

  try {
    await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  }

  await ctx.answerCallbackQuery({
    text: `✅ بسته «${plan.name}» ثبت شد — منتظر تماس ما باشید`,
    show_alert: true,
  });
}
