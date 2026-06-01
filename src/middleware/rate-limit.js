// src/middleware/rate-limit.js
// ═══════════════════════════════════════════════════════════════
// 🛡️ Rate Limiting Middleware - جلوگیری از Spam
// ═══════════════════════════════════════════════════════════════

/**
 * ساختار داده:
 * rateLimit = {
 *   "userId": {
 *     lastRequest: timestamp,
 *     count: number
 *   }
 * }
 */
const rateLimit = new Map();

// تنظیمات
const RATE_LIMIT_WINDOW = 1000; // 1 ثانیه
const MAX_REQUESTS_PER_WINDOW = 3; // حداکثر 3 درخواست در هر ثانیه
const CLEANUP_INTERVAL = 60000; // پاکسازی هر 1 دقیقه

/**
 * Middleware برای Rate Limiting
 */
function rateLimitMiddleware() {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    
    // اگر userId نداریم (مثلاً Channel Post)، اجازه بده
    if (!userId) {
      return await next();
    }
    
    const now = Date.now();
    const userKey = String(userId);
    
    // بررسی وضعیت کاربر
    const userLimit = rateLimit.get(userKey);
    
    if (userLimit) {
      const timeDiff = now - userLimit.lastRequest;
      
      // اگر در window زمانی است
      if (timeDiff < RATE_LIMIT_WINDOW) {
        userLimit.count += 1;
        
        // اگر از حد مجاز گذشته
        if (userLimit.count > MAX_REQUESTS_PER_WINDOW) {
          console.log(`⚠️ Rate limit exceeded for user ${userId}`);
          
          // پیام هشدار (فقط یک بار)
          if (userLimit.count === MAX_REQUESTS_PER_WINDOW + 1) {
            try {
              await ctx.reply("⏱ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.");
            } catch (e) {
              // Ignore
            }
          }
          
          return; // Block request
        }
      } else {
        // Window جدید - Reset
        userLimit.lastRequest = now;
        userLimit.count = 1;
      }
    } else {
      // کاربر جدید
      rateLimit.set(userKey, {
        lastRequest: now,
        count: 1,
      });
    }
    
    // اجازه ادامه
    await next();
  };
}

/**
 * پاکسازی دوره‌ای حافظه
 */
function startCleanup() {
  setInterval(() => {
    const now = Date.now();
    const threshold = now - 60000; // 1 دقیقه پیش
    
    for (const [userId, data] of rateLimit.entries()) {
      if (data.lastRequest < threshold) {
        rateLimit.delete(userId);
      }
    }
    
    console.log(`🧹 Rate limit cleanup: ${rateLimit.size} users in memory`);
  }, CLEANUP_INTERVAL);
}

/**
 * بررسی دستی Rate Limit (برای Testing)
 */
function checkRateLimit(userId) {
  const userLimit = rateLimit.get(String(userId));
  return {
    limited: userLimit && userLimit.count > MAX_REQUESTS_PER_WINDOW,
    count: userLimit?.count || 0,
    lastRequest: userLimit?.lastRequest || null,
  };
}

module.exports = {
  rateLimitMiddleware,
  startCleanup,
  checkRateLimit,
};
