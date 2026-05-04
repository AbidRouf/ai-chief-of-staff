// Simple in-memory rate limiter for API routes
// Production: use Redis-backed rate limiting (e.g., @upstash/ratelimit)

const windows = new Map();

const LIMITS = {
  '/api/process': { windowMs: 60000, maxRequests: 5 },     // 5 per minute
  '/api/reclassify': { windowMs: 60000, maxRequests: 20 },  // 20 per minute
  '/api/command': { windowMs: 60000, maxRequests: 30 },     // 30 per minute
  '/api/rules': { windowMs: 60000, maxRequests: 20 },       // 20 per minute
  '/api/triage': { windowMs: 60000, maxRequests: 40 },      // 40 per minute
  default: { windowMs: 60000, maxRequests: 60 },            // 60 per minute
};

export function rateLimit(pathname, clientIp = 'anonymous') {
  const config = LIMITS[pathname] || LIMITS.default;
  const key = `${clientIp}:${pathname}`;
  const now = Date.now();

  let window = windows.get(key);
  if (!window || now - window.start > config.windowMs) {
    window = { start: now, count: 0 };
    windows.set(key, window);
  }

  window.count++;

  if (window.count > config.maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((window.start + config.windowMs - now) / 1000),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - window.count,
    retryAfter: 0,
  };
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of windows) {
    if (now - window.start > 120000) {
      windows.delete(key);
    }
  }
}, 300000);
