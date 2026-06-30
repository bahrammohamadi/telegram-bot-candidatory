# 📋 مرحله ۱ — گزارش تحلیل و بازرسی کامل پروژه «کاندیداتوری هوشمند»

**پروژه:** `bahrammohamadi/telegram-bot-candidatory`
**نسخه بررسی‌شده:** commit `482f7a5` (Jun 13, 2026) — ~۹۰۰۰ خط، ۲۳ فایل
**محیط هدف:** Appwrite Function (serverless) + Telegram Webhook
**ابزارها:** Node.js 18+, grammY 1.21, node-appwrite 12, Gemini API

---

## 🎯 خلاصه‌ی اجرایی (Executive Summary)

**نتیجه کلی:** پروژه با کیفیت بسیار بالایی نوشته شده. معماری ماژولار، کامنت‌های فارسی عالی، error handling حساب‌شده، و عمق محتوایی چشمگیر است. **اما** ۴ باگ بحرانی دارد که ربات را عملاً غیرقابل استفاده می‌کنند، به‌علاوه ۸ مشکل امنیتی/متوسط.

| سطح | تعداد | اولویت |
|---|---|---|
| 🔴 بحرانی (ربات کار نمی‌کند) | **4** | فوری — turn بعدی |
| 🟠 امنیتی | **5** | فوری — turn بعدی |
| 🟡 متوسط | **8** | برنامه‌ریزی |
| 🟢 پیشنهاد بهبود | **6** | اختیاری |

---

## 🔴 مشکلات بحرانی (Critical Bugs)

### C1. ❗ فیلد `candidateProfile` در DB وجود ندارد ولی کد ازش استفاده می‌کند

**شواهد:**
- در `src/utils/db.js` خطوط 32, 33, 55, 56, 177, 178, 194, 195, 207, 208, 229, 230, 245, 246 → از `doc.candidateProfile` می‌خواند
- در `src/flows/onboarding.js` خط 459 → با `candidateProfile: JSON.stringify(profile)` می‌نویسد
- در `setup-db.js` خط 97 → فقط فیلد `profile` تعریف شده، نه `candidateProfile`

**نتیجه:** هر بار که کاربر فرم پروفایل را تکمیل می‌کند، Appwrite خطای `Attribute candidateProfile not found` می‌دهد و کل فلوی ۱۴ مرحله‌ای onboarding به هم می‌خورد.

**فیکس turn بعدی:** یا فیلد `candidateProfile` را در `setup-db.js` اضافه می‌کنیم، یا کل کد به `profile` migrate می‌شود. **توصیه:** اضافه کردن `candidateProfile` برای حفظ سازگاری با دیتای موجود + alias در repo.

---

### C2. ❗ webhook handler در main.js لاجیک مرده (dead code) دارد

**شواهد:** در `src/main.js` خطوط 728-757:

```js
const fakeRequest = { method: "POST", headers: ..., body: () => ..., json: () => ... };
const fakeResponse = { end: ..., status: ..., send: ..., json: ..., setHeader: () => {} };

// پردازش مستقیم با bot.handleUpdate (روش ساده‌تر و قابل اعتماد در serverless)
await bot.handleUpdate(body);
```

`fakeRequest` و `fakeResponse` ساخته می‌شوند ولی **هرگز استفاده نمی‌شوند**. مسیر واقعی فقط `bot.handleUpdate(body)` است.

**ریسک:** اگر در آینده کسی فکر کند `webhookCallback` فعال است، گمراه می‌شود. همچنین `webhookHandler` global cache می‌شود ولی هیچ‌وقت صدا زده نمی‌شود.

**فیکس:** پاک کردن کد مرده + کامنت روشن که چرا از `bot.handleUpdate` مستقیم استفاده می‌شود.

---

### C3. ❗ `bot.init()` در serverless هرگز صدا زده نمی‌شود (مگر BOT_INFO تنظیم شود)

**شواهد:** در `main.js` تنها `bot.init()` در حالت `require.main === module` (standalone) صدا زده می‌شود. در serverless، `bot.handleUpdate(body)` بدون پر کردن `bot.botInfo` صدا زده می‌شود.

**اگر `BOT_INFO` در env تنظیم نباشد:**
- grammY می‌خواهد در اولین `handleUpdate` با تلگرام تماس بگیرد → در serverless cold start می‌میرد
- خطای `Bot not initialized` که README اشاره کرده **دقیقاً همین است**

**فیکس turn بعدی:** اگر `BOT_INFO` نباشد، در ابتدای handler یک `await bot.init()` بزنیم و نتیجه را cache کنیم. این تنها کاری است که می‌توان در serverless بدون BOT_INFO کرد.

---

### C4. ❗ Rate-limit middleware ساخته شده ولی **هیچ‌جا use نمی‌شود**

**شواهد:**
- `src/middleware/rate-limit.js` وجود دارد و `rateLimitMiddleware`/`startCleanup` را export می‌کند
- در `src/main.js` هیچ `bot.use(rateLimitMiddleware())` وجود ندارد
- `startCleanup` هم صدا زده نشده → نشت حافظه

**ریسک:** بدون rate-limit، یک کاربر می‌تواند با اسپم پشت سر هم همه‌ی quotaی Appwrite را بسوزاند (یا hit کند 429 از Telegram). برای bot عمومی این خطرناک است.

**فیکس:** نصب middleware در main.js + فعال کردن cleanup. سقف فعلی ۳ پیام/ثانیه برای rebot conversational کم است → پیشنهاد ۳۰/دقیقه.

---

## 🟠 مشکلات امنیتی (Security Issues)

### S1. 🚨 توکن‌های production در ENV history لو رفته‌اند

شما در این چت توکن‌های واقعی paste کردید (BOT_TOKEN, APPWRITE_API_KEY, GitHub PAT). تا زمانی که این‌ها revoke نشوند، **هر کسی که این چت را ببیند کنترل کامل ربات و دیتابیس را در دست دارد.**

**اقدام:** revoke فوری از @BotFather، Appwrite Console، GitHub Settings.

---

### S2. 🚨 Default fallback های Appwrite در `db.js` با مقدار **واقعی** project ID hardcode شده

```js
// src/utils/db.js:13-17
const projectId = process.env.APPWRITE_PROJECT_ID || "fra-699d6797003d63f0fd8c";
dbId = process.env.DATABASE_ID || ... || "699d6d5a0038857d3279";
```

**ریسک:**
1. این **project ID و database ID شما** را در کد public قرار داده. حتی اگر API key نباشد، attacker می‌داند کجا را هدف بگیرد.
2. اگر کسی پروژه را fork کند و env تنظیم نکند، به دیتابیس **شما** متصل می‌شود.

**فیکس:** حذف default ها → اگر env نباشد، fail-fast با خطای واضح.

---

### S3. 🚨 `ADMIN_PASSWORD` به‌صورت plain text در env + مقایسه با `===`

```js
// src/utils/admin-auth.js:91
return String(input || "").trim() === String(process.env.ADMIN_PASSWORD);
```

**ریسک‌ها:**
1. **Timing attack**: `===` روی string زمانش با موقعیت اولین تفاوت متفاوت است. یک attacker می‌تواند با تحلیل تأخیر، کاراکتر به کاراکتر رمز را حدس بزند (هرچند در serverless سخت‌تر است).
2. **Plain text در env**: هر کسی که به Appwrite Console دسترسی داشته باشد رمز را می‌بیند.
3. **بدون brute-force protection**: هیچ شمارنده‌ی تلاش/قفل وجود ندارد. مهاجم می‌تواند بی‌نهایت تلاش کند.

**فیکس turn بعدی:**
- مقایسه با `crypto.timingSafeEqual`
- لاکوت پس از N تلاش
- پیشنهاد ذخیره hash به جای plain (با اسکریپت hash generator)

---

### S4. 🚨 Markdown parse mode + ورودی کاربر = Markdown injection / XSS-equivalent

سراسر پروژه: `ctx.reply(text, { parse_mode: "Markdown" })` با متن‌هایی که شامل **داده‌ی کاربر** (نام، شعار، توضیحات) هستند.

**نمونه:** در `admin.js` خط 423:
```js
text += `*${num}.* ${name}\n   ${plan}\n`;
```
اگر کاربر `firstName` خود را `*bold* [link](evil)` بگذارد، یا کارکترهای `_`, `*`, `` ` ``, `[`, `]` در نام/شعار/پاسخ‌ها داشته باشد:
- پارس Markdown می‌شکند → Telegram خطای `Bad Request: can't parse entities` می‌دهد → پیام ارسال نمی‌شود
- در بدترین حالت: کاربر می‌تواند لینک‌های جعلی به ادمین تزریق کند (مثلاً `[Google](https://evil.com)`)

**فیکس:** یک helper `escapeMd(v)` بسازیم و **همه جا** ورودی کاربر را escape کنیم. یا بهتر: استفاده از `parse_mode: "MarkdownV2"` با escape سیستماتیک، یا `HTML` parse mode.

---

### S5. 🚨 broadcast: ارسال پیام ادمین با parse_mode Markdown بدون اعتبارسنجی

```js
// admin.js:537
await ctx.api.sendMessage(u.userId, message, { parse_mode: "Markdown" });
```
اگر ادمین در پیام broadcast یک کاراکتر اشتباه Markdown بگذارد (مثلاً `_` تنها)، ارسال به همه‌ی کاربران fail می‌کند ولی شمارنده‌ی `failed` صرفاً تعداد را نشان می‌دهد بدون اینکه ادمین متوجه شود **چرا**.

**فیکس:** قبل از ارسال انبوه، یک test-send به خود ادمین + log اولین error.

---

## 🟡 مشکلات متوسط (Medium Issues)

### M1. Race condition در `currentStep` کاربر

اگر کاربر سریع دو پاسخ پشت سر هم بدهد، یا اگر دو request همزمان وارد شوند (مثلاً webhook retry تلگرام)، می‌توانند `tempAnswers` همدیگر را overwrite کنند چون `getOrCreateUser` → modify → `updateUser` **atomic نیست**.

**شواهد:** هیچ optimistic locking یا transaction در `db.js` وجود ندارد.

**فیکس پیشنهادی:** Appwrite transaction ندارد، اما می‌توان از `$updatedAt` به عنوان version استفاده کرد و در update اگر تغییر کرده، retry کرد.

---

### M2. Webhook بدون verification

```js
// main.js:691
if (req.method !== "POST") { return res.json({ error: ... }, 405); }
```
هیچ‌جا header `X-Telegram-Bot-Api-Secret-Token` بررسی نمی‌شود. این یعنی **هر کسی** که URL endpoint Appwrite Function را بداند می‌تواند update جعلی به ربات شما بفرستد.

**فیکس:** `setWebhook` با `secret_token` + بررسی header در ابتدای handler.

---

### M3. listLeads برای پیدا کردن یک lead همه را می‌خواند

```js
// admin.js:308 - handleLeadView
leads = await listLeads({ status: "all", limit: 500 });
const lead = leads.find((l) => (l.id || l.$id) === leadId);
```
به جای `getDocument(dbId, leadsCol, leadId)`، ۵۰۰ سند را می‌خواند و در حافظه search می‌کند. در Appwrite Cloud این هم گران است هم کند هم به سقف rate limit نزدیک می‌شود.

**فیکس:** `getLeadById(leadId)` ساده.

---

### M4. broadcast بدون pagination — حداکثر ۱۰۰۰۰ کاربر و در یک request

```js
users = await listAllUsers({ limit: 10000 });
```
Appwrite Cloud به‌صورت پیش‌فرض limit=100 و حداکثر 100 در هر request دارد. اگر کاربران از ۱۰۰ بیشتر شوند، فقط ۱۰۰ تای اول broadcast می‌گیرند.

**فیکس:** pagination با cursor در `listAllUsers`.

---

### M5. Memory leak در rate-limit (الان غیرفعال است ولی…)

`startCleanup()` فقط یک بار setInterval می‌گذارد. در serverless **هر invocation یک process جدید** ممکن است باشد → setInterval ها هیچ‌وقت اجرا نمی‌شوند، Map رشد می‌کند. در standalone، اگر چندبار require شود (که نباید ولی…) چند interval همزمان وجود خواهند داشت.

**فیکس:** برای serverless کاملاً ناسازگار است. باید rate-limit به Appwrite منتقل شود.

---

### M6. `lastInteraction` دو فیلد است: `lastInteraction` (datetime) و `lastInteractionNew` (string)

```js
// db.js:67
const payload = {
  ...updates,
  lastInteraction: new Date().toISOString(),     // datetime
  lastInteractionNew: new Date().toISOString(),  // string size:50
};
```
هر update دو فیلد می‌نویسد. در setup-db.js کامنت گفته `lastInteraction // legacy`. **چرا هنوز نوشته می‌شود؟** confusion و duplicate data.

**فیکس:** فقط `lastInteractionNew` نوشته شود؛ اسم را به `lastInteractionAt` عوض کنیم.

---

### M7. `bot.api.config.use` transformer در هر request اجرا می‌شود اما mutate می‌کند

```js
// main.js:103-110
bot.api.config.use(async (prev, method, payload, signal) => {
  rm.inline_keyboard = rm.inline_keyboard.filter(...);  // mutate
  return prev(method, payload, signal);
});
```
این کار درست است اما اگر همان payload در جای دیگر استفاده شود (cache, retry), رفتار غیرمنتظره دارد. ریسک کم ولی best-practice نقض شده.

**فیکس:** clone قبل از mutate یا ساخت یک reply_markup جدید.

---

### M8. وابستگی circular احتمالی: `access.js` ↔ `admin-auth.js` ↔ `db.js`

- `access.js` → require `admin-auth.js`
- `admin-auth.js` → require `db.js`
- `db.js` → require‌های module-level دیگری ندارد ✓ (پس circular نیست)
- ولی `access.js` در داخل تابع `require("grammy")` و `require("../constants/plans.js")` می‌کند → lazy load برای جلوگیری از circular، که نشانه‌ی این است که قبلاً مشکل داشته.

**توصیه:** بازآرایی dependency graph.

---

## 🟢 پیشنهادهای بهبود (Nice-to-have)

| # | پیشنهاد | فایده |
|---|---|---|
| N1 | تبدیل پروژه به ESM (نیاز به migration کامل) | type-checking بهتر، tree-shaking |
| N2 | اضافه کردن TypeScript types (حداقل JSDoc) | IDE support، کمتر شدن باگ |
| N3 | تست واحد برای `score.js`, `validateInput` | اطمینان از منطق امتیازدهی |
| N4 | استفاده از `pino` به جای `console.log` | structured logging، فیلتر آسان |
| N5 | اضافه کردن `/setMyCommands` به startup | menu پیشنهادی در Telegram |
| N6 | i18n flag برای پشتیبانی آینده از زبان‌های دیگر | scale |

---

## 📊 معماری — تحلیل کیفی

### ✅ نقاط قوت

- **ماژولاریتی عالی:** هر flow در فایل خود، utilها جدا، constants جدا
- **safeRequire در main.js:** اگر فایلی نباشد، crash نمی‌کند → robustness
- **router-compat.js:** brilliant! یک adapter layer که legacy callbackها (rival_add, swot_ans:...) را به فلوهای جدید وصل می‌کند، **بدون تغییر فلوها**. این تصمیم معمارانه‌ای است که اکثر دولوپرها نمی‌گیرند.
- **AI abstraction (`ai.js`):** عالی — Gemini + OpenAI با retry/backoff/timeout
- **Plan-based access control:** ساختار `FEATURE_ACCESS` declarative و قابل audit
- **Markdown progress bars:** UX تمیز با emoji
- **Bilingual comments:** ترکیب فارسی + کد انگلیسی به‌خوبی documented
- **Admin Panel کامل:** Stats، Leads، Search، User management، Broadcast — همه چیز است

### ❌ نقاط ضعف معماری

- **State machine implicit:** `currentStep` یک عدد است که با range معنی پیدا می‌کند (0-99 = readiness, 100-199 = editing, 500+ = profile, 1000+ = admin). این **شکننده** است. اگر یکی range را اشتباه بفهمد، state ها به هم می‌خورند. **پیشنهاد:** یک enum بزرگ یا یک object `{flow: 'readiness', step: 3}`.
- **Source of truth برای admin:** هم `role===admin` در DB و هم `ADMIN_IDS` در env. این dual-source می‌تواند گیج‌کننده شود (مثلاً اگر ادمینی از env حذف شود ولی role در DB هست).
- **Migration strategy نیست:** هر بار فیلد جدید اضافه شود، باید setup-db.js دستی اجرا شود. برای production نیاز به migration script شماره‌گذاری شده داریم.
- **No graceful schema evolution:** اگر فیلدی حذف/تغییر نام پیدا کند، در DB باقی می‌ماند.

---

## 🛡 ریسک‌های امنیتی (خلاصه و اولویت)

| ID | ریسک | شدت | احتمال | اولویت رفع |
|---|---|---|---|---|
| S1 | توکن‌های لو رفته در چت | 🔴 critical | 🔴 high | **همین حالا** |
| S2 | hardcoded project/db IDs | 🟠 high | 🟡 medium | turn بعدی |
| S3 | timing attack روی ADMIN_PASSWORD | 🟡 medium | 🟢 low | turn بعدی |
| S4 | Markdown injection | 🟠 high | 🟠 high | turn بعدی |
| S5 | broadcast بدون validation | 🟡 medium | 🟡 medium | turn بعدی |
| M2 | webhook بدون secret_token | 🟠 high | 🟡 medium | turn بعدی |

---

## 🗺 برنامه‌ی پیشنهادی برای Turn 2

اولویت‌بندی شده برای **حداکثر تأثیر، حداقل ریسک شکستن قابلیت‌های موجود**:

### Patch 1 — Critical Bug Fixes (الزامی)
1. ✅ اضافه کردن فیلد `candidateProfile` به `setup-db.js` (C1)
2. ✅ پاک کردن dead code در webhook handler + کامنت روشن (C2)
3. ✅ نصب `bot.init()` در serverless path بدون BOT_INFO (C3)
4. ✅ نصب rate-limit middleware در main.js + adapter Appwrite-friendly (C4)

### Patch 2 — Security Hardening
5. ✅ حذف hardcoded IDs از db.js (S2)
6. ✅ `timingSafeEqual` + brute-force lockout برای ADMIN_PASSWORD (S3)
7. ✅ helper `escapeMd` + استفاده در همه‌ی نقاط user-data (S4)
8. ✅ webhook secret_token verification (M2)

### Patch 3 — Performance & Correctness
9. ✅ `getLeadById` به جای listAll + find (M3)
10. ✅ pagination واقعی در broadcast (M4)
11. ✅ حذف `lastInteraction` legacy، فقط `lastInteractionNew` (M6)

### Patch 4 — Docs & DX
12. ✅ به‌روزرسانی `.env.example` با کامنت‌های جدید
13. ✅ `CHANGELOG.md` با تفصیل هر تغییر
14. ✅ `README.md` با راهنمای deploy Appwrite Function

### Patch 5 (اختیاری — turn بعدتر)
- Refactor state machine به object-based
- Migration script ها
- اضافه کردن /setMyCommands

---

## 📝 یادداشت پایانی

این پروژه **زیربنای محکمی** دارد. باگ‌های بحرانی همگی قابل fix هستند بدون اینکه ساختار کلی به هم بریزد. منوها، محتوای آموزشی، سوالات onboarding، Score Engine، Plan system، Admin Panel — همه از نظر **محتوا** عالی هستند و باید **حفظ شوند**.

تمام پچ‌های turn بعد به‌صورت **diff واضح** ارائه می‌شوند:
- چه فایلی، چه خطی، چرا، چه چیزی جایگزین می‌شود
- بعد از هر تغییر، تست syntax + smoke test
- هیچ قابلیت موجود سالم خراب نخواهد شد

**منتظر تأیید شما هستم تا Turn 2 (Critical Patches) را شروع کنم.**
