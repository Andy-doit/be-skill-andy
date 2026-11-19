---
name: be-authz
description: >
  Authorization, access control, multi-tenancy, and row-level security.
  Use when: configuring default-deny access policies on doors, implementing domain-level resource
  authorization checks, isolating tenant data, enforcing multi-tenant boundaries, and preventing
  privilege escalation.
  DO NOT USE FOR: authentication or password hashing (see be-auth), frontend role-based UI affordances
  (see fe-sec), or rate limiting abuse limits (see be-sec).
---

# be-authz — Authorization & Multi-Tenancy

Defines standards for default-deny access control, resource-level authorization in domain services, and multi-tenant data isolation.

---

## 1. Core Reference Guides

- [default-deny.md](./references/default-deny.md) — Default-deny policies at every entry door, public route declarations (BE-14, BR-4).
- [resource-authz.md](./references/resource-authz.md) — Resource-level checks in domain services, never trusting caller-supplied scopes (BE-15).
- [multi-tenancy.md](./references/multi-tenancy.md) — Multi-tenant data isolation, tenant key enforcement, database row-level security (BR-3, BE-15).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-14** | Default-deny at every door; open doors declare an explicit reason. | Automated route guard check |
| **BE-15** | Resource authorization lives in the domain service and is reached from every entry point. | Domain unit / service test |
| **BR-4** | Authority holds at every entry point: resource check reached from every door, job, and service call; caller-supplied scope is never permission. | Architecture review + tests |
