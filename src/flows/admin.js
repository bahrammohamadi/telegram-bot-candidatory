// ============================================================
// 🔐 پنل ادمین — مشاهده و مدیریت داده‌ها
// ============================================================

import { InlineKeyboard } from "grammy";
import {
  isAdmin,
  listConsultations,
  getConsultation,
  updateConsultation,
} from "../utils/db.js";

const ADMIN_PIN = "1403"; // ← PIN امنیتی — بعداً عوض کن

const STATUS_ICONS = {
  free: "🟢",
  pro_requested: "🟡",
  pro_paid: "🔵",
  analyzed: "✅",
};

// ============================================================
// 🔐 ورود ادمین — /admin
// ============================================================
export async function handleAdminCommand(ctx) {
  const userId = ctx.from.id;
  const admin = await isAdmin(userId);

  if (!admin) {
    await ctx.reply("⛔ شما دسترسی ادمین ندارید.");
    return;
  }

  await ctx.reply(
    "🔐 *پنل مدیریت*\n\nلطفاً کد امنیتی ۴ رقمی را وارد کنید:",
    { parse_mode: "Markdown" }
  );

  // ذخیره state ادمین
  // currentStep = 5000 یعنی منتظر PIN
}

// ============================================================
// 📋 نمایش لیست مشاوره‌ها
// ============================================================
export async function handleAdminList(ctx, page = 0) {
  const result = await listConsultations(page, 5);
  const docs = result.documents;
  const total = result.total;

  if (docs.length === 0) {
    await ctx.reply("📭 هیچ مشاوره‌ای ثبت نشده.");
    return;
  }

  let txt = `🔐 *پنل مدیریت — لیست مشاوره‌ها*\n`;
  txt += `📊 مجموع: ${total} | صفحه ${page + 1}\n`;
  txt += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const kb = new InlineKeyboard();

  docs.forEach((doc, i) => {
    const num = page * 5 + i + 1;
    let answers = {};
    try { answers = JSON.parse(doc.answers || "{}"); } catch {}

    const name = doc.fullName || answers.fullName || "بدون نام";
    const region = doc.region || answers.region || "—";
    const status = doc.status || "free";
    const icon = STATUS_ICONS[status] || "⚪";
    const score = doc.score || 0;

    txt += `${num}. ${icon} *${name}*\n`;
    txt += `   📍 ${region} | 📈 ${score} | ${status}\n\n`;

    kb.text(`👁️ ${num}. ${name}`, `admin_view_${doc.$id}`).row();
  });

  // Pagination
  const hasNext = total > (page + 1) * 5;
  const hasPrev = page > 0;

  if (hasPrev) kb.text("⬅️ قبلی", `admin_page_${page - 1}`);
  if (hasNext) kb.text("➡️ بعدی", `admin_page_${page + 1}`);
  if (hasPrev || hasNext) kb.row();

  kb.text("🏠 منوی اصلی", "main_menu");

  await ctx.reply(txt, {
    parse_mode: "Markdown",
    reply_markup: kb,
  });
}

// ============================================================
// 👁️ مشاهده جزئیات یک مشاوره
// ============================================================
export async function handleAdminView(ctx, docId) {
  const doc = await getConsultation(docId);

  if (!doc) {
    await ctx.answerCallbackQuery("❌ پیدا نشد");
    return;
  }

  let answers = {};
  try { answers = JSON.parse(doc.answers || "{}"); } catch {}

  const status = doc.status || "free";
  const icon = STATUS_ICONS[status] || "⚪";

  let txt = `🔐 *جزئیات مشاوره*\n`;
  txt += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  txt += `${icon} وضعیت: *${status}*\n`;
  txt += `📈 امتیاز: *${doc.score || 0}*\n`;
  txt += `📅 تاریخ: ${doc.createdAt || "—"}\n\n`;

  // نمایش تمام جواب‌ها
  txt += `📋 *پاسخ‌ها:*\n`;
  for (const [key, val] of Object.entries(answers)) {
    const display = typeof val === "string" ? val : JSON.stringify(val);
    txt += `• *${key}:* ${display}\n`;
  }

  txt += `\n━━━━━━━━━━━━━━━━━━━━━\n`;

  if (doc.adminNotes) {
    txt += `📝 یادداشت ادمین: ${doc.adminNotes}\n`;
  }

  // کیبورد مدیریت
  const kb = new InlineKeyboard()
    .text("🟡 Pro Requested", `admin_status_${docId}_pro_requested`)
    .row()
    .text("🔵 Pro Paid", `admin_status_${docId}_pro_paid`)
    .row()
    .text("✅ Analyzed", `admin_status_${docId}_analyzed`)
    .row()
    .text("📝 افزودن یادداشت", `admin_note_${docId}`)
    .row()
    .text("⬅️ بازگشت به لیست", "admin_list")
    .row()
    .text("🏠 منوی اصلی", "main_menu");

  // چون ممکنه متن طولانی باشه
  if (txt.length > 4000) {
    txt = txt.substring(0, 3900) + "\n\n⚠️ _متن کوتاه شده..._";
  }

  await ctx.reply(txt, {
    parse_mode: "Markdown",
    reply_markup: kb,
  });

  await ctx.answerCallbackQuery();
}

// ============================================================
// 🔄 تغییر وضعیت
// ============================================================
export async function handleAdminStatus(ctx, docId, newStatus) {
  try {
    await updateConsultation(docId, { status: newStatus });
    await ctx.answerCallbackQuery(`✅ وضعیت → ${newStatus}`);

    // رفرش صفحه
    await handleAdminView(ctx, docId);
  } catch (e) {
    await ctx.answerCallbackQuery("❌ خطا: " + e.message);
  }
}

// ============================================================
// 📝 شروع افزودن یادداشت
// ============================================================
export async function handleAdminNoteStart(ctx, docId, updateUserFn) {
  // ذخیره state: منتظر یادداشت برای این داکیومنت
  await updateUserFn(ctx.from.id, {
    currentStep: 6000, // 6000 = منتظر یادداشت ادمین
    tempAnswers: JSON.stringify({ adminNoteDocId: docId }),
  });

  await ctx.reply(
    "📝 *یادداشت خود را تایپ کنید:*\n\n_این یادداشت فقط برای شما قابل مشاهده است._",
    { parse_mode: "Markdown" }
  );

  await ctx.answerCallbackQuery();
}

// ============================================================
// 💬 ذخیره یادداشت ادمین (از پیام متنی)
// ============================================================
export async function handleAdminNoteText(ctx) {
  const user = await (await import("../utils/db.js")).getOrCreateUser(ctx.from);
  const temp = JSON.parse(user.tempAnswers || "{}");
  const docId = temp.adminNoteDocId;

  if (!docId) {
    await ctx.reply("⚠️ خطا. دوباره از لیست انتخاب کنید.");
    return;
  }

  const note = ctx.message.text.trim();

  await updateConsultation(docId, {
    adminNotes: note,
  });

  // ریست state
  await (await import("../utils/db.js")).updateUser(ctx.from.id, {
    currentStep: 0,
    tempAnswers: JSON.stringify({}),
  });

  await ctx.reply("✅ یادداشت ذخیره شد.");
}
