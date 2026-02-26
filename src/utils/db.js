// src/utils/db.js
// ─── توابع CRUD — سازگار با ساختار واقعی دیتابیس ───
// کالکشن‌ها: users, consultations, leads_status
// فیلدهای جدید: nationalId (string 10), phone (string 11)

import { Client, Databases, Query, ID } from "node-appwrite";

let client;
let databases;
let dbId;
let usersCol;
let consultCol;
let leadsCol;

/**
 * مقداردهی اولیه
 */
export function initDB(env) {
  client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);

  databases = new Databases(client);

  dbId = env.APPWRITE_DB_ID || "kandidatory_db";
  usersCol = env.APPWRITE_USERS_COLLECTION || "users";
  consultCol = env.APPWRITE_CONSULTATIONS_COLLECTION || "consultations";
  leadsCol = env.APPWRITE_LEADS_COLLECTION || "leads_status";
}

// ═══════════════════════════════════════════
//  Users
// ═══════════════════════════════════════════

/**
 * دریافت یا ایجاد کاربر
 * ستون‌ها: userId, username, firstName, lastName, currentStep, tempAnswers,
 *          nationalId, phone, role, createdAt, lastInteraction
 */
export async function getOrCreateUser(telegramId, fromData = {}) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("userId", String(telegramId)),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) return res.documents[0];

    // ایجاد جدید
    const doc = await databases.createDocument(dbId, usersCol, ID.unique(), {
      userId: String(telegramId),
      username: fromData.username || "",
      firstName: fromData.first_name || "",
      lastName: fromData.last_name || "",
      nationalId: "",
      phone: "",
      currentStep: null,
      tempAnswers: "{}",
      role: "user",
      createdAt: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
    });

    return doc;
  } catch (e) {
    console.error("خطا در getOrCreateUser:", e.message);
    throw e;
  }
}

/**
 * بروزرسانی کاربر
 */
export async function updateUser(telegramId, data) {
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("userId", String(telegramId)),
      Query.limit(1),
    ]);

    if (res.documents.length === 0)
      throw new Error(`کاربر ${telegramId} یافت نشد`);

    await databases.updateDocument(dbId, usersCol, res.documents[0].$id, data);
  } catch (e) {
    console.error("خطا در updateUser:", e.message);
    throw e;
  }
}

// ═══════════════════════════════════════════
//  Consultations
// ═══════════════════════════════════════════

/**
 * ذخیره مشاوره جدید
 * ستون‌ها: userId, electionType, region, answers, score, riskLevel,
 *          finalReport, fullName, status, adminNotes, analysisReport
 */
export async function saveConsultation(telegramId, data) {
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
      adminNotes: "",
      analysisReport: "",
    });
  } catch (e) {
    console.error("خطا در saveConsultation:", e.message);
    throw e;
  }
}

// ═══════════════════════════════════════════
//  Leads Status
// ═══════════════════════════════════════════

/**
 * ایجاد یا بروزرسانی لید
 * ستون‌ها: userId, leadTemperature, purchasedPlan, lastFollowUp, notes
 */
export async function upsertLead(telegramId, data) {
  try {
    const res = await databases.listDocuments(dbId, leadsCol, [
      Query.equal("userId", String(telegramId)),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) {
      // بروزرسانی
      const existing = res.documents[0];
      const updateData = {};

      if (data.leadTemperature) updateData.leadTemperature = data.leadTemperature;
      if (data.purchasedPlan) updateData.purchasedPlan = data.purchasedPlan;
      if (data.notes) {
        // اضافه کردن به یادداشت‌های قبلی
        const prev = existing.notes || "";
        updateData.notes = prev
          ? `${prev}\n---\n${data.notes}`
          : data.notes;
      }
      updateData.lastFollowUp = new Date().toISOString();

      await databases.updateDocument(dbId, leadsCol, existing.$id, updateData);
    } else {
      // ایجاد جدید
      await databases.createDocument(dbId, leadsCol, ID.unique(), {
        userId: String(telegramId),
        leadTemperature: data.leadTemperature || "cold",
        purchasedPlan: data.purchasedPlan || "none",
        lastFollowUp: new Date().toISOString(),
        notes: data.notes || "",
      });
    }
  } catch (e) {
    console.error("خطا در upsertLead:", e.message);
    throw e;
  }
}

// ═══════════════════════════════════════════
//  توابع جستجو (برای پنل ادمین)
// ═══════════════════════════════════════════

/**
 * جستجو با کد ملی
 */
export async function findByNationalId(nationalId) {
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
 * جستجو با شماره تماس
 */
export async function findByPhone(phone) {
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
export async function getUserConsultations(telegramId) {
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
 * آمار کلی
 */
export async function getStats() {
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
 * لیست آخرین لیدها
 */
export async function listLeads(limit = 10, offset = 0) {
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
