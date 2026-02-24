// ============================================================
// 🗃️ اسکریپت ساخت دیتابیس و کالکشن‌ها
// فقط یکبار اجرا شود: node setup-db.js
// ⚠️ قبل از اجرا PROJECT_ID و API_KEY را پر کنید
// ============================================================

import { Client, Databases } from "node-appwrite";

const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "YOUR_PROJECT_ID"; // ← عوض کنید
const API_KEY = "YOUR_API_KEY"; // ← عوض کنید
const DB_ID = "kandidatory_db";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function setup() {
  console.log("🚀 شروع ساخت دیتابیس...\n");

  // ========== دیتابیس ==========
  try {
    await db.create(DB_ID, "Kandidatory DB");
    console.log("✅ دیتابیس ساخته شد");
  } catch {
    console.log("⚠️  دیتابیس از قبل وجود دارد");
  }

  // ========== کالکشن users ==========
  console.log("\n📁 ساخت کالکشن users...");
  try {
    await db.createCollection(DB_ID, "users", "Users");
  } catch {
    console.log("⚠️  از قبل وجود دارد");
  }
  await wait(2000);

  // فیلدهای string
  const userStrings = [
    ["userId", 32, true],
    ["username", 64, false],
    ["firstName", 128, false],
    ["lastName", 128, false],
  ];
  for (const [key, size, req] of userStrings) {
    try {
      await db.createStringAttribute(DB_ID, "users", key, size, req);
      console.log(`  ✅ ${key} (string ${size})`);
    } catch {
      console.log(`  ⚠️  ${key} از قبل وجود دارد`);
    }
  }

  // tempAnswers — longtext (بدون محدودیت طول / حداکثر ۱۰۰۰۰۰)
  try {
    await db.createStringAttribute(DB_ID, "users", "tempAnswers", 100000, false);
    console.log("  ✅ tempAnswers (longtext)");
  } catch {
    console.log("  ⚠️  tempAnswers از قبل وجود دارد");
  }

  // currentStep — integer
  try {
    await db.createIntegerAttribute(DB_ID, "users", "currentStep", false, 0);
    console.log("  ✅ currentStep (integer)");
  } catch {
    console.log("  ⚠️  currentStep از قبل وجود دارد");
  }

  // datetime ها
  for (const key of ["createdAt", "lastInteraction"]) {
    try {
      await db.createDatetimeAttribute(DB_ID, "users", key, false);
      console.log(`  ✅ ${key} (datetime)`);
    } catch {
      console.log(`  ⚠️  ${key} از قبل وجود دارد`);
    }
  }

  await wait(3000);

  // ایندکس
  try {
    await db.createIndex(DB_ID, "users", "idx_userId", "key", ["userId"]);
    console.log("  ✅ ایندکس userId");
  } catch {
    console.log("  ⚠️  ایندکس از قبل وجود دارد");
  }

  // ========== کالکشن consultations ==========
  console.log("\n📁 ساخت کالکشن consultations...");
  try {
    await db.createCollection(DB_ID, "consultations", "Consultations");
  } catch {
    console.log("⚠️  از قبل وجود دارد");
  }
  await wait(2000);

  const consStrings = [
    ["userId", 32, true],
    ["electionType", 32, false],
    ["region", 128, false],
    ["riskLevel", 16, false],
  ];
  for (const [key, size, req] of consStrings) {
    try {
      await db.createStringAttribute(DB_ID, "consultations", key, size, req);
      console.log(`  ✅ ${key} (string ${size})`);
    } catch {
      console.log(`  ⚠️  ${key} از قبل وجود دارد`);
    }
  }

  // longtext ها
  for (const key of ["answers", "finalReport"]) {
    try {
      await db.createStringAttribute(DB_ID, "consultations", key, 100000, false);
      console.log(`  ✅ ${key} (longtext)`);
    } catch {
      console.log(`  ⚠️  ${key} از قبل وجود دارد`);
    }
  }

  // score
  try {
    await db.createIntegerAttribute(DB_ID, "consultations", "score", false, 0);
    console.log("  ✅ score (integer)");
  } catch {
    console.log("  ⚠️  score از قبل وجود دارد");
  }

  // datetime
  for (const key of ["createdAt", "updatedAt"]) {
    try {
      await db.createDatetimeAttribute(DB_ID, "consultations", key, false);
      console.log(`  ✅ ${key} (datetime)`);
    } catch {
      console.log(`  ⚠️  ${key} از قبل وجود دارد`);
    }
  }

  await wait(3000);

  try {
    await db.createIndex(DB_ID, "consultations", "idx_userId", "key", [
      "userId",
    ]);
    console.log("  ✅ ایندکس userId");
  } catch {
    console.log("  ⚠️  ایندکس از قبل وجود دارد");
  }

  // ========== کالکشن leads_status ==========
  console.log("\n📁 ساخت کالکشن leads_status...");
  try {
    await db.createCollection(DB_ID, "leads_status", "Leads Status");
  } catch {
    console.log("⚠️  از قبل وجود دارد");
  }
  await wait(2000);

  const leadStrings = [
    ["userId", 32, true],
    ["leadTemperature", 8, false],
    ["purchasedPlan", 16, false],
  ];
  for (const [key, size, req] of leadStrings) {
    try {
      await db.createStringAttribute(DB_ID, "leads_status", key, size, req);
      console.log(`  ✅ ${key} (string ${size})`);
    } catch {
      console.log(`  ⚠️  ${key} از قبل وجود دارد`);
    }
  }

  // notes — longtext
  try {
    await db.createStringAttribute(DB_ID, "leads_status", "notes", 100000, false);
    console.log("  ✅ notes (longtext)");
  } catch {
    console.log("  ⚠️  notes از قبل وجود دارد");
  }

  // datetime
  for (const key of ["lastFollowUp", "createdAt", "updatedAt"]) {
    try {
      await db.createDatetimeAttribute(DB_ID, "leads_status", key, false);
      console.log(`  ✅ ${key} (datetime)`);
    } catch {
      console.log(`  ⚠️  ${key} از قبل وجود دارد`);
    }
  }

  await wait(3000);

  try {
    await db.createIndex(DB_ID, "leads_status", "idx_userId", "key", [
      "userId",
    ]);
    console.log("  ✅ ایندکس userId");
  } catch {
    console.log("  ⚠️  ایندکس از قبل وجود دارد");
  }

  console.log("\n🎉 تمام! دیتابیس آماده است.\n");
}

setup().catch(console.error);