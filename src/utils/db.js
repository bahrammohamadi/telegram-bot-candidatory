const { Client, Databases, Query, ID } = require("node-appwrite");
const crypto = require("crypto");

let client;
let databases;
let dbId;
let usersCol;
let consultCol;
let leadsCol;
// کالکشن‌های جدید فاز ۱ (سند معماری §۸) — افزایشی و سازگار با داده‌ی موجود.
// تا وقتی setup-db.js اجرا نشود، این کالکشن‌ها وجود ندارند و فلوها
// به‌جای crash، پیام «هنوز فعال نشده» نشان می‌دهند.
let tasksCol;
let meetingsCol;
let aiJobsCol;
let auditCol;

function initDB() {
  if (client) return;

  // ⚠️ امنیتی: قبلاً مقادیر واقعی project/db ID به‌صورت hardcoded fallback
  // در کد بودند. این یعنی اگر ENV درست تنظیم نمی‌شد، ربات به دیتابیس
  // اشتباهی متصل می‌شد یا اطلاعات production در repo public لو می‌رفت.
  // اکنون fail-fast: اگر هر مقدار حیاتی نباشد، با پیام واضح خطا می‌دهیم.

  const endpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"; // public — اوکی
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId) {
    throw new Error("APPWRITE_PROJECT_ID در Environment Variables تنظیم نشده است.");
  }
  if (!apiKey) {
    throw new Error("APPWRITE_API_KEY در Environment Variables تنظیم نشده است.");
  }

  dbId = process.env.DATABASE_ID || process.env.APPWRITE_DB_ID;
  if (!dbId) {
    throw new Error("DATABASE_ID در Environment Variables تنظیم نشده است.");
  }

  // اسامی collection ها پیش‌فرض منطقی دارند (هیچ secret نیستند)
  usersCol = process.env.COLLECTION_USERS || process.env.APPWRITE_USERS_COLLECTION || "users";
  consultCol = process.env.COLLECTION_CONSULT || process.env.APPWRITE_CONSULTATIONS_COLLECTION || "consultations";
  leadsCol = process.env.COLLECTION_LEADS || process.env.APPWRITE_LEADS_COLLECTION || "leads_status";
  tasksCol = process.env.COLLECTION_TASKS || "tasks";
  meetingsCol = process.env.COLLECTION_MEETINGS || "meetings";
  aiJobsCol = process.env.COLLECTION_AI_JOBS || "ai_jobs";
  auditCol = process.env.COLLECTION_AUDIT || "audit_logs";

  client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  databases = new Databases(client);
}

async function getOrCreateUser(userId, defaults = {}) {
  initDB();
  const uid = String(userId);

  try {
    const doc = await databases.getDocument(dbId, usersCol, uid);
    if (doc.candidateProfile) {
      try { doc.profile = JSON.parse(doc.candidateProfile); } catch {}
    }
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
      const doc = await databases.createDocument(dbId, usersCol, uid, newDoc);
      if (doc.candidateProfile) {
        try { doc.profile = JSON.parse(doc.candidateProfile); } catch {}
      }
      return doc;
    }
    throw e;
  }
}

async function updateUser(userId, updates) {
  initDB();
  const uid = String(userId);

  // قبلاً هر update هم lastInteraction (datetime) و هم lastInteractionNew
  // (string) را پر می‌کرد — duplicate data. در setup-db.js کامنت
  // "legacy" روی lastInteraction خورده بود. حالا فقط جدید را پر می‌کنیم.
  // (فیلد قدیمی در schema باقی می‌ماند برای داده‌های موجود.)
  const payload = {
    ...updates,
    lastInteractionNew: new Date().toISOString(),
  };

  return await databases.updateDocument(dbId, usersCol, uid, payload);
}

async function saveConsultation(userIdOrData, dataObj) {
  initDB();
  let data;
  if (typeof userIdOrData === "string") {
    data = { userId: userIdOrData, ...dataObj };
  } else {
    data = userIdOrData;
  }
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

async function getConsultationById(consultId) {
  initDB();
  try {
    return await databases.getDocument(dbId, consultCol, String(consultId));
  } catch {
    return null;
  }
}

async function deleteConsultation(consultId) {
  initDB();
  return await databases.deleteDocument(dbId, consultCol, String(consultId));
}

async function upsertLead(userIdOrData, leadDataObj) {
  initDB();
  let uid;
  let leadData;

  if (typeof userIdOrData === "string") {
    uid = userIdOrData;
    leadData = leadDataObj || {};
  } else {
    uid = String(userIdOrData.userId);
    leadData = userIdOrData;
  }

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

// گرفتن یک lead با ID — جایگزین گردش روی کل لیست در admin.js
// قبلاً برای دیدن جزئیات یک لید، کل ۵۰۰ سند بارگذاری می‌شد (هزینه‌بر و کند)
async function getLeadById(leadId) {
  initDB();
  try {
    return await databases.getDocument(dbId, leadsCol, String(leadId));
  } catch (e) {
    if (e.code === 404) return null;
    // در نگارش قدیمی برخی leadها ممکن است با ID متفاوت ذخیره شده باشند
    // → fallback: جستجو در فیلد userId
    try {
      const res = await databases.listDocuments(dbId, leadsCol, [
        Query.equal("userId", String(leadId)),
        Query.limit(1),
      ]);
      return res.documents?.[0] || null;
    } catch {
      return null;
    }
  }
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
    const doc = res.documents?.[0] || null;
    if (doc && doc.candidateProfile) {
      try { doc.profile = JSON.parse(doc.candidateProfile); } catch {}
    }
    return doc;
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
    const doc = res.documents?.[0] || null;
    if (doc && doc.candidateProfile) {
      try { doc.profile = JSON.parse(doc.candidateProfile); } catch {}
    }
    return doc;
  } catch {
    return null;
  }
}

async function getUserById(userId) {
  initDB();
  try {
    const doc = await databases.getDocument(dbId, usersCol, String(userId));
    if (doc && doc.candidateProfile) {
      try { doc.profile = JSON.parse(doc.candidateProfile); } catch {}
    }
    return doc;
  } catch {
    return null;
  }
}

async function getUser(userId) {
  return await getUserById(userId);
}

async function listAllUsers(options = {}) {
  initDB();
  const { limit = 10000, offset = 0 } = options;
  const res = await databases.listDocuments(dbId, usersCol, [
    Query.limit(limit),
    Query.offset(offset),
  ]);
  const docs = res.documents || [];
  for (const d of docs) {
    if (d.candidateProfile) {
      try { d.profile = JSON.parse(d.candidateProfile); } catch {}
    }
  }
  return docs;
}

async function listRecentUsers(options = {}) {
  initDB();
  const { limit = 50 } = options;
  const res = await databases.listDocuments(dbId, usersCol, [
    Query.orderDesc("lastInteractionNew"),
    Query.limit(limit),
  ]);
  const docs = res.documents || [];
  for (const d of docs) {
    if (d.candidateProfile) {
      try { d.profile = JSON.parse(d.candidateProfile); } catch {}
    }
  }
  return docs;
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

// Pagination-aware iterator روی همه‌ی کاربران (برای broadcast).
// به جای limit:10000 (که در Appwrite Cloud به‌خاطر سقف 100 در request
// واقعاً فقط ۱۰۰ تای اول را برمی‌گرداند)، با cursor صفحه به صفحه می‌خوانیم.
async function* iterateAllUsers(batchSize = 100) {
  initDB();
  let lastId = null;
  for (;;) {
    const queries = [Query.limit(batchSize), Query.orderAsc("$id")];
    if (lastId) queries.push(Query.cursorAfter(lastId));
    const res = await databases.listDocuments(dbId, usersCol, queries);
    const docs = res.documents || [];
    if (docs.length === 0) break;
    for (const d of docs) {
      if (d.candidateProfile) {
        try { d.profile = JSON.parse(d.candidateProfile); } catch {}
      }
      yield d;
    }
    if (docs.length < batchSize) break;
    lastId = docs[docs.length - 1].$id;
  }
}

// ═══════════════════════════════════════════════════════════════
// فاز ۱ — مخازن جدید: Tasks / Meetings / AI Jobs / Audit Logs
// ═══════════════════════════════════════════════════════════════
// قواعد (سند §۳، §۷، §۸):
//   • هر عملیات روی رکورد، مالکیت (userId) را در سمت سرور بررسی می‌کند.
//   • ساخت وظیفه با idempotencyKey تکراری، رکورد موجود را برمی‌گرداند.
//   • تغییر وضعیت با اعتبارسنجی گذار دامنه + version (هم‌زمانی خوش‌بینانه).
//   • logAudit هرگز پرتاب نمی‌کند (best-effort) تا فلو نشکند.
// ═══════════════════════════════════════════════════════════════
const tasksDomain = require("../domain/tasks.js");
const aiJobsDomain = require("../domain/ai-jobs.js");
const auditDomain = require("../domain/audit.js");
const permissionsDomain = require("../domain/permissions.js");

function isCollectionMissing(e) {
  return e && (e.code === 404 || /not found|collection/i.test(String(e.message || "")));
}

async function createTask(userId, data = {}) {
  initDB();
  const uid = String(userId);
  const v = tasksDomain.validateNewTask(data);
  // Stable IDs make a retry atomic without requiring a read-then-write query.
  // A new request without a key must not deduplicate a legitimate identical task.
  const idempotencyKey = v.idempotencyKey || crypto.randomUUID();
  const documentId = "t_" + crypto.createHash("sha256")
    .update(JSON.stringify([uid, idempotencyKey])).digest("hex").slice(0, 32);

  const now = new Date().toISOString();
  let doc;
  try {
    doc = await databases.createDocument(dbId, tasksCol, documentId, {
    userId: uid,
    title: v.title,
    status: "open",
    priority: v.priority,
    source: v.source,
    dueAt: v.dueAt,
    meetingId: v.meetingId,
    requirementId: v.requirementId,
    idempotencyKey,
    version: 1,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    });
  } catch (e) {
    if (e.code !== 409) throw e;
    const existing = await databases.getDocument(dbId, tasksCol, documentId);
    if (existing.userId !== uid || existing.idempotencyKey !== idempotencyKey) throw e;
    return { task: existing, deduplicated: true };
  }
  return { task: doc, deduplicated: false };
}

async function listTasks(userId, options = {}) {
  initDB();
  const uid = String(userId);
  const { status, limit = 50 } = options;
  const queries = [Query.equal("userId", uid), Query.limit(limit)];
  if (status) queries.push(Query.equal("status", status));
  const res = await databases.listDocuments(dbId, tasksCol, queries);
  return res.documents || [];
}

async function getTaskById(taskId) {
  initDB();
  try {
    return await databases.getDocument(dbId, tasksCol, String(taskId));
  } catch (e) {
    if (e.code === 404) return null;
    throw e;
  }
}

async function updateTaskStatus(taskId, requesterUserId, newStatus, options = {}) {
  initDB();
  const task = await getTaskById(taskId);
  if (!task) {
    const e = new Error("وظیفه یافت نشد.");
    e.code = "NOT_FOUND";
    throw e;
  }
  permissionsDomain.assertOwnership(task, requesterUserId);
  tasksDomain.assertTransition(task.status, newStatus);
  if (options.expectedVersion != null && Number(task.version) !== Number(options.expectedVersion)) {
    const e = new Error("این وظیفه توسط درخواست دیگری تغییر کرده است. لطفاً دوباره بارگذاری کنید.");
    e.code = "VERSION_CONFLICT";
    throw e;
  }
  const now = new Date().toISOString();
  const payload = {
    status: newStatus,
    version: Number(task.version || 1) + 1,
    updatedAt: now,
  };
  if (newStatus === "done") payload.completedAt = now;
  if (newStatus === "open") payload.completedAt = null;
  return await databases.updateDocument(dbId, tasksCol, String(taskId), payload);
}

async function createMeeting(userId, data = {}) {
  initDB();
  const uid = String(userId);
  const title = String(data.title || "").trim().slice(0, 200);
  if (title.length < 3) {
    const e = new Error("عنوان جلسه باید حداقل ۳ کاراکتر باشد.");
    e.code = "MEETING_VALIDATION";
    throw e;
  }
  const now = new Date().toISOString();
  return await databases.createDocument(dbId, meetingsCol, ID.unique(), {
    userId: uid,
    title,
    notes: String(data.notes || "").slice(0, 8000),
    decisions: String(data.decisions || "").slice(0, 8000),
    heldAt: data.heldAt || now,
    createdAt: now,
    updatedAt: now,
  });
}

async function listMeetings(userId, options = {}) {
  initDB();
  const { limit = 20 } = options;
  const res = await databases.listDocuments(dbId, meetingsCol, [
    Query.equal("userId", String(userId)),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ]);
  return res.documents || [];
}

async function getMeetingById(meetingId) {
  initDB();
  try {
    return await databases.getDocument(dbId, meetingsCol, String(meetingId));
  } catch (e) {
    if (e.code === 404) return null;
    throw e;
  }
}

async function createAIJob(userId, data = {}) {
  initDB();
  const uid = String(userId);
  const v = aiJobsDomain.validateNewJob(data);
  const now = new Date().toISOString();
  return await databases.createDocument(dbId, aiJobsCol, ID.unique(), {
    userId: uid,
    kind: v.kind,
    operation: v.operation,
    status: "pending_approval",
    inputSummary: v.inputSummary,
    draftPayload: JSON.stringify(v.draftPayload).slice(0, 16000),
    requestedBy: uid,
    approvedBy: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function listAIJobs(userId, options = {}) {
  initDB();
  const { status, limit = 20 } = options;
  const queries = [
    Query.equal("userId", String(userId)),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ];
  if (status) queries.push(Query.equal("status", status));
  const res = await databases.listDocuments(dbId, aiJobsCol, queries);
  return res.documents || [];
}

async function updateAIJobStatus(jobId, requesterUserId, newStatus) {
  initDB();
  let job;
  try {
    job = await databases.getDocument(dbId, aiJobsCol, String(jobId));
  } catch (e) {
    if (e.code === 404) return null;
    throw e;
  }
  permissionsDomain.assertOwnership(job, requesterUserId);
  aiJobsDomain.assertTransition(job.status, newStatus);
  const now = new Date().toISOString();
  const payload = { status: newStatus, updatedAt: now };
  if (newStatus === "approved" || newStatus === "rejected") payload.approvedBy = String(requesterUserId);
  return await databases.updateDocument(dbId, aiJobsCol, String(jobId), payload);
}

async function logAudit(userId, event = {}) {
  try {
    initDB();
    const v = auditDomain.validateAuditEvent(event);
    const now = new Date().toISOString();
    await databases.createDocument(dbId, auditCol, ID.unique(), {
      userId: String(userId),
      action: v.action,
      entityType: v.entityType,
      entityId: v.entityId,
      meta: JSON.stringify(v.meta).slice(0, 4000),
      createdAt: now,
    });
    return true;
  } catch (e) {
    // حسابرسی best-effort است — هرگز فلو را نشکن
    console.warn("[audit] log failed:", e?.message || e);
    return false;
  }
}

async function listAuditLogs(userId, options = {}) {
  initDB();
  const { limit = 100 } = options;
  const res = await databases.listDocuments(dbId, auditCol, [
    Query.equal("userId", String(userId)),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ]);
  return res.documents || [];
}


module.exports = {
  initDB,
  getOrCreateUser,
  updateUser,
  saveConsultation,
  getUserConsultations,
  getConsultationById,
  deleteConsultation,
  upsertLead,
  updateLead,
  getStats,
  listLeads,
  getLeadById,
  getUser,
  getUserById,
  findByNationalId,
  findByPhone,
  listAllUsers,
  listRecentUsers,
  iterateAllUsers,
  // فاز ۱
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  createMeeting,
  listMeetings,
  getMeetingById,
  createAIJob,
  listAIJobs,
  updateAIJobStatus,
  logAudit,
  listAuditLogs,
  isCollectionMissing,
};
