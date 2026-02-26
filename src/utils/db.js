// ============================================================
// 🗄️ توابع دیتابیس — نسخه کامل نهایی
// ============================================================

import { Client, Databases, ID, Query } from "node-appwrite";

let _client = null;
let _databases = null;
let _config = null;

export function initDB(env) {
  _client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);

  _databases = new Databases(_client);

  _config = {
    dbId: env.DATABASE_ID,
    users: env.COLLECTION_USERS || "users",
    consult: env.COLLECTION_CONSULT || "consultations",
    leads: env.COLLECTION_LEADS || "leads_status",
  };
}

// ============================================================
// 👤 کالکشن users
// ============================================================

export async function getUser(userId) {
  try {
    return await _databases.getDocument(
      _config.dbId,
      _config.users,
      String(userId)
    );
  } catch (e) {
    if (e.code === 404) return null;
    console.error("getUser:", e.message);
    return null;
  }
}

export async function createUser(from) {
  try {
    const now = new Date().toISOString();
    return await _databases.createDocument(
      _config.dbId,
      _config.users,
      String(from.id),
      {
        userId: String(from.id),
        username: from.username || "",
        firstName: from.first_name || "",
        lastName: from.last_name || "",
        role: "user",
        createdAt: now,
        currentStep: 0,
        tempAnswers: JSON.stringify({}),
        lastInteraction: now,
      }
    );
  } catch (e) {
    console.error("createUser:", e.message);
    throw e;
  }
}

export async function getOrCreateUser(from) {
  let user = await getUser(from.id);
  if (!user) {
    user = await createUser(from);
  }
  return user;
}

export async function updateUser(userId, data) {
  try {
    data.lastInteraction = new Date().toISOString();
    await _databases.updateDocument(
      _config.dbId,
      _config.users,
      String(userId),
      data
    );
  } catch (e) {
    console.error("updateUser:", e.message);
    throw e;
  }
}

export async function isAdmin(userId) {
  const user = await getUser(userId);
  return user && user.role === "admin";
}

// ============================================================
// 📊 کالکشن consultations
// ============================================================

export async function saveConsultation(data) {
  try {
    const now = new Date().toISOString();
    return await _databases.createDocument(
      _config.dbId,
      _config.consult,
      ID.unique(),
      {
        userId: data.userId,
        fullName: data.fullName || "",
        electionType: data.electionType || "",
        region: data.region || "",
        answers: JSON.stringify(data.answers),
        score: data.score || 0,
        riskLevel: data.riskLevel || "low",
        status: "free",
        adminNotes: "",
        analysisReport: "",
        finalReport: data.finalReport || "",
        createdAt: now,
        updatedAt: now,
      }
    );
  } catch (e) {
    console.error("saveConsultation:", e.message);
    throw e;
  }
}

export async function getLastConsultation(userId) {
  try {
    const res = await _databases.listDocuments(
      _config.dbId,
      _config.consult,
      [
        Query.equal("userId", String(userId)),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ]
    );
    return res.documents.length > 0 ? res.documents[0] : null;
  } catch (e) {
    console.error("getLastConsultation:", e.message);
    return null;
  }
}

export async function listConsultations(page = 0, limit = 5) {
  try {
    const res = await _databases.listDocuments(
      _config.dbId,
      _config.consult,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(page * limit),
      ]
    );
    return res;
  } catch (e) {
    console.error("listConsultations:", e.message);
    return { documents: [], total: 0 };
  }
}

export async function getConsultation(docId) {
  try {
    return await _databases.getDocument(
      _config.dbId,
      _config.consult,
      docId
    );
  } catch (e) {
    console.error("getConsultation:", e.message);
    return null;
  }
}

export async function updateConsultation(docId, data) {
  try {
    data.updatedAt = new Date().toISOString();
    await _databases.updateDocument(
      _config.dbId,
      _config.consult,
      docId,
      data
    );
  } catch (e) {
    console.error("updateConsultation:", e.message);
    throw e;
  }
}

// ============================================================
// 🎯 کالکشن leads_status
// ============================================================

export async function upsertLead(userId, data) {
  const uid = String(userId);
  const now = new Date().toISOString();

  try {
    await _databases.getDocument(_config.dbId, _config.leads, uid);
    await _databases.updateDocument(_config.dbId, _config.leads, uid, {
      ...data,
      updatedAt: now,
    });
  } catch (e) {
    if (e.code === 404) {
      try {
        await _databases.createDocument(_config.dbId, _config.leads, uid, {
          userId: uid,
          leadTemperature: data.leadTemperature || "cold",
          purchasedPlan: data.purchasedPlan || "none",
          lastFollowUp: now,
          notes: data.notes || "",
          createdAt: now,
          updatedAt: now,
        });
      } catch (ce) {
        console.error("createLead:", ce.message);
      }
    } else {
      console.error("upsertLead:", e.message);
    }
  }
}
