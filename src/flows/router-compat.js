// src/flows/router-compat.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// لایه‌ی سازگاری روتر (Compatibility Router)
// ═══════════════════════════════════════════════════════════════
// چرا این فایل لازم است؟
//   main.js (نسل جدید) انتظار دارد هر فلو یک تابع روترِ یکپارچه مثل
//   handleRivalsCallback / handlePromisesCallback / handleSwotCallback
//   داشته باشد و callbackهای با namespace (مثل rivals:menu) بزند.
//   اما فلوهای rivals/promises/crisis/swot/onboarding/dashboard با نسل
//   قدیمیِ callback نوشته شده‌اند (مثل rival_add, swot_ans:..,, prf:..).
//   نتیجه: کلیک روی این دکمه‌ها به fallback «در حال توسعه» می‌رسید و
//   بخش‌های کمپین/پروفایل/SWOT عملاً «خالی/خراب» به‌نظر می‌رسیدند.
//
//   این ماژول همه‌ی آن callbackهای قدیمی را به توابع واقعیِ هر فلو
//   وصل می‌کند، بدون دستکاری خود فلوها (کم‌ریسک‌ترین راه).
//
// نحوه‌ی استفاده در main.js:
//   const { registerCompatRoutes } = require("./flows/router-compat.js");
//   registerCompatRoutes(bot, { onboarding, swot, rivals, promises, crisis,
//                               dashboard, educational, contact });
// ═══════════════════════════════════════════════════════════════

function num(x, def = 0) {
  const n = parseInt(x, 10);
  return Number.isFinite(n) ? n : def;
}

// کمکیِ امن برای صدا زدن تابعی که شاید وجود نداشته باشد
function call(fn, ...args) {
  if (typeof fn === "function") return fn(...args);
  return undefined;
}

function registerCompatRoutes(bot, flows) {
  const {
    onboarding = {},
    swot = {},
    rivals = {},
    promises = {},
    crisis = {},
    dashboard = {},
    educational = {},
  } = flows;

  // ─────────────────────────────────────────────────────────────
  // آموزش — منوی اصلی دکمه‌ی "edu_list" می‌زند ولی فلو "edu:list"
  // می‌شناسد. هر دو را به handleShowEducationList وصل می‌کنیم.
  // ─────────────────────────────────────────────────────────────
  ["edu_list", "education_list", "show_edu"].forEach((cb) =>
    bot.callbackQuery(cb, async (ctx) => call(educational.handleShowEducationList, ctx, 0))
  );

  // ─────────────────────────────────────────────────────────────
  // پروفایل کاندیدا (onboarding)
  // ─────────────────────────────────────────────────────────────
  ["profile_menu", "candidate_profile"].forEach((cb) =>
    bot.callbackQuery(cb, async (ctx) => call(onboarding.handleProfileMenu, ctx))
  );
  bot.callbackQuery("profile_create", async (ctx) => call(onboarding.handleProfileCreate, ctx));
  bot.callbackQuery("profile_edit",   async (ctx) => call(onboarding.handleProfileEdit, ctx));
  bot.callbackQuery("profile_view",   async (ctx) => call(onboarding.handleProfileView, ctx));
  // prf:IDX:VALUE  → پاسخ به فیلد
  bot.callbackQuery(/^prf:(\d+):(.+)$/, async (ctx) => {
    const [, idx, value] = ctx.match;
    return call(onboarding.handleProfileAnswer, ctx, num(idx), value);
  });
  bot.callbackQuery(/^prf_skip:(\d+)$/, async (ctx) =>
    call(onboarding.handleProfileSkip, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^prf_back:(-?\d+)$/, async (ctx) =>
    call(onboarding.handleProfileBack, ctx, num(ctx.match[1]))
  );

  // ─────────────────────────────────────────────────────────────
  // داشبورد
  // ─────────────────────────────────────────────────────────────
  ["campaign_dashboard", "dashboard_view"].forEach((cb) =>
    bot.callbackQuery(cb, async (ctx) => call(dashboard.handleDashboard, ctx))
  );

  // ─────────────────────────────────────────────────────────────
  // SWOT — دکمه‌ها: swot_analysis, swot_ans:IDX:VAL, swot_skip:IDX,
  //                swot_back:IDX, swot_complete
  // ─────────────────────────────────────────────────────────────
  ["swot_analysis", "start_swot", "analysis_swot"].forEach((cb) =>
    bot.callbackQuery(cb, async (ctx) => call(swot.handleSwotAnalysis, ctx))
  );
  bot.callbackQuery(/^swot_ans:(\d+):(.+)$/, async (ctx) => {
    const [, idx, value] = ctx.match;
    return call(swot.handleSwotAnswer, ctx, num(idx), value);
  });
  bot.callbackQuery(/^swot_skip:(\d+)$/, async (ctx) =>
    call(swot.handleSwotSkip, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^swot_back:(-?\d+)$/, async (ctx) =>
    call(swot.handleSwotBack, ctx, num(ctx.match[1]))
  );

  // ─────────────────────────────────────────────────────────────
  // رقبا — rivals_menu, rival_add, rival_form:IDX:VAL,
  //         rival_form_back:IDX, rival_view:I, rival_delete:I, rivals_compare
  // ─────────────────────────────────────────────────────────────
  ["rivals_menu", "show_rivals"].forEach((cb) =>
    bot.callbackQuery(cb, async (ctx) => call(rivals.handleRivalsMenu, ctx))
  );
  bot.callbackQuery("rival_add", async (ctx) => call(rivals.handleRivalAdd, ctx));
  bot.callbackQuery(/^rival_form:(\d+):(.+)$/, async (ctx) => {
    const [, idx, value] = ctx.match;
    return call(rivals.handleRivalFormAnswer, ctx, num(idx), value);
  });
  bot.callbackQuery(/^rival_form_back:(-?\d+)$/, async (ctx) =>
    call(rivals.handleRivalFormBack, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^rival_view:(\d+)$/, async (ctx) =>
    call(rivals.handleRivalView, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^rival_delete:(\d+)$/, async (ctx) =>
    call(rivals.handleRivalDelete, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery("rivals_compare", async (ctx) => call(rivals.handleRivalsCompare, ctx));

  // ─────────────────────────────────────────────────────────────
  // وعده‌ها — promises_menu, promise_add, promise_form:IDX:VAL,
  //           promise_form_back:IDX, promise_view:I, promise_done:I,
  //           promise_delete:I, promises_all
  // ─────────────────────────────────────────────────────────────
  ["promises_menu", "show_promises"].forEach((cb) =>
    bot.callbackQuery(cb, async (ctx) => call(promises.handlePromisesMenu, ctx))
  );
  bot.callbackQuery("promise_add", async (ctx) => call(promises.handlePromiseAdd, ctx));
  bot.callbackQuery(/^promise_form:(\d+):(.+)$/, async (ctx) => {
    const [, idx, value] = ctx.match;
    return call(promises.handlePromiseFormAnswer, ctx, num(idx), value);
  });
  bot.callbackQuery(/^promise_form_back:(-?\d+)$/, async (ctx) =>
    call(promises.handlePromiseFormBack, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^promise_view:(\d+)$/, async (ctx) =>
    call(promises.handlePromiseView, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^promise_done:(\d+)$/, async (ctx) =>
    call(promises.handlePromiseDone, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^promise_delete:(\d+)$/, async (ctx) =>
    call(promises.handlePromiseDelete, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery("promises_all", async (ctx) => call(promises.handlePromisesMenu, ctx));

  // ─────────────────────────────────────────────────────────────
  // بحران — crisis_menu, crisis_add, crisis_form:IDX:VAL,
  //         crisis_form_back:IDX, crisis_view:I, crisis_resolve:I
  // ─────────────────────────────────────────────────────────────
  ["crisis_menu", "show_crisis"].forEach((cb) =>
    bot.callbackQuery(cb, async (ctx) => call(crisis.handleCrisisMenu, ctx))
  );
  bot.callbackQuery("crisis_add", async (ctx) => call(crisis.handleCrisisAdd, ctx));
  bot.callbackQuery(/^crisis_form:(\d+):(.+)$/, async (ctx) => {
    const [, idx, value] = ctx.match;
    return call(crisis.handleCrisisFormAnswer, ctx, num(idx), value);
  });
  bot.callbackQuery(/^crisis_form_back:(-?\d+)$/, async (ctx) =>
    call(crisis.handleCrisisFormBack, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^crisis_view:(\d+)$/, async (ctx) =>
    call(crisis.handleCrisisView, ctx, num(ctx.match[1]))
  );
  bot.callbackQuery(/^crisis_resolve:(\d+)$/, async (ctx) =>
    call(crisis.handleCrisisResolve, ctx, num(ctx.match[1]))
  );
}

module.exports = { registerCompatRoutes };
