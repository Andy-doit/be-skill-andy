# Feature Design Record / Architectural Decision Record (ADR)

> Rule BW-P4: Name the question that applied, the mechanism chosen, the simpler one rejected and why, and the behavior that proves it.

---

## 1. Context & Business Invariant
- **Feature / Change Name:** `<Descriptive Name>`
- **Author / Agent:** `<Author Name>`
- **Date:** `<YYYY-MM-DD>`
- **Invariant to Protect:** `<What must remain true under all circumstances, crashes, and concurrency?>`

---

## 2. Decision Table & Mechanism Selection

| Question | Smallest Mechanism Chosen | Simpler Mechanism Rejected | Why Simpler Mechanism Was Insufficient |
|---|---|---|---|
| *How do we ensure duplicate payments are never charged under retries?* | Idempotency Key with Redis lease + completed receipt table (BE-9). | Checking if a charge already exists by order ID before charging. | Non-atomic check-then-act creates race window under concurrent duplicate webhook delivery. |
| *How do we notify external systems of order creation reliably?* | Transactional Outbox table in the same DB transaction + asynchronous relay (BE-2). | Publishing directly to Kafka/NATS inside the service method. | Dual-write hazard: event published even if DB transaction rolls back, or DB commits while broker is unreachable. |

---

## 3. Implementation Details & Rule Citations
- **Rules Applied:** `BE-2`, `BE-3`, `BE-9`, `BE-14`
- **Files Modified:**
  - `src/modules/orders/services/order.service.ts`
  - `src/modules/orders/repositories/outbox.repository.ts`
  - `src/modules/orders/migrations/20261119_add_outbox.ts`

---

## 4. Failure Mode Analysis
| Potential Failure / Crash Point | System Behavior | Recovery Mechanism |
|---|---|---|
| Crash after DB transaction commit but before outbox relay | Outbox row persists in database | Background outbox poller picks up row upon restart |
| External payment gateway timeout | Operation status remains PENDING | Periodic reconciliation job queries gateway status |

---

## 5. Verification & Proof (BW-P10, BR-7)
- **Boundary Proved At:** Real PostgreSQL store + real Redis instance in integration test.
- **Test File:** `test/integration/orders/outbox-concurrency.spec.ts`
- **Output:** 50 concurrent requests simulated; exactly 1 charge made, exactly 1 outbox record created, 0 dual-writes.
