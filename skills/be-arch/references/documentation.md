# Backend Architecture Documentation, ADRs & Conventions

## 1. When to read this
Read this when documenting architectural decisions, authoring Architecture Decision Records (ADRs), establishing repository conventions, or maintaining API documentation.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where are repo stack declarations maintained? | `project-profile.md` at repository root read first by all agents (BW-P1). | Multi-repo monorepo where each sub-service declares its own profile. |
| When should an ADR / Feature Design Record be written? | For any non-trivial structural decision, database addition, or queue mechanism (BW-P4). | Trivial cosmetic refactoring or bugfixes within existing patterns. |
| How should API documentation be maintained? | Generated automatically from the committed OpenAPI / GraphQL schema contract (BE-27). | Specialized interactive developer portals for external public APIs. |

---

## 3. Rules

### Architectural Decision Records (ADRs) & Design Records (BW-P4)
Every non-trivial architectural change, new data store integration, or distributed flow must produce an Architectural Decision Record based on the template in [design-record.template.md](../../../references/design-record.template.md). The design record must cite the applied rule IDs, name the smallest mechanism that holds the invariant, list simpler alternatives rejected and why, and describe the behavior that proves it.
- **Why:** Architectural decisions made without documentation lose their context over time, leading future developers to dismantle critical safety invariants or repeat past mistakes.
- **Enforced by:** Pull request review and design record checklist.

---

## 4. Documentation Templates
- [conventions.md](../../../references/conventions.md) — Shared backend conventions and review obligations.
- [project-profile.template.md](../../../references/project-profile.template.md) — Architecture and stack declaration template for target repositories.
- [design-record.template.md](../../../references/design-record.template.md) — Feature design record / ADR template.

---

## 5. Checklist for review
- [ ] Feature PR includes updated design record or ADR if new architectural patterns were introduced.
- [ ] Schema documentation (JSDoc, OpenAPI descriptions, GraphQL `@Field` descriptions) updated.
- [ ] Code comments explain *why* non-obvious invariants exist; self-explanatory code left clean without noise.

---

## 6. How to prove it
- **Documentation Verification:** Verify that `project-profile.md` exists and accurately describes active ports and services; verify that ADR citations match rule IDs.
