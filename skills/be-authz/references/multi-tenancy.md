# Multi-Tenancy & Tenant Data Isolation

## 1. When to read this
Read this when designing multi-tenant architectures, shared database schemas, preventing cross-tenant data leaks, or configuring database row-level security (RLS).

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How are multi-tenant records separated? | Mandatory `tenant_id` column on every tenant-owned table. | Physical separate databases per tenant required by enterprise compliance contracts. |
| Where is `tenant_id` attached to queries? | Bound automatically in repository/query layer from authenticated request context. | Read-only global public tables (e.g. system configurations, country codes). |
| How to implement defense in depth against SQL bugs? | PostgreSQL Row-Level Security (RLS) policies set via session variable (`app.current_tenant_id`). | Simple single-tenant internal services. |

---

## 3. Rules

### BR-3 Multi-tenant state isolation
Scopes with different lifetimes or identities (tenant, workspace, user) must never be collapsed. Every database query, cache key, and event topic touching tenant data must be explicitly scoped by `tenant_id`.
- **Why:** Missing `tenant_id` in a single `UPDATE` or `SELECT` statement causes severe cross-tenant data corruption or privacy breaches.
- **Enforced by:** Integration tests and automated SQL AST tenant filter checkers.

---

## 4. Failure examples
- **Failure:** Querying by entity ID only: `SELECT * FROM orders WHERE id = :id`.
  - *Symptom:* Tenant A accesses Tenant B's order by guessing or brute-forcing a sequential or UUID order identifier.
- **Failure:** Shared Redis cache key: `cache.get("user:profile:" + userId)` without tenant namespace.
  - *Symptom:* If user IDs collide across tenants, Tenant A reads Tenant B's profile from cache.

---

## 5. Checklist for review
- [ ] Every multi-tenant table has `tenant_id NOT NULL` with an index on `(tenant_id, id)`.
- [ ] Queries always include `WHERE tenant_id = :currentTenantId`.
- [ ] Cache keys prefixed with tenant identifier: `t:{tenantId}:u:{userId}`.
- [ ] Row-Level Security (RLS) enabled on sensitive tenant tables.

---

## 6. How to prove it
- **Cross-Tenant Test:** Authenticate as Tenant A; attempt to read and write records belonging to Tenant B; assert that query returns empty or throws `FORBIDDEN`.
