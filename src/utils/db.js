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

async function listLeads(options = {}) {
  initDB();
  const { status, limit = 20, offset = 0 } = options;
  
  const queries = [Query.orderDesc("updatedAt"), Query.limit(limit)];
  if (offset > 0) queries.push(Query.offset(offset));
  if (status && status !== "all") queries.push(Query.equal("status", status));
  
  const res = await databases.listDocuments(dbId, leadsCol, queries);
  return res.documents || [];
}

async function updateLead(leadId, updates) {
  initDB();
  return await databases.updateDocument(dbId, leadsCol, String(leadId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

async function findByNationalId(nationalId) {
  initDB();
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("nationalId", nationalId),
      Query.limit(1),
    ]);
    return res.documents?.[0] || null;
  } catch {
    return null;
  }
}

async function findByPhone(phone) {
  initDB();
  try {
    const res = await databases.listDocuments(dbId, usersCol, [
      Query.equal("phone", phone),
      Query.limit(1),
    ]);
    return res.documents?.[0] || null;
  } catch {
    return null;
  }
}

async function getUserById(userId) {
  initDB();
  try {
    return await databases.getDocument(dbId, usersCol, String(userId));
  } catch {
    return null;
  }
}

async function listAllUsers(options = {}) {
  initDB();
  const { limit = 10000, offset = 0 } = options;
  const res = await databases.listDocuments(dbId, usersCol, [
    Query.limit(limit),
    Query.offset(offset),
  ]);
  return res.documents || [];
}

async function listRecentUsers(options = {}) {
  initDB();
  const { limit = 50 } = options;
  const res = await databases.listDocuments(dbId, usersCol, [
    Query.orderDesc("lastInteractionNew"),
    Query.limit(limit),
  ]);
  return res.documents || [];
}

async function getStats() {
  initDB();
  
  // آمار کاربران
  const usersRes = await databases.listDocuments(dbId, usersCol, [Query.limit(1)]);
  const totalUsers = usersRes.total || 0;
  
  // آمار مشاوره‌ها
  const consultRes = await databases.listDocuments(dbId, consultCol, [Query.limit(1)]);
  const totalConsultations = consultRes.total || 0;
  
  // آمار لیدها
  const leadsRes = await databases.listDocuments(dbId, leadsCol, [Query.limit(1)]);
  const totalLeads = leadsRes.total || 0;
  
  // شمارش بر اساس وضعیت لید
  let pendingLeads = 0, confirmedLeads = 0, rejectedLeads = 0, totalRevenue = 0;
  try {
    const pendingRes = await databases.listDocuments(dbId, leadsCol, [Query.equal("status", "pending"), Query.limit(1)]);
    pendingLeads = pendingRes.total || 0;
  } catch {}
  try {
    const confirmedRes = await databases.listDocuments(dbId, leadsCol, [Query.equal("status", "confirmed"), Query.limit(1)]);
    confirmedLeads = confirmedRes.total || 0;
  } catch {}
  try {
    const rejectedRes = await databases.listDocuments(dbId, leadsCol, [Query.equal("status", "rejected"), Query.limit(1)]);
    rejectedLeads = rejectedRes.total || 0;
  } catch {}
  
  // کاربران بر اساس پلن
  let planFree = 0, planStarter = 0, planProfessional = 0, planVip = 0;
  try {
    const freeRes = await databases.listDocuments(dbId, usersCol, [Query.or([Query.equal("purchasedPlan", "free"), Query.equal("purchasedPlan", "none"), Query.isNull("purchasedPlan")]), Query.limit(1)]);
    planFree = freeRes.total || 0;
  } catch {}
  try {
    const starterRes = await databases.listDocuments(dbId, usersCol, [Query.equal("purchasedPlan", "starter"), Query.limit(1)]);
    planStarter = starterRes.total || 0;
  } catch {}
  try {
    const profRes = await databases.listDocuments(dbId, usersCol, [Query.equal("purchasedPlan", "professional"), Query.limit(1)]);
    planProfessional = profRes.total || 0;
  } catch {}
  try {
    const vipRes = await databases.listDocuments(dbId, usersCol, [Query.equal("purchasedPlan", "vip"), Query.limit(1)]);
    planVip = vipRes.total || 0;
  } catch {}
  
  // مشاوره‌ها بر اساس نوع
  let consultReadiness = 0, consultSwot = 0, consultOther = 0;
  try {
    const rRes = await databases.listDocuments(dbId, consultCol, [Query.equal("type", "readiness"), Query.limit(1)]);
    consultReadiness = rRes.total || 0;
  } catch {}
  try {
    const sRes = await databases.listDocuments(dbId, consultCol, [Query.equal("type", "swot"), Query.limit(1)]);
    consultSwot = sRes.total || 0;
  } catch {}
  consultOther = Math.max(0, totalConsultations - consultReadiness - consultSwot);
  
  // کاربران فعال (امروز و هفته)
  let activeToday = 0, activeWeek = 0, newToday = 0, newWeek = 0;
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const activeTodayRes = await databases.listDocuments(dbId, usersCol, [Query.greaterThan("lastInteractionNew", todayStart), Query.limit(1)]);
    activeToday = activeTodayRes.total || 0;
    
    const activeWeekRes = await databases.listDocuments(dbId, usersCol, [Query.greaterThan("lastInteractionNew", weekAgo), Query.limit(1)]);
    activeWeek = activeWeekRes.total || 0;
    
    const newTodayRes = await databases.listDocuments(dbId, usersCol, [Query.greaterThan("createdAt", todayStart), Query.limit(1)]);
    newToday = newTodayRes.total || 0;
    
    const newWeekRes = await databases.listDocuments(dbId, usersCol, [Query.greaterThan("createdAt", weekAgo), Query.limit(1)]);
    newWeek = newWeekRes.total || 0;
  } catch {}
  
  // محاسبه درآمد کل (جمع قیمت لیدهای تأییدشده)
  try {
    const confirmedLeadsList = await databases.listDocuments(dbId, leadsCol, [
      Query.equal("status", "confirmed"),
      Query.limit(10000),
    ]);
    totalRevenue = (confirmedLeadsList.documents || []).reduce((sum, lead) => {
      return sum + (lead.priceNumeric || 0);
    }, 0);
  } catch {}

  return {
    totalUsers,
    totalConsultations,
    totalLeads,
    pendingLeads,
    confirmedLeads,
    rejectedLeads,
    totalRevenue,
    planFree,
    planStarter,
    planProfessional,
    planVip,
    consultReadiness,
    consultSwot,
    consultOther,
    activeToday,
    activeWeek,
    newToday,
    newWeek,
  };
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
  updateLead,
  getStats,
  listLeads,
  getUser,
  getUserById,
  findByNationalId,
  findByPhone,
  listAllUsers,
  listRecentUsers,
};
