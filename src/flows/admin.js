// src/flows/admin.js
// ─── پنل ادمین فارسی — مدیریت کاربران، لیدها و جستجو ───
// نسخه اصلاح‌شده: ۱۴۰۴/۱۲/۰۸ — اضافه شدن lastInteractionNew + بهبود UX + امنیت بیشتر

const { InlineKeyboard } = require("grammy");
const {
  getStats,
  listLeads,
  findByNationalId,
  findByPhone,
  getUserConsultations,
  updateUser,
} = require("../utils/db.js");

// ─── پنل اصلی ادمین ───
async function handleAdminCommand(ctx) {
  const userId = String(ctx.from.id);

  // آپدیت آخرین تعامل ادمین
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  let t = "🔐 *پنل مدیریت کاندیداتوری هوشمند*\n";
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  try {
    const s = await getStats();
    t += `👥 کاربران کل: ${s.totalUsers}\n`;
    t += `📋 مشاوره‌های انجام‌شده: ${s.totalConsultations}\n`;
    t += `🎯 لیدهای ثبت‌شده: ${s.totalLeads}\n\n`;
  } catch (e) {
    console.error("خطا در getStats:", e.message);
    t += "⚠️ خطا در بارگذاری آمار\n\n";
  }

  const kb = new InlineKeyboard()
    .text("📊 آمار دقیق", "adm:stats").row()
    .text("📋 لیست لیدها (آخرین ۱۰)", "adm:leads").row()
    .text("🔍 جستجو با کد ملی", "adm:search_nc").row()
    .text("🔍 جستجو با شماره تلفن", "adm:search_ph").row()
    .text("🔙 بازگشت به منو", "menu").row();

  try {
    await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch (e) {
    console.error("خطا در نمایش پنل ادمین:", e.message);
    await ctx.reply("⚠️ خطایی رخ داد. لطفاً دوباره امتحان کنید.");
  }
}

// ─── هندلر callbackهای پنل ───
async function handleAdminCallback(ctx, data) {
  const userId = String(ctx.from.id);

  // آپدیت آخرین تعامل
  await updateUser(userId, {
    lastInteractionNew: new Date().toISOString().slice(0, 19),
  });

  const backKB = new InlineKeyboard()
    .text("🔙 بازگشت به پنل ادمین", "adm:panel").row()
    .text("🔙 منوی اصلی", "menu").row();

  if (data === "adm:stats") {
    try {
      const s = await getStats();
      let t = "📊 *آمار دقیق سیستم*\n━━━━━━━━━━━━━━━━━━━\n\n";
      t += `👥 تعداد کاربران ثبت‌شده: ${s.totalUsers}\n`;
      t += `📋 تعداد مشاوره‌های تکمیل‌شده: ${s.totalConsultations}\n`;
      t += `🎯 تعداد لیدهای فروش: ${s.totalLeads}\n\n`;
      t += "📅 به‌روزرسانی: " + new Date().toLocaleString("fa-IR");

      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch (e) {
      await ctx.editMessageText("⚠️ خطا در بارگذاری آمار", { reply_markup: backKB });
    }
    await ctx.answerCallbackQuery({ text: "✅ آمار بارگذاری شد" });
    return;
  }

  if (data === "adm:leads") {
    try {
      const res = await listLeads(10);
      let t = "📋 *آخرین ۱۰ لید ثبت‌شده*\n━━━━━━━━━━━━━━━━━━━\n\n";

      if (!res.documents.length) {
        t += "هنوز هیچ لیدی ثبت نشده است.";
      } else {
        for (const l of res.documents) {
          t += `🆔 \`${l.userId}\`\n`;
          t += `🌡️ دمای لید: ${l.leadTemperature || "نامشخص"}\n`;
          t += `💼 پلن مورد علاقه: ${l.purchasedPlan || "هیچ"}\n`;
          t += `📅 آخرین پیگیری: ${l.lastFollowUp ? new Date(l.lastFollowUp).toLocaleString("fa-IR") : "نامشخص"}\n`;
          if (l.notes) t += `📝 یادداشت: ${l.notes.substring(0, 100)}${l.notes.length > 100 ? "..." : ""}\n`;
          t += "────────────────────\n";
        }
        t += `\nکل لیدها: ${res.total}`;
      }

      await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: backKB });
    } catch (e) {
      console.error("خطا در لیست لیدها:", e.message);
      await ctx.editMessageText("⚠️ خطا در بارگذاری لیدها", { reply_markup: backKB });
    }
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "adm:search_nc") {
    await ctx.editMessageText(
      "🔍 *جستجو با کد ملی*\n\n" +
      "دستور را در چت بنویسید:\n" +
      "`/search 0012345678`\n\n" +
      "یا مستقیم کد ملی را وارد کنید.",
      { parse_mode: "Markdown", reply_markup: backKB }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "adm:search_ph") {
    await ctx.editMessageText(
      "🔍 *جستجو با شماره تلفن*\n\n" +
      "دستور را در چت بنویسید:\n" +
      "`/searchphone 09121234567`\n\n" +
      "یا مستقیم شماره را وارد کنید.",
      { parse_mode: "Markdown", reply_markup: backKB }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  if (data === "adm:panel") {
    await handleAdminCommand(ctx);
    await ctx.answerCallbackQuery({ text: "بازگشت به پنل" });
    return;
  }

  await ctx.answerCallbackQuery();
}

// ─── جستجوی ادمین (با کد ملی یا تلفن) ───
async function handleAdminSearch(ctx, type, query) {
  const q = query.trim();
  if (!q) {
    await ctx.reply("❌ لطفاً مقدار جستجو را وارد کنید.");
    return;
  }

  const results =
    type === "national_id" ? await findByNationalId(q) : await findByPhone(q);

  if (!results.length) {
    await ctx.reply(`❌ هیچ کاربری با «${q}» یافت نشد.`);
    return;
  }

  for (const u of results) {
    let t = `👤 *پروفایل کاربر*\n━━━━━━━━━━━━━━━━━━━\n\n`;
    t += `🆔 آیدی تلگرام: \`${u.userId}\`\n`;
    t += `👤 نام: ${u.firstName || ""} ${u.lastName || ""}\n`;
    t += `📛 یوزرنیم: @${u.username || "ندارد"}\n`;
    t += `🪪 کد ملی: ${u.nationalId ? maskNationalId(u.nationalId) : "ثبت نشده"}\n`;
    t += `📱 تلفن: ${u.phone ? maskPhone(u.phone) : "ثبت نشده"}\n`;
    t += `📅 تاریخ عضویت: ${new Date(u.createdAt).toLocaleString("fa-IR")}\n\n`;

    const cs = await getUserConsultations(u.userId);
    if (cs.length) {
      t += `📋 *${cs.length} مشاوره انجام‌شده:*\n`;
      cs.forEach((c, i) => {
        t += `├ مشاوره ${i + 1}: امتیاز ${c.score || 0}/125 — ریسک ${c.riskLevel || "نامشخص"}\n`;
        if (c.createdAt) t += `   تاریخ: ${new Date(c.createdAt).toLocaleDateString("fa-IR")}\n`;
      });
    } else {
      t += "هیچ مشاوره‌ای انجام نشده.\n";
    }

    await ctx.reply(t, { parse_mode: "Markdown" });
  }
}

// ─── توابع کمکی ماسک اطلاعات حساس ───
function maskNationalId(nid) {
  if (!nid || nid.length !== 10) return nid;
  return nid.substring(0, 3) + "******" + nid.substring(9);
}

function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.substring(0, 4) + "*******" + phone.substring(10);
}

module.exports = {
  handleAdminCommand,
  handleAdminCallback,
  handleAdminSearch,
};
