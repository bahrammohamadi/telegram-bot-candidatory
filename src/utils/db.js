const { Client, Databases, Query, ID } = require("node-appwrite");

let client;
let databases;
let dbId;
let usersCol;
let consultCol;
let leadsCol;

function initDB() {
  if (client) return;

  const endpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const projectId = process.env.APPWRITE_PROJECT_ID || "fra-699d6797003d63f0fd8c";
  const apiKey = process.env.APPWRITE_API_KEY || "";

  dbId = process.env.DATABASE_ID || process.env.APPWRITE_DB_ID || "699d6d5a0038857d3279";
  usersCol = process.env.COLLECTION_USERS || process.env.APPWRITE_USERS_COLLECTION || "users";
  consultCol = process.env.COLLECTION_CONSULT || process.env.APPWRITE_CONSULTATIONS_COLLECTION || "consultations";
  leadsCol = process.env.COLLECTION_LEADS || process.env.APPWRITE_LEADS_COLLECTION || "leads_status";

  client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  databases = new Databases(client);
}

async function getOrCreateUser(userId, defaults = {}) {
  initDB();
  const uid = String(userId);

  try {
    const doc = await databases.getDocument(dbId, usersCol, uid);
    return doc;
  } catch (e) {
    if (e.code === 404) {
      const newDoc = {
        userId: uid,
        username: null,
        firstName: null,
        lastName: null,
        currentStep: null,
        tempAnswers: "{}",
        createdAt: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        role: "user",
        purchasedPlan: null,
        nationalId: null,
        phone: null,
        lastInteractionNew: new Date().toISOString(),
        ...defaults,
      };
      return await databases.createDocument(dbId, usersCol, uid, newDoc);
    }
    throw e;
  }
}

async function updateUser(userId, updates) {
  initDB();
  const uid = String(userId);

  const payload = {
    ...updates,
    lastInteraction: new Date().toISOString(),
    lastInteractionNew: new Date().toISOString(),
  };

  return await databases.updateDocument(dbId, usersCol, uid, payload);
}

async function saveConsultation(data) {
  initDB();
  return await databases.createDocument(dbId, consultCol, ID.unique(), data);
}

async function getUserConsultations(userId) {
  initDB();
  const uid = String(userId);
  const res = await databases.listDocuments(dbId, consultCol, [
    Query.equal("userId", uid),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
  return res.documents || [];
}

async function upsertLead(userId, leadData) {
  initDB();
  const uid = String(userId);

  try {
    const existing = await databases.getDocument(dbId, leadsCol, uid);
    return await databases.updateDocument(dbId, leadsCol, uid, {
      ...leadData,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    if (e.code === 404) {
      return await databases.createDocument(dbId, leadsCol, uid, {
        userId: uid,
        leadTemperature: "cold",
        purchasedPlan: "none",
        lastFollowUp: new Date().toISOString(),
        notes: "{}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...leadData,
      });
    }
    throw e;
  }
}

async function getStats() {
  initDB();
  const users = await databases.listDocuments(dbId, usersCol, [Query.limit(1)]);
  const consultations = await databases.listDocuments(dbId, consultCol, [Query.limit(1)]);
  const leads = await databases.listDocuments(dbId, leadsCol, [Query.limit(1)]);

  return {
    totalUsers: users.total || 0,
    totalConsultations: consultations.total || 0,
    totalLeads: leads.total || 0,
  };
}

async function listLeads(limit = 20, offset = 0) {
  initDB();
  const res = await databases.listDocuments(dbId, leadsCol, [
    Query.orderDesc("updatedAt"),
    Query.limit(limit),
    Query.offset(offset),
  ]);
  return res.documents || [];
}

async function getUser(userId) {
  initDB();
  try {
    return await databases.getDocument(dbId, usersCol, String(userId));
  } catch {
    return null;
  }
}

module.exports = {
  getOrCreateUser,
  updateUser,
  saveConsultation,
  getUserConsultations,
  upsertLead,
  getStats,
  listLeads,
  getUser,
};
