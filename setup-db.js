// setup-db.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// مرحله ۱۲ — اسکریپت راه‌اندازی کامل دیتابیس Appwrite
// ═══════════════════════════════════════════════════════════════
// این اسکریپت:
//   ۱) دیتابیس را می‌سازد (در صورت عدم وجود)
//   ۲) سه کالکشن می‌سازد: users, consultations, leads
//   ۳) همه‌ی فیلدها (attributes) را اضافه می‌کند
//   ۴) ایندکس‌های لازم برای جستجو و سرعت را می‌سازد
//   ۵) idempotent است — می‌توانید چندبار اجرا کنید بدون مشکل
//
// اجرا:
//   node setup-db.js
//
// متغیرهای محیطی موردنیاز (.env):
//   APPWRITE_ENDPOINT       (اختیاری، پیش‌فرض: fra.cloud.appwrite.io)
//   APPWRITE_PROJECT_ID     (الزامی)
//   APPWRITE_API_KEY        (الزامی — با مجوز کامل databases)
//   DATABASE_ID             (اختیاری، پیش‌فرض: kandidatory_db)
//   COLLECTION_USERS        (اختیاری، پیش‌فرض: users)
//   COLLECTION_CONSULT      (اختیاری، پیش‌فرض: consultations)
//   COLLECTION_LEADS        (اختیاری، پیش‌فرض: leads)
// ═══════════════════════════════════════════════════════════════

const { Client, Databases, Permission, Role, ID } = require("node-appwrite");

// اختیاری: dotenv فقط در صورت نصب بارگذاری شود
try { require("dotenv").config(); } catch { /* dotenv نصب نیست — مهم نیست */ }

// ───────────────────────────────────────────────────────────────
// تنظیمات
// ───────────────────────────────────────────────────────────────
const CONFIG = {
  endpoint:  process.env.APPWRITE_ENDPOINT  || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID,
  apiKey:    process.env.APPWRITE_API_KEY,
  databaseId:      process.env.DATABASE_ID         || "kandidatory_db",
  databaseName:    "Kandidatory Database",
  collections: {
    users:   process.env.COLLECTION_USERS   || "users",
    consult: process.env.COLLECTION_CONSULT || "consultations",
    leads:   process.env.COLLECTION_LEADS   || "leads",
  },
};

// ───────────────────────────────────────────────────────────────
// اعتبارسنجی env
// ───────────────────────────────────────────────────────────────
if (!CONFIG.projectId || !CONFIG.apiKey) {
  console.error("❌ خطا: APPWRITE_PROJECT_ID و APPWRITE_API_KEY الزامی هستند.");
  console.error("   لطفاً فایل .env را ایجاد کنید یا متغیرها را تنظیم کنید.");
  process.exit(1);
}

// ───────────────────────────────────────────────────────────────
// ساخت client
// ───────────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const db = new Databases(client);

// ───────────────────────────────────────────────────────────────
// تعریف فیلدهای هر کالکشن
// ───────────────────────────────────────────────────────────────

// 👥 USERS
const USERS_SCHEMA = {
  attributes: [
    // شناسه و اطلاعات تلگرام
    { key: "userId",             type: "string",   size: 32,   required: true,  default: null },
    { key: "username",           type: "string",   size: 64,   required: false, default: null },
    { key: "firstName",          type: "string",   size: 128,  required: false, default: null },
    { key: "lastName",           type: "string",   size: 128,  required: false, default: null },

    // وضعیت فلو
    { key: "currentStep",        type: "integer",  required: false, default: null },
    { key: "tempAnswers",        type: "string",   size: 16384, required: false, default: "{}" },

    // نقش و پلن
    { key: "role",               type: "string",   size: 16,   required: false, default: "user" },
    { key: "purchasedPlan",      type: "string",   size: 32,   required: false, default: null },

    // اطلاعات هویتی
    { key: "nationalId",         type: "string",   size: 10,   required: false, default: null },
    { key: "phone",              type: "string",   size: 15,   required: false, default: null },
    { key: "fullName",           type: "string",   size: 128,  required: false, default: null },

    // پروفایل کاندیدا (JSON) — برای ذخیره پروفایل ۱۵+ فیلدی onboarding
    { key: "profile",            type: "string",   size: 16384, required: false, default: "{}" },

    // داده‌های مدیریت کمپین (JSON)
    { key: "rivals",             type: "string",   size: 32768, required: false, default: "[]" },
    { key: "promises",           type: "string",   size: 32768, required: false, default: "[]" },
    { key: "crisisLog",          type: "string",   size: 32768, required: false, default: "[]" },

    // امتیازها (cache)
    { key: "lastReadinessScore", type: "integer",  required: false, default: null },
    { key: "lastSwotScore",      type: "integer",  required: false, default: null },
    { key: "campaignHealth",     type: "integer",  required: false, default: null },

    // تاریخ‌ها
    { key: "createdAt",          type: "datetime", required: false, default: null },
    { key: "lastInteraction",    type: "datetime", required: false, default: null }, // legacy
    { key: "lastInteractionNew", type: "string",   size: 50,   required: false, default: null }, // ISO
  ],
  indexes: [
    { key: "idx_userId",     type: "unique", attributes: ["userId"] },
    { key: "idx_nationalId", type: "key",    attributes: ["nationalId"] },
    { key: "idx_phone",      type: "key",    attributes: ["phone"] },
    { key: "idx_role",       type: "key",    attributes: ["role"] },
    { key: "idx_plan",       type: "key",    attributes: ["purchasedPlan"] },
    { key: "idx_lastInteractionNew", type: "key", attributes: ["lastInteractionNew"], orders: ["DESC"] },
  ],
};

// 🎯 CONSULTATIONS (تاریخچه تحلیل‌ها)
const CONSULT_SCHEMA = {
  attributes: [
    { key: "userId",      type: "string",   size: 32,   required: true,  default: null },
    { key: "type",        type: "string",   size: 32,   required: true,  default: null },
    // type: readiness | swot | rivals | promises | crisis | dashboard | basic

    { key: "score",       type: "integer",  required: false, default: null },
    { key: "maxScore",    type: "integer",  required: false, default: 100 },

    // داده‌ی خام (پاسخ‌ها)
    { key: "answers",     type: "string",   size: 16384, required: false, default: "{}" },

    // گزارش متنی نهایی
    { key: "report",      type: "string",   size: 32768, required: false, default: null },
    { key: "summary",     type: "string",   size: 1024,  required: false, default: null },

    // ابعاد امتیازی (JSON)
    { key: "dimensions",  type: "string",   size: 4096,  required: false, default: "{}" },

    // متادیتا
    { key: "createdAt",   type: "datetime", required: false, default: null },
    { key: "planAtTime",  type: "string",   size: 32,   required: false, default: null },
  ],
  indexes: [
    { key: "idx_userId",        type: "key", attributes: ["userId"] },
    { key: "idx_type",          type: "key", attributes: ["type"] },
    { key: "idx_userId_type",   type: "key", attributes: ["userId", "type"] },
    { key: "idx_createdAt",     type: "key", attributes: ["createdAt"], orders: ["DESC"] },
  ],
};

// 💰 LEADS (سفارش‌های خرید)
const LEADS_SCHEMA = {
  attributes: [
    { key: "userId",       type: "string",   size: 32,   required: true,  default: null },
    { key: "planId",       type: "string",   size: 32,   required: true,  default: null },
    { key: "planName",     type: "string",   size: 128,  required: false, default: null },

    // قیمت
    { key: "priceNumeric", type: "integer",  required: false, default: 0 },
    { key: "priceDisplay", type: "string",   size: 64,   required: false, default: null },

    // اطلاعات کاربر در زمان ثبت
    { key: "username",     type: "string",   size: 64,   required: false, default: null },
    { key: "firstName",    type: "string",   size: 128,  required: false, default: null },
    { key: "lastName",     type: "string",   size: 128,  required: false, default: null },
    { key: "phone",        type: "string",   size: 15,   required: false, default: null },
    { key: "nationalId",   type: "string",   size: 10,   required: false, default: null },

    // وضعیت
    { key: "status",       type: "string",   size: 16,   required: false, default: "pending" },
    // status: pending | confirmed | rejected | cancelled

    { key: "note",         type: "string",   size: 2048, required: false, default: null },

    // تاریخ‌ها
    { key: "createdAt",    type: "datetime", required: false, default: null },
    { key: "updatedAt",    type: "datetime", required: false, default: null },
    { key: "confirmedAt",  type: "datetime", required: false, default: null },
  ],
  indexes: [
    { key: "idx_userId",     type: "key", attributes: ["userId"] },
    { key: "idx_status",     type: "key", attributes: ["status"] },
    { key: "idx_planId",     type: "key", attributes: ["planId"] },
    { key: "idx_createdAt",  type: "key", attributes: ["createdAt"], orders: ["DESC"] },
    { key: "idx_status_created", type: "key", attributes: ["status", "createdAt"], orders: ["ASC", "DESC"] },
  ],
};

// ───────────────────────────────────────────────────────────────
// کمکی: انتظار با مدت مشخص
// ───────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────────────────────────────────────────────────────────
// کمکی: لاگ رنگی
// ───────────────────────────────────────────────────────────────
const LOG = {
  info:    (msg) => console.log(`ℹ️  ${msg}`),
  ok:      (msg) => console.log(`✅ ${msg}`),
  warn:    (msg) => console.log(`⚠️  ${msg}`),
  err:     (msg) => console.log(`❌ ${msg}`),
  section: (msg) => console.log(`\n━━━ ${msg} ━━━`),
  step:    (msg) => console.log(`   ${msg}`),
};

// ───────────────────────────────────────────────────────────────
// ۱) ساخت / تأیید وجود دیتابیس
// ───────────────────────────────────────────────────────────────
async function ensureDatabase() {
  LOG.section("۱) دیتابیس");
  try {
    await db.get(CONFIG.databaseId);
    LOG.ok(`دیتابیس "${CONFIG.databaseId}" از قبل وجود دارد`);
  } catch (e) {
    if (e.code === 404) {
      LOG.info(`در حال ساخت دیتابیس "${CONFIG.databaseId}"...`);
      try {
        await db.create(CONFIG.databaseId, CONFIG.databaseName);
        LOG.ok(`دیتابیس "${CONFIG.databaseId}" ساخته شد`);
      } catch (e2) {
        LOG.err(`خطای ساخت دیتابیس: ${e2.message}`);
        throw e2;
      }
    } else {
      LOG.err(`خطا در دسترسی به دیتابیس: ${e.message}`);
      throw e;
    }
  }
}

// ───────────────────────────────────────────────────────────────
// ۲) ساخت / تأیید وجود کالکشن
// ───────────────────────────────────────────────────────────────
async function ensureCollection(collectionId, name) {
  try {
    await db.getCollection(CONFIG.databaseId, collectionId);
    LOG.ok(`کالکشن "${collectionId}" از قبل وجود دارد`);
    return false; // قبلاً بود
  } catch (e) {
    if (e.code === 404) {
      LOG.info(`در حال ساخت کالکشن "${collectionId}"...`);
      try {
        await db.createCollection(
          CONFIG.databaseId,
          collectionId,
          name,
          [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ],
          false, // documentSecurity
          true,  // enabled
        );
        LOG.ok(`کالکشن "${collectionId}" ساخته شد`);
        return true; // تازه ساخته شد
      } catch (e2) {
        LOG.err(`خطای ساخت کالکشن "${collectionId}": ${e2.message}`);
        throw e2;
      }
    } else {
      LOG.err(`خطا: ${e.message}`);
      throw e;
    }
  }
}

// ───────────────────────────────────────────────────────────────
// ۳) ساخت یک attribute (با مدیریت 409 = تکراری)
// ───────────────────────────────────────────────────────────────
async function createAttribute(collectionId, attr) {
  const { key, type, size, required, default: def, min, max, elements } = attr;

  try {
    if (type === "string") {
      await db.createStringAttribute(
        CONFIG.databaseId, collectionId, key, size || 255,
        !!required,
        required ? undefined : def, // اگر required است نباید default داشته باشد
        false // array
      );
    } else if (type === "integer") {
      await db.createIntegerAttribute(
        CONFIG.databaseId, collectionId, key,
        !!required,
        typeof min === "number" ? min : undefined,
        typeof max === "number" ? max : undefined,
        required ? undefined : def,
        false
      );
    } else if (type === "float") {
      await db.createFloatAttribute(
        CONFIG.databaseId, collectionId, key,
        !!required,
        typeof min === "number" ? min : undefined,
        typeof max === "number" ? max : undefined,
        required ? undefined : def,
        false
      );
    } else if (type === "boolean") {
      await db.createBooleanAttribute(
        CONFIG.databaseId, collectionId, key,
        !!required,
        required ? undefined : def,
        false
      );
    } else if (type === "datetime") {
      await db.createDatetimeAttribute(
        CONFIG.databaseId, collectionId, key,
        !!required,
        required ? undefined : def,
        false
      );
    } else if (type === "email") {
      await db.createEmailAttribute(
        CONFIG.databaseId, collectionId, key,
        !!required,
        required ? undefined : def,
        false
      );
    } else if (type === "enum") {
      await db.createEnumAttribute(
        CONFIG.databaseId, collectionId, key,
        elements || [],
        !!required,
        required ? undefined : def,
        false
      );
    } else {
      LOG.warn(`نوع ناشناخته: ${type} برای ${key}`);
      return false;
    }
    LOG.step(`✅ فیلد ${key} (${type}) ساخته شد`);
    return true;
  } catch (e) {
    if (e.code === 409) {
      LOG.step(`⏭  فیلد ${key} از قبل وجود دارد`);
      return false;
    }
    LOG.step(`❌ خطا در ${key}: ${e.message}`);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// ۴) ساخت یک ایندکس (با مدیریت 409 = تکراری)
// ───────────────────────────────────────────────────────────────
async function createIndex(collectionId, idx) {
  try {
    await db.createIndex(
      CONFIG.databaseId,
      collectionId,
      idx.key,
      idx.type || "key",
      idx.attributes,
      idx.orders || []
    );
    LOG.step(`✅ ایندکس ${idx.key} ساخته شد`);
    return true;
  } catch (e) {
    if (e.code === 409) {
      LOG.step(`⏭  ایندکس ${idx.key} از قبل وجود دارد`);
      return false;
    }
    LOG.step(`❌ خطا در ایندکس ${idx.key}: ${e.message}`);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// ۵) راه‌اندازی کامل یک کالکشن
// ───────────────────────────────────────────────────────────────
async function setupCollection(collectionId, displayName, schema) {
  LOG.section(`کالکشن: ${displayName} (${collectionId})`);

  // ساخت کالکشن
  const justCreated = await ensureCollection(collectionId, displayName);

  // اگر تازه ساخته شد، کمی صبر کن تا Appwrite آماده شود
  if (justCreated) {
    LOG.info("صبر ۲ ثانیه‌ای برای آماده‌سازی کالکشن جدید...");
    await sleep(2000);
  }

  // ساخت attribute ها
  LOG.info(`در حال ساخت ${schema.attributes.length} فیلد...`);
  let newAttrs = 0;
  for (const attr of schema.attributes) {
    if (await createAttribute(collectionId, attr)) {
      newAttrs++;
      // وقفه کوتاه برای جلوگیری از rate-limit
      await sleep(200);
    }
  }
  LOG.ok(`${newAttrs} فیلد جدید ساخته شد (${schema.attributes.length - newAttrs} از قبل موجود)`);

  // قبل از ساخت ایندکس، باید attributeها در Appwrite "available" شوند
  if (newAttrs > 0) {
    LOG.info("صبر ۵ ثانیه‌ای تا فیلدها آماده‌ی index شدن شوند...");
    await sleep(5000);
  }

  // ساخت ایندکس‌ها
  LOG.info(`در حال ساخت ${schema.indexes.length} ایندکس...`);
  let newIndexes = 0;
  for (const idx of schema.indexes) {
    if (await createIndex(collectionId, idx)) {
      newIndexes++;
      await sleep(300);
    }
  }
  LOG.ok(`${newIndexes} ایندکس جدید ساخته شد (${schema.indexes.length - newIndexes} از قبل موجود)`);
}

// ───────────────────────────────────────────────────────────────
// ۶) چاپ خلاصه نهایی
// ───────────────────────────────────────────────────────────────
async function printSummary() {
  LOG.section("📊 خلاصه نهایی");
  try {
    const collections = await db.listCollections(CONFIG.databaseId);
    console.log(`\n   📦 دیتابیس: ${CONFIG.databaseId}`);
    console.log(`   🌐 endpoint: ${CONFIG.endpoint}`);
    console.log(`   📋 کالکشن‌ها (${collections.total}):\n`);

    for (const col of collections.collections) {
      const attrs = await db.listAttributes(CONFIG.databaseId, col.$id);
      const indexes = await db.listIndexes(CONFIG.databaseId, col.$id);
      console.log(`      • ${col.$id} — ${attrs.total} فیلد، ${indexes.total} ایندکس`);
    }
    console.log("");
  } catch (e) {
    LOG.warn(`خطا در دریافت خلاصه: ${e.message}`);
  }
}

// ───────────────────────────────────────────────────────────────
// تابع اصلی
// ───────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  🚀 راه‌اندازی دیتابیس Appwrite — کاندیداتوری هوشمند v2.0  ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`   🌐 endpoint:   ${CONFIG.endpoint}`);
  console.log(`   📁 project:    ${CONFIG.projectId}`);
  console.log(`   💾 database:   ${CONFIG.databaseId}`);
  console.log("");

  try {
    // ۱) دیتابیس
    await ensureDatabase();

    // ۲) کالکشن‌ها
    await setupCollection(CONFIG.collections.users,   "Users",         USERS_SCHEMA);
    await setupCollection(CONFIG.collections.consult, "Consultations", CONSULT_SCHEMA);
    await setupCollection(CONFIG.collections.leads,   "Leads",         LEADS_SCHEMA);

    // ۳) خلاصه
    await printSummary();

    const dt = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log(`║  ✅ راه‌اندازی با موفقیت تمام شد ( ${dt} ثانیه)              ║`);
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("📝 مراحل بعدی:");
    console.log("   ۱) صبر کنید ۱ تا ۲ دقیقه تا Appwrite ایندکس‌ها را کاملاً بسازد");
    console.log("   ۲) اولین کاربر را به نقش admin ارتقا دهید (دستی در کنسول)");
    console.log("   ۳) BOT_TOKEN را در Environment Variables فانکشن قرار دهید");
    console.log("   ۴) Webhook تلگرام را به URL فانکشن متصل کنید:");
    console.log("      curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APPWRITE_FN_URL>");
    console.log("");

    process.exit(0);
  } catch (e) {
    console.log("");
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║  ❌ خطا — راه‌اندازی ناتمام ماند                         ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    LOG.err(e.message || e);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  }
}

// اجرا
main();
