// ============================================================
// 🗄️ توابع ارتباط با دیتابیس Appwrite
// تمام عملیات CRUD مربوط به ۳ کالکشن
// ============================================================

import { Client, Databases, ID, Query } from "node-appwrite";

let _client = null;
let _databases = null;
let _config = null;

/**
 * مقداردهی اولیه Appwrite — فقط یکبار اجرا می‌شود
 * @param {object} env متغیرهای محیطی
 */
export function initDB(env) {
  _client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);

  _databases = new Databases(_client);

  _config = {
    dbId: env.DATABASE_ID || "kandidatory_db",
    users: env.COLLECTION_USERS || "users",
    consult: env.COLLECTION_CONSULT || "consultations",
    leads: env.COLLECTION_LEADS || "leads_status",
  };
}

/**
 * برگرداندن تنظیمات فعلی
 */
export function getConfig() {
  return _config;
}

/**
 * برگرداندن instance دیتابیس
 */
export function getDB() {
  return _databases;
}

// ============================================================
// 👤 کالکشن users
// Document ID = userId (شناسه تلگرام)
// ============================================================

/**
 * دریافت داکیومنت کاربر بر اساس userId تلگرام
 * اگر وجود نداشت null برمی‌گرداند
 */
export async function getUser(userId) {
  try {
    const doc = await _databases.getDocument(
      _config.dbId,
      _config.users,
      String(userId)
    );
    return doc;
  } catch (e) {
    // 404 = کاربر وجود ندارد
    if (e.code === 404) return null;
    console.error("خطا getUser:", e.message);
    return null;
  }
}

/**
 * ساخت کاربر جدید
 * Document ID = userId
 */
export async function createUser(from) {
  try {
    const now = new Date().toISOString();
    const doc = await _databases.createDocument(
      _config.dbId,
      _config.users,
      String(from.id), // ← Document ID = userId
      {
        userId: String(from.id),
        username: from.username || "",
        firstName: from.first_name || "",
        lastName: from.last_name || "",
        createdAt: now,
        currentStep: 0,
        tempAnswers: JSON.stringify({}),
        lastInteraction: now,
      }
    );
    return doc;
  } catch (e) {
    console.error("خطا createUser:", e.message);
    throw e;
  }
}

/**
 * دریافت یا ساخت کاربر — اصلی‌ترین تابع
 */
export async function getOrCreateUser(from) {
  let user = await getUser(from.id);
  if (!user) {
    user = await createUser(from);
  }
  return user;
}

/**
 * بروزرسانی فیلدهای کاربر
 */
export async function updateUser(userId, data) {
  try {
    // همیشه lastInteraction رو هم آپدیت کن
    data.lastInteraction = new Date().toISOString();

    await _databases.updateDocument(
      _config.dbId,
      _config.users,
      String(userId),
      data
    );
  } catch (e) {
    console.error("خطا updateUser:", e.message);
    throw e;
  }
}

// ============================================================
// 📊 کالکشن consultations
// Document ID = اتوماتیک
// ============================================================

/**
 * ذخیره نتیجه مشاوره جدید
 */
export async function saveConsultation(data) {
  try {
    const now = new Date().toISOString();
    await _databases.createDocument(
      _config.dbId,
      _config.consult,
      ID.unique(), // ← ID اتوماتیک
      {
        userId: data.userId,
        electionType: data.electionType || "",
        region: data.region || "",
        answers: JSON.stringify(data.answers), // ← longtext JSON
        score: data.score || 0,
        riskLevel: data.riskLevel || "low",
        finalReport: data.finalReport || "", // ← longtext
        createdAt: now,
        updatedAt: now,
      }
    );
  } catch (e) {
    console.error("خطا saveConsultation:", e.message);
    throw e;
  }
}

/**
 * دریافت آخرین مشاوره کاربر (اختیاری)
 */
export async function getLastConsultation(userId) {
  try {
    const res = await _databases.listDocuments(
      _config.dbId,
      _config.consult,
      [
        Query.equal("userId", String(userId)),
        Query.orderDesc("createdAt"),
        Query.limit(1),
      ]
    );
    return res.documents.length > 0 ? res.documents[0] : null;
  } catch (e) {
    console.error("خطا getLastConsultation:", e.message);
    return null;
  }
}

// ============================================================
// 🎯 کالکشن leads_status
// Document ID = userId
// ============================================================

/**
 * ساخت یا بروزرسانی وضعیت لید
 */
export async function upsertLead(userId, data) {
  const uid = String(userId);
  const now = new Date().toISOString();

  try {
    // سعی کن بخوانی
    await _databases.getDocument(_config.dbId, _config.leads, uid);

    // اگر وجود داشت → آپدیت
    await _databases.updateDocument(_config.dbId, _config.leads, uid, {
      ...data,
      updatedAt: now,
    });
  } catch (e) {
    if (e.code === 404) {
      // وجود ندارد → بساز
      await _databases.createDocument(_config.dbId, _config.leads, uid, {
        userId: uid,
        leadTemperature: data.leadTemperature || "cold",
        purchasedPlan: data.purchasedPlan || "none",
        lastFollowUp: now,
        notes: data.notes || "",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      console.error("خطا upsertLead:", e.message);
    }
  }
}