// ponytail: in-memory fixed-window limiter, per serverless instance only —
// not shared across Vercel's multiple instances/regions, so it's a soft
// cap, not a hard guarantee. Upgrade to Upstash Redis (@upstash/ratelimit)
// if this site ever sees distributed brute-force traffic that needs one.
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  return entry.count <= limit;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
