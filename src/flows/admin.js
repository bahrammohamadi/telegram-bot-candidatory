// src/flows/admin.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// مرحله ۱۰/۴ — پنل ادمین (مدیریت کاربران، لیدها، آمار)
// ═══════════════════════════════════════════════════════════════
// قابلیت‌ها:
//   • داشبورد آمار کلی
//   • لیست لیدهای خرید (با صفحه‌بندی + فیلتر وضعیت)
//   • جستجو بر اساس کد ملی / شماره تماس
//   • مشاهده و ویرایش پلن کاربر
//   • نقش‌دهی (ادمین/کاربر)
//   • broadcast پیام به کاربران
//   • مدیریت لیدها (تأیید/رد/پیگیری)
//
// State اختصاصی: 1000+ برای فلوهای ورودی (جستجو، broadcast)
// دسترسی: فقط user.role === "admin"
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const {
  getOrCreateUser,
  updateUser,
  getStats,
  listLeads,
  updateLead,
  findByNationalId,
  findByPhone,
  getUserById,
  listAllUsers,
  listRecentUsers,
} = require("../utils/db.js");
const { setUserPlan, PLAN_LEVELS } = require("../utils/access.js");

// ───────────────────────────────────────────────────────────────
// State برای ورودی متنی ادمین (جستجو، broadcast)
// ───────────────────────────────────────────────────────────────
const ADMIN_STATE = {
  SEARCH_NATIONAL: 1000,
  SEARCH_PHONE: 1001,
  BROADCAST_TEXT: 1002,
  SET_PLAN_USER: 1003, // در حال انتخاب پلن برای کاربر خاص
};

const STATE_RANGE = { min: 1000, max: 1099 };

function isInAdminRange(step) {
  return typeof step === "number" && step >= STATE_RANGE.min && step <= STATE_RANGE.max;
}

// ───────────────────────────────────────────────────────────────
// چک ادمین بودن (محافظ همه‌ی هندلرها)
// ───────────────────────────────────────────────────────────────
async function ensureAdmin(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});

  if (user.role !== "admin") {
    if (ctx.callbackQuery) {
      try {
        await ctx.answerCallbackQuery({
          text: "⛔ دسترسی غیرمجاز",
          show_alert: true,
        });
      } catch {}
    } else {
      await ctx.reply("⛔ این بخش فقط برای ادمین‌هاست.");
    }
    return null;
  }
  return user;
}

// ───────────────────────────────────────────────────────────────
// کمکی: ارسال یا ویرایش پیام
// ───────────────────────────────────────────────────────────────
async function sendOrEdit(ctx, text, kb) {
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    try { await ctx.answerCallbackQuery(); } catch {}
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

/** فرمت تاریخ */
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso).slice(0, 10);
  }
}

/** نام نمایشی پلن */
function planLabel(planId) {
  const map = {
    none: "🆓 رایگان",
    free: "🆓 رایگان",
    single_session: "💬 جلسه تکی",
    starter: "🚀 راه‌اندازی",
    professional: "⭐ حرفه‌ای",
    vip: "👑 VIP",
  };
  return map[planId] || planId || "—";
}

// ═══════════════════════════════════════════════════════════════
// ۱) داشبورد اصلی ادمین
// ═══════════════════════════════════════════════════════════════
async function handleAdminPanel(ctx) {
  const user = await ensureAdmin(ctx);
  if (!user) return;

  let stats = {};
  try {
    stats = (await getStats()) || {};
  } catch (e) {
    console.error("[admin] getStats error:", e);
  }

  const text =
    "🛠 *پنل ادمین — کاندیداتوری هوشمند*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "📊 *آمار سریع:*\n" +
    `   👥 کل کاربران: ${stats.totalUsers ?? "—"}\n` +
    `   📈 فعال در ۲۴ ساعت: ${stats.activeToday ?? "—"}\n` +
    `   📅 فعال در ۷ روز: ${stats.activeWeek ?? "—"}\n` +
    `   💰 لیدهای در انتظار: ${stats.pendingLeads ?? "—"}\n` +
    `   ✅ لیدهای تأییدشده: ${stats.confirmedLeads ?? "—"}\n` +
    `   🎯 تحلیل‌های انجام‌شده: ${stats.totalConsultations ?? "—"}\n\n` +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "_بخش مورد نظر را انتخاب کنید:_";

  const kb = new InlineKeyboard()
    .text("📊 آمار تفصیلی", "admin:stats").row()
    .text("💰 مدیریت لیدها", "admin:leads:0:pending").row()
    .text("👥 کاربران اخیر", "admin:users:0").row()
    .text("🔍 جستجوی کاربر", "admin:search").row()
    .text("📢 ارسال پیام انبوه", "admin:broadcast").row()
    .text("🏠 منوی اصلی", "menu");

  await sendOrEdit(ctx, text, kb);
}

// ═══════════════════════════════════════════════════════════════
// ۲) آمار تفصیلی
// ═══════════════════════════════════════════════════════════════
async function handleStats(ctx) {
  if (!(await ensureAdmin(ctx))) return;

  let s = {};
  try {
    s = (await getStats()) || {};
  } catch (e) {
    console.error("[admin] stats error:", e);
  }

  const text =
    "📊 *آمار تفصیلی سیستم*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "👥 *کاربران*\n" +
    `   • کل: ${s.totalUsers ?? "—"}\n` +
    `   • امروز جدید: ${s.newToday ?? "—"}\n` +
    `   • این هفته جدید: ${s.newWeek ?? "—"}\n` +
    `   • فعال ۲۴ ساعت: ${s.activeToday ?? "—"}\n` +
    `   • فعال ۷ روز: ${s.activeWeek ?? "—"}\n\n` +
    "💎 *پلن‌ها*\n" +
    `   🆓 رایگان: ${s.planFree ?? "—"}\n` +
    `   🚀 راه‌اندازی: ${s.planStarter ?? "—"}\n` +
    `   ⭐ حرفه‌ای: ${s.planProfessional ?? "—"}\n` +
    `   👑 VIP: ${s.planVip ?? "—"}\n\n` +
    "💰 *لیدها*\n" +
    `   • در انتظار: ${s.pendingLeads ?? "—"}\n` +
    `   • تأییدشده: ${s.confirmedLeads ?? "—"}\n` +
    `   • ردشده: ${s.rejectedLeads ?? "—"}\n` +
    `   • کل درآمد (تومان): ${(s.totalRevenue ?? 0).toLocaleString("fa-IR")}\n\n` +
    "🎯 *فعالیت‌ها*\n" +
    `   • کل تحلیل‌ها: ${s.totalConsultations ?? "—"}\n` +
    `   • ارزیابی آمادگی: ${s.consultReadiness ?? "—"}\n` +
    `   • SWOT: ${s.consultSwot ?? "—"}\n` +
    `   • سایر: ${s.consultOther ?? "—"}`;

  const kb = new InlineKeyboard()
    .text("🔄 به‌روزرسانی", "admin:stats").row()
    .text("⬅️ بازگشت", "admin:panel");

  await sendOrEdit(ctx, text, kb);
}

// ═══════════════════════════════════════════════════════════════
// ۳) مدیریت لیدها
// ═══════════════════════════════════════════════════════════════
async function handleLeadsList(ctx, page = 0, status = "pending") {
  if (!(await ensureAdmin(ctx))) return;

  const PER_PAGE = 5;
  let leads = [];
  try {
    leads = (await listLeads({ status, limit: 100 })) || [];
  } catch (e) {
    console.error("[admin] listLeads error:", e);
  }

  if (leads.length === 0) {
    const text =
      `💰 *لیدها — وضعیت: ${statusLabel(status)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `_هیچ لیدی با این وضعیت یافت نشد._`;
    const kb = leadsFilterKB(0, status, 0);
    await sendOrEdit(ctx, text, kb);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(leads.length / PER_PAGE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * PER_PAGE;
  const slice = leads.slice(start, start + PER_PAGE);

  let text =
    `💰 *لیدها — وضعیت: ${statusLabel(status)}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📊 مجموع: ${leads.length} | صفحه ${safePage + 1}/${totalPages}\n\n`;

  slice.forEach((lead, i) => {
    const num = start + i + 1;
    const name = lead.firstName || lead.username || "بی‌نام";
    const planName = lead.planName || lead.planId || "—";
    const date = fmtDate(lead.createdAt);
    text +=
      `*${num}.* ${name}\n` +
      `   📦 ${planName}\n` +
      `   📅 ${date}\n` +
      `   🔖 \`${(lead.id || lead.$id || "").toString().slice(-8)}\`\n\n`;
  });

  const kb = new InlineKeyboard();
  slice.forEach((lead, i) => {
    const num = start + i + 1;
    kb.text(`👁 مشاهده ${num}`, `admin:lead:${lead.id || lead.$id}`).row();
  });

  // ناوبری
  if (totalPages > 1) {
    if (safePage > 0) kb.text("⬅️ قبلی", `admin:leads:${safePage - 1}:${status}`);
    kb.text(`📖 ${safePage + 1}/${totalPages}`, "admin:noop");
    if (safePage < totalPages - 1) kb.text("بعدی ➡️", `admin:leads:${safePage + 1}:${status}`);
    kb.row();
  }

  // فیلتر وضعیت
  kb.text("⏳ در انتظار", "admin:leads:0:pending")
    .text("✅ تأییدشده", "admin:leads:0:confirmed").row()
    .text("❌ ردشده", "admin:leads:0:rejected")
    .text("📋 همه", "admin:leads:0:all").row();

  kb.text("⬅️ پنل ادمین", "admin:panel");

  await sendOrEdit(ctx, text, kb);
}

function statusLabel(s) {
  const m = {
    pending: "⏳ در انتظار",
    confirmed: "✅ تأییدشده",
    rejected: "❌ ردشده",
    all: "📋 همه",
  };
  return m[s] || s;
}

function leadsFilterKB(page, status, totalPages) {
  const kb = new InlineKeyboard()
    .text("⏳ در انتظار", "admin:leads:0:pending")
    .text("✅ تأییدشده", "admin:leads:0:confirmed").row()
    .text("❌ ردشده", "admin:leads:0:rejected")
    .text("📋 همه", "admin:leads:0:all").row()
    .text("⬅️ پنل ادمین", "admin:panel");
  return kb;
}

// ═══════════════════════════════════════════════════════════════
// ۴) مشاهده‌ی جزئیات یک لید
// ═══════════════════════════════════════════════════════════════
async function handleLeadView(ctx, leadId) {
  if (!(await ensureAdmin(ctx))) return;

  let leads = [];
  try {
    leads = (await listLeads({ status: "all", limit: 500 })) || [];
  } catch (e) {
    console.error("[admin] leadView error:", e);
  }
  const lead = leads.find((l) => (l.id || l.$id) === leadId);

  if (!lead) {
    await ctx.answerCallbackQuery({ text: "لید یافت نشد", show_alert: true });
    return;
  }

  const text =
    `💰 *جزئیات لید*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🔖 *کد:* \`${(lead.id || lead.$id || "").toString().slice(-12)}\`\n` +
    `📊 *وضعیت:* ${statusLabel(lead.status)}\n\n` +
    `👤 *کاربر*\n` +
    `   • نام: ${lead.firstName || "—"} ${lead.lastName || ""}\n` +
    `   • یوزرنیم: ${lead.username ? "@" + lead.username : "—"}\n` +
    `   • تلگرام ID: \`${lead.userId || "—"}\`\n` +
    `   • شماره: ${lead.phone || "—"}\n` +
    `   • کد ملی: ${lead.nationalId || "—"}\n\n` +
    `📦 *خرید*\n` +
    `   • بسته: ${lead.planName || lead.planId || "—"}\n` +
    `   • مبلغ: ${(lead.priceNumeric ?? 0).toLocaleString("fa-IR")} تومان\n` +
    `   • تاریخ ثبت: ${fmtDate(lead.createdAt)}\n` +
    (lead.confirmedAt ? `   • تاریخ تأیید: ${fmtDate(lead.confirmedAt)}\n` : "") +
    (lead.note ? `\n📝 *یادداشت:* ${lead.note}` : "");

  const kb = new InlineKeyboard();

  if (lead.status === "pending") {
    kb.text("✅ تأیید پرداخت", `admin:leadact:confirm:${leadId}`).row()
      .text("❌ رد لید", `admin:leadact:reject:${leadId}`).row();
  } else if (lead.status === "confirmed") {
    kb.text("⏪ بازگشت به انتظار", `admin:leadact:revert:${leadId}`).row();
  } else if (lead.status === "rejected") {
    kb.text("⏪ بازگشت به انتظار", `admin:leadact:revert:${leadId}`).row();
  }

  if (lead.userId) {
    kb.text("👤 مشاهده کاربر", `admin:user:${lead.userId}`).row();
  }

  kb.text("⬅️ لیست لیدها", `admin:leads:0:${lead.status || "pending"}`);

  await sendOrEdit(ctx, text, kb);
}

// ═══════════════════════════════════════════════════════════════
// ۵) اقدامات روی لید (تأیید/رد/بازگشت)
// ═══════════════════════════════════════════════════════════════
async function handleLeadAction(ctx, action, leadId) {
  if (!(await ensureAdmin(ctx))) return;

  let leads = [];
  try {
    leads = (await listLeads({ status: "all", limit: 500 })) || [];
  } catch (e) {
    console.error("[admin] leadAction error:", e);
  }
  const lead = leads.find((l) => (l.id || l.$id) === leadId);

  if (!lead) {
    await ctx.answerCallbackQuery({ text: "لید یافت نشد", show_alert: true });
    return;
  }

  let newStatus;
  let toast;
  if (action === "confirm") { newStatus = "confirmed"; toast = "✅ تأیید شد"; }
  else if (action === "reject") { newStatus = "rejected"; toast = "❌ رد شد"; }
  else if (action === "revert") { newStatus = "pending"; toast = "⏪ بازگشت به انتظار"; }
  else {
    await ctx.answerCallbackQuery({ text: "اقدام نامعتبر", show_alert: true });
    return;
  }

  try {
    await updateLead(leadId, {
      status: newStatus,
      confirmedAt: newStatus === "confirmed" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });

    // اگر تأیید شد، پلن کاربر را فعال کن
    if (newStatus === "confirmed" && lead.userId && lead.planId) {
      await setUserPlan(lead.userId, lead.planId);
    }
  } catch (e) {
    console.error("[admin] updateLead error:", e);
    await ctx.answerCallbackQuery({ text: "خطا در به‌روزرسانی", show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: toast, show_alert: false });
  // برگشت به جزئیات همان لید (با وضعیت جدید)
  return handleLeadView(ctx, leadId);
}

// ═══════════════════════════════════════════════════════════════
// ۶) کاربران اخیر
// ═══════════════════════════════════════════════════════════════
async function handleUsersList(ctx, page = 0) {
  if (!(await ensureAdmin(ctx))) return;

  const PER_PAGE = 5;
  let users = [];
  try {
    users = (await listRecentUsers({ limit: 50 })) || [];
  } catch (e) {
    console.error("[admin] listRecentUsers error:", e);
  }

  if (users.length === 0) {
    await sendOrEdit(
      ctx,
      "👥 *کاربران اخیر*\n\n_هیچ کاربری یافت نشد._",
      new InlineKeyboard().text("⬅️ پنل ادمین", "admin:panel")
    );
    return;
  }

  const totalPages = Math.max(1, Math.ceil(users.length / PER_PAGE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * PER_PAGE;
  const slice = users.slice(start, start + PER_PAGE);

  let text =
    "👥 *کاربران اخیر*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    `📊 مجموع: ${users.length} | صفحه ${safePage + 1}/${totalPages}\n\n`;

  const kb = new InlineKeyboard();
  slice.forEach((u, i) => {
    const num = start + i + 1;
    const name = u.firstName || u.username || `User-${(u.userId || "").slice(-6)}`;
    const plan = planLabel(u.purchasedPlan || u.role);
    const lastSeen = fmtDate(u.lastInteractionNew || u.lastInteraction);
    text +=
      `*${num}.* ${name}\n` +
      `   ${plan}\n` +
      `   🕒 ${lastSeen}\n\n`;
    kb.text(`👁 ${name}`, `admin:user:${u.userId}`).row();
  });

  if (totalPages > 1) {
    if (safePage > 0) kb.text("⬅️ قبلی", `admin:users:${safePage - 1}`);
    kb.text(`📖 ${safePage + 1}/${totalPages}`, "admin:noop");
    if (safePage < totalPages - 1) kb.text("بعدی ➡️", `admin:users:${safePage + 1}`);
    kb.row();
  }

  kb.text("⬅️ پنل ادمین", "admin:panel");
  await sendOrEdit(ctx, text, kb);
}

// ═══════════════════════════════════════════════════════════════
// ۷) جستجوی کاربر
// ═══════════════════════════════════════════════════════════════
async function handleSearchMenu(ctx) {
  if (!(await ensureAdmin(ctx))) return;

  const text =
    "🔍 *جستجوی کاربر*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "روش جستجو را انتخاب کنید:";

  const kb = new InlineKeyboard()
    .text("🆔 جستجو با کد ملی", "admin:srch:national").row()
    .text("📞 جستجو با شماره تماس", "admin:srch:phone").row()
    .text("⬅️ پنل ادمین", "admin:panel");

  await sendOrEdit(ctx, text, kb);
}

async function handleSearchStart(ctx, kind) {
  const adminUser = await ensureAdmin(ctx);
  if (!adminUser) return;

  const adminId = String(ctx.from.id);
  const state = kind === "national" ? ADMIN_STATE.SEARCH_NATIONAL : ADMIN_STATE.SEARCH_PHONE;

  await updateUser(adminId, { currentStep: state, tempAnswers: "{}" });

  const text =
    kind === "national"
      ? "🆔 *جستجو با کد ملی*\n\nلطفاً کد ملی ۱۰ رقمی را ارسال کنید:"
      : "📞 *جستجو با شماره تماس*\n\nلطفاً شماره تماس ۱۱ رقمی (مثل 09xxxxxxxxx) را ارسال کنید:";

  const kb = new InlineKeyboard().text("❌ انصراف", "admin:cancel");
  await sendOrEdit(ctx, text, kb);
}

// ═══════════════════════════════════════════════════════════════
// ۸) مشاهده جزئیات کاربر
// ═══════════════════════════════════════════════════════════════
async function handleUserView(ctx, targetUserId) {
  if (!(await ensureAdmin(ctx))) return;

  let user = null;
  try {
    user = await getUserById(targetUserId);
  } catch (e) {
    console.error("[admin] getUserById error:", e);
  }

  if (!user) {
    await ctx.answerCallbackQuery({ text: "کاربر یافت نشد", show_alert: true });
    return;
  }

  const text =
    `👤 *جزئیات کاربر*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🆔 *تلگرام ID:* \`${user.userId || targetUserId}\`\n` +
    `📛 *نام:* ${user.firstName || "—"} ${user.lastName || ""}\n` +
    `🔖 *یوزرنیم:* ${user.username ? "@" + user.username : "—"}\n` +
    `📞 *شماره:* ${user.phone || "—"}\n` +
    `🆔 *کد ملی:* ${user.nationalId || "—"}\n\n` +
    `💎 *پلن:* ${planLabel(user.purchasedPlan)}\n` +
    `🎭 *نقش:* ${user.role === "admin" ? "🛠 ادمین" : "👤 کاربر عادی"}\n\n` +
    `📅 *ثبت‌نام:* ${fmtDate(user.createdAt)}\n` +
    `🕒 *آخرین فعالیت:* ${fmtDate(user.lastInteractionNew || user.lastInteraction)}\n` +
    `📊 *مرحله فعلی:* ${user.currentStep ?? "—"}`;

  const kb = new InlineKeyboard()
    .text("💎 تغییر پلن", `admin:setplan:${targetUserId}`).row()
    .text(
      user.role === "admin" ? "👤 حذف نقش ادمین" : "🛠 ارتقا به ادمین",
      `admin:togglerole:${targetUserId}`
    ).row()
    .text("⬅️ بازگشت", "admin:panel");

  await sendOrEdit(ctx, text, kb);
}

// ═══════════════════════════════════════════════════════════════
// ۹) تغییر پلن کاربر
// ═══════════════════════════════════════════════════════════════
async function handleSetPlanMenu(ctx, targetUserId) {
  if (!(await ensureAdmin(ctx))) return;

  const text =
    `💎 *تغییر پلن کاربر*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🆔 \`${targetUserId}\`\n\n` +
    `پلن جدید را انتخاب کنید:`;

  const kb = new InlineKeyboard()
    .text("🆓 رایگان", `admin:doplan:${targetUserId}:free`).row()
    .text("🚀 راه‌اندازی", `admin:doplan:${targetUserId}:starter`).row()
    .text("⭐ حرفه‌ای", `admin:doplan:${targetUserId}:professional`).row()
    .text("👑 VIP", `admin:doplan:${targetUserId}:vip`).row()
    .text("⬅️ بازگشت", `admin:user:${targetUserId}`);

  await sendOrEdit(ctx, text, kb);
}

async function handleDoSetPlan(ctx, targetUserId, planId) {
  if (!(await ensureAdmin(ctx))) return;

  if (!(planId in PLAN_LEVELS)) {
    await ctx.answerCallbackQuery({ text: "پلن نامعتبر", show_alert: true });
    return;
  }

  try {
    await setUserPlan(targetUserId, planId);
  } catch (e) {
    console.error("[admin] setUserPlan error:", e);
    await ctx.answerCallbackQuery({ text: "خطا", show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: `✅ پلن به ${planLabel(planId)} تغییر کرد`, show_alert: false });
  return handleUserView(ctx, targetUserId);
}

// ═══════════════════════════════════════════════════════════════
// ۱۰) تغییر نقش (ادمین/کاربر)
// ═══════════════════════════════════════════════════════════════
async function handleToggleRole(ctx, targetUserId) {
  if (!(await ensureAdmin(ctx))) return;

  let target = null;
  try {
    target = await getUserById(targetUserId);
  } catch (e) {
    console.error("[admin] toggleRole get error:", e);
  }
  if (!target) {
    await ctx.answerCallbackQuery({ text: "کاربر یافت نشد", show_alert: true });
    return;
  }

  // محافظت: ادمین نمی‌تواند خودش را از ادمینی خارج کند
  if (String(target.userId) === String(ctx.from.id) && target.role === "admin") {
    await ctx.answerCallbackQuery({
      text: "نمی‌توانید نقش خودتان را حذف کنید",
      show_alert: true,
    });
    return;
  }

  const newRole = target.role === "admin" ? "user" : "admin";
  try {
    await updateUser(targetUserId, { role: newRole });
  } catch (e) {
    console.error("[admin] toggleRole update error:", e);
    await ctx.answerCallbackQuery({ text: "خطا در به‌روزرسانی", show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({
    text: newRole === "admin" ? "🛠 ادمین شد" : "👤 ادمینی حذف شد",
    show_alert: false,
  });
  return handleUserView(ctx, targetUserId);
}

// ═══════════════════════════════════════════════════════════════
// ۱۱) Broadcast — ارسال پیام انبوه
// ═══════════════════════════════════════════════════════════════
async function handleBroadcastStart(ctx) {
  const adminUser = await ensureAdmin(ctx);
  if (!adminUser) return;

  const adminId = String(ctx.from.id);
  await updateUser(adminId, {
    currentStep: ADMIN_STATE.BROADCAST_TEXT,
    tempAnswers: "{}",
  });

  const text =
    "📢 *ارسال پیام انبوه*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "متن پیامی که می‌خواهید برای *همه‌ی کاربران* ارسال شود را بنویسید:\n\n" +
    "⚠️ این پیام به همه‌ی کاربران ربات ارسال خواهد شد. لطفاً با دقت بنویسید.\n\n" +
    "_مارک‌داون پشتیبانی می‌شود (\\*، \\_، \\`، …)._";

  const kb = new InlineKeyboard().text("❌ انصراف", "admin:cancel");
  await sendOrEdit(ctx, text, kb);
}

async function handleBroadcastConfirm(ctx, textToSend) {
  const adminUser = await ensureAdmin(ctx);
  if (!adminUser) return;

  const text =
    "📢 *تأیید ارسال پیام انبوه*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "*پیش‌نمایش پیام:*\n\n" +
    "─────────────\n" +
    `${textToSend}\n` +
    "─────────────\n\n" +
    "آیا ارسال شود؟";

  const kb = new InlineKeyboard()
    .text("📤 بله، ارسال کن", "admin:bcyes")
    .text("❌ انصراف", "admin:cancel").row();

  await sendOrEdit(ctx, text, kb);
}

async function handleBroadcastExecute(ctx) {
  const adminUser = await ensureAdmin(ctx);
  if (!adminUser) return;

  const adminId = String(ctx.from.id);
  // متن از tempAnswers ادمین خوانده می‌شود
  let tempAnswers = {};
  try {
    tempAnswers = adminUser.tempAnswers ? JSON.parse(adminUser.tempAnswers) : {};
  } catch {}

  const message = tempAnswers.broadcastText;
  if (!message) {
    await ctx.answerCallbackQuery({ text: "متنی برای ارسال یافت نشد", show_alert: true });
    return;
  }

  let users = [];
  try {
    users = (await listAllUsers({ limit: 10000 })) || [];
  } catch (e) {
    console.error("[admin] broadcast listAllUsers error:", e);
  }

  let success = 0;
  let failed = 0;

  // پاسخ اولیه به کاربر
  await sendOrEdit(
    ctx,
    `📤 *ارسال آغاز شد...*\n\n_در حال ارسال به ${users.length} کاربر..._`,
    new InlineKeyboard().text("⏳ صبر کنید", "admin:noop")
  );

  for (const u of users) {
    try {
      await ctx.api.sendMessage(u.userId, message, { parse_mode: "Markdown" });
      success++;
    } catch (e) {
      failed++;
    }
    // وقفه‌ی کوتاه برای جلوگیری از rate limit تلگرام
    await new Promise((r) => setTimeout(r, 50));
  }

  // پاک کردن state
  await updateUser(adminId, { currentStep: null, tempAnswers: "{}" });

  const result =
    "✅ *ارسال پیام انبوه پایان یافت*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    `📊 مجموع کاربران: ${users.length}\n` +
    `✅ ارسال موفق: ${success}\n` +
    `❌ ارسال ناموفق: ${failed}`;

  const kb = new InlineKeyboard().text("⬅️ پنل ادمین", "admin:panel");
  await ctx.reply(result, { parse_mode: "Markdown", reply_markup: kb });
}

// ═══════════════════════════════════════════════════════════════
// ۱۲) دریافت ورودی متنی ادمین (برای جستجو و broadcast)
// از onMessage در main.js صدا زده می‌شود. خروجی true یعنی پیام را خوردیم.
// ═══════════════════════════════════════════════════════════════
async function handleTextInput(ctx) {
  const adminId = String(ctx.from.id);
  const user = await getOrCreateUser(adminId, {});

  if (user.role !== "admin") return false;
  if (!isInAdminRange(user.currentStep)) return false;

  const text = (ctx.message?.text || "").trim();
  if (!text) {
    await ctx.reply("⚠️ متن خالی.");
    return true;
  }

  const step = user.currentStep;

  // جستجو با کد ملی
  if (step === ADMIN_STATE.SEARCH_NATIONAL) {
    if (!/^\d{10}$/.test(text)) {
      await ctx.reply("⚠️ کد ملی باید دقیقاً ۱۰ رقم باشد.");
      return true;
    }
    await updateUser(adminId, { currentStep: null, tempAnswers: "{}" });

    let found = null;
    try {
      found = await findByNationalId(text);
    } catch (e) {
      console.error("[admin] findByNationalId error:", e);
    }
    if (!found) {
      await ctx.reply("❌ کاربری با این کد ملی یافت نشد.");
      return true;
    }
    return handleUserView(ctx, found.userId || found.$id);
  }

  // جستجو با شماره
  if (step === ADMIN_STATE.SEARCH_PHONE) {
    if (!/^09\d{9}$/.test(text)) {
      await ctx.reply("⚠️ شماره باید با 09 شروع و ۱۱ رقم باشد.");
      return true;
    }
    await updateUser(adminId, { currentStep: null, tempAnswers: "{}" });

    let found = null;
    try {
      found = await findByPhone(text);
    } catch (e) {
      console.error("[admin] findByPhone error:", e);
    }
    if (!found) {
      await ctx.reply("❌ کاربری با این شماره یافت نشد.");
      return true;
    }
    return handleUserView(ctx, found.userId || found.$id);
  }

  // متن broadcast
  if (step === ADMIN_STATE.BROADCAST_TEXT) {
    if (text.length < 5 || text.length > 3500) {
      await ctx.reply("⚠️ متن باید بین ۵ تا ۳۵۰۰ کاراکتر باشد.");
      return true;
    }

    // ذخیره موقت برای تأیید
    await updateUser(adminId, {
      tempAnswers: JSON.stringify({ broadcastText: text }),
    });

    return handleBroadcastConfirm(ctx, text);
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
// ۱۳) انصراف عمومی
// ═══════════════════════════════════════════════════════════════
async function handleCancel(ctx) {
  if (!(await ensureAdmin(ctx))) return;
  const adminId = String(ctx.from.id);
  await updateUser(adminId, { currentStep: null, tempAnswers: "{}" });
  return handleAdminPanel(ctx);
}

// ═══════════════════════════════════════════════════════════════
// روتر یکپارچه‌ی callback های admin:*
// ═══════════════════════════════════════════════════════════════
async function handleAdminCallback(ctx) {
  const data = ctx.callbackQuery?.data || "";
  const parts = data.split(":");

  if (parts[0] !== "admin") return;

  try {
    const action = parts[1];

    if (action === "panel")     return handleAdminPanel(ctx);
    if (action === "stats")     return handleStats(ctx);

    if (action === "leads") {
      const page = parseInt(parts[2], 10) || 0;
      const status = parts[3] || "pending";
      return handleLeadsList(ctx, page, status);
    }
    if (action === "lead")      return handleLeadView(ctx, parts[2]);
    if (action === "leadact")   return handleLeadAction(ctx, parts[2], parts[3]);

    if (action === "users") {
      const page = parseInt(parts[2], 10) || 0;
      return handleUsersList(ctx, page);
    }
    if (action === "user")      return handleUserView(ctx, parts[2]);

    if (action === "search")    return handleSearchMenu(ctx);
    if (action === "srch")      return handleSearchStart(ctx, parts[2]);

    if (action === "setplan")   return handleSetPlanMenu(ctx, parts[2]);
    if (action === "doplan")    return handleDoSetPlan(ctx, parts[2], parts[3]);

    if (action === "togglerole") return handleToggleRole(ctx, parts[2]);

    if (action === "broadcast") return handleBroadcastStart(ctx);
    if (action === "bcyes")     return handleBroadcastExecute(ctx);

    if (action === "cancel")    return handleCancel(ctx);
    if (action === "noop") {
      try { await ctx.answerCallbackQuery(); } catch {}
      return;
    }

    await ctx.answerCallbackQuery({ text: "عملیات نامعتبر", show_alert: false });
  } catch (e) {
    console.error("[admin] callback error:", e);
    try {
      await ctx.answerCallbackQuery({ text: "خطا در پردازش", show_alert: true });
    } catch {}
  }
}

module.exports = {
  // هندلرهای اصلی
  handleAdminPanel,
  handleStats,
  handleLeadsList,
  handleLeadView,
  handleLeadAction,
  handleUsersList,
  handleUserView,
  handleSearchMenu,
  handleSearchStart,
  handleSetPlanMenu,
  handleDoSetPlan,
  handleToggleRole,
  handleBroadcastStart,
  handleBroadcastExecute,
  handleCancel,
  handleAdminCallback,
  handleTextInput,

  // کمکی‌ها
  ensureAdmin,
  isInAdminRange,
  ADMIN_STATE,
  STATE_RANGE,
};
