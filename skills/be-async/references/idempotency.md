# Operation Idempotency & Inbox Delivery Claims

## 1. When to read this
Read this when designing financial or state-changing mutations, accepting client `Idempotency-Key` headers, or handling duplicate incoming events.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How to prevent duplicate client mutation requests? | Client sends unique `Idempotency-Key`; backend stores completed response receipt in DB/Redis. | Operation is inherently naturally idempotent (e.g. `SET status = 'INACTIVE'`). |
| What happens if a duplicate request arrives while first is processing? | Return HTTP 409 Conflict or hold lock until first request completes, then replay receipt. | Long-running asynchronous mutation returning `202 Accepted` with polling URL. |
| How to handle inbound event or webhook redeliveries? | Claim delivery ID in an `inbox` table within the same DB transaction as the state update (BE-8). | Receiver only performs pure idempotent mathematical recalculation. |

---

## 3. Rules

### BE-9 Client mutation idempotency
Client mutations that must not double (payments, transfers, order placements, ticket issuance) must require a stable operation identity (e.g. `Idempotency-Key` header). The backend records the lease, executes the mutation, and persists the committed response receipt. Subsequent requests with the same key replay the committed outcome without re-executing business effects.
- **Why:** Mobile network reconnects and browser double-clicks re-send identical HTTP requests. Without idempotency keys, users are billed twice or duplicate orders are created.
- **Enforced by:** Concurrent race tests with identical idempotency keys.

### BE-8 Inbound delivery inbox claims
Every message broker or webhook delivery must be assumed at-least-once. The receiver claims the incoming delivery identifier in an `inbox` table within the receiver's local database transaction. If the claim fails (unique constraint violation), the delivery is treated as already processed and acknowledged.
- **Why:** Network acknowledgements are lost during network partitions. Brokers redeliver unacknowledged messages. Without an inbox claim, redelivered messages cause duplicate side-effects.
- **Enforced by:** Duplicate event delivery integration tests.

---

## 4. Failure examples
- **Failure:** User submits checkout; network hiccups for 3 seconds; client retries.
  - *Symptom:* Two distinct orders are created and the customer's card is charged twice.
- **Failure:** Broker redelivers `ORDER_PLACED` event because consumer crashed 1ms after writing database but before sending ACK.
  - *Symptom:* Warehouse generates two shipping labels for a single order.

---

## 5. Checklist for review
- [ ] Mutating endpoints accept and validate `Idempotency-Key` header.
- [ ] Response status and body cached in idempotent receipt table.
- [ ] Inbound event consumers check/insert into `inbox (message_id)` inside the processing transaction.
- [ ] Concurrent requests with identical key receive identical response without duplicate side effects.

---

## 6. How to prove it
- **Real-Store Race Test:** Launch 20 concurrent requests with the exact same `Idempotency-Key` simultaneously against real database; assert that exactly 1 charge is executed and all 20 receive identical successful response bodies.
