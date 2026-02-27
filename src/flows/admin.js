// src/flows/admin.js — CommonJS

const { InlineKeyboard } = require("grammy");
const { getStats, listLeads, findByNationalId, findByPhone, getUserConsultations } = require("../utils/db.js");

async function handleAdminCommand(ctx) {
  let t = "🔐 *پنل مدیریت*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  try { const s = await getStats(); t += `👥 ${s.totalUsers} | 📋 ${s.totalConsultations} | 🎯 ${s.totalLeads}\n\n`; } catch { t += "⚠️ خطا\n\n"; }
  const kb = new InlineKeyboard().text("📊 آمار", "adm:stats").row().text("📋 لیدها", "adm:leads").row().text("🔍 کد ملی", "adm:search_nc").row().text("🔍 تلفن", "adm:search_ph").row().text("🔙 منو", "menu").row();
  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleAdminCallback(ctx, data) {
  const bk = new InlineKeyboard().text("🔙 پنل ادمین", "adm:panel").row();
  if (data === "adm:stats") { try { const s = await getStats(); await ctx.editMessageText(`📊 👥 ${s.totalUsers} | 📋 ${s.totalConsultations} | 🎯 ${s.totalLeads}`, { parse_mode: "Markdown", reply_markup: bk }); } catch {} await ctx.answerCallbackQuery({ text: "✅" }); return; }
  if (data === "adm:leads") { try { const res = await listLeads(10); let t = "📋 *لیدها:*\n\n"; if (!res.documents.length) t += "خالی"; else for (const l of res.documents) t += `🆔 \`${l.userId}\` 🌡️${l.leadTemperature} 💼${l.purchasedPlan}\n─────\n`; t += `\nکل: ${res.total}`; await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: bk }); } catch {} await ctx.answerCallbackQuery(); return; }
  if (data === "adm:search_nc") { await ctx.editMessageText("🔍 `/search 0012345678`", { parse_mode: "Markdown", reply_markup: bk }); await ctx.answerCallbackQuery(); return; }
  if (data === "adm:search_ph") { await ctx.editMessageText("🔍 `/searchphone 09121234567`", { parse_mode: "Markdown", reply_markup: bk }); await ctx.answerCallbackQuery(); return; }
  if (data === "adm:panel") { await handleAdminCommand(ctx); await ctx.answerCallbackQuery(); return; }
  await ctx.answerCallbackQuery();
}

async function handleAdminSearch(ctx, type, query) {
  const q = query.trim();
  const results = type === "national_id" ? await findByNationalId(q) : await findByPhone(q);
  if (!results.length) { await ctx.reply(`❌ نتیجه‌ای برای «${q}» یافت نشد.`); return; }
  for (const u of results) {
    let t = `👤 *پروفایل*\n🆔 \`${u.userId}\`\n👤 ${u.firstName || ""} ${u.lastName || ""}\n📛 @${u.username || "—"}\n🪪 ${u.nationalId || "—"}\n📱 ${u.phone || "—"}\n`;
    const cs = await getUserConsultations(u.userId);
    if (cs.length) { t += `\n📋 *${cs.length} مشاوره:*\n`; for (const c of cs) t += `├ ${c.score} — ${c.riskLevel}\n`; }
    await ctx.reply(t, { parse_mode: "Markdown" });
  }
}

module.exports = { handleAdminCommand, handleAdminCallback, handleAdminSearch };
