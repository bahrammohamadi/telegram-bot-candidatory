// src/flows/admin.js
// ─── پنل ادمین فارسی ───

import { InlineKeyboard } from "grammy";
import {
  getStats,
  listLeads,
  findUserByNationalId,
  findUserByPhone,
  getUserConsultations,
} from "../utils/db.js";

// ═══════════════════════════════════════
//  دستور /admin
// ═══════════════════════════════════════

export async function handleAdminCommand(ctx) {
  let t = "🔐 *پنل مدیریت — کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  try {
    const stats = await getStats();
    t += "📊 *آمار کلی:*\n\n";
    t += `  👥 کاربران: *${stats.totalUsers}*\n`;
    t += `  📋 مشاوره‌ها: *${stats.totalConsultations}*\n`;
    t += `  🎯 لیدها: *${stats.totalLeads}*\n\n`;
  } catch {
    t += "⚠️ خطا در دریافت آمار\n\n";
  }

  t += "از منوی زیر انتخاب کنید:";

  const kb = new InlineKeyboard()
    .text("📊 بروزرسانی آمار", "admin:stats").row()
    .text("📋 آخرین لیدها", "admin:leads").row()
    .text("🔍 جستجو: کد ملی", "admin:search_nc").row()
    .text("🔍 جستجو: شماره تلفن", "admin:search_ph").row()
    .text("🔙 منوی اصلی", "menu").row();

  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

// ═══════════════════════════════════════
//  callback ادمین
// ═══════════════════════════════════════

export async function handleAdminCallbackQuery(ctx, data) {
  const backKB = new InlineKeyboard().text("🔙 پنل ادمین", "admin:panel").row();

  // آمار
  if (data === "admin:stats") {
    try {
      const s = await getStats();
      let t = "📊 *آمار (بروز):*\n\n";
      t += `👥 کاربران: *${s.totalUsers}*\n`;
      t += `📋 مشاوره‌ها: *${s.totalConsultations}*\n`;
      t += `🎯 لیدها: *${s.totalLeads}*\n`;
      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch {
      await ctx.answerCallbackQuery({ text: "❌ خطا" });
    }
    await ctx.answerCallbackQuery();
    return;
  }

  // لیدها
  if (data === "admin:leads") {
    try {
      const res = await listLeads(10, 0);
      let t = "📋 *آخرین ۱۰ لید:*\n━━━━━━━━━━━━━━━━━━━\n\n";

      if (res.documents.length === 0) {
        t += "هنوز لیدی ثبت نشده.\n";
      } else {
        for (const l of res.documents) {
          t += `🆔 ${l.userId}\n`;
          t += `🌡️ ${l.leadTemperature || "—"} | 📦 ${l.purchasedPlan || "none"}\n`;
          if (l.notes) t += `📝 ${l.notes.substring(0, 80)}...\n`;
          t += "─────────────\n";
        }
      }
      t += `\nکل: ${res.total}`;

      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch {
      await ctx.answerCallbackQuery({ text: "❌ خطا" });
    }
    await ctx.answerCallbackQuery();
    return;
  }

  // جستجو
  if (data === "admin:search_nc") {
    await ctx.editMessageText(
      "🔍 *جستجو با کد ملی*\n\nدستور زیر را ارسال کنید:\n\n`/search_nc 0012345678`",
      { parse_mode: "Markdown", reply_markup: backKB }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "admin:search_ph") {
    await ctx.editMessageText(
      "🔍 *جستجو با شماره تلفن*\n\nدستور زیر را ارسال کنید:\n\n`/search_phone 09121234567`",
      { parse_mode: "Markdown", reply_markup: backKB }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  // بازگشت به پنل
  if (data === "admin:panel") {
    await handleAdminCommand(ctx);
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery();
}

// ═══════════════════════════════════════
//  دستورات جستجوی ادمین
// ═══════════════════════════════════════

/** /search_nc <code> */
export async function handleSearchNC(ctx, code) {
  const user = await findUserByNationalId(code);
  if (!user) {
    await ctx.reply(`❌ کاربری با کد ملی «${code}» یافت نشد.`);
    return;
  }

  let t = "🔍 *نتیجه جستجو:*\n━━━━━━━━━━━━━━━━━━━\n\n";
  t += `🆔 آیدی تلگرام: \`${user.userId}\`\n`;
  t += `👤 نام: ${user.fullName || user.firstName || "—"}\n`;
  t += `🪪 کد ملی: ${user.nationalId || "—"}\n`;
  t += `📱 تلفن: ${user.phone || "—"}\n`;
  t += `📅 عضویت: ${user.createdAt || user.$createdAt || "—"}\n`;

  // مشاوره‌ها
  const cons = await getUserConsultations(user.userId);
  if (cons.documents.length > 0) {
    t += `\n📋 *مشاوره‌ها (${cons.total}):*\n`;
    for (const c of cons.documents) {
      t += `  • امتیاز: ${c.score} | ریسک: ${c.riskLevel} | ${c.createdAt || ""}\n`;
    }
  }

  await ctx.reply(t, { parse_mode: "Markdown" });
}

/** /search_phone <phone> */
export async function handleSearchPhone(ctx, phone) {
  const user = await findUserByPhone(phone);
  if (!user) {
    await ctx.reply(`❌ کاربری با شماره «${phone}» یافت نشد.`);
    return;
  }

  let t = "🔍 *نتیجه جستجو:*\n━━━━━━━━━━━━━━━━━━━\n\n";
  t += `🆔 آیدی تلگرام: \`${user.userId}\`\n`;
  t += `👤 نام: ${user.fullName || user.firstName || "—"}\n`;
  t += `🪪 کد ملی: ${user.nationalId || "—"}\n`;
  t += `📱 تلفن: ${user.phone || "—"}\n`;

  const cons = await getUserConsultations(user.userId);
  if (cons.documents.length > 0) {
    t += `\n📋 *مشاوره‌ها (${cons.total}):*\n`;
    for (const c of cons.documents) {
      t += `  • امتیاز: ${c.score} | ریسک: ${c.riskLevel}\n`;
    }
  }

  await ctx.reply(t, { parse_mode: "Markdown" });
}
