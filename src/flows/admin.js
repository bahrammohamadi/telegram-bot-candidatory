import { InlineKeyboard } from "grammy";
import {
  isAdmin,
  listConsultations,
  getConsultation,
  updateConsultation,
  searchConsultations,
} from "../utils/db.js";

// ============================================================
// 📋 توضیح گزینه های پنل ادمین:
//
// 📋 لیست کاندیداها — نمایش آخرین ثبت نام ها
// 🔍 جستجو — جستجو با نام یا حوزه
// 👁️ مشاهده — دیدن تمام اطلاعات یک کاندیدا
// 🔄 تغییر وضعیت — عوض کردن مرحله بررسی:
//    🟢 ثبت اولیه (free)
//    🟡 درخواست پلن حرفه ای (pro_requested)
//    🔵 پرداخت شده (pro_paid)
//    ✅ تحلیل شده (analyzed)
// 📝 یادداشت — اضافه کردن نکته برای خودت
// ============================================================

const STATUS_LABELS = {
  free: "🟢 ثبت اولیه",
  pro_requested: "🟡 درخواست پلن",
  pro_paid: "🔵 پرداخت شده",
  analyzed: "✅ تحلیل شده",
};

// ============================================================
// 📋 لیست کاندیداها
// ============================================================
export async function handleAdminList(ctx, page = 0) {
  const result = await listConsultations(page, 5);
  const docs = result.documents;
  const total = result.total;

  if (docs.length === 0) {
    await ctx.reply("📭 هیچ مشاوره ای ثبت نشده.");
    return;
  }

  let txt = "🔐 پنل مدیریت\n";
  txt += "📋 لیست کاندیداها\n";
  txt += "مجموع: " + total + " نفر | صفحه " + (page + 1) + "\n";
  txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";

  const kb = new InlineKeyboard();

  docs.forEach((doc, i) => {
    const num = page * 5 + i + 1;
    let answers = {};
    try { answers = JSON.parse(doc.answers || "{}"); } catch {}

    const name = doc.fullName || answers.fullName || "بدون نام";
    const region = doc.region || answers.region || "---";
    const phone = answers.phone || "---";
    const status = doc.status || "free";
    const statusLabel = STATUS_LABELS[status] || status;
    const score = doc.score || 0;

    txt += num + ". " + statusLabel + "\n";
    txt += "   نام: " + name + "\n";
    txt += "   حوزه: " + region + "\n";
    txt += "   تلفن: " + phone + "\n";
    txt += "   امتیاز: " + score + "\n\n";

    kb.text("👁️ " + num + ". " + name, "admin_view_" + doc.$id).row();
  });

  // صفحه بندی
  const hasNext = total > (page + 1) * 5;
  const hasPrev = page > 0;

  if (hasPrev) kb.text("⬅️ صفحه قبل", "admin_page_" + (page - 1));
  if (hasNext) kb.text("➡️ صفحه بعد", "admin_page_" + (page + 1));
  if (hasPrev || hasNext) kb.row();

  kb.text("🔍 جستجو", "admin_search").row();
  kb.text("🏠 منوی اصلی", "main_menu");

  await ctx.reply(txt, { reply_markup: kb });
}

// ============================================================
// 👁️ مشاهده جزئیات کاندیدا
// ============================================================
export async function handleAdminView(ctx, docId) {
  const doc = await getConsultation(docId);

  if (!doc) {
    await ctx.answerCallbackQuery("پیدا نشد");
    return;
  }

  let answers = {};
  try { answers = JSON.parse(doc.answers || "{}"); } catch {}

  const status = doc.status || "free";
  const statusLabel = STATUS_LABELS[status] || status;

  let txt = "🔐 جزئیات کاندیدا\n";
  txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";
  txt += "وضعیت: " + statusLabel + "\n";
  txt += "امتیاز: " + (doc.score || 0) + "\n";
  txt += "تاریخ ثبت: " + (doc.createdAt || "---") + "\n\n";

  // اطلاعات مهم بالا
  txt += "━━ اطلاعات کلیدی ━━\n";
  txt += "نام: " + (answers.fullName || "---") + "\n";
  txt += "کد ملی: " + (answers.nationalId || "---") + "\n";
  txt += "تلفن: " + (answers.phone || "---") + "\n";
  txt += "سن: " + (answers.age || "---") + "\n";
  txt += "حوزه: " + (answers.region || "---") + "\n";
  txt += "تحصیلات: " + (answers.education || "---") + "\n";
  txt += "شغل: " + (answers.currentJob || "---") + "\n\n";

  // بقیه جواب ها
  txt += "━━ تمام پاسخ ها ━━\n";
  for (const [key, val] of Object.entries(answers)) {
    if (["fullName", "nationalId", "phone", "age", "region", "education", "currentJob"].includes(key)) continue;
    const display = typeof val === "string" ? val : String(val);
    txt += key + ": " + display + "\n";
  }

  // یادداشت ادمین
  if (doc.adminNotes) {
    txt += "\n━━ یادداشت ادمین ━━\n";
    txt += doc.adminNotes + "\n";
  }

  // کوتاه کردن اگه طولانیه
  if (txt.length > 4000) {
    txt = txt.substring(0, 3900) + "\n\n... (متن کوتاه شده)";
  }

  const kb = new InlineKeyboard()
    .text("🟡 درخواست پلن", "admin_status_" + docId + "_pro_requested").row()
    .text("🔵 پرداخت شده", "admin_status_" + docId + "_pro_paid").row()
    .text("✅ تحلیل شده", "admin_status_" + docId + "_analyzed").row()
    .text("🟢 برگرداندن به اولیه", "admin_status_" + docId + "_free").row()
    .text("📝 افزودن یادداشت", "admin_note_" + docId).row()
    .text("⬅️ بازگشت به لیست", "admin_list").row()
    .text("🏠 منوی اصلی", "main_menu");

  await ctx.reply(txt, { reply_markup: kb });
  await ctx.answerCallbackQuery();
}

// ============================================================
// 🔄 تغییر وضعیت
// ============================================================
export async function handleAdminStatus(ctx, docId, newStatus) {
  try {
    await updateConsultation(docId, { status: newStatus });
    const label = STATUS_LABELS[newStatus] || newStatus;
    await ctx.answerCallbackQuery("وضعیت تغییر کرد: " + label);
    await handleAdminView(ctx, docId);
  } catch (e) {
    await ctx.answerCallbackQuery("خطا: " + e.message);
  }
}

// ============================================================
// 📝 شروع یادداشت
// ============================================================
export async function handleAdminNoteStart(ctx, docId, updateUserFn) {
  await updateUserFn(ctx.from.id, {
    currentStep: 6000,
    tempAnswers: JSON.stringify({ adminNoteDocId: docId }),
  });

  await ctx.reply("📝 یادداشت خود را تایپ کنید:\n(فقط شما میبینید)");
  await ctx.answerCallbackQuery();
}

// ============================================================
// 💬 ذخیره یادداشت
// ============================================================
export async function handleAdminNoteText(ctx) {
  const { getOrCreateUser, updateUser, updateConsultation: updateCons } = await import("../utils/db.js");
  const user = await getOrCreateUser(ctx.from);
  const temp = JSON.parse(user.tempAnswers || "{}");
  const docId = temp.adminNoteDocId;

  if (!docId) {
    await ctx.reply("خطا. دوباره از لیست انتخاب کنید.");
    return;
  }

  await updateCons(docId, { adminNotes: ctx.message.text.trim() });
  await updateUser(ctx.from.id, { currentStep: 0, tempAnswers: "{}" });
  await ctx.reply("یادداشت ذخیره شد.");
}

// ============================================================
// 🔍 شروع جستجو
// ============================================================
export async function handleAdminSearchStart(ctx, updateUserFn) {
  await updateUserFn(ctx.from.id, {
    currentStep: 7000,
    tempAnswers: "{}",
  });

  await ctx.reply("🔍 نام یا حوزه انتخابیه را تایپ کنید:");
  await ctx.answerCallbackQuery();
}

// ============================================================
// 💬 انجام جستجو
// ============================================================
export async function handleAdminSearchText(ctx) {
  const query = ctx.message.text.trim();
  const { searchConsultations, updateUser } = await import("../utils/db.js");

  await updateUser(ctx.from.id, { currentStep: 0, tempAnswers: "{}" });

  const docs = await searchConsultations(query);

  if (docs.length === 0) {
    await ctx.reply("نتیجه ای برای '" + query + "' پیدا نشد.\n\nدوباره /admin بزنید.");
    return;
  }

  let txt = "🔍 نتایج جستجو: " + query + "\n";
  txt += "━━━━━━━━━━━━━━━━━━━━━\n\n";

  const kb = new InlineKeyboard();

  docs.forEach((doc, i) => {
    let answers = {};
    try { answers = JSON.parse(doc.answers || "{}"); } catch {}

    const name = doc.fullName || answers.fullName || "بدون نام";
    const region = doc.region || answers.region || "---";
    const status = STATUS_LABELS[doc.status || "free"];

    txt += (i + 1) + ". " + name + " | " + region + " | " + status + "\n";
    kb.text("👁️ " + name, "admin_view_" + doc.$id).row();
  });

  kb.text("⬅️ بازگشت", "admin_list").row();
  kb.text("🏠 منو", "main_menu");

  await ctx.reply(txt, { reply_markup: kb });
}
