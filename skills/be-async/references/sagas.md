# Distributed Sagas & Long-Running Workflows

## 1. When to read this
Read this when coordinating multi-step distributed operations across distinct microservices or capabilities where a later failure requires undoing earlier committed steps.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| When should a distributed saga be introduced? | **Only when a business transaction spans multiple storage systems AND requires compensating undo.** | Operation can fit within a single database transaction (always prefer local ACID). |
| How to manage saga state and progression? | Choreographed events with outbox OR centralized orchestrator with a state machine table. | Formal workflow engine (e.g. Temporal, Camunda) for workflows spanning weeks. |
| What happens when an intermediate step fails permanently? | Execute declared compensating actions in reverse order; if compensation fails, park visibly and alert owner. | Never drop or abort without executing compensations. |

---

## 3. Rules

### BE-12 Sagas require declared undo actions per step
Every step in a multi-step distributed workflow must define an explicit compensating action (undo). When a step fails non-recoverably, the saga coordinator executes compensating actions for all previously committed steps in reverse order. If compensation cannot complete, the saga instance must be visibly parked in a `FAILED_MANUAL_REVIEW` state with an owner alert.
- **Why:** In distributed architectures, earlier steps have already committed to their local databases. Without explicit compensation, partial failures leave the system in permanent inconsistent state (e.g. money deducted from customer, but flights never booked).
- **Enforced by:** Saga failure and compensation integration tests.

---

## 4. Failure examples
- **Failure:** An order workflow: Step 1 (reserve inventory) -> Step 2 (charge credit card) -> Step 3 (generate shipping label). Step 3 fails, but code does not refund credit card or release inventory.
  - *Symptom:* Customer is charged, stock is locked, but order is never delivered.

---

## 5. Checklist for review
- [ ] Every forward action `executeStep()` has a corresponding `compensateStep()`.
- [ ] Compensating actions are themselves designed to be strictly idempotent.
- [ ] Saga state machine records current step, status (`RUNNING`, `COMPENSATING`, `COMPLETED`, `PARKED`), and monotonic version.
- [ ] Critical failures trigger webhook / PagerDuty / Sentry alerts to system operators.

---

## 6. How to prove it
- **Compensation Test:** Inject a failure at Step 3 of a 4-step saga; assert that Step 2 and Step 1 compensation actions execute successfully and final state is marked as cancelled/refunded.
