# Code Quality, Typing & Boundary Safety

## 1. When to read this
Read this when authoring services, defining function signatures, typing inputs and outputs, or designing public module boundaries.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should function parameters and results be typed? | Named `{Action}Params` and `{Action}Result` interfaces. | Function takes a single un-changing primitive value (e.g. `findById(id: string)`). |
| Can database entities be returned from API controllers? | Never; map explicitly to response DTOs. | Internal admin debug script with no external consumers. |
| How to handle multi-variant business results? | Discriminated union with a `kind` or `status` tag. | Single happy path with all failures thrown as standard exceptions. |
| What are function complexity budgets? | Functions <= 50 lines, max cyclomatic complexity 10. | A complex mathematical state-machine parser with comprehensive unit tests. |

---

## 3. Rules

### BE-26 Typed boundaries
All external data and internal module boundaries must be explicitly typed with named interfaces. Leaking storage entity instances directly into public API outputs is forbidden. A TypeScript type assertion (`as SomeType`) is not validation; inputs must be parsed at the perimeter.
- **Why:** Leaking database rows exposes internal columns (password hashes, soft-delete flags, internal tenant IDs) and tightly couples database schema changes to client contracts.
- **Enforced by:** Type check, schema validation libraries (Zod, class-validator), and code review.

---

## 4. Failure examples
- **Failure:** Returning TypeORM entity directly: `return this.userRepo.findOne({ id })`.
  - *Symptom:* A new column `passwordHash` or `mfaSecret` added to the table is inadvertently serialized to the HTTP response, leaking credentials.
- **Failure:** Using inline object literals `Promise<{ id: string; status: boolean }>` across files.
  - *Symptom:* Field renaming breaks callers invisibly without a single source of truth for the type definition.

---

## 5. Checklist for review
- [ ] No `any` or uncontrolled type assertions (`as unknown as X`).
- [ ] Explicit `{Action}Params` and `{Action}Result` on non-trivial methods.
- [ ] Comments explain *why* non-obvious business logic exists; obvious operations left clean without noisy comments.
- [ ] No service-locator pattern (`container.get(...)`) inside business logic.

---

## 6. How to prove it
- **Type Check:** TypeScript compiler runs in `strict` mode with zero errors.
- **Perimeter Test:** Invalid payload shapes rejected with structured 400 validation errors before reaching domain service.
