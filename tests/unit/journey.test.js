// tests/unit/journey.test.js — تست دامنه‌ی مسیر (بدون DB/Telegram)
const { test } = require("node:test");
const assert = require("node:assert/strict");
const journey = require("../../src/domain/journey.js");

test("کاربر جدید: فقط ورود تکمیل است، بقیه not_started/needs_review", () => {
  const j = journey.deriveJourney({ profile: {}, consultations: [], tasks: [], meetings: [] });
  assert.equal(j.total, 11);
  assert.equal(j.stages[0].id, "entry_auth");
  assert.equal(j.stages[0].status, "completed");
  assert.equal(j.completedCount, 1);
  assert.ok(j.nextStage);
});

test("پروفایل کامل + ارزیابی → مراحل اول جلو می‌روند", () => {
  const profile = {
    fullName: "علی رضایی", age: "30_40", education: "bachelor", occupation: "معلم",
    electionType: "council", constituency: "تهران - ری", residencyYears: "over20",
    pastPositions: "عضو شورا", electionExperience: "won", budget: "100",
    slogan: "تغییر", mainStrength: "مردمی", mainWeakness: "کمبود وقت", topPriorities: "جوانان",
  };
  const j = journey.deriveJourney({
    profile,
    consultations: [{ type: "readiness" }, { type: "swot" }],
    tasks: [{ status: "done", title: "x" }],
    meetings: [{ title: "جلسه" }],
  });
  assert.equal(journey.profileCompleteness(profile), 100);
  const byId = Object.fromEntries(j.stages.map((s) => [s.id, s.status]));
  assert.equal(byId.status_discovery, "completed");
  assert.equal(byId.needs_assessment, "completed");
  assert.equal(byId.profile_building, "completed");
  assert.equal(byId.roadmap, "completed");
  assert.equal(byId.execution, "completed");
  assert.equal(byId.learning, "completed");
});

test("مرحله‌ی رسمی الزامات: user_declared از officially_verified جداست", () => {
  const j = journey.deriveJourney({ profile: {}, requirementsProgress: { req_registration: "done" } });
  const stage = j.stages.find((s) => s.id === "requirements_guide");
  assert.equal(stage.official, true);
  assert.equal(stage.verification, "user_declared");
  assert.notEqual(stage.verification, "officially_verified");
});

test("وظیفه‌ی باز → execution در حال انجام", () => {
  const j = journey.deriveJourney({ profile: {}, tasks: [{ status: "open", title: "x" }] });
  assert.equal(j.stages.find((s) => s.id === "execution").status, "in_progress");
});
