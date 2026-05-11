const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const MAX_REQUESTS = 100;
const WINDOW_MS = 60 * 1000; // 1 minute

export function rateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

export function getRateLimitHeaders(identifier: string) {
  const result = rateLimit(identifier);
  return {
    "X-RateLimit-Limit": MAX_REQUESTS.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": rateLimitMap.get(identifier)?.resetTime.toString() || Date.now().toString(),
  };
}
