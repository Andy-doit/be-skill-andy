# Default-Deny Access at Every Door

## 1. When to read this
Read this when registering new HTTP routes, GraphQL queries/mutations, webhook receivers, or configuring route security guards.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| What is the baseline authorization on an endpoint? | **Default-deny:** all routes require valid authenticated user session by default. | Explicitly annotated with `@Public({ reason: 'Login endpoint' })`. |
| Where is default-deny configured? | Global guard / middleware applied at the application root level. | Never rely on per-controller decorator placement. |
| Can an endpoint be public without documentation? | **NO.** Public routes must declare an explicit architectural reason in code. | Never; undocumented public endpoints are security hazards. |

---

## 3. Rules

### BE-14 Default-deny at every door
Every entry point (HTTP endpoint, GraphQL operation, WebSocket event) is denied by default unless an authenticated session is proven. Open or unauthenticated doors must explicitly declare a `@Public()` annotation carrying a human-readable justification for why public access is required.
- **Why:** In opt-in security models, developers inevitably forget to add security decorators to newly created endpoints, accidentally exposing administrative or sensitive data to the internet.
- **Enforced by:** Automated test scanning all route registrations; asserts that every route either has an active auth guard or an approved `@Public()` reason.

---

## 4. Failure examples
- **Failure:** A new controller `InvoiceExportController` is added without `@UseGuards(AuthGuard)`.
  - *Symptom:* Unauthenticated web crawlers find `/invoices/export` and download all customer billing statements.
- **Failure:** An endpoint is made public because "the client couldn't get authentication working easily".
  - *Symptom:* Attackers bypass authentication and execute sensitive business operations.

---

## 5. Checklist for review
- [ ] Global authentication guard configured at composition root (`app.useGlobalGuards(new AuthGuard())`).
- [ ] Every `@Public()` decorator declares an explicit reason: `@Public({ reason: 'Health check probe' })`.
- [ ] Automated security scan verifies 100% of routes are gated or justified.

---

## 6. How to prove it
- **Route Scan Test:** Test iterates through all registered application endpoints; sends unauthenticated requests to each; asserts that all routes return HTTP 401 except those explicitly in the public whitelist.
