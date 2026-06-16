import { cache as kvCache } from "@/lib/cache";

const PAGE_TTL_SECONDS = 60;

const PAGE_KEYS = [
  "dashboard",
  "transactions",
  "budgets",
  "goals",
  "groups",
  "reports",
  "settings",
  "notifications",
  "layout",
  "debts",
] as const;

export type PageCacheKey = (typeof PAGE_KEYS)[number];

function pageCacheKey(userId: string, page: PageCacheKey, extra = "") {
  return `page:${page}:${userId}${extra ? `:${extra}` : ""}`;
}

export async function getOrSetPageCache<T>(
  userId: string,
  page: PageCacheKey,
  fetcher: () => Promise<T>,
  extra = ""
): Promise<T> {
  const key = pageCacheKey(userId, page, extra);
  const cached = await kvCache.get(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // corrupt cache entry — refetch
    }
  }

  const data = await fetcher();
  await kvCache.set(key, JSON.stringify(data), PAGE_TTL_SECONDS);
  return data;
}

export async function invalidateUserPageCache(userId: string) {
  await Promise.all(
    PAGE_KEYS.flatMap((page) => [
      kvCache.del(pageCacheKey(userId, page)),
      kvCache.del(pageCacheKey(userId, page, "monthly")),
      kvCache.del(pageCacheKey(userId, page, "weekly")),
      kvCache.del(pageCacheKey(userId, page, "quarterly")),
      kvCache.del(pageCacheKey(userId, page, "yearly")),
    ])
  );
}
