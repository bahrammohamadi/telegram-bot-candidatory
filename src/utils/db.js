// src/utils/db.js
// ─── CommonJS — سازگار با دیتابیس واقعی Appwrite ───
// نسخه اصلاح‌شده: ۱۴۰۴/۱۲/۰۸ — اضافه شدن lastInteractionNew + بهبود پایداری

const { Client, Databases, Query, ID } = require("node-appwrite");

let client;
let databases;
let dbId;
let usersCol;
let consultCol;
let leadsCol;

/**
 * مقداردهی اولیه دیتابیس + ایندکس‌های پیشنهادی
 */
function initDB(env) {
  client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);

  databases = new Databases(client);
  dbId = env.APPWRITE_DB_ID || "kandidatory_db";
  usersCol = env.APPWRITE_USERS_COLLECTION || "users";
  consultCol = env.APPWRITE_CONSULTATIONS_COLLECTION || "consultations";
  leadsCol = env.APPWRITE_LEADS_COLLECTION || "leads_status";

  // ─── ایندکس‌های پیشنهادی برای سرعت بیشتر ───
  // فقط یک بار اجرا می‌شه (در deploy اول یا setup-db.js)
  // users: ایندکس روی userId, nationalId, phone
  // consultations: ایندکس روی userId
  // leads_status: ایندکس روی userId
  console.log("دیتابیس مقداردهی شد. ایندکس‌ها در صورت نیاز در Appwrite Console اضافه شوند.");
}

/**
 * دریافت یا ایجاد کاربر (ایمن‌شده با lastInteractionNew)
 */
async function getOrCreateUser(telegramId, fromData = {}) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("userId", String(telegramId)),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) return res.documents[0];

    // زمان کوتاه‌شده برای سازگاری با سایز string
    const nowShort = new Date().toISOString().slice(0, 19); // "2026-02-28T14:35:22"

    // فیلدهای پایه
    const userData = {
      userId: String(telegramId),
      username: fromData.username || "",
      firstName: fromData.first_name || "",
      lastName: fromData.last_name || "",
      currentStep: null,
      tempAnswers: "{}",
      role: "user",
      createdAt: new Date().toISOString(),
      lastInteractionNew: nowShort,      // فیلد جدید
    };

    // فیلدهای اختیاری (اگر در کالکشن تعریف شده باشند)
    try {
      userData.nationalId = "";
      userData.phone = "";
      const doc = await databases.createDocument(dbId, usersCol, ID.unique(), userData);
      return doc;
    } catch (err) {
      console.warn("⚠️ فیلدهای اختیاری (nationalId/phone) اضافه نشدند:", err.message);
      // تلاش دوم بدون فیلدهای اختیاری
      const fallbackData = { ...userData };
      delete fallbackData.nationalId;
      delete fallbackData.phone;
      const docFallback = await databases.createDocument(dbId, usersCol, ID.unique(), fallbackData);
      return docFallback;
    }
  } catch (e) {
    console.error("❌ خطا در getOrCreateUser:", e.message);
    throw e;
  }
}

/**
 * بروزرسانی کاربر (ایمن‌شده + آپدیت lastInteractionNew اگر لازم بود)
 */
async function updateUser(telegramId, data) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("userId", String(telegramId)),
      Query.limit(1),
    ]);

    if (res.documents.length === 0) {
      console.warn(`کاربر ${telegramId} یافت نشد`);
      return; // به جای throw، فقط هشدار
    }

    // پاک کردن فیلدهای undefined
    const cleanData = {};
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        cleanData[key] = data[key];
      }
    }

    // اگر lastInteractionNew در data نبود، خودکار اضافه کن
    if (!cleanData.lastInteractionNew) {
      cleanData.lastInteractionNew = new Date().toISOString().slice(0, 19);
    }

    await databases.updateDocument(dbId, usersCol, res.documents[0].$id, cleanData);
  } catch (e) {
    console.error("❌ خطا در updateUser:", e.message);
    // throw نمی‌کنیم تا ربات متوقف نشه
  }
}

/**
 * ذخیره مشاوره جدید
 */
async function saveConsultation(telegramId, data) {
  try {
    await databases.createDocument(dbId, consultCol, ID.unique(), {
      userId: String(telegramId),
      electionType: data.electionType || "",
      region: data.region || "",
      answers: data.answers || "{}",
      score: data.score || 0,
      riskLevel: data.riskLevel || "low",
      finalReport: data.finalReport || "",
      fullName: data.fullName || "",
      status: data.status || "free",
      adminNotes: data.adminNotes || "",
      analysisReport: data.analysisReport || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ خطا در saveConsultation:", e.message);
    throw e;
  }
}

/**
 * ایجاد یا بروزرسانی لید
 */
async function upsertLead(telegramId, data) {
  try {
    const res = await databases.listDocuments(dbId, leadsCol, [
      Query.equal("userId", String(telegramId)),
      Query.limit(1),
    ]);

    const now = new Date().toISOString();

    if (res.documents.length > 0) {
      const existing = res.documents[0];
      const upd = {
        updatedAt: now,
      };

      if (data.leadTemperature) upd.leadTemperature = data.leadTemperature;
      if (data.purchasedPlan) upd.purchasedPlan = data.purchasedPlan;
      if (data.notes) {
        const prev = existing.notes || "";
        upd.notes = prev ? `${prev}\n---\n${data.notes}` : data.notes;
      }
      if (!upd.lastFollowUp) upd.lastFollowUp = now;

      await databases.updateDocument(dbId, leadsCol, existing.$id, upd);
    } else {
      await databases.createDocument(dbId, leadsCol, ID.unique(), {
        userId: String(telegramId),
        leadTemperature: data.leadTemperature || "cold",
        purchasedPlan: data.purchasedPlan || "none",
        lastFollowUp: now,
        notes: data.notes || "",
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (e) {
    console.error("❌ خطا در upsertLead:", e.message);
    throw e;
  }
}

/**
 * جستجو با کد ملی
 */
async function findByNationalId(nationalId) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("nationalId", nationalId),
      Query.limit(5),
    ]);
    return res.documents;
  } catch (e) {
    console.error("خطا در findByNationalId:", e.message);
    return [];
  }
}

/**
 * جستجو با شماره تلفن
 */
async function findByPhone(phone) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("phone", phone),
      Query.limit(5),
    ]);
    return res.documents;
  } catch (e) {
    console.error("خطا در findByPhone:", e.message);
    return [];
  }
}

/**
 * دریافت مشاوره‌های یک کاربر
 */
async function getUserConsultations(telegramId) {
  try {
    const res = await databases.listDocuments(dbId, consultCol, [
      Query.equal("userId", String(telegramId)),
      Query.orderDesc("$createdAt"),
      Query.limit(10),
    ]);
    return res.documents;
  } catch (e) {
    console.error("خطا در getUserConsultations:", e.message);
    return [];
  }
}

/**
 * آمار کلی (برای پنل ادمین)
 */
async function getStats() {
  try {
    const [u, c, l] = await Promise.all([
      databases.listDocuments(dbId, usersCol, [Query.limit(1)]),
      databases.listDocuments(dbId, consultCol, [Query.limit(1)]),
      databases.listDocuments(dbId, leadsCol, [Query.limit(1)]),
    ]);
    return {
      totalUsers: u.total,
      totalConsultations: c.total,
      totalLeads: l.total,
    };
  } catch (e) {
    console.error("خطا در getStats:", e.message);
    return { totalUsers: 0, totalConsultations: 0, totalLeads: 0 };
  }
}

/**
 * لیست آخرین لیدها (برای پنل ادمین)
 */
async function listLeads(limit = 10, offset = 0) {
  try {
    return await databases.listDocuments(dbId, leadsCol, [
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ]);
  } catch (e) {
    console.error("خطا در listLeads:", e.message);
    return { documents: [], total: 0 };
  }
}

module.exports = {
  initDB,
  getOrCreateUser,
  updateUser,
  saveConsultation,
  upsertLead,
  findByNationalId,
  findByPhone,
  getUserConsultations,
  getStats,
  listLeads,
};
