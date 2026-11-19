# Transactions, Concurrency & Store Constraints

## 1. When to read this
Read this when coordinating multi-row database updates, managing concurrency, preventing double-spends or lost updates, and setting transaction boundaries.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Can an external network call be made inside a DB transaction? | **NEVER.** Prepare data outside, run DB transaction, then call external service. | Never; two-phase commit is avoided; use transactional outbox instead. |
| How to prevent duplicate records under concurrent writers? | Unique database constraint (e.g. `UNIQUE (user_id, date)`). | Multi-tenant dynamic constraint requiring application-level serializable isolation. |
| How to protect a balance or counter from lost updates? | Atomic conditional update: `UPDATE account SET balance = balance - :amount WHERE id = :id AND balance >= :amount`. | Complex multi-aggregate invariant requiring row-level locking (`SELECT ... FOR UPDATE`). |
| How to handle concurrent edits on an entity? | Optimistic concurrency via integer `version` column. | Contention is extreme (> 100 concurrent writers per record per second). |

---

## 3. Rules

### BE-3 No transaction spans an external call
A database transaction must never wrap an external network call (HTTP request, message broker enqueue, third-party payment gateway, email sending). Transactions must be kept strictly local, small, and fast.
- **Why:** External network calls have unbounded latency. Holding a database transaction across an external call keeps database connection slots, table locks, and row locks open, starving the connection pool. Furthermore, if the external call succeeds but the local DB commit fails, the system enters an irreconcilable split-brain state (dual-write hazard).
- **Enforced by:** AST linter checks, code review, and integration tests with injected network latency.

### BE-6 Invariants under concurrent writers are held by constraints or conditional updates
Business invariants that must survive concurrent execution (inventory limits, unique identities, single active sessions) must be held by database constraints or conditional atomic SQL statements, never by application-level read-then-write loops. Claims must be proven by a concurrent race test on a real store.
- **Why:** Two parallel requests running `if (balance >= amount) balance -= amount` will both read the same initial balance, succeed, and overdraw the account. No in-memory unit test with mocks reveals this race.
- **Enforced by:** Concurrency race tests on real database containers.

---

## 4. Failure examples
- **Failure:** Wrapping Stripe checkout and order creation in one transaction:
  ```typescript
  // VIOLATION: BE-3
  await db.transaction(async (tx) => {
    await tx.insert(Order, orderData);
    await stripe.charges.create({ ... }); // Latency holds DB lock; if commit fails later, charge cannot roll back!
    await tx.update(Order, { status: 'PAID' });
  });
  ```
- **Failure:** In-memory check before insert:
  ```typescript
  // VIOLATION: BE-6
  const existing = await db.findOne(User, { email });
  if (existing) throw new ConflictException();
  await db.insert(User, { email }); // Concurrent request slips between find and insert!
  ```

---

## 5. Checklist for review
- [ ] No `fetch`, `axios`, `http`, or queue publishing inside `db.transaction(...)` callbacks.
- [ ] Concurrency-sensitive counters use conditional SQL statements checking thresholds.
- [ ] Tables subject to concurrent writes implement optimistic locking (`version` column).
- [ ] Unique business constraints are enforced by unique indexes in the database schema.

---

## 6. How to prove it
- **Real-Store Race Test:** Run a test launching 50 parallel asynchronous workers attempting the same mutation simultaneously against a real PostgreSQL instance; assert that invariants hold and only the permitted number of records succeed.
