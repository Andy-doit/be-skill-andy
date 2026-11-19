# Layering, Tiers & Dependency Inversion

## 1. When to read this
Read this when designing new backend modules, deciding where a class or function belongs, reviewing circular dependencies, or decoupling business logic from technical infrastructure.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where does a business rule belong? | Pure domain service or entity with zero external I/O imports. | Never; business invariants must not depend on database or network drivers. |
| How does domain access storage or external APIs? | Port interfaces defined in domain; adapters implemented in platform/integrations. | The operation is a read-only query that needs specialized projection caching. |
| How do two independent capabilities communicate? | Durable handover (asynchronous outbox event or background job queue). | The call is strictly read-only and within the same local process memory. |
| Where are singletons and connections instantiated? | In a single, thin composition root (e.g. `AppModule` or `main.ts`). | The service is explicitly multi-tenant and requires dynamic scoped lifecycles. |

---

## 3. Rules

### BE-23 Unidirectional dependency direction, single raw library owners & mandatory timeouts
Dependencies must point inward toward the domain core (Domain <- Platform <- Integrations as declared). The domain layer owns business invariants and defines ports. Platform implements technical capabilities (database, cache, queues). Integrations translate third-party protocols. Handlers and doors are thin adapters. Every raw external library has exactly one adapter owner, and every outbound call has a required timeout.
- **Why:** Inverting dependencies isolates business logic from framework deprecations, database migrations, and third-party API churn. Single raw library owners isolate third-party changes.
- **Enforced by:** Linter import rules (e.g. `eslint-plugin-import` forbidden zones) and code review.

### BE-24 Doors are thin
Entry doors (HTTP controllers, GraphQL resolvers, webhook handlers, CLI commands, queue consumers) must only parse input, authenticate/authorize, dispatch to the domain service, and map results to response contracts. Zero business logic in doors.
- **Why:** Embedding business logic in doors couples invariants to a single transport, duplicating logic when the same operation is triggered via webhook or CLI.
- **Enforced by:** Unit testing and code review.

### BR-2 Abstractions carry a concrete responsibility
An abstraction must carry a clear architectural responsibility: contract translation, retry policy, lifecycle management, or coordination. Forwarding layers that merely pass arguments through without adding validation, policy, or mapping must be removed.
- **Why:** Pointless pass-through classes add mental overhead, slow down debugging, and create illusion of structure.
- **Enforced by:** Code review.

---

## 4. Failure examples
- **Failure:** A domain `OrderService` directly imports `stripe` and executes an HTTP charge inside an open database transaction.
  - *Symptom:* When Stripe has network jitter, database connection pool exhausts; if DB commit fails after charge, money is deducted but order status rolls back.
- **Failure:** Controller contains 200 lines of calculation and database queries before returning JSON.
  - *Symptom:* When a webhook endpoint needs to trigger the same order placement, logic must be copied or hacked.

---

## 5. Checklist for review
- [ ] No database drivers, ORM entities, or HTTP client libraries imported in domain logic.
- [ ] Composition root is the only place instantiating connection pools and stateful singletons.
- [ ] No circular imports (`A -> B -> A`).
- [ ] Cross-module mutations use durable handovers, never nested transactions.

---

## 6. How to prove it
- **Unit Boundary:** Domain unit tests run in memory without mocking database drivers or network sockets.
- **Static Boundary:** Dependency graph lint passes without cyclic dependencies.
