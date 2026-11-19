# Input Validation, Abuse Limits & SSRF Defense

## 1. When to read this
Read this when validating request bodies, configuring rate limiting, restricting file upload sizes, or fetching URLs supplied by users.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should request inputs be bounded? | Strict schema validation declaring `max` length on strings, numbers, and arrays (BE-16). | Custom business domain validators. |
| How to prevent Server-Side Request Forgery (SSRF)? | Resolve DNS, verify IP does not fall within private/loopback/link-local ranges before connecting (BE-16). | Dedicated outbound proxy or egress network firewall. |
| How to limit API rate consumption? | Redis token bucket or sliding window keyed by authenticated user ID or client IP. | Complex multi-tier billing quotas tracked per calendar month. |

---

## 3. Rules

### BE-16 Bound everything external & prevent SSRF
All incoming payload data must be strictly bounded in size, length, and collection element count. Unbounded strings or arrays are forbidden. Outbound HTTP requests to user-supplied URLs must validate that the destination IP address does not resolve to private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), or cloud metadata endpoints (`169.254.169.254`).
- **Why:** Unbounded arrays allow attackers to send a 100,000-element payload, causing CPU and memory exhaustion (ReDoS / JSON bomb). Unchecked outbound fetches (SSRF) allow attackers to query internal cloud metadata services (`http://169.254.169.254/latest/meta-data/iam/security-credentials`) to steal cloud IAM credentials.
- **Enforced by:** Schema bounds checks and SSRF integration tests.

---

## 4. SSRF Defense Implementation

```typescript
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export async function assertSafeUrl(urlString: string): Promise<URL> {
  const url = new URL(urlString);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only HTTP(S) protocols are permitted.');
  }

  const { address } = await lookup(url.hostname);
  const addr = ipaddr.parse(address);
  const range = addr.range();

  // Block loopback, private networks, carrier-grade NAT, and cloud metadata
  if (range !== 'unicast') {
    throw new Error(`SSRF Detected: Destination IP ${address} (${range}) is not a public routable address.`);
  }

  return url;
}
```

---

## 5. Checklist for review
- [ ] Every array in input schemas defines `.max(N)` (e.g. `z.array().max(100)`).
- [ ] Every string defines `.max(N)` to prevent memory exhaustion.
- [ ] User-supplied webhook destination URLs or webhook callbacks run through SSRF validation.
- [ ] Global rate limiting applied to authentication endpoints (login, forgot password, token refresh).

---

## 6. How to prove it
- **SSRF Test:** Submit webhook registration with destination `http://169.254.169.254/` and `http://127.0.0.1:5432/`; assert immediate rejection with `INVALID_ARGUMENT`.
- **Payload Bound Test:** Send a JSON array containing 5,000 elements when limit is 100; assert HTTP 400 rejection before handler execution.
