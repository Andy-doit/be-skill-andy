# Folder Structure by Trigger Kind & Operation Shape

## 1. When to read this
Read this when creating a new service, feature, or module, or reorganizing an existing backend codebase into maintainable, discoverable operation units.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should backend folders be grouped? | By business capability at root, then by trigger kind (`http`, `jobs`, `webhooks`, `cli`). | App is a pure microservice with exactly one trigger door. |
| How should an operation's files be laid out? | Flat operation shape: input schema, output schema, handler, mapper co-located. | An entity/model is shared by multiple closely coupled operations. |
| Where do shared cross-cutting utilities live? | Under a top-level `shared/` or `common/` library with strict zero-domain imports. | The utility is specific to a single domain capability. |

---

## 3. Rules

### BE-24 Flat trigger-based operation shape
Operations are organized under the trigger kind that invokes them. Within an operation folder, all related artifacts (input validation schema, output contract, handler, mapping logic) are findable from the operation name without jumping across distant directories.
- **Why:** Developers spend 80% of time navigating between controller, service, DTO, and mapper for a single endpoint. Co-locating them by operation makes changes cohesive and reviewable.
- **Enforced by:** Code review and directory structure linting.

---

## 4. Canonical Directory Layout

```text
src/modules/billing/
├── domain/                         # Core domain models and business invariants
│   ├── models/
│   │   └── invoice.model.ts
│   └── ports/                      # Outbound interfaces (storage, gateway)
│       ├── invoice-repository.port.ts
│       └── payment-gateway.port.ts
├── triggers/                       # Entry doors grouped by trigger kind
│   ├── http/                       # REST or GraphQL endpoints
│   │   └── create-invoice/
│   │       ├── create-invoice.dto.ts
│   │       ├── create-invoice.controller.ts
│   │       └── create-invoice.mapper.ts
│   ├── webhooks/                   # Inbound webhook intake
│   │   └── stripe-payment/
│   │       ├── stripe-payment.dto.ts
│   │       └── stripe-payment.handler.ts
│   ├── jobs/                       # Background queue workers
│   │   └── reconcile-invoices/
│   │       ├── reconcile-invoices.job.ts
│   │       └── reconcile-invoices.worker.ts
│   └── cli/                        # Administrative CLI commands
│       └── backfill-tax-id.command.ts
└── adapters/                       # Concrete implementations of domain ports
    ├── persistence/
    │   ├── invoice.entity.ts
    │   └── invoice-typeorm.adapter.ts
    └── gateway/
        └── stripe-payment.adapter.ts
```

---

## 5. Checklist for review
- [ ] No monolithic `services/` or `controllers/` bucket with 50 unrelated files.
- [ ] Each trigger door has its own dedicated input and output schemas.
- [ ] Domain ports remain pure interfaces without framework decorator dependencies.

---

## 6. How to prove it
- **Navigation Proof:** Any endpoint can be read and modified by opening files within its single operation directory.
