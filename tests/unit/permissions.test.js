// tests/unit/permissions.test.js — تست RBAC و مالکیت (سند §۳)
const { test } = require("node:test");
const assert = require("node:assert/strict");
const perm = require("../../src/domain/permissions.js");

test("نگاشت نقش قدیمی: admin→system_admin، بقیه→individual", () => {
  assert.equal(perm.mapLegacyRole({ role: "admin" }), "system_admin");
  assert.equal(perm.mapLegacyRole({ role: "user" }), "individual");
  assert.equal(perm.mapLegacyRole({}), "individual");
});

test("پشتیبان به اسناد خصوصی دسترسی ندارد", () => {
  assert.equal(perm.canWorkspace("support", "documents:read"), false);
  assert.equal(perm.canWorkspace("support", "support:read"), true);
});

test("مشاور دعوت‌شده فقط خواندنی محدود است", () => {
  assert.equal(perm.canWorkspace("advisor", "tasks:read"), true);
  assert.equal(perm.canWorkspace("advisor", "tasks:write"), false);
  assert.equal(perm.canWorkspace("advisor", "finance:read"), false);
});

test("مالک داده به داده‌ی خودش دسترسی دارد", () => {
  assert.equal(perm.canAccess({ isOwner: true, permission: "tasks:write" }), true);
  assert.equal(perm.canAccess({ isOwner: false, permission: "tasks:write" }), false);
});

test("assertOwnership: مالک دیگر رد می‌شود", () => {
  assert.equal(perm.assertOwnership({ userId: "123" }, "123"), true);
  assert.throws(() => perm.assertOwnership({ userId: "123" }, "999"), (e) => e.code === "PERMISSION_DENIED");
  assert.throws(() => perm.assertOwnership(null, "123"), (e) => e.code === "NOT_FOUND");
});
