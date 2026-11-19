# Distributed Rate Limiting & Atomic Lua Evaluation

## 1. When to read this
Read this when designing API gateways, rate limiting under distributed multi-node clusters, preventing abuse on public or authenticated endpoints, and choosing between Token Bucket, Leaky Bucket, and Sliding Window algorithms under high load.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Which algorithm for smoothing burst traffic? | **Sliding Window Counter** with time-weighting approximation ($O(1)$ memory). | Leaky Bucket / Token Bucket when burst credit accumulation is an explicit product requirement. |
| Which algorithm for exact timestamp tracking? | Fixed window with sub-second bucketing. | Sliding Window Log (ZSET) only for low-frequency sensitive operations (e.g. max 5 password attempts/hour); forbidden for high RPS due to $O(N)$ memory. |
| How to ensure atomicity across cluster nodes? | Single atomic Redis Lua script executing read, compute, increment, and expire (BE-35). | Multi-cluster synchronization or Envoy ratelimit service when operating multi-region meshes. |
| What is the Redis failure strategy? | **Fail-open** for public read APIs; **Fail-close** for auth/payment doors. | Local memory rate-limiting fallback with degraded local quotas. |

---

## 3. Rules

### BE-35 Atomic Distributed Rate Limiting
All distributed rate limiting counters, quotas, and token allowances shared across application nodes must be evaluated and mutated within a single atomic execution boundary (such as an atomic Redis Lua script). Multi-step `GET`-then-`SET` sequences across network hops are forbidden. Every rate-limiting door must explicitly declare its degradation mode: `fail-open` (with fallback circuit breaker) for general content and read endpoints, or `fail-close` for sensitive authentication, password reset, and financial transaction doors.
- **Why:** Non-atomic `GET-then-SET` sequences across distributed nodes create severe race conditions: 50 concurrent requests reading a remaining count of 1 simultaneously will all pass, allowing $50\times$ the allowed quota. In-memory per-process rate limits fail in clustered environments because load balancers distribute traffic across $M$ nodes, multiplying the effective allowance by $M$. Sliding Window Logs using Redis sorted sets (ZSET) store an entry per request, causing memory to explode to $O(N)$ under DDoS bursts.
- **Enforced by:** Concurrency integration tests proving limit enforcement under parallel callers; static review verifying Lua script encapsulation.

---

## 4. Production Redis Lua Script: Sliding Window Counter ($O(1)$ Memory)

The Sliding Window Counter algorithm calculates an estimated request count by blending the request count of the previous window with the count of the current window based on elapsed time:

$$\text{Estimated Count} = \text{Count}_{\text{prev}} \times \left(1 - \frac{\text{elapsed}}{\text{window}}\right) + \text{Count}_{\text{curr}}$$

```lua
-- KEYS[1]: Current window key (e.g. "rl:api:usr_123:1700000060")
-- KEYS[2]: Previous window key (e.g. "rl:api:usr_123:1700000000")
-- ARGV[1]: Max requests allowed in window
-- ARGV[2]: Window size in seconds (e.g. 60)
-- ARGV[3]: Current timestamp (Unix seconds)

local current_key = KEYS[1]
local previous_key = KEYS[2]
local max_limit = tonumber(ARGV[1])
local window_size = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- 1. Fetch counts
local current_count = tonumber(redis.call('GET', current_key) or "0")
local previous_count = tonumber(redis.call('GET', previous_key) or "0")

-- 2. Calculate time elapsed in current window
local time_into_current_window = now % window_size
local time_weight = (window_size - time_into_current_window) / window_size
local estimated_count = math.floor(previous_count * time_weight + current_count)

-- 3. Check threshold
if estimated_count >= max_limit then
  local retry_after = window_size - time_into_current_window
  return { 0, max_limit - estimated_count, retry_after } -- [allowed: 0, remaining, retry_after]
end

-- 4. Atomically increment current counter & set TTL
local new_count = redis.call('INCR', current_key)
if new_count == 1 then
  redis.call('EXPIRE', current_key, window_size * 2) -- TTL survives into next window
end

local remaining = max_limit - (estimated_count + 1)
if remaining < 0 then remaining = 0 end
return { 1, remaining, 0 } -- [allowed: 1, remaining, retry_after]
```

### TypeScript Client Adapter

```typescript
import { Redis } from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export class DistributedRateLimiter {
  constructor(
    private readonly redis: Redis,
    private readonly failureStrategy: 'fail-open' | 'fail-close' = 'fail-open'
  ) {}

  async check(keyPrefix: string, subjectId: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const currentWindow = Math.floor(now / windowSeconds) * windowSeconds;
    const previousWindow = currentWindow - windowSeconds;

    const currentKey = `${keyPrefix}:${subjectId}:${currentWindow}`;
    const previousKey = `${keyPrefix}:${subjectId}:${previousWindow}`;

    try {
      const res = (await this.redis.eval(
        SLIDING_WINDOW_LUA_SCRIPT,
        2,
        currentKey,
        previousKey,
        limit,
        windowSeconds,
        now
      )) as [number, number, number];

      return {
        allowed: res[0] === 1,
        limit,
        remaining: res[1],
        retryAfterSeconds: res[2],
      };
    } catch (err) {
      if (this.failureStrategy === 'fail-open') {
        // Log warning and allow traffic to preserve availability
        return { allowed: true, limit, remaining: 1, retryAfterSeconds: 0 };
      }
      // Fail-close: Protect sensitive target
      return { allowed: false, limit, remaining: 0, retryAfterSeconds: windowSeconds };
    }
  }
}
```

---

## 5. Checklist for review
- [ ] Rate-limit counter mutation is enclosed in a single Redis Lua script (no `GET` then `SET`).
- [ ] Memory footprint is bounded at $O(1)$ per client subject (no unbounded ZSETs).
- [ ] Redis key includes window epoch and has a TTL set to $2\times$ window length.
- [ ] Degraded mode declared: Auth/Payment endpoints set to `fail-close`; read endpoints set to `fail-open`.
- [ ] Standard response headers returned on HTTP 429: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`.

---

## 6. How to prove it
- **Concurrency Invariant Test:** Spin up 50 parallel workers using `Promise.all()` calling the rate limiter simultaneously with a limit of 10 within a 60-second window.
- **Assertion:** Exactly 10 calls return `allowed: true`, exactly 40 return `allowed: false` with `retryAfterSeconds > 0`. Zero quota leaks.
