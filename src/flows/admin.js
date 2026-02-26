// src/flows/admin.js
// ─── پنل ادمین فارسی ───

import { InlineKeyboard } from "grammy";
import {
  getStats, listLeads, findByNationalId, findByPhone, getUserConsultations,
} from "../utils/db.js";

export async function handleAdminCommand(ctx) {
  let t = "🔐 *پنل مدیریت — کاندیداتوری هوشمند*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  try {
    const s = await getStats();
    t += `📊 *آمار:*\n├ 👥 کاربران: *${s.totalUsers}*\n├ 📋 مشاوره‌ها: *${s.totalConsultations}*\n└ 🎯 لیدها: *${s.totalLeads}*\n\n`;
  } catch { t += "⚠️ خطا در آمار\n\n"; }
  t += "عملیات مورد نظر:";

  const kb = new InlineKeyboard()
    .text("📊 بروزرسانی آمار", "adm:stats").row()
    .text("📋 آخرین لیدها", "adm:leads").row()
    .text("🔍 جستجو با کد ملی", "adm:search_nc").row()
    .text("🔍 جستجو با شماره تماس", "adm:search_ph").row()
    .text("🔙 منو", "menu").row();

  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

export async function handleAdminCallback(ctx, data) {
  const backKB = new InlineKeyboard().text("🔙 پنل ادمین", "adm:panel").row();

  if (data === "adm:stats") {
    try {
      const s = await getStats();
      const t = `📊 *آمار:*\n👥 ${s.totalUsers} | 📋 ${s.totalConsultations} | 🎯 ${s.totalLeads}`;
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch {}
    await ctx.answerCallbackQuery({ text: "✅ بروز شد" });
    return;
  }

  if (data === "adm:leads") {
    try {
      const res = await listLeads(10);
      let t = "📋 *آخرین ۱۰ لید:*\n━━━━━━━━━━━━━━━━━━━\n\n";
      if (res.documents.length === 0) t += "هنوز لیدی نیست.\n";
      else {
        for (const l of res.documents) {
          t += `🆔 \`${l.userId}\` | 🌡️ ${l.leadTemperature} | 💼 ${l.purchasedPlan}\n`;
          if (l.notes) t += `📝 ${l.notes.substring(0, 60)}...\n`;
          t += "─────\n";
        }
      }
      t += `\nکل: ${res.total}`;
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "adm:search_nc") {
    await ctx.editMessageText("🔍 *جستجو:*\n\n`/search 0012345678`", {
      parse_mode: "Markdown", reply_markup: backKB,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "adm:search_ph") {
    await ctx.editMessageText("🔍 *جستجو:*\n\n`/searchphone 09121234567`", {
      parse_mode: "Markdown", reply_markup: backKB,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "adm:panel") {
    await handleAdminCommand(ctx);
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery();
}

export async function handleAdminSearch(ctx, type, query) {
  const q = query.trim();
  let results = [];
  if (type === "national_id") results = await findByNationalId(q);
  else if (type === "phone") results = await findByPhone(q);

  if (results.length === 0) {
    await ctx.reply(`❌ نتیجه‌ای برای «${q}» یافت نشد.`);
    return;
  }

  for (const u of results) {
    let t = "👤 *پروفایل کاربر*\n━━━━━━━━━━━━━━━━━━━\n\n";
    t += `🆔 \`${u.userId}\`\n👤 ${u.firstName || ""} ${u.lastName || ""}\n`;
    t += `📛 @${u.username || "—"}\n🪪 ${u.nationalId || "—"}\n📱 ${u.phone || "—"}\n`;
    t += `📅 ${u.createdAt || "—"}\n🕐 ${u.lastInteraction || "—"}\n`;

    const consults = await getUserConsultations(u.userId);
    if (consults.length > 0) {
      t += `\n📋 *مشاوره‌ها (${consults.length}):*\n`;
      for (const c of consults) {
        t += `├ 📊 ${c.score} — ${c.riskLevel} — ${c.electionType}\n`;
      }
    }
    await ctx.reply(t, { parse_mode: "Markdown" });
  }
}
