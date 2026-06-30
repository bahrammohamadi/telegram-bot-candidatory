// src/flows/history.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// مرحله ۱۰/۲ — تاریخچه‌ی تحلیل‌ها و فعالیت‌های کاربر
// ═══════════════════════════════════════════════════════════════
// قابلیت‌ها:
//   • نمایش لیست تحلیل‌های قبلی (با صفحه‌بندی)
//   • مشاهده‌ی جزئیات یک تحلیل
//   • مقایسه‌ی ۲ تحلیل آخر
//   • حذف یک تحلیل (با تأیید)
//   • فیلتر بر اساس نوع تحلیل
//
// State اختصاصی: ندارد (stateless)
// دسترسی: همگانی (نمایش فقط مال کاربر خودش)
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const {
  getOrCreateUser,
  getUserConsultations,
  getConsultationById,
  deleteConsultation,
} = require("../utils/db.js");

const PER_PAGE = 5;

// ───────────────────────────────────────────────────────────────
// کمکی‌ها
// ───────────────────────────────────────────────────────────────

/** تبدیل تاریخ به فرمت فارسی خوانا */
function formatPersianDate(isoDate) {
  if (!isoDate) return "نامشخص";
  try {
    const d = new Date(isoDate);
    return d.toLocaleString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(isoDate).slice(0, 10);
  }
}

/** ایموجی متناسب با نوع تحلیل */
function getTypeEmoji(type) {
  const map = {
    readiness: "🎯",
    swot: "🧭",
    rivals: "⚔️",
    promises: "📋",
    crisis: "🚨",
    dashboard: "📊",
    basic: "✅",
  };
  return map[type] || "📌";
}

/** نام فارسی نوع تحلیل */
function getTypeName(type) {
  const map = {
    readiness: "ارزیابی آمادگی",
    swot: "تحلیل SWOT",
    rivals: "تحلیل رقبا",
    promises: "مدیریت وعده‌ها",
    crisis: "مدیریت بحران",
    dashboard: "گزارش داشبورد",
    basic: "ارزیابی پایه",
  };
  return map[type] || "تحلیل";
}

/** فرمت‌بندی امتیاز */
function formatScore(score, max) {
  if (typeof score !== "number") return "—";
  const m = typeof max === "number" ? max : 100;
  return `${score}/${m}`;
}

// ───────────────────────────────────────────────────────────────
// هندلر ۱: نمایش لیست تحلیل‌ها (با صفحه‌بندی)
// ───────────────────────────────────────────────────────────────
async function handleShowHistory(ctx, page = 0, filter = "all") {
  const userId = String(ctx.from.id);

  let items = [];
  try {
    items = (await getUserConsultations(userId)) || [];
  } catch (e) {
    console.error("[history] getUserConsultations error:", e);
  }

  // فیلتر بر اساس نوع
  if (filter !== "all") {
    items = items.filter((it) => it.type === filter);
  }

  // مرتب‌سازی بر اساس تاریخ (جدیدترین بالا)
  items.sort((a, b) => {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    return db - da;
  });

  if (items.length === 0) {
    const emptyText =
      "📜 *تاریخچه‌ی تحلیل‌ها*\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      (filter === "all"
        ? "_هنوز هیچ تحلیلی انجام نداده‌اید._\n\n💡 برای شروع، یکی از ارزیابی‌ها را انتخاب کنید."
        : `_تحلیلی از نوع «${getTypeName(filter)}» یافت نشد._`);

    const kb = new InlineKeyboard()
      .text("🎯 شروع ارزیابی", "menu_analysis").row()
      .text("🏠 منوی اصلی", "menu");

    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(emptyText, { parse_mode: "Markdown", reply_markup: kb });
      } catch {
        await ctx.reply(emptyText, { parse_mode: "Markdown", reply_markup: kb });
      }
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(emptyText, { parse_mode: "Markdown", reply_markup: kb });
    }
    return;
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * PER_PAGE;
  const slice = items.slice(start, start + PER_PAGE);

  let text =
    "📜 *تاریخچه‌ی تحلیل‌ها*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    `📊 *مجموع:* ${items.length} تحلیل` +
    (filter !== "all" ? ` (نوع: ${getTypeName(filter)})` : "") +
    `\n📄 *صفحه:* ${safePage + 1} از ${totalPages}\n\n` +
    "_برای مشاهده‌ی جزئیات روی یک تحلیل کلیک کنید:_\n";

  const kb = new InlineKeyboard();

  slice.forEach((item, i) => {
    const num = start + i + 1;
    const emoji = getTypeEmoji(item.type);
    const name = getTypeName(item.type);
    const date = formatPersianDate(item.createdAt);
    const score = item.score != null ? ` — ${formatScore(item.score, item.maxScore)}` : "";
    const label = `${num}. ${emoji} ${name}${score} (${date.split(" ")[0]})`;
    kb.text(label, `history:view:${item.id || item.$id}`).row();
  });

  // ناوبری صفحات
  if (totalPages > 1) {
    if (safePage > 0) {
      kb.text("⬅️ قبلی", `history:page:${safePage - 1}:${filter}`);
    }
    kb.text(`📖 ${safePage + 1}/${totalPages}`, "history:noop");
    if (safePage < totalPages - 1) {
      kb.text("بعدی ➡️", `history:page:${safePage + 1}:${filter}`);
    }
    kb.row();
  }

  // فیلترها
  kb.text("🔍 فیلتر", "history:filter").row();

  // مقایسه (فقط اگر حداقل ۲ تحلیل هم‌نوع داشته باشیم)
  if (items.length >= 2 && filter !== "all") {
    kb.text("📊 مقایسه ۲ تحلیل آخر", `history:compare:${filter}`).row();
  }

  kb.text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// هندلر ۲: نمایش جزئیات یک تحلیل
// ───────────────────────────────────────────────────────────────
async function handleViewConsultation(ctx, consultId) {
  const userId = String(ctx.from.id);

  let item = null;
  try {
    item = await getConsultationById(consultId);
  } catch (e) {
    console.error("[history] getConsultationById error:", e);
  }

  if (!item) {
    await ctx.answerCallbackQuery({ text: "تحلیل یافت نشد", show_alert: true });
    return;
  }

  // بررسی مالکیت
  if (String(item.userId) !== userId) {
    await ctx.answerCallbackQuery({ text: "این تحلیل متعلق به شما نیست", show_alert: true });
    return;
  }

  const emoji = getTypeEmoji(item.type);
  const name = getTypeName(item.type);
  const date = formatPersianDate(item.createdAt);
  const score = item.score != null ? formatScore(item.score, item.maxScore) : "—";

  let body = item.report || item.summary || "_خلاصه‌ای برای این تحلیل ثبت نشده است._";

  // محدود کردن طول
  const MAX_BODY = 3000;
  if (body.length > MAX_BODY) {
    body = body.slice(0, MAX_BODY) + "\n\n_..._ (متن کامل‌تر در سیستم ذخیره است)";
  }

  const text =
    `${emoji} *${name}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📅 *تاریخ:* ${date}\n` +
    `🎯 *امتیاز:* ${score}\n` +
    `🔖 *شناسه:* \`${(item.id || item.$id || "").toString().slice(-8)}\`\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    body;

  const kb = new InlineKeyboard()
    .text("🗑 حذف این تحلیل", `history:del:${item.id || item.$id}`).row()
    .text("⬅️ بازگشت به لیست", "history:list").row()
    .text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// هندلر ۳: فیلتر بر اساس نوع
// ───────────────────────────────────────────────────────────────
async function handleFilterMenu(ctx) {
  const text =
    "🔍 *فیلتر تحلیل‌ها*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "_بر اساس نوع تحلیل فیلتر کنید:_";

  const kb = new InlineKeyboard()
    .text("📋 همه", "history:page:0:all").row()
    .text("🎯 آمادگی", "history:page:0:readiness")
    .text("🧭 SWOT", "history:page:0:swot").row()
    .text("⚔️ رقبا", "history:page:0:rivals")
    .text("📋 وعده‌ها", "history:page:0:promises").row()
    .text("🚨 بحران", "history:page:0:crisis")
    .text("📊 داشبورد", "history:page:0:dashboard").row()
    .text("⬅️ بازگشت", "history:list");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// هندلر ۴: مقایسه‌ی ۲ تحلیل آخر هم‌نوع
// ───────────────────────────────────────────────────────────────
async function handleCompareLastTwo(ctx, type) {
  const userId = String(ctx.from.id);

  let items = [];
  try {
    items = (await getUserConsultations(userId)) || [];
  } catch (e) {
    console.error("[history] compare error:", e);
  }

  const filtered = items
    .filter((it) => it.type === type)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (filtered.length < 2) {
    await ctx.answerCallbackQuery({
      text: "حداقل ۲ تحلیل از این نوع لازم است",
      show_alert: true,
    });
    return;
  }

  const [latest, prev] = filtered;
  const emoji = getTypeEmoji(type);
  const name = getTypeName(type);

  const latestScore = latest.score ?? 0;
  const prevScore = prev.score ?? 0;
  const diff = latestScore - prevScore;
  const diffSign = diff > 0 ? "📈" : diff < 0 ? "📉" : "➡️";
  const diffText = diff > 0 ? `+${diff}` : `${diff}`;

  let interpretation = "";
  if (diff > 5) interpretation = "✅ پیشرفت قابل توجه! ادامه دهید.";
  else if (diff > 0) interpretation = "👍 پیشرفت کوچک اما در مسیر درست.";
  else if (diff === 0) interpretation = "➡️ بدون تغییر — نیاز به اقدامات جدید.";
  else if (diff > -5) interpretation = "⚠️ افت جزئی — بازنگری توصیه می‌شود.";
  else interpretation = "🚨 افت قابل توجه — نیاز به اقدام فوری.";

  const text =
    `📊 *مقایسه‌ی ${name}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${emoji} *آخرین تحلیل:*\n` +
    `   📅 ${formatPersianDate(latest.createdAt)}\n` +
    `   🎯 ${formatScore(latestScore, latest.maxScore)}\n\n` +
    `${emoji} *تحلیل قبلی:*\n` +
    `   📅 ${formatPersianDate(prev.createdAt)}\n` +
    `   🎯 ${formatScore(prevScore, prev.maxScore)}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${diffSign} *تغییر:* ${diffText} امتیاز\n\n` +
    `${interpretation}`;

  const kb = new InlineKeyboard()
    .text("📄 مشاهده آخرین", `history:view:${latest.id || latest.$id}`).row()
    .text("📄 مشاهده قبلی", `history:view:${prev.id || prev.$id}`).row()
    .text("⬅️ بازگشت", "history:list").row()
    .text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// هندلر ۵: حذف یک تحلیل (با تأیید)
// ───────────────────────────────────────────────────────────────
async function handleDeleteConfirm(ctx, consultId) {
  const text =
    "⚠️ *تأیید حذف*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "آیا از حذف این تحلیل مطمئن هستید؟\n" +
    "_این عمل قابل بازگشت نیست._";

  const kb = new InlineKeyboard()
    .text("🗑 بله، حذف کن", `history:delyes:${consultId}`)
    .text("❌ انصراف", `history:view:${consultId}`).row();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function handleDeleteExecute(ctx, consultId) {
  const userId = String(ctx.from.id);

  try {
    const item = await getConsultationById(consultId);
    if (!item) {
      await ctx.answerCallbackQuery({ text: "یافت نشد", show_alert: true });
      return;
    }
    if (String(item.userId) !== userId) {
      await ctx.answerCallbackQuery({ text: "اجازه ندارید", show_alert: true });
      return;
    }
    await deleteConsultation(consultId);
  } catch (e) {
    console.error("[history] delete error:", e);
    await ctx.answerCallbackQuery({ text: "خطا در حذف", show_alert: true });
    return;
  }

  const text =
    "✅ *تحلیل حذف شد*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "این تحلیل از تاریخچه‌ی شما پاک شد.";

  const kb = new InlineKeyboard()
    .text("📜 بازگشت به لیست", "history:list").row()
    .text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery({ text: "حذف شد", show_alert: false });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

// ───────────────────────────────────────────────────────────────
// روتر یکپارچه callback های history:*
// ───────────────────────────────────────────────────────────────
async function handleHistoryCallback(ctx) {
  const data = ctx.callbackQuery?.data || "";
  const parts = data.split(":");

  if (parts[0] !== "history") return;

  try {
    const action = parts[1];

    if (action === "list") {
      return handleShowHistory(ctx, 0, "all");
    }
    if (action === "page") {
      const page = parseInt(parts[2], 10) || 0;
      const filter = parts[3] || "all";
      return handleShowHistory(ctx, page, filter);
    }
    if (action === "view") {
      return handleViewConsultation(ctx, parts[2]);
    }
    if (action === "filter") {
      return handleFilterMenu(ctx);
    }
    if (action === "compare") {
      return handleCompareLastTwo(ctx, parts[2]);
    }
    if (action === "del") {
      return handleDeleteConfirm(ctx, parts[2]);
    }
    if (action === "delyes") {
      return handleDeleteExecute(ctx, parts[2]);
    }
    if (action === "noop") {
      return ctx.answerCallbackQuery();
    }

    await ctx.answerCallbackQuery({ text: "عملیات نامعتبر", show_alert: false });
  } catch (e) {
    console.error("[history] callback error:", e);
    try {
      await ctx.answerCallbackQuery({ text: "خطا در پردازش", show_alert: true });
    } catch {}
  }
}

module.exports = {
  handleShowHistory,
  handleViewConsultation,
  handleFilterMenu,
  handleCompareLastTwo,
  handleDeleteConfirm,
  handleDeleteExecute,
  handleHistoryCallback,
  // کمکی‌ها
  formatPersianDate,
  getTypeEmoji,
  getTypeName,
};
