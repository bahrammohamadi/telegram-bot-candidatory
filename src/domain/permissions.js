// src/domain/permissions.js — CommonJS
// ═══════════════════════════════════════════════════════════════
// دامنه‌ی مجوزها (RBAC) — منطق خالص
// ═══════════════════════════════════════════════════════════════
// مبنا: سند معماری نهایی §۳ (کاربران، نقش‌ها و محدوده‌ی دسترسی)
// نکته‌ی معماری سند: نقش کاربر در سامانه با نقش او در یک فضای کاری
// متفاوت است. این ماژول هر دو را پوشش می‌دهد:
//   - نقش سامانه (system role): visitor | individual | system_admin
//   - نقش فضای کاری (workspace role): owner | manager | member | advisor
// در نسخه‌ی فعلی (تک‌کاربره) همه‌ی کاربران individual هستند و فقط
// داده‌ی خودشان را می‌بینند؛ ادمین system_admin است.
// پشتیبان به‌صورت پیش‌فرض به اسناد خصوصی دسترسی ندارد (§۳).
// ═══════════════════════════════════════════════════════════════

const SYSTEM_ROLES = Object.freeze(["visitor", "individual", "system_admin"]);
const WORKSPACE_ROLES = Object.freeze(["owner", "manager", "member", "advisor", "support"]);

const PERMISSIONS = Object.freeze([
  "profile:read",
  "profile:write",
  "tasks:read",
  "tasks:write",
  "meetings:read",
  "meetings:write",
  "documents:read",
  "documents:write",
  "finance:read",
  "finance:write",
  "team:manage",
  "ai:approve",
  "billing:manage",
  "account:export",
  "account:delete",
  "admin:system",
  "support:read",
]);

// ماتریس مجوز فضای کاری
const WORKSPACE_MATRIX = Object.freeze({
  owner: Object.freeze([
    "profile:read", "profile:write", "tasks:read", "tasks:write",
    "meetings:read", "meetings:write", "documents:read", "documents:write",
    "finance:read", "finance:write", "team:manage", "ai:approve",
    "billing:manage", "account:export", "account:delete",
  ]),
  manager: Object.freeze([
    "profile:read", "tasks:read", "tasks:write",
    "meetings:read", "meetings:write", "documents:read",
    "finance:read", "team:manage", "ai:approve", "account:export",
  ]),
  member: Object.freeze([
    "profile:read", "tasks:read", "tasks:write",
    "meetings:read", "meetings:write", "documents:read", "account:export",
  ]),
  advisor: Object.freeze(["profile:read", "tasks:read", "meetings:read", "documents:read"]),
  support: Object.freeze(["support:read"]), // بدون دسترسی به اسناد خصوصی
});

const SYSTEM_MATRIX = Object.freeze({
  visitor: Object.freeze([]),
  individual: Object.freeze([
    "profile:read", "profile:write", "tasks:read", "tasks:write",
    "meetings:read", "meetings:write", "documents:read", "documents:write",
    "finance:read", "finance:write", "ai:approve",
    "account:export", "account:delete",
  ]),
  system_admin: Object.freeze([
    "profile:read", "tasks:read", "meetings:read", "documents:read",
    "finance:read", "billing:manage", "admin:system", "support:read",
  ]),
});

/**
 * نگاشت نقش قدیمی دیتابیس (role: user|admin) به نقش سامانه‌ی جدید.
 * سازگار با داده‌های موجود — هیچ مهاجرت داده‌ای لازم نیست.
 */
function mapLegacyRole(user = {}) {
  if (user && user.role === "admin") return "system_admin";
  return "individual";
}

function canSystem(systemRole, permission) {
  const list = SYSTEM_MATRIX[systemRole] || [];
  return list.includes(permission);
}

function canWorkspace(workspaceRole, permission) {
  const list = WORKSPACE_MATRIX[workspaceRole] || [];
  return list.includes(permission);
}

/**
 * بررسی کامل دسترسی به یک عملیات روی داده‌ی یک مالک.
 * قاعده‌ی سند §۳: «هر درخواست در سمت سرور بر اساس مالکیت داده،
 * عضویت، نقش و مجوز همان عملیات بررسی شود.»
 * context: { systemRole, workspaceRole, isOwner, isMember }
 */
function canAccess({ systemRole = "individual", workspaceRole = null, isOwner = false, isMember = false, permission } = {}) {
  if (!permission) return false;
  if (systemRole === "system_admin" && permission === "admin:system") return true;
  // مالک داده همیشه به داده‌ی خودش دسترسی دارد (تک‌کاربره‌ی فعلی)
  if (isOwner && canSystem("individual", permission)) return true;
  if (workspaceRole && canWorkspace(workspaceRole, permission)) {
    // عضویت فضای کاری برای دسترسی تیمی لازم است
    if (isOwner || isMember) return true;
    // owner/manager بدون isMember صریح هم در فضای خودش مالک است
    if (workspaceRole === "owner" || workspaceRole === "manager") return true;
  }
  if (canSystem(systemRole, permission) && isOwner) return true;
  return false;
}

/**
 * گارد مالکیت برای عملیات روی یک رکورد (وظیفه، جلسه، ...).
 * اگر رکورد مالک مشخصی دارد و با درخواست‌کننده نمی‌خواند → رد.
 */
function assertOwnership(record, requesterUserId) {
  if (!record) {
    const e = new Error("رکورد یافت نشد.");
    e.code = "NOT_FOUND";
    throw e;
  }
  const owner = String(record.userId || record.ownerId || "");
  if (owner && String(requesterUserId) !== owner) {
    const e = new Error("شما مجوز انجام این عملیات را ندارید.");
    e.code = "PERMISSION_DENIED";
    throw e;
  }
  return true;
}

module.exports = {
  SYSTEM_ROLES,
  WORKSPACE_ROLES,
  PERMISSIONS,
  WORKSPACE_MATRIX,
  SYSTEM_MATRIX,
  mapLegacyRole,
  canSystem,
  canWorkspace,
  canAccess,
  assertOwnership,
};
