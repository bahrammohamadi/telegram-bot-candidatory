// src/domain/index.js — CommonJS
// نقطه‌ی ورود یکپارچه‌ی لایه‌ی دامنه (سند §۷: مرزهای مشخص ماژول‌ها)
// هیچ ماژول دامنه‌ای به DB یا Telegram وابسته نیست — فقط منطق خالص.
module.exports = {
  tasks: require("./tasks.js"),
  journey: require("./journey.js"),
  requirements: require("./requirements.js"),
  permissions: require("./permissions.js"),
  aiJobs: require("./ai-jobs.js"),
  audit: require("./audit.js"),
};
