# Consumer/Provider Contract & Async Boundary Testing

## 1. When to read this
Read this when testing APIs consumed by frontend or mobile clients, validating third-party provider integrations, or testing asynchronous message publishers and consumers.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How to verify API compatibility across teams? | Contract tests running against the committed OpenAPI / GraphQL schema (BE-29). | Formal Pact contract broker for large enterprise cross-organization teams. |
| How to test asynchronous message flows? | End-to-end boundary test: publish to real test broker, verify consumer processes message to completion (BE-30). | Basic payload serialization unit tests. |

---

## 3. Rules

### BE-29 Provider/consumer contract testing
Consumer and provider contract tests must run against the committed schema contract, never against the other side's local source code.
- **Why:** Testing against source code allows subtle schema serialization bugs (field name casing, date format strings, nullability) to slip through undetected.
- **Enforced by:** Schema-driven contract test runner in CI.

### BE-30 Testing asynchronous flows across boundaries
Asynchronous event publishing and consumer processing must be tested across the boundary: delivery, redelivery (simulating duplicates), and consumer crash recovery.
- **Why:** Unit testing the publisher and consumer in isolation fails to verify that serialization formats match, headers are preserved, and idempotency logic works on redelivery.
- **Enforced by:** Broker integration tests.

---

## 4. Failure examples
- **Failure:** Backend changes date serialization from Unix timestamp to ISO-8601 string without running contract tests.
  - *Symptom:* Frontend parser fails at runtime; contract test against schema would have immediately caught the type mismatch.

---

## 5. Checklist for review
- [ ] Contract test asserts response matches committed OpenAPI / GraphQL schema.
- [ ] Async test publishes event, awaits consumer completion, and asserts final database state.
- [ ] Test verifies that redelivering the same event ID does not duplicate business effects (BE-8).

---

## 6. How to prove it
- **Integration Test:** Publish message with duplicate delivery ID to real NATS/Redis broker; assert consumer executes exactly once.
