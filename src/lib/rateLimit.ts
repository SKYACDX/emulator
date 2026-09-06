import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ponytail: falls back to an in-memory per-instance counter when Upstash
// isn't configured (local dev, or before the env vars are set) — a real
// distributed attack needs the Redis-backed limiter below, since Vercel
// runs many serverless instances that don't share memory.
const memoryHits = new Map<string, { count: number; resetAt: number }>();

function checkMemoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryHits.get(key);
  if (!entry || now > entry.resetAt) {
    memoryHits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// One limiter instance per (limit, windowMs) pair, cached — Ratelimit
// objects are cheap to reuse and Upstash's client is stateless per-call.
const limiters = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  if (!redis) return checkMemoryLimit(key, limit, windowMs);
  const { success } = await getLimiter(limit, windowMs).limit(key);
  return success;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
