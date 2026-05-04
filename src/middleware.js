import { NextResponse } from 'next/server';

// In-memory rate limiting (edge-compatible)
// Production: use @upstash/ratelimit with Redis
const windows = new Map();

const LIMITS = {
  '/api/process': { windowMs: 60000, max: 5 },
  '/api/reclassify': { windowMs: 60000, max: 20 },
  '/api/command': { windowMs: 60000, max: 30 },
  '/api/rules': { windowMs: 60000, max: 20 },
  '/api/triage': { windowMs: 60000, max: 40 },
};

function checkRateLimit(pathname, clientIp) {
  const config = LIMITS[pathname] || { windowMs: 60000, max: 60 };
  const key = `${clientIp}:${pathname}`;
  const now = Date.now();

  let window = windows.get(key);
  if (!window || now - window.start > config.windowMs) {
    window = { start: now, count: 0 };
    windows.set(key, window);
  }

  window.count++;

  if (window.count > config.max) {
    return { allowed: false, retryAfter: Math.ceil((window.start + config.windowMs - now) / 1000) };
  }
  return { allowed: true, remaining: config.max - window.count };
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous';

  const result = checkRateLimit(pathname, clientIp);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: result.retryAfter },
      { status: 429, headers: { 'Retry-After': result.retryAfter.toString() } }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
