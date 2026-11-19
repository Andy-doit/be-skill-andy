# Security Hardening, CORS & Proxy Hops

## 1. When to read this
Read this when configuring security headers (Helmet), CORS policies, trusted proxy hops, or running dependency vulnerability audits.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Which security headers to send? | Standard Helmet headers (`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `X-Frame-Options: DENY`). | Specific framing required for authorized iframe embeds. |
| How to configure CORS? | Explicit allowlist of trusted web origins (`origin: ['https://app.domain.com']`). | Public static endpoints (e.g. open OpenAPI docs) requiring wildcard `*`. |
| How to handle `X-Forwarded-For`? | Declare exact count of trusted reverse proxy hops (e.g. `app.set('trust proxy', 1)`). | Multi-tier cloud proxy topology with static subnet verification. |

---

## 3. Rules

### Trusted Proxy Hops & Strict CORS (Applying Rule BE-17)
Applications behind load balancers must declare the exact count or subnets of trusted proxy hops, adhering to rule `BE-17`. Blindly trusting `X-Forwarded-For` without declaring proxy hops is forbidden. CORS must never configure `Access-Control-Allow-Origin: *` in combination with `credentials: true`.
- **Why:** Blindly trusting `X-Forwarded-For` allows attackers to spoof client IP addresses, completely bypassing IP rate limits and IP geoblocking. Permissive wildcard CORS with credentials allows foreign websites to read authenticated user data.
- **Enforced by:** Security headers test and CORS verification suite.

---

## 4. Failure examples
- **Failure:** Configuring `cors({ origin: true, credentials: true })`.
  - *Symptom:* Reflects whatever `Origin` header the client sends, effectively permitting any malicious site to read user data via credentialed requests.
- **Failure:** Blindly trusting `req.headers['x-forwarded-for']`.
  - *Symptom:* Attacker sends `X-Forwarded-For: 127.0.0.1` and bypasses all rate limiting.

---

## 5. Checklist for review
- [ ] CORS origin is an explicit array of production/staging domains.
- [ ] `trust proxy` configured to match exact cloud architecture (e.g. AWS ALB = 1).
- [ ] Dependency security audit (`npm audit`) runs in CI without high/critical vulnerabilities.

---

## 6. How to prove it
- **CORS Test:** Send `OPTIONS` request with `Origin: https://evil.com`; assert that `Access-Control-Allow-Origin` is omitted or does not match evil.com.
