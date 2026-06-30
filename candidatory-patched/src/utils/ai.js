// src/utils/ai.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// لایه‌ی انتزاعی هوش مصنوعی (AI Provider Abstraction)
// ═══════════════════════════════════════════════════════════════
// هدف: یک تابع واحد generateAI({system, prompt}) که فارغ از سرویس،
// متن تولید کند. سرویس با متغیر محیطی AI_PROVIDER انتخاب می‌شود:
//
//   AI_PROVIDER = "gemini"  (پیش‌فرض — رایگان و باکیفیت فارسی)
//   AI_PROVIDER = "openai"  (یا هر سرویس سازگار با OpenAI)
//
// متغیرهای محیطی:
//   ─ Gemini:
//       GEMINI_API_KEY           کلید (از https://aistudio.google.com/apikey)
//       GEMINI_MODEL             پیش‌فرض: gemini-2.5-flash-lite (۱۰۰۰ درخواست/روز رایگان)
//   ─ OpenAI / سازگار:
//       OPENAI_API_KEY           کلید
//       OPENAI_BASE_URL          پیش‌فرض: https://api.openai.com/v1
//                                (برای سرویس‌های واسط/ایرانی این را عوض کنید)
//       OPENAI_MODEL             پیش‌فرض: gpt-4o-mini
//   ─ عمومی:
//       AI_TIMEOUT_MS            مهلت درخواست (پیش‌فرض ۳۰۰۰۰)
//       AI_MAX_TOKENS            حداکثر توکن خروجی (پیش‌فرض ۱۲۰۰)
//
// نکته: از fetch داخلی Node 18+ استفاده می‌شود (بدون وابستگی اضافه).
// ═══════════════════════════════════════════════════════════════

function getProvider() {
  return (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();
}

// آیا AI اصلاً پیکربندی شده؟ (کلید موجود است؟)
function isAIConfigured() {
  const p = getProvider();
  if (p === "gemini") return !!process.env.GEMINI_API_KEY;
  if (p === "openai" || p === "openai-compatible") return !!process.env.OPENAI_API_KEY;
  return false;
}

// خطای اختصاصی تا فراخوان‌ها بتوانند تشخیص دهند مشکل از AI بوده
class AIError extends Error {
  constructor(message, code = "ai_error", status = 0) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.status = status; // کد HTTP (در صورت وجود) برای تشخیص خطای موقت/دائمی
  }
}

// آیا این خطا «موقت» است و ارزش تلاش مجدد دارد؟
// 429 (سقف نرخ)، 500/502/503/504 (خطای سرور)، timeout → موقت
function isRetryable(err) {
  if (!err) return false;
  if (err.code === "timeout") return true;
  const s = err.status || 0;
  return s === 429 || s === 500 || s === 502 || s === 503 || s === 504;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────────────────────────────────────────────────────────
// کمکی: fetch با timeout
// ───────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const ms = timeoutMs || parseInt(process.env.AI_TIMEOUT_MS || "30000", 10);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ───────────────────────────────────────────────────────────────
// Gemini
// ───────────────────────────────────────────────────────────────
async function callGemini({ system, prompt, temperature }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIError("GEMINI_API_KEY تنظیم نشده", "no_key");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const body = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: typeof temperature === "number" ? temperature : 0.8,
      maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || "1200", 10),
    },
  };

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new AIError(`Gemini HTTP ${res.status}: ${t.slice(0, 200)}`, "http", res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text.trim()) throw new AIError("پاسخ خالی از Gemini", "empty");
  return text.trim();
}

// ───────────────────────────────────────────────────────────────
// OpenAI / سازگار با OpenAI
// ───────────────────────────────────────────────────────────────
async function callOpenAI({ system, prompt, temperature }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AIError("OPENAI_API_KEY تنظیم نشده", "no_key");

  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const url = `${base}/chat/completions`;

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: typeof temperature === "number" ? temperature : 0.8,
      max_tokens: parseInt(process.env.AI_MAX_TOKENS || "1200", 10),
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new AIError(`OpenAI HTTP ${res.status}: ${t.slice(0, 200)}`, "http", res.status);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new AIError("پاسخ خالی از OpenAI", "empty");
  return text.trim();
}

// ───────────────────────────────────────────────────────────────
// تابع اصلی: تولید متن با AI
//   generateAI({ system, prompt, temperature })  → string
// در صورت خطا، AIError پرتاب می‌کند (فراخوان باید try/catch کند).
// ───────────────────────────────────────────────────────────────
async function generateAI({ system, prompt, temperature } = {}) {
  if (!prompt || !prompt.trim()) throw new AIError("prompt خالی است", "no_prompt");

  const provider = getProvider();

  // تعداد تلاش مجدد برای خطاهای موقت (429/5xx/timeout). پیش‌فرض ۲ تلاش اضافه.
  const maxRetries = parseInt(process.env.AI_MAX_RETRIES || "2", 10);
  const baseDelay = parseInt(process.env.AI_RETRY_DELAY_MS || "1500", 10);

  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const t0 = Date.now();
    try {
      let out;
      if (provider === "gemini") {
        out = await callGemini({ system, prompt, temperature });
      } else if (provider === "openai" || provider === "openai-compatible") {
        out = await callOpenAI({ system, prompt, temperature });
      } else {
        throw new AIError(`AI_PROVIDER ناشناخته: ${provider}`, "bad_provider");
      }
      const dt = Date.now() - t0;
      if (dt > 8000) console.warn(`[ai] کند: ${provider} ${dt}ms`);
      return out;
    } catch (e) {
      // نرمال‌سازی خطا
      if (e.name === "AbortError") e = new AIError("درخواست AI به مهلت رسید (timeout)", "timeout");
      else if (!(e instanceof AIError)) e = new AIError(`خطای AI: ${e.message}`, "unknown");
      lastErr = e;

      // اگر خطا موقت است و هنوز تلاش باقی مانده → صبر و تلاش مجدد (backoff تصاعدی)
      if (isRetryable(e) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // 1500ms, 3000ms, ...
        console.warn(`[ai] خطای موقت (${e.code}/${e.status}) — تلاش مجدد ${attempt + 1}/${maxRetries} پس از ${delay}ms`);
        await sleep(delay);
        continue;
      }
      // خطای دائمی یا اتمام تلاش‌ها
      throw e;
    }
  }
  throw lastErr || new AIError("خطای ناشناخته AI", "unknown");
}

module.exports = {
  generateAI,
  isAIConfigured,
  getProvider,
  AIError,
};
