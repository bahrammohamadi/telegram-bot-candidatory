// src/flows/admin.js
// ─── پنل ادمین فارسی ───

import { InlineKeyboard } from "grammy";
import {
  getStats,
  listLeads,
  findByNationalId,
  findByPhone,
  getUserConsultations,
} from "../utils/db.js";

/**
 * دستور /admin
 */
export async function handleAdminCommand(ctx) {
  let t = "🔐 *پنل مدیریت — کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  try {
    const s = await getStats();
    t += "📊 *آمار کلی:*\n\n";
    t += `├ 👥 کاربران: *${s.totalUsers}*\n`;
    t += `├ 📋 مشاوره‌ها: *${s.totalConsultations}*\n`;
    t += `└ 🎯 لیدها: *${s.totalLeads}*\n\n`;
  } catch {
    t += "⚠️ خطا در دریافت آمار\n\n";
  }

  t += "📌 عملیات مورد نظر را انتخاب کنید:";

  const kb = new InlineKeyboard()
    .text("📊 بروزرسانی آمار", "adm:stats")
    .row()
    .text("📋 آخرین لیدها", "adm:leads")
    .row()
    .text("🔍 جستجو با کد ملی", "adm:search_nc")
    .row()
    .text("🔍 جستجو با شماره تماس", "adm:search_ph")
    .row()
    .text("🔙 منو", "menu")
    .row();

  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

/**
 * هندلر callback‌های ادمین
 */
export async function handleAdminCallback(ctx, data) {
  const backKB = new InlineKeyboard().text("🔙 پنل ادمین", "adm:panel").row();

  // ─── آمار ───
  if (data === "adm:stats") {
    try {
      const s = await getStats();
      const t = `📊 *آمار (${new Date().toLocaleTimeString("fa-IR")})*\n\n` +
        `👥 کاربران: *${s.totalUsers}*\n` +
        `📋 مشاوره‌ها: *${s.totalConsultations}*\n` +
        `🎯 لیدها: *${s.totalLeads}*`;
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch { /* ignore */ }
    await ctx.answerCallbackQuery({ text: "✅ بروز شد" });
    return;
  }

  // ─── لیدها ───
  if (data === "adm:leads") {
    try {
      const res = await listLeads(10);
      let t = "📋 *آخرین ۱۰ لید:*\n━━━━━━━━━━━━━━━━━━━\n\n";

      if (res.documents.length === 0) {
        t += "هنوز لیدی ثبت نشده.\n";
      } else {
        for (const l of res.documents) {
          t += `🆔 \`${l.userId}\`\n`;
          t += `🌡️ دمای لید: *${l.leadTemperature}*\n`;
          t += `💼 پلن: ${l.purchasedPlan}\n`;
          if (l.notes) t += `📝 ${l.notes.substring(0, 80)}...\n`;
          t += "─────────────\n";
        }
      }
      t += `\nکل: ${res.total}`;

      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch { /* ignore */ }
    await ctx.answerCallbackQuery();
    return;
  }

  // ─── راهنمای جستجو ───
  if (data === "adm:search_nc") {
    await ctx.editMessageText(
      "🔍 *جستجو با کد ملی*\n\nدستور زیر را ارسال کنید:\n\n`/search 0012345678`",
      { parse_mode: "Markdown", reply_markup: backKB }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "adm:search_ph") {
    await ctx.editMessageText(
      "🔍 *جستجو با شماره تماس*\n\nدستور زیر را ارسال کنید:\n\n`/searchphone 09121234567`",
      { parse_mode: "Markdown", reply_markup: backKB }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  // ─── بازگشت به پنل ───
  if (data === "adm:panel") {
    await handleAdminCommand(ctx);
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery();
}

/**
 * جستجوی ادمین — /search <code> or /searchphone <phone>
 */
export async function handleAdminSearch(ctx, type, query) {
  let results = [];
  const q = query.trim();

  if (type === "national_id") {
    results = await findByNationalId(q);
  } else if (type === "phone") {
    results = await findByPhone(q);
  }

  if (results.length === 0) {
    await ctx.reply(`❌ نتیجه‌ای برای «${q}» یافت نشد.`);
    return;
  }

  for (const u of results) {
    let t = "👤 *پروفایل کاربر*\n━━━━━━━━━━━━━━━━━━━\n\n";
    t += `🆔 آیدی تلگرام: \`${u.userId}\`\n`;
    t += `👤 نام: ${u.firstName || ""} ${u.lastName || ""}\n`;
    t += `📛 یوزرنیم: @${u.username || "—"}\n`;
    t += `🪪 کد ملی: ${u.nationalId || "—"}\n`;
    t += `📱 تماس: ${u.phone || "—"}\n`;
    t += `📅 عضویت: ${u.createdAt || "—"}\n`;
    t += `🕐 آخرین فعالیت: ${u.lastInteraction || "—"}\n`;

    // مشاوره‌ها
    const consults = await getUserConsultations(u.userId);
    if (consults.length > 0) {
      t += `\n📋 *مشاوره‌ها (${consults.length}):*\n`;
      for (const c of consults) {
        t += `├ 📊 امتیاز: ${c.score} — ${c.riskLevel} — ${c.electionType}\n`;
        t += `│  📍 ${c.region}\n`;
        t += `│  📅 ${c.$createdAt}\n`;
      }
    }

    await ctx.reply(t, { parse_mode: "Markdown" });
  }
}
