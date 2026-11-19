---
name: be-audit
description: >
  Read-only audit mode inspecting backend code against engineering laws and review obligations.
  Use when: auditing existing code, reviewing pull requests, inspecting legacy services for architectural drift,
  verifying adherence to BE-* engineering rules and BR-* review obligations, and producing findings tables
  with file:line citations and severity ratings.
  DO NOT USE FOR: writing new features or applying code changes (see be or topic skills), frontend code auditing
  (see fe-review in fe-skill-andy), or modifying source files (be-audit is strictly read-only).
---

# be-audit — Read-Only Backend Code Audit Mode

Performs comprehensive, read-only architectural and code-quality audits against backend engineering laws (`BE-1..36`) and review obligations (`BR-1..7`).

**Core Mandate:** `be-audit` NEVER mutates code. Its output is an objective, evidence-based findings report.

---

## 1. Core Reference Guides

- [audit-checklist.md](./references/audit-checklist.md) — Comprehensive checklist matrix mapping each rule ID to inspection criteria and violation indicators.

---

## 2. Audit Workflow

1. **Identify Scope:** Target directory, module, or git diff to audit.
2. **Inspect Against Rules:** Scan code against the 36 engineering rules (`BE-1..36`) and 7 review obligations (`BR-1..7`).
3. **Classify Severity:**
   - **BLOCKER:** Direct security leak, data loss risk, dual-write hazard, missing authz/auth, or runtime crash hazard (e.g. `BE-1`, `BE-2`, `BE-3`, `BE-14`, `BE-16`, `BE-17`, `BE-19`).
   - **WARN:** Performance bottleneck, unindexed FK, missing idempotency key, unbounded array, loose error handling (e.g. `BE-5`, `BE-9`, `BE-20`, `BE-23`, `BE-25`).
   - **NIT:** Naming inconsistency, minor typing loose-end, non-critical documentation gap (e.g. `BE-26`).
4. **Generate Findings Report:** Present structured table in chat. If findings $\ge 10$, write to `.audits/be/<scope>-<date>.md`.

---

## 3. Findings Report Format

| Rule ID | File:Line | Severity | Violation Evidence Snippet | Proposed Remedy |
|---|---|:---:|---|---|
| `BE-3` | `src/orders/order.service.ts:45` | **BLOCKER** | `await stripe.charges.create(...)` inside `tx.transaction()` | Move Stripe call outside transaction; record outbox record instead. |
| `BE-5` | `src/orders/order.entity.ts:18` | **WARN** | `@Column() customerId: string` without `@Index` | Add `@Index('idx_orders_customer_id')` to foreign key column. |
| `BE-20`| `src/users/user.service.ts:88` | **WARN** | `throw new Error("User does not exist")` | Replace with closed enum: `throw new NotFoundException('USER_NOT_FOUND', ...)`. |
