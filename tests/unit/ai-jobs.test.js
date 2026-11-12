// tests/unit/ai-jobs.test.js — تست دامنه‌ی AI Jobs (سند §۱۰)
const { test } = require("node:test");
const assert = require("node:assert/strict");
const ai = require("../../src/domain/ai-jobs.js");

test("عملیات نوشتنی نیازمند تأیید است", () => {
  assert.equal(ai.requiresApproval("create_task"), true);
  assert.equal(ai.requiresApproval("send_message"), true);
  assert.equal(ai.requiresApproval("read_only"), false);
});

test("canExecute: نوشتنی فقط پس از approved", () => {
  assert.equal(ai.canExecute({ operation: "create_task", status: "pending_approval" }), false);
  assert.equal(ai.canExecute({ operation: "create_task", status: "approved" }), true);
  assert.equal(ai.canExecute({ operation: "read_only", status: "draft" }), true);
});

test("گذارها: pending→approved مجاز، approved→rejected غیرمجاز", () => {
  assert.equal(ai.canTransition("pending_approval", "approved"), true);
  assert.equal(ai.canTransition("pending_approval", "rejected"), true);
  assert.equal(ai.canTransition("approved", "rejected"), false);
  assert.equal(ai.canTransition("approved", "executed"), true);
});

test("سهمیه‌ی AI بر اساس پلن", () => {
  assert.equal(ai.checkQuota("free", 5).allowed, false);
  assert.equal(ai.checkQuota("free", 4).allowed, true);
  assert.equal(ai.checkQuota("vip", 9999).allowed, true);
  assert.equal(ai.checkQuota("unknown", 0).allowed, true);
});

test("validateNewJob نوع نامعتبر را رد می‌کند", () => {
  assert.throws(() => ai.validateNewJob({ kind: "nope" }), (e) => e.code === "AI_VALIDATION");
});
