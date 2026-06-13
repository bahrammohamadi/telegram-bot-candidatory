// src/flows/campaign/crisis.js — CommonJS
// ─── مدیریت بحران انتخاباتی ───

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser, updateUser } = require("../../utils/db.js");
const { requireAccess } = require("../../utils/access.js");

const CRISIS_STEP_BASE  = 900;

const CRISIS_FIELDS = [
  {
    id: "title", title: "🚨 عنوان بحران",
    question: "عنوان کوتاه بحران را بنویسید:\n\n📌 مثال: «شایعه فساد مالی»، «ویدیوی تحریف‌شده»\n\n💬 بنویسید:",
    type: "text", validation: "min_5",
  },
  {
    id: "type", title: "📋 نوع بحران",
    question: "این بحران از چه نوعی است؟",
    type: "choice",
    options: [
      { label: "📰 شایعه یا اتهام بی‌سند",      value: "rumor" },
      { label: "🎥 ویدیو یا محتوای تحریف‌شده",   value: "fake_content" },
      { label: "⚔️ حمله مستقیم از رقیب",          value: "rival_attack" },
      { label: "📱 حمله رسانه‌ای یا فضای مجازی", value: "media_attack" },
      { label: "👥 اختلاف داخلی در تیم",          value: "internal" },
      { label: "⚡ اشتباه شخصی یا لغزش کلامی",   value: "own_mistake" },
      { label: "📋 اتهام حقوقی",                  value: "legal" },
    ],
  },
  {
    id: "urgency", title: "⏰ فوریت",
    question: "این بحران چقدر فوری است؟",
    type: "choice",
    options: [
      { label: "🔴 بحرانی — باید همین الان اقدام کنم", value: "critical" },
      { label: "🟠 بالا — باید امروز اقدام کنم",       value: "high" },
      { label: "🟡 متوسط — ظرف ۲۴ ساعت",              value: "medium" },
      { label: "🟢 کم — می‌توانم صبر کنم",             value: "low" },
    ],
  },
  {
    id: "spread", title: "📡 میزان انتشار",
    question: "این بحران تا چه حد منتشر شده؟",
    type: "choice",
    options: [
      { label: "🌐 در همه جا — ویروسی شده",         value: "viral" },
      { label: "📱 در گروه‌های محلی تلگرام",         value: "local_groups" },
      { label: "👥 در بین عده‌ای از مردم",           value: "limited" },
      { label: "🔒 هنوز محدود است — پیشگیرانه",      value: "contained" },
    ],
  },
  {
    id: "description", title: "📝 توضیح بحران",
    question: "بحران را با جزئیات توضیح دهید:\n\n📌 چه اتفاقی افتاده؟ چه کسی شروع کرده؟ محتوا چیست؟\n\n💬 بنویسید:",
    type: "text", validation: "min_15",
  },
  {
    id: "hasEvidence", title: "📁 آیا مدرک دارید؟",
    question: "آیا مدرک یا سند برای رد این بحران دارید؟",
    type: "choice",
    options: [
      { label: "✅ بله — مدرک مستحکم دارم",   value: "strong" },
      { label: "🔶 بله — مدرک نسبی دارم",     value: "partial" },
      { label: "❌ خیر — مدرکی ندارم",         value: "none" },
      { label: "⏳ در حال جمع‌آوری مدرک هستم", value: "gathering" },
    ],
  },
];

const TOTAL_CRISIS_FIELDS = CRISIS_FIELDS.length;

function _getCurrentTemp(user) {
  try { return JSON.parse(user.tempAnswers || "{}"); } catch { return {}; }
}

function _urgencyLabel(v) {
  const m = { critical: "بحرانی", high: "بالا", medium: "متوسط", low: "کم" };
  return m[v] || v || "—";
}
function _urgencyEmoji(v) {
  return { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[v] || "⚪";
}
function _typeLabel(v) {
  const m = { rumor: "شایعه/اتهام", fake_content: "محتوای تحریف‌شده", rival_attack: "حمله رقیب", media_attack: "حمله رسانه‌ای", internal: "اختلاف داخلی", own_mistake: "اشتباه شخصی", legal: "اتهام حقوقی" };
  return m[v] || v || "—";
}

function crisisFormKB(idx) {
  const field = CRISIS_FIELDS[idx];
  const kb    = new InlineKeyboard();
  if (field.type === "choice") {
    for (const opt of field.options) kb.text(opt.label, `crisis_form:${idx}:${opt.value}`).row();
  }
  if (idx > 0) kb.text("⬅️ قبلی", `crisis_form_back:${idx - 1}`);
  kb.text("❌ انصراف", "crisis_menu").row();
  return kb;
}

function crisisProgress(idx) {
  const pct    = Math.round(((idx + 1) / TOTAL_CRISIS_FIELDS) * 100);
  const filled = Math.round(pct / 10);
  return `🚨 ثبت بحران: ${"🟢".repeat(filled)}${"⚪".repeat(10 - filled)} ${idx + 1}/${TOTAL_CRISIS_FIELDS}`;
}

// ═══════════════════════════════════════════
// منوی بحران
// ═══════════════════════════════════════════
async function handleCrisisMenu(ctx) {
  const userId = String(ctx.from.id);
  const ok     = await requireAccess(ctx, "crisis_management");
  if (!ok) return;

  const user   = await getOrCreateUser(userId, ctx.from);
  let crises   = [];
  try { crises = _getCurrentTemp(user)._crises || []; } catch {}

  let t = "🛡️ *مدیریت بحران انتخاباتی*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "در این بخش می‌توانید شایعات، حملات تخریبی یا بحران‌های کمپین خود را ثبت کنید تا سیستم بر اساس نوع و فوریت آن، *پروتکل علمی و استراتژی واکنش سریع* را در اختیارتان قرار دهد.\n\n";

  if (crises.length === 0) {
    t += "✅ *هیچ بحران فعالی ثبت نشده است.*\n\n";
    t += "📌 برای ثبت اولین بحران، روی دکمه‌ی «ثبت بحران جدید» کلیک کنید.";
  } else {
    const active = crises.filter(c => c.status !== "resolved");
    t += active.length > 0
      ? `⚠️ *${active.length} بحران فعال:*\n\n`
      : "✅ همه بحران‌ها حل شده‌اند.\n\n";

    for (const c of active.slice(0, 5)) {
      t += `${_urgencyEmoji(c.urgency)} *${c.title}*\n`;
      t += `   نوع: ${_typeLabel(c.type)} | فوریت: ${_urgencyLabel(c.urgency)}\n\n`;
    }
  }

  const kb = new InlineKeyboard();
  kb.text("🚨 ثبت بحران جدید", "crisis_add").row();
  const active = crises.filter(c => c.status !== "resolved");
  for (let i = 0; i < Math.min(active.length, 3); i++) {
    kb.text(`${_urgencyEmoji(active[i].urgency)} ${active[i].title.substring(0, 25)}`, `crisis_view:${i}`).row();
  }
  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();

  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); await ctx.answerCallbackQuery(); }
    else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

// ═══════════════════════════════════════════
// شروع ثبت بحران
// ═══════════════════════════════════════════
async function handleCrisisAdd(ctx) {
  const userId = String(ctx.from.id);
  const ok     = await requireAccess(ctx, "crisis_management");
  if (!ok) return;

  const user = await getOrCreateUser(userId, ctx.from);
  const temp = _getCurrentTemp(user);
  temp._crisisForm = {};

  await updateUser(userId, { currentStep: CRISIS_STEP_BASE, tempAnswers: JSON.stringify(temp) });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  await ctx.reply(
    "🚨 *ثبت بحران جدید*\n\n" +
    "اطلاعات بحران را وارد کنید تا استراتژی مقابله تحلیل شود.\n\nشروع می‌کنیم 👇",
    { parse_mode: "Markdown" }
  );
  await showCrisisFormStep(ctx, userId, 0);
}

async function showCrisisFormStep(ctx, userId, idx) {
  if (idx < 0 || idx >= TOTAL_CRISIS_FIELDS) return;
  const field = CRISIS_FIELDS[idx];
  await updateUser(userId, { currentStep: CRISIS_STEP_BASE + idx });
  const text = `${crisisProgress(idx)}\n\n*${field.title}*\n━━━━━━━━━━━━━━━━━━━\n\n${field.question}`;
  const kb   = crisisFormKB(idx);
  try {
    if (ctx.callbackQuery) await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    else await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handleCrisisFormAnswer(ctx, idx, value) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  const temp   = _getCurrentTemp(user);
  if (!temp._crisisForm) temp._crisisForm = {};
  const field  = CRISIS_FIELDS[idx];
  if (field) temp._crisisForm[field.id] = value;
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.answerCallbackQuery({ text: "✅ ثبت شد" });
  const next = idx + 1;
  if (next < TOTAL_CRISIS_FIELDS) await showCrisisFormStep(ctx, userId, next);
  else await saveCrisis(ctx, userId, temp);
}

async function handleCrisisTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  if (user.currentStep === null || user.currentStep === undefined || user.currentStep < CRISIS_STEP_BASE || user.currentStep >= CRISIS_STEP_BASE + TOTAL_CRISIS_FIELDS) return false;
  const idx   = user.currentStep - CRISIS_STEP_BASE;
  const field = CRISIS_FIELDS[idx];
  if (!field || field.type !== "text") return false;
  const input  = ctx.message.text.trim();
  const minMap = { min_15: 15, min_10: 10, min_5: 5 };
  const minLen = minMap[field.validation] || 0;
  if (input.length < minLen) { await ctx.reply(`❌ لطفاً حداقل *${minLen} کاراکتر* بنویسید.`, { parse_mode: "Markdown" }); return true; }
  const temp = _getCurrentTemp(user);
  if (!temp._crisisForm) temp._crisisForm = {};
  temp._crisisForm[field.id] = input;
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.reply(`✅ *${field.title}* ثبت شد.`, { parse_mode: "Markdown" });
  const next = idx + 1;
  if (next < TOTAL_CRISIS_FIELDS) await showCrisisFormStep(ctx, userId, next);
  else await saveCrisis(ctx, userId, temp);
  return true;
}

async function handleCrisisFormBack(ctx, idx) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showCrisisFormStep(ctx, userId, Math.max(0, idx));
}

// ═══════════════════════════════════════════
// ذخیره بحران + تولید استراتژی
// ═══════════════════════════════════════════
async function saveCrisis(ctx, userId, temp) {
  const crisisData = { ...temp._crisisForm, id: Date.now(), status: "active", createdAt: new Date().toISOString() };
  delete temp._crisisForm;
  if (!temp._crises) temp._crises = [];
  temp._crises.push(crisisData);
  await updateUser(userId, { currentStep: null, tempAnswers: JSON.stringify(temp) });

  // تولید استراتژی مقابله
  let t = `🛡️ *بحران «${crisisData.title}» ثبت شد*\n`;
  t += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += `${_urgencyEmoji(crisisData.urgency)} فوریت: ${_urgencyLabel(crisisData.urgency)}\n`;
  t += `📋 نوع: ${_typeLabel(crisisData.type)}\n\n`;

  t += "─── 🎯 *استراتژی پیشنهادی* ───\n\n";

  // استراتژی بر اساس نوع بحران
  switch (crisisData.type) {
    case "rumor":
      t += "1. *سکوت ممنوع* — ظرف ۲–۴ ساعت واکنش نشان دهید\n";
      t += "2. از یک *معتمد محلی* بخواهید تکذیب کند\n";
      t += "3. یک *پاسخ مستند و آرام* منتشر کنید\n";
      t += "4. بعد از پاسخ، سریع به *پیام اصلی* برگردید\n";
      break;
    case "fake_content":
      t += "1. *ویدیو/محتوای اصلی* را منتشر کنید\n";
      t += "2. زمینه و *توضیح کامل* را بدهید\n";
      t += "3. از *حمله متقابل* خودداری کنید\n";
      t += "4. در صورت لزوم *شکایت حقوقی* کنید\n";
      break;
    case "rival_attack":
      t += "1. *عصبانی نشوید* — خونسردی مزیت است\n";
      t += "2. با *آمار و مدرک* پاسخ دهید\n";
      t += "3. *حمله را به فرصت* تبدیل کنید\n";
      t += "4. موضوع را به *برنامه‌هایتان* منتقل کنید\n";
      break;
    case "own_mistake":
      t += "1. *اعتراف صادقانه* — انکار ممنوع\n";
      t += "2. *عذرخواهی صریح* اگر لازم است\n";
      t += "3. *اقدام اصلاحی* مشخص اعلام کنید\n";
      t += "4. *پیش بروید* — طولانی نکنید\n";
      break;
    case "media_attack":
      t += "1. *رصد مستمر* — ببینید چه می‌گویند\n";
      t += "2. *پاسخ رسمی کوتاه* و مستند\n";
      t += "3. از *حامیان* بخواهید کمک کنند\n";
      t += "4. *کانال‌های مستقیم* خود را فعال کنید\n";
      break;
    default:
      t += "1. وضعیت را *رصد* کنید\n";
      t += "2. *تیم بحران* را جمع کنید\n";
      t += "3. *پاسخ مدون* آماده کنید\n";
      t += "4. *آرام و مستند* واکنش نشان دهید\n";
  }

  t += "\n";

  // هشدار مدرک
  if (crisisData.hasEvidence === "none") {
    t += "⚠️ *هشدار:* بدون مدرک، پاسخ‌تان را ضعیف‌تر ارائه دهید و روی اعتبار شخصی تمرکز کنید.\n\n";
  }

  // اولویت بر اساس فوریت
  if (crisisData.urgency === "critical") {
    t += "🔴 *فوری:* همین الان با تیم خود مشورت کنید و در ۲ ساعت آینده اقدام کنید!\n";
  }

  const newIndex = temp._crises.length - 1;
  const kb = new InlineKeyboard()
    .text("✅ بحران حل شد", `crisis_resolve:${newIndex}`).row()
    .text("📋 لیست بحران‌ها", "crisis_menu").row()
    .text("🔙 مدیریت کمپین", "campaign_menu").row();

  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleCrisisView(ctx, crisisIndex) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  let crises   = [];
  try { crises = _getCurrentTemp(user)._crises || []; } catch {}
  const crisis = crises.filter(c => c.status !== "resolved")[crisisIndex];
  if (!crisis) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ بحران یافت نشد" }); return; }

  let t = `🚨 *${crisis.title}*\n━━━━━━━━━━━━━━━━━━━\n\n`;
  t += `${_urgencyEmoji(crisis.urgency)} فوریت: ${_urgencyLabel(crisis.urgency)}\n`;
  t += `📋 نوع: ${_typeLabel(crisis.type)}\n\n`;
  if (crisis.description) t += `📝 توضیحات:\n${crisis.description}\n`;

  const realIndex = crises.findIndex(c => c.id === crisis.id);
  const kb = new InlineKeyboard()
    .text("✅ بحران حل شد", `crisis_resolve:${realIndex}`).row()
    .text("🔙 لیست بحران‌ها", "crisis_menu").row();

  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); await ctx.answerCallbackQuery(); }
    else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handleCrisisResolve(ctx, crisisIndex) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  const temp   = _getCurrentTemp(user);
  if (!temp._crises || !temp._crises[crisisIndex]) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ یافت نشد" });
    return;
  }
  temp._crises[crisisIndex].status     = "resolved";
  temp._crises[crisisIndex].resolvedAt = new Date().toISOString();
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "✅ بحران حل‌شده علامت‌گذاری شد" });
  await handleCrisisMenu(ctx);
}

module.exports = {
  handleCrisisMenu,
  handleCrisisAdd,
  handleCrisisFormAnswer,
  handleCrisisTextInput,
  handleCrisisFormBack,
  handleCrisisView,
  handleCrisisResolve,
  CRISIS_STEP_BASE,
  TOTAL_CRISIS_FIELDS,
};
