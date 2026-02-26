// setup-db.js
// ─── اسکریپت اضافه کردن فیلدهای جدید به دیتابیس ───
// فقط فیلدهای جدید (nationalId, phone, fullName) اضافه می‌شوند
// فیلدهای قدیمی دست نمی‌خورند

import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const DB = process.env.APPWRITE_DB_ID || "kandidatory_db";
const USERS = process.env.APPWRITE_USERS_COLLECTION || "users";

async function addNewFields() {
  console.log("🔧 اضافه کردن فیلدهای جدید به کالکشن users...\n");

  const fields = [
    { key: "nationalId", size: 10 },
    { key: "phone",      size: 15 },
    { key: "fullName",   size: 128 },
  ];

  for (const f of fields) {
    try {
      await db.createStringAttribute(DB, USERS, f.key, f.size, false);
      console.log(`  ✅ فیلد ${f.key} ساخته شد.`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  ℹ️ فیلد ${f.key} قبلاً وجود دارد.`);
      } else {
        console.error(`  ❌ خطا در ساخت ${f.key}:`, e.message);
      }
    }
  }

  // ایندکس‌ها
  const indexes = [
    { key: "idx_nationalId", field: "nationalId" },
    { key: "idx_phone",      field: "phone" },
  ];

  for (const idx of indexes) {
    try {
      await db.createIndex(DB, USERS, idx.key, "key", [idx.field]);
      console.log(`  ✅ ایندکس ${idx.key} ساخته شد.`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  ℹ️ ایندکس ${idx.key} قبلاً وجود دارد.`);
      } else {
        console.error(`  ❌ خطا:`, e.message);
      }
    }
  }

  console.log("\n🎉 تمام فیلدهای جدید اضافه شدند!");
  console.log("⚠️ توجه: بعد از اجرا ۱–۲ دقیقه صبر کنید تا Appwrite ایندکس‌ها را بسازد.");
}

addNewFields().catch(console.error);
