const { Bot, session } = require("grammy");
const { getOrCreateUser } = require("./utils/db.js");
const { mainMenuKB } = require("./utils/keyboard.js");
const { rateLimitMiddleware, startCleanup } = require("./middleware/rate-limit.js");
const { handleStartConsultation, handleAnswer, handleEdit, handleConfirm, handleReset, handleTextInput } = require("./flows/consultation.js");
const { handleShowPlans, handleSelectPlan } = require("./flows/plans.js");
const { handleAdminPanel, handleAdminLeads } = require("./flows/admin.js");
const { handleAboutUs, handleContactUs, handleSampleReports } = require("./flows/contact.js");
const { handleShowHistory, handleHistoryDetail } = require("./flows/history.js");
const { handleShowEducationList, handleShowEducationCard, handleEducationView, handleRelatedCards, handleShowAssessments, handleStartAssessmentTest, handleAssessmentAnswer } = require("./flows/educational.js");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const HB = { id: 847870553, is_bot: true, first_name: "bot", username: "candidatoryiran_bot", can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false };
let botInfo;
try { botInfo = process.env.BOT_INFO ? JSON.parse(process.env.BOT_INFO) : HB; } catch (e) { botInfo = HB; }
