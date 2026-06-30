const rateLimit = new Map();

const RATE_LIMIT_WINDOW = 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const CLEANUP_INTERVAL = 60000;

function rateLimitMiddleware() {
  return async (ctx, next) => {
    const userId = ctx.from?.id;

    if (!userId) {
      return await next();
    }

    const now = Date.now();
    const userKey = String(userId);

    const userLimit = rateLimit.get(userKey);

    if (userLimit) {
      const timeDiff = now - userLimit.lastRequest;

      if (timeDiff < RATE_LIMIT_WINDOW) {
        userLimit.count += 1;

        if (userLimit.count > MAX_REQUESTS_PER_WINDOW) {
          if (userLimit.count === MAX_REQUESTS_PER_WINDOW + 1) {
            try {
              await ctx.reply("لطفا کمی صبر کنید.");
            } catch (e) {}
          }
          return;
        }
      } else {
        userLimit.lastRequest = now;
        userLimit.count = 1;
      }
    } else {
      rateLimit.set(userKey, {
        lastRequest: now,
        count: 1,
      });
    }

    await next();
  };
}

function startCleanup() {
  setInterval(() => {
    const now = Date.now();
    const threshold = now - 60000;

    for (const [userId, data] of rateLimit.entries()) {
      if (data.lastRequest < threshold) {
        rateLimit.delete(userId);
      }
    }
  }, CLEANUP_INTERVAL);
}

module.exports = {
  rateLimitMiddleware,
  startCleanup,
};
