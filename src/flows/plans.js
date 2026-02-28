// src/flows/plans.js
// ─── نمایش و مدیریت بسته‌های خدماتی — فروش‌محور ───
// نسخه اصلاح‌شده: ۱۴۰۴/۱۲/۰۸ — متن‌های متقاعدکننده‌تر + lastInteractionNew + UX بهتر

const { InlineKeyboard } = require("grammy");
const { upsertLead, updateUser } = require("../utils/db.js"); // updateUser برای lastInteractionNew

// لیست بسته‌ها — حرفه‌ای، با حس فوریت و ارزش
const PLANS = [
  {
    id: "starter",
    emoji: "🌱",
    name: "بسته راه‌اندازی",
    subtitle: "ایده‌آل برای تازه‌واردان",
    price: "۲,۸۰۰,۰۰۰ تومان",
    badge: "",
    features: [
      "گزارش PDF جامع ۱۵+ صفحه",
      "مشاوره تلفنی اختصاصی ۴۵ دقیقه",
      "راهنمای گام‌به‌گام ثبت‌نام",
      "چک‌لیست ۳۰ اقدام فوری",
      "دسترسی به گروه پشتیبانی VIP",
    ],
    cta: "📞 همین حالا تماس بگیرید",
  },
  {
    id: "professional",
    emoji: "⭐",
    name: "بسته حرفه‌ای",
    subtitle: "🔥 پرفروش‌ترین بسته",
    price: "۸,۵۰۰,۰۰۰ تومان",
    badge: "🔥",
    features: [
      "تمام خدمات بسته راه‌اندازی",
      "استراتژی اختصاصی کمپین",
      "۳ جلسه مشاوره ۶۰ دقیقه‌ای",
      "طراحی شعار و پیام انتخاباتی",
      "برنامه تبلیغاتی ۹۰ روزه",
      "آموزش فن بیان و سخنرانی",
      "تحلیل رقبا و نقاط ضعف",
    ],
    cta: "📞 رزرو فوری — ظرفیت محدود",
  },
  {
    id: "vip",
    emoji: "💎",
    name: "بسته VIP",
    subtitle: "مدیریت کامل کمپین شما",
    price: "۲۸,۰۰۰,۰۰۰ تومان",
    badge: "💎",
    features: [
      "تمام خدمات بسته حرفه‌ای",
      "مدیر کمپین اختصاصی",
      "تیم اجرایی و عملیاتی",
      "تولید محتوای تبلیغاتی",
      "مدیریت شبکه‌های اجتماعی",
      "مدیریت بحران و شایعه",
      "پشتیبانی ۲۴/۷ اولویت‌دار",
    ],
    cta: "📞 جلسه حضوری هماهنگ کنید",
  },
  {
    id: "single_session",
    emoji: "🎓",
    name: "مشاوره تکی",
    subtitle: "یک جلسه تخصصی عمیق",
    price: "۱,۵۰۰,۰۰۰ تومان",
    badge: "",
    features: [
      "جلسه ۶۰ دقیقه‌ای اختصاصی",
      "تحلیل وضعیت فعلی شما",
      "پاسخ به تمام سؤالات",
      "نقشه راه شخصی PDF",
    ],
    cta: "📞 رزرو سریع جلسه",
  },
];

/**
 * کیبورد لیست بسته‌ها
 */
function plansListKB() {
  const kb = new InlineKeyboard();

  for (const p of PLANS) {
    const badge = p.badge ? `${p.badge} ` : "";
    kb.text(`${badge}${p.emoji} ${p.name} — ${p.price}`, `plan:${p.id}`).row();
  }

  kb.text("🔙 بازگشت به منو", "menu").row();
  return kb;
}

/**
 * نمایش صفحه اصلی بسته‌ها
 */
async function handleShowPlans(ctx) {
  const userId = String(ctx.from.id);

  // آپدیت آخرین تعامل
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  let t = "💼 *بسته‌های تخصصی کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "📌 مشاوره و استراتژی حرفه‌ای شانس موفقیت شما را چند برابر می‌کند.\n";
  t += "هر بسته دقیقاً متناسب با مرحله آمادگی شما طراحی شده است.\n\n";
  t += "─── بسته مناسب خود را انتخاب کنید ───";

  const kb = plansListKB();

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("خطا در نمایش بسته‌ها:", e.message);
    await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره امتحان کنید.");
  }
}

/**
 * نمایش جزئیات یک بسته خاص
 */
async function handleSelectPlan(ctx, planId) {
  const userId = String(ctx.from.id);
  const plan = PLANS.find(p => p.id === planId);

  if (!plan) {
    await ctx.answerCallbackQuery({ text: "❌ بسته موردنظر یافت نشد" });
    return;
  }

  // آپدیت آخرین تعامل
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  let t = `${plan.emoji} *${plan.name}*\n`;
  t += `_${plan.subtitle}_ — ${plan.price}\n`;
  t += "━━━━━━━━━━━━━━━━━━━\n\n";
  t += "📋 *این بسته شامل:*\n\n";

  for (const f of plan.features) {
    t += `${f}\n`;
  }

  t += "\n🎯 *اقدام بعدی:*\n";
  t += `👉 ${plan.cta}\n`;
  t += "📱 ۰۹۱۲-XXX-XXXX | 💬 @candidatory_support";

  const kb = new InlineKeyboard()
    .text("📞 ثبت درخواست این بسته", `plan_request:${planId}`).row()
    .text("📋 مشاهده همه بسته‌ها", "show_plans").row()
    .text("🔙 بازگشت به منو", "menu").row();

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("خطا در نمایش جزئیات بسته:", e.message);
    await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره امتحان کنید.");
  }
}

/**
 * ثبت درخواست کاربر برای بسته
 */
async function handlePlanRequest(ctx, planId) {
  const userId = String(ctx.from.id);
  const plan = PLANS.find(p => p.id === planId);

  if (!plan) {
    await ctx.answerCallbackQuery({ text: "❌ بسته موردنظر یافت نشد" });
    return;
  }

  // آپدیت آخرین تعامل
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  // ثبت علاقه‌مندی در لید
  try {
    await upsertLead(userId, {
      purchasedPlan: plan.id,
      leadTemperature: "hot",
      notes: `درخواست بسته: «${plan.name}» — ${plan.price} — ${new Date().toLocaleString("fa-IR")}`,
    });
  } catch (e) {
    console.error("خطا در ثبت درخواست بسته:", e.message);
  }

  let t = `✅ *درخواست شما برای «${plan.name}» با موفقیت ثبت شد!*\n\n`;
  t += "📞 کارشناسان ما در اولین فرصت با شما تماس خواهند گرفت.\n";
  t += "💬 در صورت نیاز سریع: @candidatory_support\n\n";
  t += "ممنون از اعتمادتون! 🚀";

  const kb = new InlineKeyboard()
    .text("📋 مشاهده بسته‌ها", "show_plans").row()
    .text("🔙 بازگشت به منو", "menu").row();

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
    }

    await ctx.answerCallbackQuery({
      text: `✅ درخواست «${plan.name}» ثبت شد!`,
      show_alert: true,
    });
  } catch (e) {
    console.error("خطا در نمایش تأیید درخواست:", e.message);
    await ctx.reply("✅ درخواست ثبت شد. کارشناسان تماس می‌گیرند.");
  }
}

module.exports = {
  handleShowPlans,
  handleSelectPlan,
  handlePlanRequest,
};
