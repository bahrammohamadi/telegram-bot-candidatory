// setup-db.js — تبدیل‌شده به CommonJS
// ═══════════════════════════════════════════════════════════════
// ✅ فیکس: تبدیل از ESM به CommonJS
// ✅ اسکریپت اضافه کردن فیلدهای جدید به دیتابیس
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const { Client, Databases } = require("node-appwrite");

// ═══════════════════════════════════════════════════════════════
// تنظیمات
// ═══════════════════════════════════════════════════════════════
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "fra-699d6797003d63f0fd8c")
  .setKey(process.env.APPWRITE_API_KEY || "");

const db = new Databases(client);

const DB = process.env.DATABASE_ID || process.env.APPWRITE_DB_ID || "699d6d5a0038857d3279";
const USERS = process.env.COLLECTION_USERS || process.env.APPWRITE_USERS_COLLECTION || "users";

// ═══════════════════════════════════════════════════════════════
// اضافه کردن فیلدهای جدید
// ═══════════════════════════════════════════════════════════════
async function addNewFields() {
  console.log("\n🔧 در حال اضافه کردن فیلدهای جدید به کالکشن users...\n");

  const fields = [
    { key: "nationalId", size: 10 },
    { key: "phone", size: 15 },
    { key: "fullName", size: 128 },
    { key: "lastInteractionNew", size: 50 },
  ];

  for (const f of fields) {
    try {
      await db.createStringAttribute(DB, USERS, f.key, f.size, false);
      console.log(`✅ فیلد ${f.key} ساخته شد.`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`ℹ️  فیلد ${f.key} قبلاً وجود دارد.`);
      } else {
        console.error(`❌ خطا در ساخت ${f.key}:`, e.message);
      }
    }
  }

  // ایندکس‌ها
  console.log("\n🔧 در حال اضافه کردن ایندکس‌ها...\n");

  const indexes = [
    { key: "idx_nationalId", field: "nationalId" },
    { key: "idx_phone", field: "phone" },
  ];

  for (const idx of indexes) {
    try {
      await db.createIndex(DB, USERS, idx.key, "key", [idx.field]);
      console.log(`✅ ایندکس ${idx.key} ساخته شد.`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`ℹ️  ایندکس ${idx.key} قبلاً وجود دارد.`);
      } else {
        console.error(`❌ خطا:`, e.message);
      }
    }
  }

  console.log("\n✅ تمام فیلدهای جدید اضافه شدند!");
  console.log("⚠️  توجه: ایندکس‌ها ممکن است ۱–۲ دقیقه طول بکشد تا فعال شوند.\n");
}

// ═══════════════════════════════════════════════════════════════
// اجرا
// ═══════════════════════════════════════════════════════════════
addNewFields().catch((err) => {
  console.error("❌ خطای کلی:", err);
  process.exit(1);
});
