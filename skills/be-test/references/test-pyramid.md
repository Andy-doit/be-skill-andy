# Backend Test Pyramid & Real-Boundary Evidence

## 1. When to read this
Read this when designing test suites, deciding whether to write a unit or integration test, proving concurrency/transaction claims, or structuring test folders.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where to test business logic and calculations? | Pure unit tests with in-memory execution and typed doubles (BE-28). | Logic involves complex database-specific SQL dialect expressions. |
| Where to test database transactions, locks, and constraints? | **Real-store integration test:** execute against a real containerized PostgreSQL instance (BE-28). | Never use SQLite or in-memory mocks to prove Postgres locking or constraint claims. |
| Where to test message brokers and outbox relays? | Integration test against real Redis / NATS container (BE-30). | Basic payload serialization unit tests. |

---

## 3. Rules

### BE-28 Real-store integration tests for persistence and concurrency
Claims about database transactions, row-level locking, foreign key constraints, unique indexes, idempotency, or race conditions must be proven by integration tests running against the real database engine (e.g. real PostgreSQL in Docker/Testcontainers). Using in-memory mocks or SQLite to prove PostgreSQL transaction or constraint claims is strictly forbidden.
- **Why:** In-memory mocks do not execute SQL constraints, do not enforce ACID transaction isolation, and cannot reproduce multi-connection race conditions. A mock-based test will pass green even if the underlying SQL query is completely invalid or deadlocks under concurrency.
- **Enforced by:** Integration test execution in CI.

### BW-P10 Evidence matches the claim
A claim about concurrency, crash recovery, authorization, or idempotency must be proven at the boundary it names. A unit double proves control flow only. State in every verification report exactly which boundary each claim was proven at.
- **Why:** Prevents false confidence where an author claims "concurrency is safe" because an isolated single-threaded unit test passed.
- **Enforced by:** Review of the verification section.

---

## 4. Failure examples
- **Failure:** Testing an `ON CONFLICT DO UPDATE` query using an in-memory array mock.
  - *Symptom:* The mock passes, but in production the query crashes with a syntax error due to an ambiguous column reference.
- **Failure:** Claiming "duplicate payments are impossible" based on a serial unit test.
  - *Symptom:* Production double-spend occurs under concurrent network requests.

---

## 5. Checklist for review
- [ ] Concurrency tests launch parallel asynchronous promises (`Promise.all([...])`).
- [ ] Integration tests run against real Postgres/Redis test containers.
- [ ] Tests must be capable of failing for the wrong reason (assert values, state, and outcomes, not just call counts).
- [ ] Placement convention followed: `src/**/*.spec.ts` for unit; `test/integration/**/*.spec.ts` for real-store.

---

## 6. How to prove it
- **Proof Report:** Report includes: "Proven at boundary: Real PostgreSQL 16 container, 20 concurrent connections".
