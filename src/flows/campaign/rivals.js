// src/flows/campaign/rivals.js — CommonJS
// ─── مدیریت و تحلیل رقبا ───

const { InlineKeyboard } = require("grammy");
const { getOrCreateUser, updateUser } = require("../../utils/db.js");
const { requireAccess, requireLimit } = require("../../utils/access.js");

const RIVAL_STEP_BASE  = 800;

const RIVAL_FIELDS = [
  {
    id: "name", title: "👤 نام رقیب",
    question: "نام و نام خانوادگی رقیب را وارد کنید:",
    type: "text", validation: "min_2",
  },
  {
    id: "background", title: "📋 سابقه",
    question: "سابقه اجتماعی و سیاسی این رقیب چیست؟\n\n💬 مثال: «عضو شورای قبلی، معلم بازنشسته»",
    type: "text", validation: "min_3",
  },
  {
    id: "strength", title: "💪 نقطه قوت اصلی",
    question: "مهم‌ترین نقطه قوت این رقیب چیست؟",
    type: "choice",
    options: [
      { label: "🌟 شناخته‌شدگی و محبوبیت بالا", value: "recognition" },
      { label: "💰 بودجه و منابع مالی قوی",      value: "budget" },
      { label: "🤝 پشتیبانی سیاسی قوی",          value: "political" },
      { label: "📋 سابقه اجرایی موفق",            value: "experience" },
      { label: "👥 شبکه خانوادگی/قومی قوی",       value: "network" },
      { label: "🎓 تخصص و دانش برجسته",           value: "expertise" },
    ],
  },
  {
    id: "weakness", title: "⚠️ نقطه ضعف اصلی",
    question: "مهم‌ترین نقطه ضعف این رقیب چیست؟",
    type: "choice",
    options: [
      { label: "😶 ناشناخته در بخش‌هایی از حوزه", value: "unknown" },
      { label: "💸 بودجه محدود",                   value: "low_budget" },
      { label: "📉 سابقه ضعیف یا بد",              value: "bad_record" },
      { label: "🧑‍🤝‍🧑 ضعف در تیم‌سازی",               value: "weak_team" },
      { label: "🗣️ ضعف در سخنرانی و ارتباط",      value: "communication" },
      { label: "⚡ حواشی و اتهامات",                value: "controversies" },
    ],
  },
  {
    id: "voteBase", title: "🗳️ پایگاه رأی",
    question: "پایگاه رأی اصلی این رقیب کدام گروه است؟",
    type: "choice",
    options: [
      { label: "🕌 مذهبی‌ها و هیئتی‌ها", value: "religious" },
      { label: "🏪 اصناف و کسبه",         value: "business" },
      { label: "👦 جوانان",                value: "youth" },
      { label: "👩 بانوان",                value: "women" },
      { label: "👴 سالمندان",              value: "elderly" },
      { label: "👨‍👩‍👧 قومیت/خانواده خاص",  value: "ethnic" },
      { label: "🎓 تحصیل‌کردگان",          value: "educated" },
    ],
  },
  {
    id: "dangerLevel", title: "🔴 سطح خطر",
    question: "این رقیب چقدر برای شما خطرناک است؟",
    type: "choice",
    options: [
      { label: "🔴 خیلی خطرناک — رقیب اصلی من", value: "critical" },
      { label: "🟠 خطرناک — باید جدی بگیرم",     value: "high" },
      { label: "🟡 متوسط — قابل مدیریت",          value: "medium" },
      { label: "🟢 کم‌خطر",                        value: "low" },
    ],
  },
  {
    id: "strategy", title: "🎯 استراتژی مقابله",
    question: "استراتژی شما برای مقابله با این رقیب چیست؟\n\n💬 بنویسید:",
    type: "text", validation: "min_5",
  },
];

const TOTAL_RIVAL_FIELDS = RIVAL_FIELDS.length;

function rivalFormKB(idx) {
  const field = RIVAL_FIELDS[idx];
  const kb    = new InlineKeyboard();
  if (field.type === "choice") {
    for (const opt of field.options) {
      kb.text(opt.label, `rival_form:${idx}:${opt.value}`).row();
    }
  }
  if (idx > 0) kb.text("⬅️ قبلی", `rival_form_back:${idx - 1}`);
  kb.text("❌ انصراف", "rivals_menu").row();
  return kb;
}

function rivalProgress(idx) {
  const pct    = Math.round(((idx + 1) / TOTAL_RIVAL_FIELDS) * 100);
  const filled = Math.round(pct / 10);
  return `⚔️ اطلاعات رقیب: ${"🟢".repeat(filled)}${"⚪".repeat(10 - filled)} ${idx + 1}/${TOTAL_RIVAL_FIELDS}`;
}

function _getCurrentTemp(user) {
  try { return JSON.parse(user.tempAnswers || "{}"); } catch { return {}; }
}

function _strengthLabel(v) {
  const m = { recognition: "شناخته‌شدگی بالا", budget: "منابع مالی قوی", political: "پشتیبانی سیاسی", experience: "سابقه اجرایی", network: "شبکه خانوادگی/قومی", expertise: "تخصص برجسته" };
  return m[v] || v || "—";
}
function _weaknessLabel(v) {
  const m = { unknown: "ناشناخته در بخش‌هایی", low_budget: "بودجه محدود", bad_record: "سابقه ضعیف", weak_team: "تیم ضعیف", communication: "ضعف ارتباطی", controversies: "حواشی و اتهامات" };
  return m[v] || v || "—";
}
function _voteBaseLabel(v) {
  const m = { religious: "مذهبی‌ها", business: "اصناف", youth: "جوانان", women: "بانوان", elderly: "سالمندان", ethnic: "قومیت/خانواده", educated: "تحصیل‌کردگان" };
  return m[v] || v || "—";
}
function _dangerLabel(v) {
  const m = { critical: "خیلی خطرناک", high: "خطرناک", medium: "متوسط", low: "کم‌خطر" };
  return m[v] || v || "—";
}

async function handleRivalsMenu(ctx) {
  const userId = String(ctx.from.id);
  const ok     = await requireAccess(ctx, "rivals_basic");
  if (!ok) return;

  const user = await getOrCreateUser(userId, ctx.from);
  let rivals = [];
  try { rivals = JSON.parse(user.tempAnswers || "{}")._rivals || []; } catch {}

  let t = "⚔️ *تحلیل و رصد سیستماتیک رقبا*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  t += "در این بخش می‌توانید اطلاعات رقبای احتمالی یا قطعی خود را ثبت کنید تا سیستم با مقایسه‌ی پایگاه‌های رأی و نقاط قوت/ضعف، *گروه‌های رأی‌دهنده‌ی مغفول‌مانده و خلأهای استراتژیک رقبا* را برایتان مشخص کند.\n\n";

  if (rivals.length === 0) {
    t += "✅ *هنوز هیچ رقیبی ثبت نشده است.*\n\n";
    t += "📌 برای ثبت اولین رقیب، روی دکمه‌ی «افزودن رقیب جدید» کلیک کنید.";
  } else {
    t += `📊 *${rivals.length} رقیب ثبت شده:*\n\n`;
    for (const r of rivals) {
      const de = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[r.dangerLevel] || "⚪";
      t += `${de} *${r.name}*\n   💪 ${_strengthLabel(r.strength)} | ⚠️ ${_weaknessLabel(r.weakness)}\n\n`;
    }
  }

  const kb = new InlineKeyboard();
  kb.text("➕ افزودن رقیب جدید", "rival_add").row();
  for (let i = 0; i < Math.min(rivals.length, 5); i++) {
    kb.text(`⚔️ ${rivals[i].name}`, `rival_view:${i}`).row();
  }
  if (rivals.length >= 2) kb.text("📊 تحلیل مقایسه‌ای", "rivals_compare").row();
  kb.text("🔙 مدیریت کمپین", "campaign_menu").row();

  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); await ctx.answerCallbackQuery(); }
    else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handleRivalAdd(ctx) {
  const userId = String(ctx.from.id);
  const ok     = await requireAccess(ctx, "rivals_basic");
  if (!ok) return;

  const user = await getOrCreateUser(userId, ctx.from);

  // اعمال محدودیت تعداد رقبا بر اساس پلن (رایگان: ۱، راه‌اندازی: ۳، ...)
  let currentRivals = [];
  try { currentRivals = JSON.parse(user.tempAnswers || "{}")._rivals || []; } catch {}
  if (!(await requireLimit(ctx, "rivals", currentRivals.length))) return;

  const temp = _getCurrentTemp(user);
  temp._rivalForm = {};

  await updateUser(userId, { currentStep: RIVAL_STEP_BASE, tempAnswers: JSON.stringify(temp) });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  await ctx.reply("➕ *افزودن رقیب جدید*\n\nاطلاعات رقیب را وارد کنید.\n\nشروع می‌کنیم 👇", { parse_mode: "Markdown" });
  await showRivalFormStep(ctx, userId, 0);
}

async function showRivalFormStep(ctx, userId, idx) {
  if (idx < 0 || idx >= TOTAL_RIVAL_FIELDS) return;
  const field = RIVAL_FIELDS[idx];
  await updateUser(userId, { currentStep: RIVAL_STEP_BASE + idx });
  let text = `${rivalProgress(idx)}\n\n*${field.title}*\n━━━━━━━━━━━━━━━━━━━\n\n${field.question}`;
  const kb  = rivalFormKB(idx);
  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb }); }
    else await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handleRivalFormAnswer(ctx, idx, value) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  const temp   = _getCurrentTemp(user);
  if (!temp._rivalForm) temp._rivalForm = {};
  const field  = RIVAL_FIELDS[idx];
  if (field) temp._rivalForm[field.id] = value;
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.answerCallbackQuery({ text: "✅ ثبت شد" });
  const next = idx + 1;
  if (next < TOTAL_RIVAL_FIELDS) await showRivalFormStep(ctx, userId, next);
  else await saveRival(ctx, userId, temp);
}

async function handleRivalTextInput(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  if (user.currentStep === null || user.currentStep === undefined || user.currentStep < RIVAL_STEP_BASE || user.currentStep >= RIVAL_STEP_BASE + TOTAL_RIVAL_FIELDS) return false;
  const idx   = user.currentStep - RIVAL_STEP_BASE;
  const field = RIVAL_FIELDS[idx];
  if (!field || field.type !== "text") return false;
  const input  = ctx.message.text.trim();
  const minMap = { min_5: 5, min_3: 3, min_2: 2 };
  const minLen = minMap[field.validation] || 0;
  if (input.length < minLen) { await ctx.reply(`❌ لطفاً حداقل *${minLen} کاراکتر* بنویسید.`, { parse_mode: "Markdown" }); return true; }
  const temp = _getCurrentTemp(user);
  if (!temp._rivalForm) temp._rivalForm = {};
  temp._rivalForm[field.id] = input;
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  await ctx.reply(`✅ *${field.title}* ثبت شد.`, { parse_mode: "Markdown" });
  const next = idx + 1;
  if (next < TOTAL_RIVAL_FIELDS) await showRivalFormStep(ctx, userId, next);
  else await saveRival(ctx, userId, temp);
  return true;
}

async function handleRivalFormBack(ctx, idx) {
  const userId = String(ctx.from.id);
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await showRivalFormStep(ctx, userId, Math.max(0, idx));
}

async function saveRival(ctx, userId, temp) {
  const rivalData = { ...temp._rivalForm, id: Date.now() };
  delete temp._rivalForm;
  if (!temp._rivals) temp._rivals = [];
  temp._rivals.push(rivalData);
  await updateUser(userId, { currentStep: null, tempAnswers: JSON.stringify(temp) });

  let t = `✅ *رقیب «${rivalData.name}» با موفقیت ثبت شد!*\n\n`;
  t += `💪 قوت: ${_strengthLabel(rivalData.strength)}\n`;
  t += `⚠️ ضعف: ${_weaknessLabel(rivalData.weakness)}\n`;
  t += `🗳️ پایگاه رأی: ${_voteBaseLabel(rivalData.voteBase)}\n\n`;
  if (rivalData.strategy) t += `🎯 *استراتژی شما:*\n${rivalData.strategy}\n\n`;

  t += "─── 💡 *توصیه استراتژیک* ───\n\n";
  if (rivalData.weakness === "unknown") t += "• رقیب در بخش‌هایی ناشناخته است — آن مناطق را هدف بگیرید.\n";
  if (rivalData.weakness === "communication") t += "• ضعف ارتباطی رقیب فرصت است — سخنرانی خود را تقویت کنید.\n";
  if (rivalData.dangerLevel === "critical") t += "• رقیب اصلی — روی تمایز پیام تمرکز کنید، حمله مستقیم نکنید.\n";

  const kb = new InlineKeyboard().text("➕ افزودن رقیب دیگر", "rival_add").row().text("📊 مشاهده همه رقبا", "rivals_menu").row().text("🔙 مدیریت کمپین", "campaign_menu").row();
  await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
}

async function handleRivalView(ctx, rivalIndex) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  let rivals   = [];
  try { rivals = JSON.parse(user.tempAnswers || "{}")._rivals || []; } catch {}
  const rival  = rivals[rivalIndex];
  if (!rival) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ رقیب یافت نشد" }); return; }

  const de = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[rival.dangerLevel] || "⚪";
  let t  = `⚔️ *پروفایل رقیب: ${rival.name}*\n━━━━━━━━━━━━━━━━━━━\n\n`;
  t += `${de} سطح خطر: ${_dangerLabel(rival.dangerLevel)}\n`;
  if (rival.background) t += `📋 سابقه: ${rival.background}\n`;
  t += `💪 نقطه قوت: ${_strengthLabel(rival.strength)}\n`;
  t += `⚠️ نقطه ضعف: ${_weaknessLabel(rival.weakness)}\n`;
  t += `🗳️ پایگاه رأی: ${_voteBaseLabel(rival.voteBase)}\n`;
  if (rival.strategy) t += `\n🎯 *استراتژی مقابله:*\n${rival.strategy}\n`;

  const kb = new InlineKeyboard().text("🗑️ حذف این رقیب", `rival_delete:${rivalIndex}`).row().text("🔙 لیست رقبا", "rivals_menu").row();
  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); await ctx.answerCallbackQuery(); }
    else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

async function handleRivalDelete(ctx, rivalIndex) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  const temp   = _getCurrentTemp(user);
  if (!temp._rivals) temp._rivals = [];
  const rival  = temp._rivals[rivalIndex];
  if (!rival) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "❌ رقیب یافت نشد" }); return; }
  temp._rivals.splice(rivalIndex, 1);
  await updateUser(userId, { tempAnswers: JSON.stringify(temp) });
  if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: `✅ ${rival.name} حذف شد` });
  await handleRivalsMenu(ctx);
}

async function handleRivalsCompare(ctx) {
  const userId = String(ctx.from.id);
  const user   = await getOrCreateUser(userId, ctx.from);
  let rivals   = [];
  try { rivals = JSON.parse(user.tempAnswers || "{}")._rivals || []; } catch {}
  if (rivals.length < 2) { if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "⚠️ حداقل ۲ رقیب لازم است", show_alert: true }); return; }

  let t = "📊 *تحلیل مقایسه‌ای رقبا*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  for (const r of rivals) {
    const de = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[r.dangerLevel] || "⚪";
    t += `${de} *${r.name}*\n  💪 ${_strengthLabel(r.strength)}\n  ⚠️ ${_weaknessLabel(r.weakness)}\n  🗳️ ${_voteBaseLabel(r.voteBase)}\n\n`;
  }

  const covered  = rivals.map(r => r.voteBase);
  const allBases = ["religious", "business", "youth", "women", "elderly", "ethnic", "educated"];
  const open     = allBases.filter(b => !covered.includes(b));
  const bLabels  = { religious: "مذهبی‌ها", business: "اصناف", youth: "جوانان", women: "بانوان", elderly: "سالمندان", ethnic: "قومیت", educated: "تحصیل‌کردگان" };
  if (open.length > 0) {
    t += "─── 🚀 *گروه‌های رأی‌دهنده خالی* ───\n\n";
    for (const b of open.slice(0, 4)) t += `• ${bLabels[b]} — هیچ رقیبی هدف نگرفته ✅\n`;
  }

  const kb = new InlineKeyboard().text("➕ افزودن رقیب", "rival_add").row().text("🔙 لیست رقبا", "rivals_menu").row();
  try {
    if (ctx.callbackQuery) { await ctx.editMessageText(t, { parse_mode: "Markdown", reply_markup: kb }); await ctx.answerCallbackQuery(); }
    else await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb });
  } catch { await ctx.reply(t, { parse_mode: "Markdown", reply_markup: kb }); }
}

module.exports = {
  handleRivalsMenu, handleRivalAdd, handleRivalFormAnswer, handleRivalTextInput,
  handleRivalFormBack, handleRivalView, handleRivalDelete, handleRivalsCompare,
  RIVAL_STEP_BASE, TOTAL_RIVAL_FIELDS,
};
