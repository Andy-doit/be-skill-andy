# Outbound Integrations, Timeouts & Circuit Breaking

## 1. When to read this
Read this when calling any external HTTP, gRPC, or third-party partner service (Stripe, Twilio, SendGrid, OpenAI, external payment gateways).

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| What is the required timeout for outbound HTTP calls? | Mandatory hard deadline (e.g. 5,000ms max) configured on HTTP client instance (BE-23). | Streaming endpoints (SSE / LLM tokens) with per-chunk idle timeout. |
| Where does third-party SDK code live? | Isolated behind a dedicated adapter interface in `adapters/` (BE-23). | Never; domain code must never directly import raw third-party SDKs. |
| When should retries be executed inline? | Only for safe idempotent GET requests with exponential backoff (e.g. 2 attempts max). | Mutating operations must be retried via background queue jobs, never inline. |
| When should a circuit breaker be introduced? | When an external service outage risks cascading thread/connection exhaustion in the caller. | High-traffic services with measured downstream unreliability. |

---

## 3. Rules

### Mandatory Outbound Timeouts & Isolated Providers (Applying Rule BE-23)
Every outbound network call must configure a mandatory hard timeout deadline, adhering to rule `BE-23`. Raw third-party SDKs and API clients must be encapsulated behind a single domain adapter interface. Business logic never imports external provider SDKs directly.
- **Why:** External providers experience network freezes and outages. Outbound calls without timeouts hang indefinitely, consuming Node.js sockets, thread workers, and memory until the entire backend crashes.
- **Enforced by:** HTTP client configuration linter and mock timeout integration tests.

### BR-5 Unknown remote outcomes stay unknown
If an outbound mutation call times out or returns a network error, the outcome on the remote system is unknown. The caller must not assume failure and must not blindly retry without checking or reconciling remote state.
- **Why:** A timeout usually means the request arrived at the remote server, but the response was delayed or lost. Retrying a blind POST creates duplicate charges or double bookings.
- **Enforced by:** Reconciliation job tests.

---

## 4. Failure examples
- **Failure:** Invoking `fetch('https://api.external.com/data')` with default settings (no AbortController/timeout).
  - *Symptom:* External API hangs; after 5 minutes, 1,000 pending requests exhaust server file descriptors, crashing the entire backend.
- **Failure:** Inlining `stripe.paymentIntents.create()` directly inside a domain controller.
  - *Symptom:* Stripe SDK major upgrade breaks 15 files across the codebase simultaneously.

---

## 5. Checklist for review
- [ ] Every `axios.create()` or `fetch()` call includes `{ timeout: 5000 }` or `AbortSignal.timeout(5000)`.
- [ ] Third-party SDK imported in exactly one file under `adapters/` or `integrations/`.
- [ ] No unbounded retry loops in HTTP client handlers.

---

## 6. How to prove it
- **Timeout Test:** Configure mock server with 10-second delay; execute outbound call; assert that client throws `TimeoutException` within exactly the configured deadline (e.g. 2000ms).
