// src/flows/operations.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// فلوهای عملیات فاز ۱ — امروز / مسیر من / کارها / جلسات / الزامات / حساب
// ═══════════════════════════════════════════════════════════════
// مبنا: سند معماری نهایی §۴ (فرایند کاندیدا)، §۵ (پنج بخش اصلی)، §۷
// این فلوها روی ربات تلگرام موجود سوار می‌شوند (نه محصول موازی).
// هیچ داده‌ی موجودی حذف یا مهاجرت نمی‌شود؛ کالکشن‌های جدید افزایشی‌اند.
// محدوده‌ی currentStep این فلوها: 300 تا 399 (بدون تداخل با فلوهای قدیمی:
// readiness 0-200، profile 500+، swot 700+، rivals 800+، promises 850+،
// crisis 900+، content 950-999، admin 1000-1099).
// ═══════════════════════════════════════════════════════════════

const { InlineKeyboard } = require("grammy");
const {
  getOrCreateUser,
  updateUser,
  getUserConsultations,
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  createMeeting,
  listMeetings,
  getMeetingById,
  listAIJobs,
  updateAIJobStatus,
  logAudit,
  listAuditLogs,
  isCollectionMissing,
} = require("../utils/db.js");
const { escapeMd, truncate } = require("../utils/safe-text.js");
const tasksDomain = require("../domain/tasks.js");
const journeyDomain = require("../domain/journey.js");
const reqDomain = require("../domain/requirements.js");

const OPS_STEP_BASE = 300;
const STATE_RANGE = { min: 300, max: 399 };

const ST = {
  TASK_TITLE: 300,
  TASK_DUE: 301,
  MEETING_TITLE: 310,
  MEETING_NOTES: 311,
  MEETING_ACTIONS: 312,
};

function isInOpsRange(step) {
  return typeof step === "number" && step >= STATE_RANGE.min && step <= STATE_RANGE.max;
}

function parseOpsState(user) {
  try {
    const raw = user && user.opsState;
    if (!raw) return {};
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

async function saveOpsState(userId, patch) {
  const user = await getOrCreateUser(String(userId), {});
  const current = parseOpsState(user);
  const next = { ...current, ...patch };
  const serialized = JSON.stringify(next);
  if (serialized.length > 16000) throw new Error("opsState too large");
  await updateUser(String(userId), { opsState: serialized });
  return next;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return String(iso).slice(0, 10);
  }
}

function fmtDue(task, now = new Date()) {
  if (!task.dueAt) return "بدون مهلت";
  const d = new Date(task.dueAt);
  const label = d.toLocaleDateString("fa-IR");
  if (tasksDomain.isOverdue(task, now)) return `🔴 ${label} (عقب‌افتاده)`;
  if (tasksDomain.isDueToday(task, now)) return `🟡 ${label} (امروز)`;
  return label;
}

const PRIORITY_LABEL = { low: "کم", normal: "عادی", high: "بالا", urgent: "فوری" };
const SOURCE_LABEL = {
  manual: "ثبت دستی",
  meeting: "جلسه",
  requirement: "الزام",
  journey: "نقشه راه",
  ai_draft: "پیش‌نویس AI",
};
const STATUS_LABEL = {
  open: "باز",
  in_progress: "در حال انجام",
  done: "انجام‌شده",
  postponed: "معوق",
  cancelled: "لغوشده",
};

async function sendOrEdit(ctx, text, kb) {
  const opts = { parse_mode: "Markdown", reply_markup: kb };
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, opts);
      return;
    } catch {}
  }
  await ctx.reply(text, opts);
}

function backKB() {
  return new InlineKeyboard()
    .text("🏠 منوی اصلی", "menu")
    .text("✅ امروز", "ops:today");
}

function notEnabledKB() {
  return new InlineKeyboard()
    .text("🏠 منوی اصلی", "menu")
    .text("✅ امروز", "ops:today");
}

async function handleCollectionMissing(ctx) {
  const text =
    `⚠️ *این بخش هنوز فعال نشده است*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `دیتابیس برای «کارها و جلسات» هنوز ساخته نشده است.\n` +
    `ادمین باید یک‌بار این دستور را اجرا کند:\n\n` +
    `\`node setup-db.js\`\n\n` +
    `_داده‌های فعلی شما (پروفایل، تحلیل‌ها، خریدها) هیچ تغییری نمی‌کنند._`;
  await sendOrEdit(ctx, text, notEnabledKB());
}

// ───────────────────────────────────────────────────────────────
// امروز (Today) — اولویت امروز + اقدام بعدی مسیر + تأییدهای در انتظار
// ───────────────────────────────────────────────────────────────
async function showToday(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const profile = user.profile || {};
  let tasks = [];
  let meetings = [];
  let consultations = [];
  let pendingAI = [];
  try {
    consultations = await getUserConsultations(userId);
  } catch {}
  try {
    tasks = await listTasks(userId, { limit: 50 });
  } catch (e) {
    if (isCollectionMissing(e)) return handleCollectionMissing(ctx);
    console.error("[ops:today] tasks:", e?.message || e);
  }
  try {
    meetings = await listMeetings(userId, { limit: 5 });
  } catch {}
  try {
    pendingAI = await listAIJobs(userId, { status: "pending_approval", limit: 5 });
  } catch {}

  const opsState = parseOpsState(user);
  const journey = journeyDomain.deriveJourney({
    profile,
    consultations,
    tasks,
    meetings,
    requirementsProgress: opsState.requirementsProgress || {},
  });
  const todayTasks = tasksDomain.sortForToday(tasks).slice(0, 5);
  const summary = tasksDomain.summarize(tasks);

  let text =
    `✅ *میز کار من — امروز*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📋 کارهای باز: *${summary.open}*` +
    (summary.overdue ? ` (🔴 ${summary.overdue} عقب‌افتاده)` : "") +
    (summary.dueToday ? ` (🟡 ${summary.dueToday} مهلت امروز)` : "") +
    `\n🗺 مسیر: *${journey.completedCount}/${journey.total}* مرحله تکمیل‌شده\n\n`;

  if (journey.nextStage && journey.nextStage.nextAction) {
    text += `🎯 *اقدام بعدی پیشنهادی:*\n${escapeMd(journey.nextStage.title)} — ${escapeMd(journey.nextStage.nextAction.label)}\n\n`;
  }

  if (pendingAI.length > 0) {
    text += `🤖 *${pendingAI.length} مورد در انتظار تأیید شما* (پیش‌نویس AI)\n\n`;
  }

  text += `📌 *اولویت امروز:*\n`;
  if (todayTasks.length === 0) {
    text += `_کار بازی وجود ندارد. یک وظیفه ثبت کنید تا اینجا نمایش داده شود._\n`;
  } else {
    todayTasks.forEach((t, i) => {
      text += `${i + 1}. ${escapeMd(truncate(t.title, 60))}\n   _${STATUS_LABEL[t.status] || t.status} • ${fmtDue(t)}_\n`;
    });
  }

  const kb = new InlineKeyboard()
    .text("➕ ثبت سریع وظیفه", "ops:task_new").row()
    .text("📋 همه کارها", "ops:tasks").row()
    .text("🗺 مسیر من", "ops:journey").row();
  if (pendingAI.length > 0) kb.text("🤖 تأییدهای در انتظار", "ops:ai_inbox").row();
  kb.text("🏠 منوی اصلی", "menu");

  await sendOrEdit(ctx, text, kb);
}

// ───────────────────────────────────────────────────────────────
// مسیر من (Journey)
// ───────────────────────────────────────────────────────────────
async function showJourney(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const profile = user.profile || {};
  let consultations = [];
  let tasks = [];
  let meetings = [];
  try { consultations = await getUserConsultations(userId); } catch {}
  try { tasks = await listTasks(userId, { limit: 50 }); } catch (e) {
    if (isCollectionMissing(e)) return handleCollectionMissing(ctx);
  }
  try { meetings = await listMeetings(userId, { limit: 5 }); } catch {}
  const opsState = parseOpsState(user);
  const journey = journeyDomain.deriveJourney({
    profile,
    consultations,
    tasks,
    meetings,
    requirementsProgress: opsState.requirementsProgress || {},
  });

  let text =
    `🗺 *مسیر من*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `پیشرفت پرونده: *${journey.profileCompleteness}%* • مراحل تکمیل‌شده: *${journey.completedCount}/${journey.total}*\n\n`;

  journey.stages.forEach((s, i) => {
    text += `${i + 1}. ${journeyDomain.statusLabel(s.status)} — *${escapeMd(s.title)}*\n`;
    if (s.official) {
      text += `   _مرحله‌ی رسمی: وضعیت «اعلام کاربر» با «تأیید مرجع رسمی» متفاوت است._\n`;
    }
    if (s.nextAction && s.status !== "completed") {
      text += `   👉 ${escapeMd(s.nextAction.label)}\n`;
    }
  });

  text += `\n_وضعیت‌ها از داده‌های واقعی شما (پروفایل، تحلیل‌ها، وظایف) محاسبه می‌شوند._`;

  const kb = new InlineKeyboard()
    .text("✅ امروز", "ops:today").row()
    .text("📋 کارها", "ops:tasks").row()
    .text("📜 الزامات", "ops:requirements").row()
    .text("🏠 منوی اصلی", "menu");

  await sendOrEdit(ctx, text, kb);
}

// ───────────────────────────────────────────────────────────────
// کارها (Tasks)
// ───────────────────────────────────────────────────────────────
async function showTasks(ctx) {
  const userId = String(ctx.from.id);
  let tasks = [];
  try {
    tasks = await listTasks(userId, { limit: 30 });
  } catch (e) {
    if (isCollectionMissing(e)) return handleCollectionMissing(ctx);
    throw e;
  }
  const sorted = tasksDomain.sortForToday(tasks);
  const done = tasks.filter((t) => t.status === "done").slice(0, 5);

  let text = `📋 *کارها*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (sorted.length === 0 && done.length === 0) {
    text += `_هنوز وظیفه‌ای ثبت نشده است._\n\n` +
      `با «ثبت سریع» در چند ثانیه اولین وظیفه را بسازید — بدون نیاز به AI.\n`;
  } else {
    if (sorted.length > 0) {
      text += `📌 *باز (${sorted.length}):*\n`;
      sorted.slice(0, 10).forEach((t, i) => {
        text += `${i + 1}. ${escapeMd(truncate(t.title, 55))}\n   _${STATUS_LABEL[t.status] || t.status} • ${PRIORITY_LABEL[t.priority] || t.priority} • ${fmtDue(t)}_\n`;
      });
      text += `\n`;
    }
    if (done.length > 0) {
      text += `✅ *انجام‌شده (اخیر):*\n`;
      done.forEach((t) => {
        text += `• ${escapeMd(truncate(t.title, 55))}\n`;
      });
    }
  }

  const kb = new InlineKeyboard().text("➕ ثبت سریع وظیفه", "ops:task_new").row();
  // دکمه‌های اقدام روی ۵ وظیفه‌ی اول باز
  sorted.slice(0, 5).forEach((t) => {
    const id = String(t.$id || t.id || "");
    if (!id) return;
    kb.text(`👁 ${truncate(String(t.title), 28)}`, `ops:task_view:${id}`).row();
  });
  kb.text("📅 جلسات", "ops:meetings").row();
  kb.text("✅ امروز", "ops:today").row();
  kb.text("🏠 منوی اصلی", "menu");

  await sendOrEdit(ctx, text, kb);
}

async function showTaskView(ctx, taskId) {
  const userId = String(ctx.from.id);
  let task = null;
  try {
    task = await getTaskById(taskId);
  } catch (e) {
    if (isCollectionMissing(e)) return handleCollectionMissing(ctx);
    throw e;
  }
  if (!task) {
    await ctx.answerCallbackQuery({ text: "وظیفه یافت نشد", show_alert: true });
    return;
  }
  if (String(task.userId) !== userId) {
    await ctx.answerCallbackQuery({ text: "شما مجوز مشاهده این وظیفه را ندارید.", show_alert: true });
    return;
  }
  const text =
    `📌 *جزئیات وظیفه*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${escapeMd(task.title)}\n\n` +
    `• وضعیت: ${STATUS_LABEL[task.status] || task.status}\n` +
    `• اولویت: ${PRIORITY_LABEL[task.priority] || task.priority}\n` +
    `• منبع: ${SOURCE_LABEL[task.source] || task.source}\n` +
    `• مهلت: ${fmtDue(task)}\n` +
    `• ثبت: ${fmtDate(task.createdAt)}\n`;

  const kb = new InlineKeyboard();
  if (task.status === "open") kb.text("▶️ شروع", `ops:task_start:${taskId}`).row();
  if (task.status === "open" || task.status === "in_progress") {
    kb.text("✅ انجام شد", `ops:task_done:${taskId}`).row();
    kb.text("⏸ تعویق", `ops:task_postpone:${taskId}`).row();
  }
  if (task.status === "postponed") kb.text("🔁 فعال‌سازی", `ops:task_start:${taskId}`).row();
  if (task.status !== "done" && task.status !== "cancelled") {
    kb.text("🗑 لغو وظیفه", `ops:task_cancel:${taskId}`).row();
  }
  kb.text("📋 بازگشت به کارها", "ops:tasks").row();
  kb.text("🏠 منوی اصلی", "menu");

  await sendOrEdit(ctx, text, kb);
}

async function changeTaskStatus(ctx, taskId, newStatus) {
  const userId = String(ctx.from.id);
  try {
    const { task } = await (async () => {
      const updated = await updateTaskStatus(taskId, userId, newStatus);
      return { task: updated };
    })();
    await logAudit(userId, {
      action: "task.update",
      entityType: "task",
      entityId: String(taskId),
      meta: { from: "telegram", to: newStatus },
    });
    await ctx.answerCallbackQuery({ text: "انجام شد ✅", show_alert: false });
    await showTaskView(ctx, taskId);
  } catch (e) {
    if (e.code === "PERMISSION_DENIED") {
      await ctx.answerCallbackQuery({ text: "شما مجوز تغییر این وظیفه را ندارید.", show_alert: true });
    } else if (e.code === "TASK_INVALID_TRANSITION") {
      await ctx.answerCallbackQuery({ text: "این تغییر وضعیت مجاز نیست.", show_alert: true });
    } else if (isCollectionMissing(e)) {
      await handleCollectionMissing(ctx);
    } else {
      console.error("[ops:taskStatus]", e?.message || e);
      await ctx.answerCallbackQuery({ text: "خطا رخ داد. دوباره تلاش کنید.", show_alert: true });
    }
  }
}

async function startTaskFlow(ctx) {
  const userId = String(ctx.from.id);
  await updateUser(userId, { currentStep: ST.TASK_TITLE, tempAnswers: "{}" });
  await ctx.reply(
    `➕ *ثبت سریع وظیفه*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `عنوان وظیفه را بنویسید (۳ تا ۲۰۰ کاراکتر):\n\n` +
      `_مثال: تماس با ستاد شهرستان برای رزرو سالن_\n\n` +
      `برای انصراف: /cancel`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("❌ انصراف", "cancel"),
    }
  );
}

async function finishTaskCreation(ctx, title, dueAt, priority, idempotencyKey) {
  const userId = String(ctx.from.id);
  try {
    const { task, deduplicated } = await createTask(userId, {
      title,
      dueAt,
      priority,
      source: "manual",
      idempotencyKey,
    });
    await logAudit(userId, {
      action: "task.create",
      entityType: "task",
      entityId: String(task.$id || task.id || ""),
      meta: { source: "manual", deduplicated: !!deduplicated },
    });
    await updateUser(userId, { currentStep: null, tempAnswers: "{}" });
    const msg = deduplicated
      ? `ℹ️ این وظیفه قبلاً ثبت شده بود (جلوگیری از ثبت تکراری).\n\n📌 ${escapeMd(truncate(task.title, 80))}`
      : `✅ وظیفه ثبت شد:\n\n📌 ${escapeMd(truncate(task.title, 80))}\n• مهلت: ${task.dueAt ? fmtDate(task.dueAt) : "بدون مهلت"}\n• اولویت: ${PRIORITY_LABEL[task.priority] || task.priority}`;
    await ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("📋 مشاهده کارها", "ops:tasks")
        .text("✅ امروز", "ops:today"),
    });
  } catch (e) {
    if (isCollectionMissing(e)) {
      await updateUser(userId, { currentStep: null, tempAnswers: "{}" }).catch(() => {});
      return handleCollectionMissing(ctx);
    }
    console.error("[ops:finishTask]", e?.message || e);
    await ctx.reply("⚠️ ثبت وظیفه ناموفق بود. دوباره تلاش کنید یا /cancel بزنید.");
  }
}

// ───────────────────────────────────────────────────────────────
// جلسات (Meetings) — صورت‌جلسه به وظایف قابل پیگیری تبدیل می‌شود
// ───────────────────────────────────────────────────────────────
async function showMeetings(ctx) {
  const userId = String(ctx.from.id);
  let meetings = [];
  try {
    meetings = await listMeetings(userId, { limit: 10 });
  } catch (e) {
    if (isCollectionMissing(e)) return handleCollectionMissing(ctx);
    throw e;
  }
  let text = `📅 *جلسات*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (meetings.length === 0) {
    text += `_هنوز جلسه‌ای ثبت نشده است._\n\n` +
      `پس از ثبت جلسه، اقدام‌ها به وظایف قابل پیگیری تبدیل می‌شوند — نه فقط خلاصه‌ی متنی.\n`;
  } else {
    meetings.forEach((m, i) => {
      text += `${i + 1}. ${escapeMd(truncate(m.title, 55))}\n   _${fmtDate(m.createdAt)}_\n`;
    });
  }
  const kb = new InlineKeyboard().text("➕ ثبت جلسه جدید", "ops:meeting_new").row();
  meetings.slice(0, 5).forEach((m) => {
    const id = String(m.$id || m.id || "");
    if (id) kb.text(`👁 ${truncate(String(m.title), 28)}`, `ops:meeting_view:${id}`).row();
  });
  kb.text("📋 کارها", "ops:tasks").row();
  kb.text("🏠 منوی اصلی", "menu");
  await sendOrEdit(ctx, text, kb);
}

async function showMeetingView(ctx, meetingId) {
  const userId = String(ctx.from.id);
  let meeting = null;
  try {
    meeting = await getMeetingById(meetingId);
  } catch (e) {
    if (isCollectionMissing(e)) return handleCollectionMissing(ctx);
    throw e;
  }
  if (!meeting) {
    await ctx.answerCallbackQuery({ text: "جلسه یافت نشد", show_alert: true });
    return;
  }
  if (String(meeting.userId) !== userId) {
    await ctx.answerCallbackQuery({ text: "شما مجوز مشاهده این جلسه را ندارید.", show_alert: true });
    return;
  }
  let linkedTasks = [];
  try {
    const all = await listTasks(userId, { limit: 50 });
    linkedTasks = all.filter((t) => String(t.meetingId || "") === String(meetingId));
  } catch {}
  let text =
    `📅 *${escapeMd(truncate(meeting.title, 80))}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📆 تاریخ ثبت: ${fmtDate(meeting.createdAt)}\n`;
  if (meeting.notes) text += `\n📝 *یادداشت‌ها:*\n${escapeMd(truncate(meeting.notes, 800))}\n`;
  if (meeting.decisions) text += `\n⚖️ *تصمیم‌ها:*\n${escapeMd(truncate(meeting.decisions, 800))}\n`;
  text += `\n📌 *اقدام‌های تبدیل‌شده به وظیفه (${linkedTasks.length}):*\n`;
  if (linkedTasks.length === 0) text += `_هنوز اقدامی ثبت نشده است._\n`;
  else linkedTasks.forEach((t) => { text += `• ${escapeMd(truncate(t.title, 55))} — ${STATUS_LABEL[t.status] || t.status}\n`; });

  const kb = new InlineKeyboard()
    .text("📅 بازگشت به جلسات", "ops:meetings").row()
    .text("📋 کارها", "ops:tasks").row()
    .text("🏠 منوی اصلی", "menu");
  await sendOrEdit(ctx, text, kb);
}

async function startMeetingFlow(ctx) {
  const userId = String(ctx.from.id);
  await updateUser(userId, { currentStep: ST.MEETING_TITLE, tempAnswers: "{}" });
  await ctx.reply(
    `📅 *ثبت جلسه*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `عنوان جلسه را بنویسید:\n\n_مثال: جلسه‌ی ستاد شهرستان — ۲۱ آبان_\n\nبرای انصراف: /cancel`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("❌ انصراف", "cancel"),
    }
  );
}

// ───────────────────────────────────────────────────────────────
// الزامات (Requirements) — پیش‌نویس ساختاری، بدون ادعای حقوقی قطعی
// ───────────────────────────────────────────────────────────────
async function showRequirements(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const opsState = parseOpsState(user);
  const progress = opsState.requirementsProgress || {};
  const list = reqDomain.listRequirements();

  let text =
    `📜 *الزامات و منابع رسمی*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `⚠️ *توجه:* این فهرست در مرحله‌ی «پیش‌نویس ساختاری» است.\n` +
    `تا منبع رسمی هر مورد درج و بازبینی حقوقی انجام نشود، هیچ موردی به‌عنوان حکم قطعی ارائه نمی‌شود.\n\n`;

  list.forEach((r, i) => {
    const p = progress[r.id] || "not_started";
    text += `${i + 1}. ${reqDomain.progressLabel(p)} — *${escapeMd(r.title)}*\n   _دسته: ${escapeMd(r.category)} • وضعیت: نیازمند بازبینی حقوقی_\n`;
  });

  const kb = new InlineKeyboard();
  list.forEach((r) => {
    kb.text(`👁 ${truncate(r.title, 30)}`, `ops:req_view:${r.id}`).row();
  });
  kb.text("🗺 مسیر من", "ops:journey").row();
  kb.text("🏠 منوی اصلی", "menu");
  await sendOrEdit(ctx, text, kb);
}

async function showRequirementView(ctx, reqId) {
  const userId = String(ctx.from.id);
  const req = reqDomain.getRequirement(reqId);
  if (!req) {
    await ctx.answerCallbackQuery({ text: "مورد یافت نشد", show_alert: true });
    return;
  }
  const user = await getOrCreateUser(userId, {});
  const opsState = parseOpsState(user);
  const progress = (opsState.requirementsProgress || {})[reqId] || "not_started";

  const text =
    `📜 *${escapeMd(req.title)}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${escapeMd(req.description)}\n\n` +
    `• دسته: ${escapeMd(req.category)}\n` +
    `• وضعیت پیشرفت شما: ${reqDomain.progressLabel(progress)}\n` +
    `• منبع: ${escapeMd(req.source.name)} (نسخه ${escapeMd(req.source.version)})\n` +
    `• وضعیت اعتبار: *نیازمند بازبینی حقوقی* — هنوز حکم قطعی نیست.\n\n` +
    `_«انجام‌شده» یعنی شما اعلام کرده‌اید که این مورد را بررسی کرده‌اید؛` +
    ` به معنای تأیید مرجع رسمی نیست._`;

  const kb = new InlineKeyboard();
  if (progress !== "done") kb.text("✅ علامت‌گذاری به‌عنوان انجام‌شده (اعلام کاربر)", `ops:req_done:${reqId}`).row();
  if (progress === "done") kb.text("↩️ بازگردانی به «در حال انجام»", `ops:req_review:${reqId}`).row();
  kb.text("📜 بازگشت به الزامات", "ops:requirements").row();
  kb.text("🏠 منوی اصلی", "menu");
  await sendOrEdit(ctx, text, kb);
}

async function setRequirementProgress(ctx, reqId, value) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const opsState = parseOpsState(user);
  const progress = { ...(opsState.requirementsProgress || {}), [reqId]: value };
  await saveOpsState(userId, { requirementsProgress: progress });
  await logAudit(userId, {
    action: "requirement.update",
    entityType: "requirement",
    entityId: reqId,
    meta: { progress: value },
  });
  await ctx.answerCallbackQuery({ text: "ثبت شد ✅", show_alert: false });
  await showRequirementView(ctx, reqId);
}

// ───────────────────────────────────────────────────────────────
// حساب (Account) — خروجی و حذف (سند §۱۲)
// ───────────────────────────────────────────────────────────────
async function showAccount(ctx) {
  const userId = String(ctx.from.id);
  const user = await getOrCreateUser(userId, {});
  const text =
    `👤 *حساب من*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `• پلن فعلی: ${escapeMd(user.purchasedPlan || "free")}\n` +
    `• عضویت از: ${fmtDate(user.createdAt)}\n` +
    `• آخرین فعالیت: ${fmtDate(user.lastInteractionNew || user.lastInteraction)}\n\n` +
    `🔒 امکانات خروجی و حذف داده هنوز در حال توسعه‌اند. برای درخواست به پشتیبانی مراجعه کنید.`;

  const kb = new InlineKeyboard()
    .text("💼 بسته‌ها و خدمات", "show_plans").row()
    .text("🏠 منوی اصلی", "menu");
  await sendOrEdit(ctx, text, kb);
}

// ───────────────────────────────────────────────────────────────
// صندوق تأیید AI (AI Inbox) — کنترل انسانی (سند §۱۰)
// ───────────────────────────────────────────────────────────────
async function showAIInbox(ctx) {
  const userId = String(ctx.from.id);
  let jobs = [];
  try {
    jobs = await listAIJobs(userId, { status: "pending_approval", limit: 10 });
  } catch (e) {
    if (isCollectionMissing(e)) return handleCollectionMissing(ctx);
    throw e;
  }
  let text =
    `🤖 *تأییدهای در انتظار*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `پیش‌نویس‌های AI فقط پس از تأیید صریح شما اجرا می‌شوند.\n\n`;
  if (jobs.length === 0) {
    text += `_موردی در انتظار تأیید نیست._\n`;
  } else {
    jobs.forEach((j, i) => {
      text += `${i + 1}. *${escapeMd(j.kind)}* — عملیات: ${escapeMd(j.operation)}\n   _${escapeMd(truncate(j.inputSummary || "—", 80))}_\n`;
    });
  }
  const kb = new InlineKeyboard();
  jobs.slice(0, 5).forEach((j) => {
    const id = String(j.$id || j.id || "");
    if (!id) return;
    kb.text(`✅ تأیید ${truncate(String(j.kind), 18)}`, `ops:ai_approve:${id}`).row();
    kb.text(`❌ رد ${truncate(String(j.kind), 18)}`, `ops:ai_reject:${id}`).row();
  });
  kb.text("✅ امروز", "ops:today").row();
  kb.text("🏠 منوی اصلی", "menu");
  await sendOrEdit(ctx, text, kb);
}

async function handleAIDecision(ctx, jobId, decision) {
  const userId = String(ctx.from.id);
  try {
    const updated = await updateAIJobStatus(jobId, userId, decision === "approve" ? "approved" : "rejected");
    if (!updated) {
      await ctx.answerCallbackQuery({ text: "مورد یافت نشد", show_alert: true });
      return;
    }
    await logAudit(userId, {
      action: decision === "approve" ? "ai_job.approve" : "ai_job.reject",
      entityType: "ai_job",
      entityId: String(jobId),
      meta: {},
    });
    await ctx.answerCallbackQuery({
      text: decision === "approve" ? "تأیید شد ✅" : "رد شد ❌",
      show_alert: false,
    });
    // پس از تأیید، اگر پیش‌نویس شامل وظایف بود، آن‌ها را بساز (کنترل‌شده)
    if (decision === "approve") {
      let draft = {};
      try { draft = JSON.parse(updated.draftPayload || "{}"); } catch {}
      const draftTasks = Array.isArray(draft.tasks) ? draft.tasks : [];
      let created = 0;
      for (const dt of draftTasks.slice(0, 10)) {
        try {
          await createTask(userId, {
            title: String(dt.title || "").slice(0, 200),
            priority: dt.priority || "normal",
            source: "ai_draft",
            dueAt: dt.dueAt || null,
          });
          created++;
        } catch {}
      }
      if (created > 0) {
        await logAudit(userId, {
          action: "ai_job.execute",
          entityType: "ai_job",
          entityId: String(jobId),
          meta: { createdTasks: created },
        });
        await ctx.reply(`✅ ${created} وظیفه از پیش‌نویس تأییدشده ساخته شد.`, {
          reply_markup: new InlineKeyboard().text("📋 مشاهده کارها", "ops:tasks"),
        });
      }
    }
    await showAIInbox(ctx);
  } catch (e) {
    if (e.code === "PERMISSION_DENIED") {
      await ctx.answerCallbackQuery({ text: "شما مجوز تأیید این مورد را ندارید.", show_alert: true });
    } else if (e.code === "AI_INVALID_TRANSITION") {
      await ctx.answerCallbackQuery({ text: "این مورد قبلاً تعیین تکلیف شده است.", show_alert: true });
    } else if (isCollectionMissing(e)) {
      await handleCollectionMissing(ctx);
    } else {
      console.error("[ops:aiDecision]", e?.message || e);
      await ctx.answerCallbackQuery({ text: "خطا رخ داد.", show_alert: true });
    }
  }
}

// ───────────────────────────────────────────────────────────────
// روتر callback
// ───────────────────────────────────────────────────────────────
async function handleOperationsCallback(ctx) {
  const data = ctx.callbackQuery?.data || "";
  if (!data.startsWith("ops:")) return false;
  const rest = data.slice(4);
  try {
    if (rest === "today") { await showToday(ctx); return true; }
    if (rest === "journey") { await showJourney(ctx); return true; }
    if (rest === "tasks") { await showTasks(ctx); return true; }
    if (rest === "task_new") { await startTaskFlow(ctx); return true; }
    if (rest === "meetings") { await showMeetings(ctx); return true; }
    if (rest === "meeting_new") { await startMeetingFlow(ctx); return true; }
    if (rest === "requirements") { await showRequirements(ctx); return true; }
    if (rest === "account") { await showAccount(ctx); return true; }
    if (["export", "delete_confirm", "delete_yes"].includes(rest)) {
      await ctx.answerCallbackQuery({ text: "این قابلیت هنوز فعال نشده است. لطفاً با پشتیبانی تماس بگیرید.", show_alert: true });
      return true;
    }
    if (rest === "ai_inbox") { await showAIInbox(ctx); return true; }
    if (rest.startsWith("task_view:")) { await showTaskView(ctx, rest.slice(10)); return true; }
    if (rest.startsWith("task_done:")) { await changeTaskStatus(ctx, rest.slice(10), "done"); return true; }
    if (rest.startsWith("task_start:")) { await changeTaskStatus(ctx, rest.slice(11), "in_progress"); return true; }
    if (rest.startsWith("task_postpone:")) { await changeTaskStatus(ctx, rest.slice(14), "postponed"); return true; }
    if (rest.startsWith("task_cancel:")) { await changeTaskStatus(ctx, rest.slice(12), "cancelled"); return true; }
    if (rest.startsWith("meeting_view:")) { await showMeetingView(ctx, rest.slice(13)); return true; }
    if (rest.startsWith("req_view:")) { await showRequirementView(ctx, rest.slice(9)); return true; }
    if (rest.startsWith("req_done:")) { await setRequirementProgress(ctx, rest.slice(9), "done"); return true; }
    if (rest.startsWith("req_review:")) { await setRequirementProgress(ctx, rest.slice(11), "in_progress"); return true; }
    if (rest.startsWith("ai_approve:")) { await ctx.answerCallbackQuery({ text: "اجرای پیش‌نویس هنوز فعال نیست.", show_alert: true }); return true; }
    if (rest.startsWith("ai_reject:")) { await handleAIDecision(ctx, rest.slice(10), "reject"); return true; }
    if (rest.startsWith("task_priority:")) {
      const priority = rest.slice(14);
      const userId = String(ctx.from.id);
      const user = await getOrCreateUser(userId, {});
      const opsState = parseOpsState(user);
      const draft = opsState.taskDraft || {};
      if (!draft.title) {
        await ctx.answerCallbackQuery({ text: "پیش‌نویس وظیفه یافت نشد.", show_alert: true });
        return true;
      }
      await finishTaskCreation(ctx, draft.title, draft.dueAt || null, priority, draft.idempotencyKey);
      return true;
    }
    if (rest.startsWith("meeting_confirm:")) {
      const meetingId = rest.slice(16);
      const userId = String(ctx.from.id);
      const user = await getOrCreateUser(userId, {});
      const opsState = parseOpsState(user);
      const meeting = await getMeetingById(meetingId);
      if (!meeting || String(meeting.userId) !== userId || opsState.meetingDraftId !== meetingId) {
        await ctx.answerCallbackQuery({ text: "پیش‌نویس این جلسه در دسترس نیست.", show_alert: true });
        return true;
      }
      const actions = Array.isArray(opsState.meetingActions) ? opsState.meetingActions : [];
      let created = 0;
      try {
        for (const [index, title] of actions.slice(0, 20).entries()) {
          await createTask(userId, { title, source: "meeting", meetingId, priority: "normal", idempotencyKey: `meeting:${meetingId}:${index}` });
          created++;
        }
      } catch (e) {
        console.error("[ops:meeting_confirm]", e?.message || e);
        await ctx.answerCallbackQuery({ text: "ثبت همه اقدام‌ها کامل نشد. دوباره تلاش کنید.", show_alert: true });
        return true;
      }
      await saveOpsState(userId, { meetingActions: [], meetingTitle: null, meetingNotes: null, meetingDraftId: null });
      await updateUser(userId, { currentStep: null, tempAnswers: "{}" });
      await logAudit(userId, {
        action: "meeting.create",
        entityType: "meeting",
        entityId: String(meetingId),
        meta: { createdTasks: created },
      });
      await ctx.reply(
        `✅ جلسه ثبت شد و ${created} اقدام به وظایف قابل پیگیری تبدیل شد.`,
        {
          reply_markup: new InlineKeyboard()
            .text("📋 مشاهده کارها", "ops:tasks")
            .text("📅 جلسات", "ops:meetings"),
        }
      );
      return true;
    }
  } catch (e) {
    console.error("[ops:callback]", e?.message || e);
    try { await ctx.answerCallbackQuery({ text: "خطا رخ داد.", show_alert: true }); } catch {}
    return true;
  }
  return false;
}

// ───────────────────────────────────────────────────────────────
// ورودی متنی (state 300-399)
// ───────────────────────────────────────────────────────────────
async function handleTextInput(ctx) {
  const userId = String(ctx.from.id);
  let user;
  try {
    user = await getOrCreateUser(userId, {});
  } catch {
    return false;
  }
  if (!isInOpsRange(user.currentStep)) return false;
  const text = String(ctx.message?.text || "").trim();
  if (!text) return false;
  if (text === "/cancel") return false; // هندلر /cancel در main.js

  try {
    if (user.currentStep === ST.TASK_TITLE) {
      if (text.length < 3 || text.length > 200) {
        await ctx.reply("⚠️ عنوان باید بین ۳ تا ۲۰۰ کاراکتر باشد. دوباره بنویسید یا /cancel بزنید.");
        return true;
      }
      await saveOpsState(userId, { taskDraft: { title: text, dueAt: null, idempotencyKey: `telegram-update:${ctx.update.update_id}` } });
      await updateUser(userId, { currentStep: ST.TASK_DUE });
      await ctx.reply(
        `📌 «${escapeMd(truncate(text, 80))}»\n\n` +
          `مهلت را بنویسید (اختیاری):\n` +
          `• «امروز» یا «فردا»\n` +
          `• تاریخ میلادی ISO مثل 2026-11-20\n` +
          `• «-» برای بدون مهلت\n\nبرای انصراف: /cancel`,
        { parse_mode: "Markdown" }
      );
      return true;
    }

    if (user.currentStep === ST.TASK_DUE) {
      const opsState = parseOpsState(user);
      const draft = opsState.taskDraft || {};
      if (!draft.title) {
        await updateUser(userId, { currentStep: null, tempAnswers: "{}" });
        await ctx.reply("⚠️ پیش‌نویس وظیفه یافت نشد. از «ثبت سریع» شروع کنید.");
        return true;
      }
      let dueAt = null;
      const t = text.trim();
      if (t !== "-" && t !== "بدون مهلت") {
        if (t === "امروز") {
          const d = new Date(); d.setHours(23, 59, 59, 999); dueAt = d.toISOString();
        } else if (t === "فردا") {
          const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(23, 59, 59, 999); dueAt = d.toISOString();
        } else {
          // ISO یا YYYY-MM-DD
          const iso = t.replace(/\//g, "-");
          const d = new Date(iso);
          if (!Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
            dueAt = d.toISOString();
          } else {
            await ctx.reply(
              "⚠️ فرمت مهلت را متوجه نشدم. «امروز»، «فردا»، «-» یا تاریخ ISO (مثل 2026-11-20) بنویسید.",
              { parse_mode: "Markdown" }
            );
            return true;
          }
        }
      }
      await saveOpsState(userId, { taskDraft: { ...draft, dueAt } });
      const kb = new InlineKeyboard()
        .text("🔴 فوری", "ops:task_priority:urgent").row()
        .text("🟠 بالا", "ops:task_priority:high").row()
        .text("🔵 عادی", "ops:task_priority:normal").row()
        .text("⚪ کم", "ops:task_priority:low").row();
      await ctx.reply(`🎯 اولویت وظیفه را انتخاب کنید:`, { reply_markup: kb });
      return true;
    }

    if (user.currentStep === ST.MEETING_TITLE) {
      if (text.length < 3 || text.length > 200) {
        await ctx.reply("⚠️ عنوان جلسه باید بین ۳ تا ۲۰۰ کاراکتر باشد.");
        return true;
      }
      await saveOpsState(userId, { meetingTitle: text, meetingNotes: null, meetingActions: [] });
      await updateUser(userId, { currentStep: ST.MEETING_NOTES });
      await ctx.reply(
        `📝 یادداشت‌ها و تصمیم‌های جلسه را بنویسید (یا «-» اگر ندارید):\n\n_هر تصمیم در یک خط._`,
        { parse_mode: "Markdown" }
      );
      return true;
    }

    if (user.currentStep === ST.MEETING_NOTES) {
      const notes = text === "-" ? "" : text.slice(0, 8000);
      await saveOpsState(userId, { meetingNotes: notes });
      await updateUser(userId, { currentStep: ST.MEETING_ACTIONS });
      await ctx.reply(
        `📌 اقدام‌های جلسه را بنویسید — هر اقدام در یک خط:\n\n` +
          `_مثال:\nتماس با ستاد شهرستان\nرزرو سالن برای سخنرانی_\n\n` +
          `اگر اقدامی ندارید «-» بنویسید. پس از تأیید شما، هر اقدام به یک وظیفه‌ی قابل پیگیری تبدیل می‌شود.`,
        { parse_mode: "Markdown" }
      );
      return true;
    }

    if (user.currentStep === ST.MEETING_ACTIONS) {
      const opsState = parseOpsState(user);
      const title = opsState.meetingTitle || "جلسه بدون عنوان";
      const notes = opsState.meetingNotes || "";
      const actions =
        text === "-"
          ? []
          : text
              .split("\n")
              .map((l) => l.trim().replace(/^[-•\d.)\s]+/, ""))
              .filter((l) => l.length >= 3)
              .slice(0, 20);

      let meeting;
      try {
        meeting = await createMeeting(userId, { title, notes, decisions: notes });
      } catch (e) {
        if (isCollectionMissing(e)) {
          await updateUser(userId, { currentStep: null, tempAnswers: "{}" }).catch(() => {});
          await handleCollectionMissing(ctx);
          return true;
        }
        throw e;
      }
      const meetingId = String(meeting.$id || meeting.id || "");
      await saveOpsState(userId, { meetingActions: actions, meetingDraftId: meetingId });
      await updateUser(userId, { currentStep: null, tempAnswers: "{}" });

      if (actions.length === 0) {
        await updateUser(userId, { currentStep: null, tempAnswers: "{}" }).catch(() => {});
        await logAudit(userId, { action: "meeting.create", entityType: "meeting", entityId: meetingId, meta: { createdTasks: 0 } });
        await ctx.reply(`✅ جلسه «${escapeMd(truncate(title, 60))}» ثبت شد (بدون اقدام).`, {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard().text("📅 جلسات", "ops:meetings"),
        });
        return true;
      }

      let preview = `📋 *پیش‌نمایش اقدام‌ها (${actions.length}):*\n\n`;
      actions.forEach((a, i) => { preview += `${i + 1}. ${escapeMd(truncate(a, 70))}\n`; });
      preview += `\nبا تأیید، هر مورد به یک وظیفه‌ی قابل پیگیری تبدیل می‌شود.`;
      const kb = new InlineKeyboard()
        .text("✅ تأیید و تبدیل به وظیفه", `ops:meeting_confirm:${meetingId}`).row()
        .text("❌ انصراف", "cancel");
      await ctx.reply(preview, { parse_mode: "Markdown", reply_markup: kb });
      return true;
    }
  } catch (e) {
    console.error("[ops:text]", e?.message || e);
    await ctx.reply("⚠️ خطا رخ داد. دوباره تلاش کنید یا /cancel بزنید.");
    return true;
  }
  return false;
}

module.exports = {
  OPS_STEP_BASE,
  STATE_RANGE,
  ST,
  isInOpsRange,
  showToday,
  showJourney,
  showTasks,
  showTaskView,
  showMeetings,
  showMeetingView,
  showRequirements,
  showRequirementView,
  showAccount,
  showAIInbox,
  handleOperationsCallback,
  handleTextInput,
};
