const { InlineKeyboard } = require("grammy");
const { upsertLead } = require("../utils/db.js");

const PLANS = [
  {
    id: "free",
    name: "🆓 رایگان",
    price: "رایگان",
    description: "برای آشنایی اولیه",
    features: ["✅ تحلیل اولیه", "✅ گزارش خلاصه", "❌ مشاوره"],
  },
  {
    id: "starter",
    name: "🚀 راه اندازی",
    price: "500,000 تومان",
    description: "برای کاندیداهای تازه کار",
    features: ["✅ تحلیل نامحدود", "✅ گزارش تفصیلی", "✅ پشتیبانی 24 ساعته"],
  },
  {
    id: "professional",
    name: "💼 حرفه ای",
    price: "2,000,000 تومان",
    description: "برای کاندیداهای جدی",
    features: ["✅ تحلیل رقبا", "✅ تحلیل منطقه ای", "✅ 3 جلسه مشاوره"],
  },
  {
    id: "vip",
    name: "👑 ویژه",
    price: "5,000,000 تومان",
    description: "برای کمپین های بزرگ",
    features: ["✅ مشاور اختصاصی", "✅ نظرسنجی", "✅ پشتیبانی فوری"],
  },
];

async function handleShowPlans(ctx) {
  let text = "💼 بسته های خدماتی\n\n";
  text += "با انتخاب پلن مناسب، شانس موفقیت خود را افزایش دهید.\n\n";

  const kb = new InlineKeyboard();

  PLANS.forEach((plan) => {
    kb.text(plan.name, `select_plan:${plan.id}`).row();
  });

  kb.text("🏠 منو", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { reply_markup: kb });
    } catch {
      await ctx.reply(text, { reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { reply_markup: kb });
  }
}

async function handleSelectPlan(ctx) {
  const planId = ctx.callbackQuery.data.split(":")[1];
  const plan = PLANS.find((p) => p.id === planId);

  if (!plan) {
    await ctx.answerCallbackQuery("پیدا نشد");
    return;
  }

  let text = `${plan.name}\n\n`;
  text += `💰 قیمت: ${plan.price}\n\n`;
  text += `📝 ${plan.description}\n\n`;
  text += "📋 امکانات:\n\n";

  plan.features.forEach((f) => {
    text += `${f}\n`;
  });

  text += "\n";

  if (plan.id === "free") {
    text += "این پلن رایگان است.\n\n";
    text += "برای شروع از منو استفاده کنید.";
  } else {
    text += "برای خرید با پشتیبانی تماس بگیرید.";
  }

  try {
    await upsertLead(ctx.from.id, {
      leadTemperature: plan.id === "vip" ? "hot" : "warm",
      notes: JSON.stringify({
        interestedPlan: plan.id,
        timestamp: new Date().toISOString(),
      }),
      lastFollowUp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("خطا در ثبت lead:", e);
  }

  const kb = new InlineKeyboard();

  if (plan.id !== "free") {
    kb.text("📞 تماس", "contact_us").row();
  }

  kb.text("« لیست", "show_plans").row();
  kb.text("🏠 منو", "menu");

  try {
    await ctx.editMessageText(text, { reply_markup: kb });
  } catch {
    await ctx.reply(text, { reply_markup: kb });
  }

  await ctx.answerCallbackQuery();
}

module.exports = {
  handleShowPlans,
  handleSelectPlan,
};
