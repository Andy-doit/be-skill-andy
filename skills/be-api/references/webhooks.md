# Inbound Webhook Ingestion & Verification

## 1. When to read this
Read this when creating or updating endpoints that receive external webhook deliveries (Stripe, GitHub, Shopify, crypto exchanges).

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| When is the webhook signature verified? | As the very first statement before parsing payload body. | Never; unverified payloads must never be deserialized or processed. |
| How to handle the raw request body? | Retain raw unparsed buffer at HTTP middleware layer for HMAC check. | Provider uses asymmetric public key signature over pre-hashed header. |
| How should webhook intake be processed? | Record raw event into inbox table in single DB transaction, then ack 200 immediately. | Operation is strictly idempotent and completes in < 50ms. |
| How to handle slow downstream effects? | Enqueue a background job from the persisted inbox event. | Provider expects synchronous inline response containing return data. |

---

## 3. Rules

### BE-18 Webhook signature check is the first statement of its door
The cryptographic signature header (HMAC-SHA256) of an inbound webhook must be verified as the first statement of the intake door using constant-time comparison against the raw request body buffer. If signature verification fails, reject immediately with HTTP 401/403.
- **Why:** Processing or parsing unverified webhook payloads enables unauthenticated attackers to forge events, trigger unauthorized state changes, or exploit JSON parser vulnerabilities.
- **Enforced by:** Unit and integration tests sending valid and tampered signatures.

### Inbound Delivery Inbox Claims (Applying Rule BE-8)
Every inbound webhook delivery is assumed at-least-once. The receiver claims the incoming delivery ID (e.g. `event.id`) into an `inbox` table within the same transaction as state updates, as defined in rule `BE-8` (see `be-async`). If the ID already exists, replay the acknowledged status without duplicate execution.
- **Why:** Webhook providers retry delivery on network timeouts. Without an inbox claim, duplicate deliveries cause duplicate shipments or double balance credits.
- **Enforced by:** Duplicate delivery integration tests.

---

## 4. Failure examples
- **Failure:** Parsing JSON body with `express.json()` before verifying signature, then computing HMAC on `JSON.stringify(req.body)`.
  - *Symptom:* Subtle key re-ordering causes HMAC check to fail unpredictably, dropping legitimate webhooks.
- **Failure:** Sending transactional email and updating database directly in webhook handler.
  - *Symptom:* Email provider has 3-second latency; webhook provider times out at 2 seconds and retries, sending duplicate emails.

---

## 5. Checklist for review
- [ ] Raw body buffer captured and preserved for cryptographic verification.
- [ ] Signature verified using constant-time comparison (`crypto.timingSafeEqual`).
- [ ] Ingestion door returns HTTP 200 within 200ms after saving to inbox.
- [ ] Downstream business logic handled via background job worker.

---

## 6. How to prove it
- **Integration Boundary:** Test sends duplicate webhook requests with identical ID; asserts that only 1 job is queued and both receive HTTP 200.
- **Security Check:** Test sends payload with tampered signature; asserts immediate HTTP 400/401 rejection with zero database writes.
