// tests/unit/tasks.test.js — تست دامنه‌ی وظایف (بدون DB/Telegram)
const { test } = require("node:test");
const assert = require("node:assert/strict");
const tasks = require("../../src/domain/tasks.js");

test("validateNewTask: عنوان کوتاه رد می‌شود", () => {
  assert.throws(() => tasks.validateNewTask({ title: "ab" }), (e) => e.code === "TASK_VALIDATION");
});

test("validateNewTask: ورودی معتبر نرمال می‌شود", () => {
  const v = tasks.validateNewTask({ title: "  تماس با ستاد  ", priority: "high", source: "meeting", dueAt: "2026-11-20T10:00:00.000Z" });
  assert.equal(v.title, "تماس با ستاد");
  assert.equal(v.priority, "high");
  assert.equal(v.source, "meeting");
  assert.ok(v.dueAt.startsWith("2026-11-20"));
});

test("گذارهای وضعیت: open→done مجاز، done→open غیرمجاز", () => {
  assert.equal(tasks.canTransition("open", "done"), true);
  assert.equal(tasks.canTransition("open", "in_progress"), true);
  assert.equal(tasks.canTransition("done", "open"), false);
  assert.equal(tasks.canTransition("cancelled", "open"), true);
  assert.throws(() => tasks.assertTransition("done", "open"), (e) => e.code === "TASK_INVALID_TRANSITION");
});

test("idempotencyKey قطعی است (جلوگیری از ثبت تکراری)", () => {
  const a = tasks.makeIdempotencyKey("123", { title: "تماس", dueAt: null, source: "manual" });
  const b = tasks.makeIdempotencyKey("123", { title: "تماس", dueAt: null, source: "manual" });
  const c = tasks.makeIdempotencyKey("123", { title: "دیگر", dueAt: null, source: "manual" });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(a.startsWith("idem_"));
});

test("sortForToday: عقب‌افتاده اول، بعد مهلت امروز، بعد اولویت", () => {
  const now = new Date("2026-11-11T12:00:00Z");
  const list = [
    { title: "آینده", status: "open", priority: "urgent", dueAt: "2026-11-20T10:00:00Z" },
    { title: "امروز عادی", status: "open", priority: "normal", dueAt: "2026-11-11T18:00:00Z" },
    { title: "عقب‌افتاده", status: "open", priority: "low", dueAt: "2026-11-10T10:00:00Z" },
    { title: "انجام‌شده", status: "done", priority: "urgent", dueAt: "2026-11-10T10:00:00Z" },
  ];
  const sorted = tasks.sortForToday(list, now);
  assert.equal(sorted.length, 3);
  assert.equal(sorted[0].title, "عقب‌افتاده");
  assert.equal(sorted[1].title, "امروز عادی");
  assert.equal(sorted[2].title, "آینده");
});

test("summarize شمارش درست می‌دهد", () => {
  const now = new Date("2026-11-11T12:00:00Z");
  const s = tasks.summarize(
    [
      { status: "open", dueAt: "2026-11-10T10:00:00Z" },
      { status: "open", dueAt: "2026-11-11T18:00:00Z" },
      { status: "done", dueAt: null },
    ],
    now
  );
  assert.equal(s.open, 2);
  assert.equal(s.overdue, 1);
  assert.equal(s.dueToday, 1);
  assert.equal(s.done, 1);
});
