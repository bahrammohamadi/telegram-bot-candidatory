const { getOrCreateUser } = require("./db.js");

const PLAN_LEVELS = {
  none: 0,
  free: 0,
  single_session: 1,
  starter: 2,
  professional: 3,
  vip: 4,
};

async function getUserPlanLevel(userId) {
  try {
    const user = await getOrCreateUser(userId, {});
    const plan = user.purchasedPlan || user.role || "none";
    if (user.role === "admin") return 4;
    return PLAN_LEVELS[plan] || 0;
  } catch (e) {
    return 0;
  }
}

module.exports = {
  PLAN_LEVELS,
  getUserPlanLevel,
};
