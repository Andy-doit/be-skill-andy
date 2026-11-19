# Session Management, Cookies & Token Security

## 1. When to read this
Read this when designing user login endpoints, setting HTTP session cookies, issuing API tokens or JWTs, configuring CSRF protection, or handling logout and token revocation.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where should web session tokens be stored? | `HttpOnly; Secure; SameSite=Lax` (or `Strict`) HTTP cookies. | Native mobile app using secure OS keychain storage. |
| How to prevent CSRF on cookie-authenticated requests? | SameSite cookies + Origin/Referer header verification on mutating methods. | Double Submit Cookie pattern required for legacy subdomains. |
| What is the lifespan of an access token? | Short-lived (5 to 15 minutes max). | Offline background processing requiring long-lived scoped API keys. |
| How to revoke sessions immediately? | Store session ID / refresh token family in Redis with TTL; validate on refresh. | Stateless JWT with high risk tolerance where 15-minute natural expiration is acceptable. |

---

## 3. Rules

### BE-17 Secrets compared in constant time, cookies with strict flags, and origin verification
Secrets must be compared in constant time; session tokens delivered via HTTP cookies must pin `HttpOnly`, `Secure`, and `SameSite=Lax` (or `Strict`); state-changing requests authenticated by cookies must verify the `Origin` or `Referer` header against an allowlist of trusted origins to prevent Cross-Site Request Forgery (CSRF); trusted proxy hops must be declared explicitly.
- **Why:** Omitting `HttpOnly` allows XSS scripts to steal user sessions. Omitting `Secure` leaks tokens over unencrypted networks. Omitting origin checks allows malicious third-party websites to forge requests on behalf of authenticated users. Non-constant time comparison leaks timing info.
- **Enforced by:** Security headers test, CORS/CSRF integration tests, and crypto comparison tests.

---

## 4. Failure examples
- **Failure:** Returning access token in JSON body for browser frontend to store in `localStorage`.
  - *Symptom:* Any minor third-party script or XSS vulnerability reads `localStorage` and exfiltrates user tokens immediately.
- **Failure:** Accepting state-changing POST requests without validating the `Origin` header.
  - *Symptom:* Attacker hosts a malicious page with auto-submitting form `<form action="https://bank.com/transfer" method="POST">` that executes using victim's ambient browser cookies.

---

## 5. Checklist for review
- [ ] Cookie options include: `{ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }`.
- [ ] Refresh tokens are rotated on each use (new refresh token issued, old token invalidated).
- [ ] Logout invalidates both the client cookie and the server-side session record in Redis/DB.
- [ ] Access tokens have a maximum lifetime of 15 minutes.

---

## 6. How to prove it
- **HTTP Header Test:** Inspect Set-Cookie header in authentication responses; assert all three security flags are present.
- **CSRF Attack Test:** Send a `POST` request with a foreign `Origin: https://evil.com` header; assert immediate HTTP 403 rejection.
