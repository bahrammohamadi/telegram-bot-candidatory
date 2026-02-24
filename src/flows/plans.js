// ============================================================
// 📦 فلو پلن‌های خدمات (Placeholder)
// ============================================================

import { InlineKeyboard } from "grammy";
import { upsertLead } from "../utils/db.js";
import { backKB } from "../utils/keyboard.js";

export const PLANS_TEXT = `
📦 *پلن‌های خدمات کاندیداتوری هوشمند*

━━━━━━━━━━━━━━━━━━━━━

📌 *پلن پایه (Basic) — رایگان*
• تحلیل اولیه شانس کاندیداتوری
• گزارش خلاصه وضعیت
• راهنمای عمومی ثبت‌نام

━━━━━━━━━━━━━━━━━━━━━

⭐ *پلن حرفه‌ای (Pro)*
• تحلیل جامع رقبا
• استراتژی تبلیغاتی اختصاصی
• مشاوره تلفنی ۳۰ دقیقه‌ای
• نقشه راه انتخاباتی
💰 *تماس بگیرید*

━━━━━━━━━━━━━━━━━━━━━

💎 *پلن VIP*
• تمام امکانات پلن حرفه‌ای
• مدیریت کامل کمپین
• تیم مشاوره اختصاصی ۲۴/۷
• تحلیل لحظه‌ای رقبا
• مدیریت بحران
💰 *تماس بگیرید*
`;

export function plansKB() {
  return new InlineKeyboard()
    .text("📌 انتخاب پلن پایه (رایگان)", "plan_basic")
    .row()
    .text("⭐ انتخاب پلن حرفه‌ای", "plan_pro")
    .row()
    .text("💎 انتخاب پلن VIP", "plan_vip")
    .row()
    .text("📞 مشاوره قبل از خرید", "contact")
    .row()
    .text("🏠 منوی اصلی", "main_menu");
}

/**
 * نمایش پلن‌ها
 */
export async function handleShowPlans(ctx) {
  await ctx.editMessageText(PLANS_TEXT, {
    parse_mode: "Markdown",
    reply_markup: plansKB(),
  });
  await ctx.answerCallbackQuery();
}

/**
 * انتخاب پلن — ثبت علاقه‌مندی
 */
export async function handleSelectPlan(ctx, planType) {
  const names = { basic: "پایه", pro: "حرفه‌ای", vip: "VIP" };
  const temps = { basic: "cold", pro: "warm", vip: "hot" };

  // ثبت لید
  await upsertLead(ctx.from.id, {
    leadTemperature: temps[planType] || "cold",
    purchasedPlan: "none",
    notes: JSON.stringify({ interestedPlan: planType }),
  });

  await ctx.editMessageText(
    `✅ علاقه‌مندی شما به *پلن ${names[planType]}* ثبت شد!\n\n` +
      `کارشناسان ما به زودی با شما تماس خواهند گرفت.\n\n` +
      `📞 برای تماس فوری: ۰۲۱-XXXXXXXX`,
    {
      parse_mode: "Markdown",
      reply_markup: backKB(),
    }
  );
  await ctx.answerCallbackQuery("✅ ثبت شد!");
}