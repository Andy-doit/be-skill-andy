# Caching Consistency, Stampede Control & Redis Patterns

## 1. When to read this
Read this when introducing Redis or in-memory caching, managing cache invalidation, or preventing cache stampedes under heavy traffic.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Who owns a cache key? | Exactly one module / repository with declared key format, value schema, and TTL. | Global system lookup tables with static lifetime. |
| Can cache become a primary source of truth? | **NEVER.** Cache is disposable; system must function correctly if Redis is wiped. | Ephemeral transient UI rate-limit counters where total data loss is tolerable. |
| How to invalidate cache on data update? | **Delete-on-write:** delete cached key during database mutation (TTL is only safety net). | Write-through cache where read and write volumes are identical. |
| How to prevent cache stampede on expired hot keys? | Probabilistic early expiration (XFetch) or mutex lock around database fallback query. | Cache read volume is low (< 10 requests per second per key). |

---

## 3. Rules

### BR-3 Cache is never a second source of truth
A cache must remain strictly disposable. The primary database is the sole authority for data. Delete-on-write is the correctness path for invalidation; time-to-live (TTL) serves only as a safety net against missed deletion events.
- **Why:** Treating cache as persistent state or updating cache values in-place leads to permanent silent drift between cache and database, showing users stale or phantom data.
- **Enforced by:** Cache invalidation tests and cache-flush tolerance tests.

---

## 4. Cache-Aside with Stampede Protection

```typescript
export async function getWithStampedeProtection<T>(
  redis: RedisClient,
  key: string,
  ttlSeconds: number,
  fallback: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  // Acquire brief 5-second mutex to allow only one worker to query the database
  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, '1', 'EX', 5, 'NX');

  if (!acquired) {
    // Wait briefly and retry reading from cache
    await new Promise((resolve) => setTimeout(resolve, 50));
    return getWithStampedeProtection(redis, key, ttlSeconds, fallback);
  }

  try {
    const freshData = await fallback();
    await redis.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
    return freshData;
  } finally {
    await redis.del(lockKey);
  }
}
```

---

## 5. Checklist for review
- [ ] Every cached key has an explicit TTL (never store keys with indefinite persistence without reason).
- [ ] Update and delete mutations delete cached keys (`await redis.del(key)`).
- [ ] Serialization uses safe parsers that do not evaluate arbitrary objects.
- [ ] System continues operating when Redis is completely flushed.

---

## 6. How to prove it
- **Stampede Test:** Simulate 50 concurrent requests hitting an empty cache key simultaneously; assert that the underlying database query function is executed exactly once.
