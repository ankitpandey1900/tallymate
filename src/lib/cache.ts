// Redis/In-memory caching abstraction

interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryCacheStore implements CacheStore {
  private cache = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

// In production with Redis:
// We could dynamically import ioredis if it was installed and REDIS_URL exists.
// Since we want robust zero-setup out of the box, we use the in-memory cache
// which behaves exactly like Redis in terms of async operations.
class RedisCacheStore implements CacheStore {
  private memoryFallback = new MemoryCacheStore();
  private client: { get(key: string): Promise<string | null>; set(...args: unknown[]): Promise<unknown>; del(key: string): Promise<unknown> } | null = null;

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        // Dynamic load to avoid failing if ioredis is not installed
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Redis = require("ioredis");
        this.client = new Redis(process.env.REDIS_URL);
        console.log("🚀 Connected to Redis cache");
      } catch (err) {
        console.warn("⚠️ Failed to load ioredis, falling back to memory cache:", err);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        console.error("Redis get error:", err);
        return this.memoryFallback.get(key);
      }
    }
    return this.memoryFallback.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, "EX", ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        console.error("Redis set error:", err);
      }
    }
    await this.memoryFallback.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        console.error("Redis del error:", err);
      }
    }
    await this.memoryFallback.del(key);
  }
}

export const cache = new RedisCacheStore();
export type { CacheStore };
