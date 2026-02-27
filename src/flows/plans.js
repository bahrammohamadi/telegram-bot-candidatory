// src/flows/plans.js — CommonJS

const { InlineKeyboard } = require("grammy");
const { upsertLead } = require("../utils/db.js");

const PLANS = [
  { id: "starter", emoji: "🌱", name: "بسته راه‌اندازی", subtitle: "مناسب تازه‌واردها", price: "۲,۸۰۰,۰۰۰ تومان", badge: "", features: ["✅ گزارش PDF ۱۵+ صفحه", "✅ مشاوره تلفنی ۴۵ دقیقه", "✅ راهنمای ثبت‌نام", "✅ چک‌لیست ۳۰ اقدام", "✅ گروه پشتیبانی"], cta: "📞 تماس بگیرید" },
  { id: "professional", emoji: "⭐", name: "بسته حرفه‌ای", subtitle: "🔥 پرفروش‌ترین", price: "۸,۵۰۰,۰۰۰ تومان", badge: "🔥", features: ["✅ تمام خدمات راه‌اندازی", "✅ استراتژی کمپین", "✅ ۳ جلسه مشاوره ۶۰ دقیقه", "✅ طراحی شعار", "✅ برنامه تبلیغات", "✅ آموزش فن بیان", "✅ تحلیل رقبا"], cta: "📞 رزرو — ظرفیت محدود" },
  { id: "vip", emoji: "💎", name: "بسته VIP", subtitle: "مدیریت کامل کمپین", price: "۲۸,۰۰۰,۰۰۰ تومان", badge: "💎", features: ["✅ تمام خدمات حرفه‌ای", "✅ مدیر کمپین اختصاصی", "✅ تیم اجرایی", "✅ محتوای تبلیغاتی", "✅ مدیریت شبکه‌های اجتماعی", "✅ مدیریت بحران", "✅ پشتیبانی ۲۴/۷"], cta: "📞 جلسه حضوری" },
  { id: "single_session", emoji: "🎓", name: "مشاوره تکی", subtitle: "یک جلسه تخصصی", price: "۱,۵۰۰,۰۰۰ تومان", badge: "", features: ["✅ جلسه ۶۰ دقیقه", "✅ تحلیل وضعیت", "✅ پاسخ به سؤالات", "✅ نقشه راه PDF"], cta: "📞 رزرو جلسه" },
];

function plansListKB() {
  const kb = new InlineKeyboard();
  for (const p of PLANS) { kb.text(`${p.badge ? p.badge + " " : ""}${p.emoji} ${p.name} — ${p.price}`, `plan:${p.id}`).row(); }
  kb.text("🔙 منو", "menu").row();
  return kb;
}

async function handleShowPlans(ctx) {
  const t = "💼 *خدمات تخصصی*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📌 مشاوره تخصصی شانس موفقیت را ۳ برابر می‌کند.\n\n─── بسته انتخاب کنید: ───";
  const kb = plansListKB();
  if (ctx.callbackQuery) { try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); } await ctx.answerCallbackQuery(); }
  else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleSelectPlan(ctx, planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) { await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }
  let t = `${plan.emoji} *${plan.name}*\n_${plan.subtitle}_\n━━━━━━━━━━━━━━━━━━━\n💰 *${plan.price}*\n\n📋 *شامل:*\n`;
  for (const f of plan.features) t += `  ${f}\n`;
  t += `\n🎯 *${plan.cta}*\n📱 ۰۹۱۲-XXX-XXXX | 💬 @candidatory\\_support`;
  const kb = new InlineKeyboard().text("📞 ثبت درخواست", `plan_request:${planId}`).row().text("📋 همه بسته‌ها", "show_plans").row().text("🔙 منو", "menu").row();
  try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
  await ctx.answerCallbackQuery();
}

async function handlePlanRequest(ctx, planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) { await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }
  try { await upsertLead(String(ctx.from.id), { purchasedPlan: plan.id, leadTemperature: "hot", notes: `علاقه‌مند به «${plan.name}»` }); } catch (e) { console.error(e.message); }
  const t = `✅ *درخواست «${plan.name}» ثبت شد!*\n\n📞 کارشناسان تماس خواهند گرفت.\n💬 @candidatory\\_support`;
  const kb = new InlineKeyboard().text("📋 بسته‌ها", "show_plans").row().text("🔙 منو", "menu").row();
  try { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
  await ctx.answerCallbackQuery({ text: `✅ «${plan.name}» ثبت شد!`, show_alert: true });
}

module.exports = { handleShowPlans, handleSelectPlan, handlePlanRequest };
