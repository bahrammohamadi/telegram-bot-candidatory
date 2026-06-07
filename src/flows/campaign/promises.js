// src/flows/campaign/promises.js — CommonJS
// ─── مدیریت وعده‌های انتخاباتی ───

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser, updateUser } = require("../../utils/db.js");
const { requireAccess, requireLimit } = require("../../utils/access.js");

const PROMISE_STEP_BASE   = 850;

const PROMISE_FIELDS = [
  {
    id: "title", title: "📋 عنوان وعده",
    question: "عنوان کوتاه وعده انتخاباتی را بنویسید:\n\n📌 مثال: «آسفالت معابر فرعی»\n\n💬 بنویسید:",
    type: "text", validation: "min_5",
  },
  {
    id: "category", title: "🏷️ دسته‌بندی",
    question: "این وعده در کدام حوزه است؟",
    type: "choice",
    options: [
      { label: "🏗️ عمران و زیرساخت",     value: "infrastructure" },
      { label: "🌳 محیط زیست و فضای سبز", value: "environment" },
      { label: "💼 اشتغال و اقتصاد",      value: "economy" },
      { label: "🎓 آموزش و فرهنگ",        value: "education" },
      { label: "🏥 بهداشت و سلامت",       value: "health" },
      { label: "👦 جوانان و ورزش",         value: "youth" },
      { label: "👩 بانوان و خانواده",      value: "women" },
      { label: "🔒 امنیت و نظم",          value: "security" },
      { label: "📋 مدیریتی و اداری",      value: "management" },
    ],
  },
  {
    id: "priority", title: "⭐ اولویت",
    question: "اولویت این وعده چقدر است؟",
    type: "choice",
    options: [
      { label: "🔴 اول — بلافاصله بعد از انتخاب", value: "first" },
      { label: "🟠 دوم — ۶ ماه اول",              value: "second" },
      { label: "🟡 سوم — سال اول",                value: "third" },
      { label: "🟢 بلندمدت — طول دوره",           value: "longterm" },
    ],
  },
  {
    id: "feasibility", title: "✅ قابلیت اجرا",
    question: "آیا این وعده در اختیارات شما هست؟",
    type: "choice",
    options: [
      { label: "✅ کاملاً در اختیارات شوراست",   value: "full" },
      { label: "🤝 نیاز به همکاری با شهرداری",   value: "partial" },
      { label: "🏛️ نیاز به تأیید سطوح بالاتر",  value: "approval" },
      { label: "❓ مطمئن نیستم",                 value: "unsure" },
    ],
  },
  {
    id: "description", title: "📝 توضیحات",
    question: "توضیح مختصر این وعده را بنویسید:\n\n📌 چطور اجرا می‌کنید؟ از کجا تأمین مالی می‌شود؟\n\n💬 بنویسید:",
    type: "text", validation: "min_10",
  },
];

const TOTAL_PROMISE_FIELDS = PROMISE_FIELDS.length;

function _getCurrentTemp(user) {
  try { return JSON.parse(user.tempAnswers || "{}"); } catch { return {}; }
}
function _categoryLabel(v) {
  const m = { infrastructure: "عمران و زیرساخت", environment: "محیط زیست", economy: "اشتغال و اقتصاد", education: "آموزش و فرهنگ", health: "بهداشت", youth: "جوانان و ورزش", women: "بانوان", security: "امنیت", management: "مدیریتی" };
  return m[v] || v || "—";
}
function _priorityLabel(v) {
  const m = { first: "اولویت اول", second: "اولویت دوم", third: "اولویت سوم", longterm: "بلندمدت" };
  return m[v] || v || "—";
}
function _priorityEmoji(v) {
  return { first: "🔴", second: "🟠", third: "🟡", longterm: "🟢" }[v] || "⚪";
}
function _statusLabel(v) {
  const m = { pending: "در انتظار", inprogress: "در حال اجرا", done: "انجام شده", cancelled: "لغو شده" };
  return m[v] || v || "—";
}
function _statusEmoji(v) {
  return { pending: "📋", inprogress: "🔄", done: "✅", cancelled: "❌" }[v] || "📋";
}

function promiseFormKB(idx) {
  const field = PROMISE_FIELDS[idx];
  const kb    = new InlineKeyboard();
  if (field.type === "choice") {
    for (const opt of field.options) kb.text(opt.label, `promise_form:${idx}:${opt.value}`).row();
  }
  if (idx > 0) kb.text("⬅️ قبلی", `promise_form_back:${idx - 1}`);
  kb.text("❌ انصراف", "promises_menu").row();
  return kb;
}

function promiseProgress(idx) {
  const pct    = Math.round(((idx + 1) / TOTAL_PROMISE_FIELDS) * 100);
  const filled = Math.round(pct / 10);
  return `📋 وعده انتخاباتی: ${"🟢".repeat(filled)}${"⚪".repeat(10 - filled)} ${idx + 1}/${TOTAL_PROMISE_FIELDS}`;
}

async function handlePromisesMenu(ctx) {
  const userId   = String(ctx.from.id);
  const ok       = await requireAccess(ctx, "promises_basic");
  if (!ok) return;
  const user     = await getOrCreateUser(userId, ctx.from);
  let promises   = [];
  try { promises = _getCurrentTemp(user)._promises || []; } catch {}

  let t = "📋 *وعده‌های انتخاباتی*\n━━━━━━━━━━━━━━━━━━━\n\n";
  if (promises.length === 0) {
    t += "هنوز هیچ وعده‌ای ثبت نشده.\n\n📌 وعده‌های شفاف و قابل اجرا = اعتماد بیشتر مردم";
  } else {
    t += `📊 *${promises.length} وعده ثبت شده:*\n\n`;
    const firstP  = promises.filter(p => p.priority === "first");
    const secondP = promises.filter(p => p.priority === "second");
    const otherP  = promises.filter(p => !["first","second"].includes(p.priority));
    if (firstP.length)  { t += "🔴 *اولویت اول:*\n"; firstP.forEach(p  => { t += `• ${p.title}\n`; }); t += "\n"; }
    if (secondP.length) { t += "🟠 *اولویت دوم:*\n"; secondP.forEach(p => { t += `• ${p.title}\n`; }); t += "\n"; }
    if (otherP.length)  { t += "🟡 *سایر:*\n";       otherP.forEach(p  => { t += `• ${p.title}\n`; }); t += "\n"; }
  }

  const kb = new InlineKeyboard();
  kb.text("➕ ثبت وعده جدید", "promise_add").row();
  for (let i = 0; i < Math.min(promises.length, 5); i++) {
    kb.text(`${_priorityEmoji(promises[i].priority)} ${promises[i].title.substring(0,25)}`, `promise_view:${i}`).row();
  }
  if (promises.length > 5) kb.text(`📋 همه وعده‌ها (${promises.length})`, "promises_all").row();
  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();

  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); await ctx.answerCallbackQuery(); }
    else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handlePromiseAdd(ctx) {
  const userId = String(ctx.from.id);
  const ok     = await requireAccess(ctx, "promises_basic");
  if (!ok) return;
  const user   = await getOrCreateUser(userId, ctx.from);

  // اعمال محدودیت تعداد وعده‌ها بر اساس پلن (رایگان: ۳، راه‌اندازی: ۱۰، ...)
  let currentPromises = [];
  try { currentPromises = JSON.parse(user.tempAnswers || "{}")._promises || []; } catch {}
  if (!(await requireLimit(ctx, "promises", currentPromises.length))) return;

  const temp   = _getCurrentTemp(user);
  temp._promiseForm = {};
  await updateUser(userId, { currentStep: PROMISE_STEP_BASE, tempAnswers: JSON.stringify(temp) });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await ctx.reply("➕ *ثبت وعده انتخاباتی جدید*\n\n📌 وعده‌های شفاف، مشخص و قابل اجرا بیشترین تأثیر را دارند.\n\nشروع می‌کنیم 👇", { parse_mode: "Markdown" });
  await showPromiseFormStep(ctx, userId, 0);
}

async function showPromiseFormStep(ctx, userId, idx) {
  if (idx < 0 || idx >= TOTAL_PROMISE_FIELDS) return;
  const field = PROMISE_FIELDS[idx];
  await updateUser(userId, { currentStep: PROMISE_STEP_BASE + idx });
  const text = `${promiseProgress(idx)}\n\n*${field.title}*\n━━━━━━━━━━━━━━━━━━━\n\n${field.question}`;
  const kb   = promiseFormKB(idx);
  try {
    if (ctx.callbackQuery) await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    else await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handlePromiseFormAnswer(ctx, idx, value) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  const temp   = _getCurrentTemp(user);
  if (!temp._promiseForm) temp._promiseForm = {};
  const field  = PROMISE_FIELDS[idx];
  if (field) temp._promiseForm[field.id] = value;
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.answerCallbackQuery({ text: "✅ ثبت شد" });
  const next = idx + 1;
  if (next < TOTAL_PROMISE_FIELDS) await showPromiseFormStep(ctx, userId, next);
  else await savePromise(ctx, userId, temp);
}

async function handlePromiseTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  if (user.currentStep === null || user.currentStep === undefined || user.currentStep < PROMISE_STEP_BASE || user.currentStep >= PROMISE_STEP_BASE + TOTAL_PROMISE_FIELDS) return false;
  const idx   = user.currentStep - PROMISE_STEP_BASE;
  const field = PROMISE_FIELDS[idx];
  if (!field || field.type !== "text") return false;
  const input  = ctx.message.text.trim();
  const minMap = { min_10: 10, min_5: 5, min_2: 2 };
  const minLen = minMap[field.validation] || 0;
  if (input.length < minLen) { await ctx.reply(`❌ لطفاً حداقل *${minLen} کاراکتر* بنویسید.`, { parse_mode: "Markdown" }); return true; }
  const temp = _getCurrentTemp(user);
  if (!temp._promiseForm) temp._promiseForm = {};
  temp._promiseForm[field.id] = input;
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.reply(`✅ *${field.title}* ثبت شد.`, { parse_mode: "Markdown" });
  const next = idx + 1;
  if (next < TOTAL_PROMISE_FIELDS) await showPromiseFormStep(ctx, userId, next);
  else await savePromise(ctx, userId, temp);
  return true;
}

async function handlePromiseFormBack(ctx, idx) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showPromiseFormStep(ctx, userId, Math.max(0, idx));
}

async function savePromise(ctx, userId, temp) {
  const promiseData = { ...temp._promiseForm, id: Date.now(), status: "pending" };
  delete temp._promiseForm;
  if (!temp._promises) temp._promises = [];
  temp._promises.push(promiseData);
  await updateUser(userId, { currentStep: null, tempAnswers: JSON.stringify(temp) });

  let t = `✅ *وعده «${promiseData.title}» ثبت شد!*\n\n`;
  t += `🏷️ دسته: ${_categoryLabel(promiseData.category)}\n`;
  t += `${_priorityEmoji(promiseData.priority)} اولویت: ${_priorityLabel(promiseData.priority)}\n\n`;
  if (promiseData.feasibility === "unsure") t += "⚠️ *توجه:* قابلیت اجرا را با کارشناس بررسی کنید.\n\n";
  if (promiseData.feasibility === "approval") t += "📌 *یادآوری:* این وعده نیاز به تأیید سطوح بالاتر دارد.\n\n";

  const kb = new InlineKeyboard()
    .text("➕ ثبت وعده دیگر", "promise_add").row()
    .text("📋 مشاهده همه وعده‌ها", "promises_menu").row()
    .text("🔙 مدیریت کمپین", "campaign_menu").row();
  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handlePromiseView(ctx, promiseIndex) {
  const userId  = String(ctx.from.id);
  const user    = await getOrCreateUser(userId, ctx.from);
  let promises  = [];
  try { promises = _getCurrentTemp(user)._promises || []; } catch {}
  const promise = promises[promiseIndex];
  if (!promise) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ وعده یافت نشد" }); return; }

  let t = `📋 *${promise.title}*\n━━━━━━━━━━━━━━━━━━━\n\n`;
  t += `🏷️ دسته: ${_categoryLabel(promise.category)}\n`;
  t += `${_priorityEmoji(promise.priority)} اولویت: ${_priorityLabel(promise.priority)}\n`;
  t += `${_statusEmoji(promise.status)} وضعیت: ${_statusLabel(promise.status)}\n\n`;
  if (promise.description) t += `📝 توضیحات:\n${promise.description}\n`;

  const kb = new InlineKeyboard()
    .text("✅ علامت‌گذاری انجام‌شده", `promise_done:${promiseIndex}`).row()
    .text("🗑️ حذف", `promise_delete:${promiseIndex}`).row()
    .text("🔙 لیست وعده‌ها", "promises_menu").row();

  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); await ctx.answerCallbackQuery(); }
    else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handlePromiseDone(ctx, promiseIndex) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  const temp   = _getCurrentTemp(user);
  if (!temp._promises || !temp._promises[promiseIndex]) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }
  temp._promises[promiseIndex].status = "done";
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "✅ انجام‌شده علامت‌گذاری شد" });
  await handlePromisesMenu(ctx);
}

async function handlePromiseDelete(ctx, promiseIndex) {
  const userId  = String(ctx.from.id);
  const user    = await getOrCreateUser(userId, ctx.from);
  const temp    = _getCurrentTemp(user);
  if (!temp._promises) temp._promises = [];
  const promise = temp._promises[promiseIndex];
  if (!promise) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ یافت نشد" }); return; }
  temp._promises.splice(promiseIndex, 1);
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "✅ حذف شد" });
  await handlePromisesMenu(ctx);
}

module.exports = {
  handlePromisesMenu, handlePromiseAdd, handlePromiseFormAnswer,
  handlePromiseTextInput, handlePromiseFormBack, handlePromiseView,
  handlePromiseDone, handlePromiseDelete,
  PROMISE_STEP_BASE, TOTAL_PROMISE_FIELDS,
};
