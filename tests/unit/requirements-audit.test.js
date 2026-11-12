// tests/unit/requirements-audit.test.js — الزامات + حسابرسی + safe-text
const { test } = require("node:test");
const assert = require("node:assert/strict");
const req = require("../../src/domain/requirements.js");
const audit = require("../../src/domain/audit.js");
const safe = require("../../src/utils/safe-text.js");

test("کاتالوگ بذر: هیچ موردی publishable نیست تا منبع رسمی درج شود", () => {
  for (const r of req.listRequirements()) {
    assert.equal(r.status, "needs_legal_review");
    assert.equal(req.isPublishable(r), false);
  }
});

test("validateSource: منبع ناقص رد می‌شود", () => {
  assert.equal(req.validateSource({}).ok, false);
  const ok = req.validateSource({ name: "سازمان رسمی", version: "v2", effectiveDate: "2026-01-01", url: "https://example.com" });
  assert.equal(ok.ok, true);
});

test("sanitizeMeta توکن/رمز را حذف می‌کند", () => {
  const out = audit.sanitizeMeta({ token: "abc", note: "ok", api_key: "xyz" });
  assert.equal(out.token, "[redacted]");
  assert.equal(out.api_key, "[redacted]");
  assert.equal(out.note, "ok");
});

test("validateAuditEvent کنش نامعتبر را رد می‌کند", () => {
  assert.throws(() => audit.validateAuditEvent({ action: "nope" }), (e) => e.code === "AUDIT_VALIDATION");
  const v = audit.validateAuditEvent({ action: "task.create", entityType: "task", entityId: "1" });
  assert.equal(v.action, "task.create");
});

test("escapeMd کاراکترهای markdown را خنثی می‌کند", () => {
  assert.equal(safe.escapeMd("*bold*"), "\\*bold\\*");
  assert.equal(safe.escapeMd("[x](http://evil)"), "\\[x](http://evil)");
  assert.equal(safe.plain("*a* [b]"), "a b");
});
