// src/flows/plans.js
// ─── پلن‌های خدماتی حرفه‌ای و فروش‌محور ───

import { InlineKeyboard } from "grammy";
import { upsertLead } from "../utils/db.js";

const PLANS = [
  {
    id: "starter", emoji: "🌱", name: "بسته راه‌اندازی",
    subtitle: "مناسب تازه‌واردها", price: "۲,۸۰۰,۰۰۰ تومان",
    priceNote: "(امکان پرداخت اقساطی)", badge: "",
    features: [
      "✅ گزارش تحلیلی کامل (PDF ۱۵+ صفحه)",
      "✅ یک جلسه مشاوره تلفنی ۴۵ دقیقه‌ای",
      "✅ راهنمای کامل ثبت‌نام + مدارک",
      "✅ چک‌لیست ۳۰ اقدام ضروری",
      "✅ دسترسی به گروه پشتیبانی",
    ],
    cta: "📞 تماس بگیرید",
  },
  {
    id: "professional", emoji: "⭐", name: "بسته حرفه‌ای",
    subtitle: "🔥 پرفروش‌ترین | مناسب کاندیداهای جدی", price: "۸,۵۰۰,۰۰۰ تومان",
    priceNote: "(پرداخت ۳ قسطی)", badge: "🔥 پیشنهاد ویژه",
    features: [
      "✅ تمام خدمات بسته راه‌اندازی",
      "✅ طراحی استراتژی کمپین اختصاصی",
      "✅ ۳ جلسه مشاوره تخصصی (۶۰ دقیقه)",
      "✅ طراحی پیام و شعار انتخاباتی",
      "✅ برنامه تبلیغات محلی",
      "✅ آموزش فن بیان (۲ جلسه)",
      "✅ تحلیل رقبا",
    ],
    cta: "📞 رزرو کنید — ظرفیت محدود",
  },
  {
    id: "vip", emoji: "💎", name: "بسته VIP مدیریت کمپین",
    subtitle: "برای کسانی که می‌خواهند *برنده* شوند", price: "۲۸,۰۰۰,۰۰۰ تومان",
    priceNote: "(قابل مذاکره)", badge: "💎 تضمین رقابتی",
    features: [
      "✅ تمام خدمات بسته حرفه‌ای",
      "✅ مدیر کمپین اختصاصی تمام‌وقت",
      "✅ تیم اجرایی (مشاور رسانه + طراح)",
      "✅ طراحی تمام محتوای تبلیغاتی",
      "✅ مدیریت شبکه‌های اجتماعی",
      "✅ مدیریت بحران + پاسخ فوری به حملات",
      "✅ پشتیبانی ۲۴/۷ تا پایان شمارش آرا",
    ],
    cta: "📞 جلسه حضوری هماهنگ کنید",
  },
  {
    id: "single_session", emoji: "🎓", name: "مشاوره تکی",
    subtitle: "فقط یک جلسه تخصصی", price: "۱,۵۰۰,۰۰۰ تومان",
    priceNote: "", badge: "",
    features: [
      "✅ جلسه ۶۰ دقیقه‌ای آنلاین/تلفنی",
      "✅ تحلیل اختصاصی وضعیت شما",
      "✅ پاسخ به تمام سؤالات",
      "✅ نقشه راه اولیه (PDF)",
    ],
    cta: "📞 رزرو جلسه مشاوره",
  },
];

function buildPlansIntro() {
  let t = "💼 *خدمات تخصصی کاندیداتوری هوشمند*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "🏆 *چرا خدمات حرفه‌ای ضروری است؟*\n\n";
  t += "📌 ۷۵٪ کاندیداهای ناموفق بدون مشاور وارد شدند\n";
  t += "📌 مشاوره تخصصی شانس موفقیت را تا *۳ برابر* افزایش می‌دهد\n\n";
  t += "─── بسته مورد نظر را انتخاب کنید: ───";
  return t;
}

function plansListKB() {
  const kb = new InlineKeyboard();
  for (const p of PLANS) {
    let label = `${p.emoji} ${p.name} — ${p.price}`;
    if (p.badge) label = `${p.badge} ${label}`;
    kb.text(label, `plan:${p.id}`).row();
  }
  kb.text("🔙 بازگشت به منو", "menu").row();
  return kb;
}

export async function handleShowPlans(ctx) {
  const text = buildPlansIntro();
  const kb = plansListKB();
  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }); }
    catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

export async function handleSelectPlan(ctx, planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) { await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }

  let t = plan.badge ? `${plan.badge}\n` : "";
  t += `${plan.emoji} *${plan.name}*\n_${plan.subtitle}_\n━━━━━━━━━━━━━━━━━━━\n\n`;
  t += `💰 قیمت: *${plan.price}*\n`;
  if (plan.priceNote) t += `   ${plan.priceNote}\n`;
  t += "\n📋 *شامل:*\n\n";
  for (const f of plan.features) t += `  ${f}\n`;
  t += `\n━━━━━━━━━━━━━━━━━━━\n🎯 *${plan.cta}*\n\n`;
  t += "📱 تماس: *۰۹۱۲-XXX-XXXX*\n💬 تلگرام: @candidatory\\_support";

  const kb = new InlineKeyboard()
    .text("📞 ثبت درخواست", `plan_request:${planId}`).row()
    .text("📋 همه بسته‌ها", "show_plans").row()
    .text("🔙 منو", "menu").row();

  try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
  catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
  await ctx.answerCallbackQuery();
}

export async function handlePlanRequest(ctx, planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) { await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }

  try {
    await upsertLead(String(ctx.from.id), {
      purchasedPlan: plan.id,
      leadTemperature: "hot",
      notes: `علاقه‌مند به «${plan.name}» — ${new Date().toLocaleDateString("fa-IR")}`,
    });
  } catch (e) { console.error("خطا:", e.message); }

  const t = `✅ *درخواست بسته «${plan.name}» ثبت شد!*\n\n📞 کارشناسان ما تماس خواهند گرفت.\n\n💬 تلگرام: @candidatory\\_support`;
  const kb = new InlineKeyboard()
    .text("📋 بسته‌ها", "show_plans").row()
    .text("🔙 منو", "menu").row();

  try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); }
  catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
  await ctx.answerCallbackQuery({ text: `✅ درخواست «${plan.name}» ثبت شد!`, show_alert: true });
}
