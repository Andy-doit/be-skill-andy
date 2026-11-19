---
name: be-arch
description: >
  Backend architecture, layering, folder structure, code quality, and determinism.
  Use when: structuring backend tiers (domain vs platform vs integrations), organizing feature folders
  by trigger kind (HTTP, webhook, job, CLI), eliminating circular dependencies, establishing composition
  roots, ensuring deterministic time and ID generation, and enforcing typed boundaries.
  DO NOT USE FOR: API schema design or error protocol mapping (see be-api), database migrations and transaction
  isolation (see be-persist), or background queue workers (see be-async).
---

# be-arch — Backend Architecture & Code Structure

Defines the core architectural tiers, dependency direction, folder layouts, and determinism standards for backend systems.

---

## 1. Core Reference Guides

- [layering.md](./references/layering.md) — 4-tier architecture, dependency inversion, composition root, cycles, durable handover (BE-23, BE-24, BR-2).
- [folder-structure.md](./references/folder-structure.md) — Feature organization by trigger kind (HTTP, webhook, job, CLI) and flat operation shape.
- [determinism.md](./references/determinism.md) — Clock injection, ID generators, UTC storage, avoiding ambient non-determinism (BE-25).
- [code-quality.md](./references/code-quality.md) — Typed boundaries, preventing leaked DB rows in APIs, function budgets, naming (BE-26).
- [documentation.md](./references/documentation.md) — Architecture decision records (ADRs), repository conventions, generated API docs (BW-P4).

---

## 2. Quick Architectural Decision Matrix

| Concern | Standard Pattern | Antipattern to Reject |
|---|---|---|
| **Tier Dependency** | Domain <- Platform <- Integrations (unidirectional) | Domain importing HTTP controllers or database drivers |
| **Composition Root** | Thin bootstrap wiring modules once at boot | Ambient service locator (`Container.get()`) or scattered singletons |
| **Cross-Capability Comm** | Durable handover (transactional outbox / queue) | Synchronous deep import inside caller's DB transaction |
| **Time & Randomness** | Injected `Clock` port and `IdGenerator` | Ambient `Date.now()` or `Math.random()` in domain invariants |
| **Data Boundaries** | Explicit `{Action}Params` and `{Action}Result` DTOs | Leaking database entities directly out of public API doors |
