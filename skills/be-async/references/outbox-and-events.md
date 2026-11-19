# Transactional Outbox Pattern & Event Publishing

## 1. When to read this
Read this when a database update must trigger an event, notification, or message broker publication (NATS, Kafka, RabbitMQ, BullMQ).

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Can an event be published directly to a broker during a DB transaction? | **NEVER.** (Dual-write hazard). | Never; direct broker publish inside DB transaction is forbidden. |
| How to ensure an event is emitted if and only if the DB commits? | Write an `outbox` row in the same database transaction as the entity change (BE-2). | Native change data capture (Debezium) streaming directly from Postgres WAL. |
| How are outbox rows delivered to the message broker? | Dedicated background relay worker polling outbox table or listening to WAL. | Low-throughput internal tool where eventual consistency of 100ms is sufficient. |

---

## 3. Rules

### BE-2 Transactional outbox
Any business state change that must cause an asynchronous message, event, or background job must write an `outbox` record into the database within the **same local transaction** as the business state change. A background relay process reads committed outbox rows and publishes them to the broker with at-least-once delivery semantics.
- **Why:** Publishing directly to a message broker during or immediately after a database write creates an unresolvable dual-write hazard: if the broker publish fails, the DB has committed without notifying anyone; if the broker publish succeeds but the DB transaction rolls back, external consumers process phantom data that does not exist in the database.
- **Enforced by:** Integration tests simulating database rollbacks and broker disconnections.

---

## 4. Transactional Outbox Schema & Pattern

```sql
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_outbox_pending ON outbox_events (created_at) WHERE published_at IS NULL;
```

```typescript
// Atomic write in service
await this.dataSource.transaction(async (tx) => {
  await tx.save(OrderEntity, order);
  await tx.save(OutboxEntity, {
    topic: 'orders.placed',
    payload: { orderId: order.id, amount: order.amount },
  });
});
```

---

## 5. Failure examples
- **Failure:** Publishing event to Kafka immediately after `await repo.save(order)` outside transaction:
  ```typescript
  await repo.save(order);
  await kafka.send({ topic: 'orders', message: order }); // Process crashes here!
  ```
  - *Symptom:* If server crashes between lines 1 and 2, order is saved in database but event is never published; downstream inventory is never reserved.

---

## 6. Checklist for review
- [ ] No `kafka.send()`, `nats.publish()`, or `queue.add()` calls inside business transaction methods.
- [ ] Outbox table has partial index for fast retrieval of un-published records (`WHERE published_at IS NULL`).
- [ ] Relay worker updates `published_at` only after broker confirms acknowledgement.
- [ ] Relay uses deterministic sequence IDs to support consumer deduplication.

---

## 7. How to prove it
- **Integration Boundary:** Test initiates database transaction, writes outbox row, and simulates transaction rollback; asserts zero messages are emitted to the broker.
