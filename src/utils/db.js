// src/utils/db.js
// ─── توابع CRUD با node-appwrite ───
// سازگار با دیتابیس فعلی: users / consultations / leads_status
// فیلدهای جدید اضافه‌شده: nationalId, phone, fullName

import { Client, Databases, Query, ID } from "node-appwrite";

let client, databases, dbId;
let usersCol, consultationsCol, leadsCol;

// ═══════════════════════════════════════
//  مقداردهی اولیه
// ═══════════════════════════════════════

export function initDB(env) {
  client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);

  databases = new Databases(client);

  dbId = env.APPWRITE_DB_ID || "kandidatory_db";
  usersCol = env.APPWRITE_USERS_COLLECTION || "users";
  consultationsCol = env.APPWRITE_CONSULTATIONS_COLLECTION || "consultations";
  leadsCol = env.APPWRITE_LEADS_COLLECTION || "leads_status";
}

// ═══════════════════════════════════════
//  Users
// ═══════════════════════════════════════

/**
 * دریافت یا ایجاد کاربر
 * فیلد userId = تلگرام آیدی (string)
 */
export async function getOrCreateUser(telegramId, fromData = {}) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("userId", telegramId),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) return res.documents[0];

    // ایجاد کاربر جدید
    const doc = await databases.createDocument(dbId, usersCol, ID.unique(), {
      userId: telegramId,
      username: fromData.username || "",
      firstName: fromData.first_name || "",
      lastName: fromData.last_name || "",
      nationalId: "",
      phone: "",
      fullName: "",
      currentStep: null,
      tempAnswers: "{}",
      role: "user",
      createdAt: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
    });

    return doc;
  } catch (err) {
    console.error("خطا getOrCreateUser:", err.message);
    throw err;
  }
}

/**
 * بروزرسانی کاربر
 */
export async function updateUser(telegramId, data) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("userId", telegramId),
      Query.limit(1),
    ]);

    if (res.documents.length === 0) throw new Error(`کاربر ${telegramId} یافت نشد`);

    await databases.updateDocument(dbId, usersCol, res.documents[0].$id, data);
  } catch (err) {
    console.error("خطا updateUser:", err.message);
    throw err;
  }
}

// ═══════════════════════════════════════
//  Consultations
// ═══════════════════════════════════════

/**
 * ذخیره مشاوره جدید
 * سازگار با ستون‌های موجود: userId, electionType, region, answers, score, riskLevel, finalReport, fullName, status
 */
export async function saveConsultation(telegramId, data) {
  try {
    await databases.createDocument(dbId, consultationsCol, ID.unique(), {
      userId: telegramId,
      electionType: data.electionType || "",
      region: data.region || "",
      answers: data.answers || "",
      score: data.score || 0,
      riskLevel: data.riskLevel || "medium",
      finalReport: data.finalReport || "",
      fullName: data.fullName || "",
      status: data.status || "free",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("خطا saveConsultation:", err.message);
    throw err;
  }
}

// ═══════════════════════════════════════
//  Leads
// ═══════════════════════════════════════

/**
 * ایجاد یا بروزرسانی لید
 * سازگار با ستون‌های leads_status: userId, leadTemperature, purchasedPlan, notes, ...
 */
export async function upsertLead(telegramId, data) {
  try {
    const res = await databases.listDocuments(dbId, leadsCol, [
      Query.equal("userId", telegramId),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) {
      await databases.updateDocument(dbId, leadsCol, res.documents[0].$id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await databases.createDocument(dbId, leadsCol, ID.unique(), {
        userId: telegramId,
        leadTemperature: data.leadTemperature || "cold",
        purchasedPlan: data.purchasedPlan || "none",
        notes: data.notes || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("خطا upsertLead:", err.message);
    throw err;
  }
}

// ═══════════════════════════════════════
//  جستجو (پنل ادمین)
// ═══════════════════════════════════════

/** جستجو با کد ملی */
export async function findUserByNationalId(nationalId) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("nationalId", nationalId),
      Query.limit(1),
    ]);
    return res.documents.length > 0 ? res.documents[0] : null;
  } catch (err) {
    console.error("خطا findUserByNationalId:", err.message);
    return null;
  }
}

/** جستجو با شماره تماس */
export async function findUserByPhone(phone) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("phone", phone),
      Query.limit(1),
    ]);
    return res.documents.length > 0 ? res.documents[0] : null;
  } catch (err) {
    console.error("خطا findUserByPhone:", err.message);
    return null;
  }
}

/** دریافت لیست لیدها */
export async function listLeads(limit = 25, offset = 0) {
  try {
    return await databases.listDocuments(dbId, leadsCol, [
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ]);
  } catch (err) {
    console.error("خطا listLeads:", err.message);
    return { documents: [], total: 0 };
  }
}

/** دریافت مشاوره‌های یک کاربر */
export async function getUserConsultations(telegramId) {
  try {
    return await databases.listDocuments(dbId, consultationsCol, [
      Query.equal("userId", telegramId),
      Query.orderDesc("$createdAt"),
      Query.limit(10),
    ]);
  } catch (err) {
    console.error("خطا getUserConsultations:", err.message);
    return { documents: [], total: 0 };
  }
}

/** آمار کلی */
export async function getStats() {
  try {
    const [u, c, l] = await Promise.all([
      databases.listDocuments(dbId, usersCol, [Query.limit(1)]),
      databases.listDocuments(dbId, consultationsCol, [Query.limit(1)]),
      databases.listDocuments(dbId, leadsCol, [Query.limit(1)]),
    ]);
    return {
      totalUsers: u.total,
      totalConsultations: c.total,
      totalLeads: l.total,
    };
  } catch (err) {
    console.error("خطا getStats:", err.message);
    return { totalUsers: 0, totalConsultations: 0, totalLeads: 0 };
  }
}
