import { cache } from "@/lib/cache";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

function getClientIpFromHeaders(headersLike: { get(name: string): string | null }): string {
  const xff = headersLike.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headersLike.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown-ip";
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<void> {
  const bucketKey = `rate-limit:${options.key}`;
  const currentRaw = await cache.get(bucketKey);
  const current = currentRaw ? Number(currentRaw) : 0;

  if (current >= options.limit) {
    throw new Error("Too many requests. Please wait and try again.");
  }

  await cache.set(bucketKey, String(current + 1), options.windowSeconds);
}

export async function enforceActionRateLimit(
  headersLike: { get(name: string): string | null },
  actionName: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const ip = getClientIpFromHeaders(headersLike);
  await enforceRateLimit({
    key: `action:${actionName}:ip:${ip}`,
    limit,
    windowSeconds,
  });
}

export async function enforceAuthRouteRateLimit(
  req: Request,
  method: "GET" | "POST",
  limit: number,
  windowSeconds: number
): Promise<void> {
  const ip = getClientIpFromHeaders(req.headers);
  await enforceRateLimit({
    key: `auth:${method}:ip:${ip}`,
    limit,
    windowSeconds,
  });
}
