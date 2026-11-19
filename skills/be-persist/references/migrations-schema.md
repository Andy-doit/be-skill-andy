# Database Migrations & Schema Authority

## 1. When to read this
Read this before altering database schemas, adding tables/columns, creating indexes, writing backfill scripts, or configuring deployment migration steps.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Who holds schema authority? | Sequential, versioned, committed migration files. | Never; ORM auto-synchronization (`synchronize=true`) is strictly forbidden in all environments. |
| When and where are migrations applied? | Dedicated pre-deploy migration job run exactly once before new code containers boot. | Local single-developer isolated SQLite / test fixture. |
| How to rename or delete a column without downtime? | Two-phase expand-then-contract migration over two releases. | System is offline during a planned maintenance window. |
| How to execute large data backfills? | Batched, rate-limited, fenced background job with resumable cursor. | Table has < 1,000 rows. |

---

## 3. Rules

### BE-1 Migrations are the sole schema authority
Migrations are the only authority for database schemas. They are executed by a single, dedicated deployment step prior to serving application traffic. Serving processes must never execute schema migrations on boot, and migrations must never be raced by multiple container replicas. Auto-synchronization (`synchronize: true`) is banned.
- **Why:** Running migrations on multiple application replicas causes distributed deadlocks, index corruption, and race conditions. Auto-sync can silently drop columns or recreate tables during transient network disconnections.
- **Enforced by:** Deployment pipeline checks and CI policy.

### Schema Evolution: Expand Then Contract (Applying Rule BE-7)
All database schema alterations must follow the expand-then-contract principle (rule `BE-7`) to remain backward-compatible with currently running application instances. Adding non-nullable columns without defaults, dropping active columns, or renaming tables in a single step is forbidden.
- **Why:** Zero-downtime rolling deployments run old and new application containers concurrently. An immediate breaking schema change breaks running instances of the previous version.
- **Enforced by:** Migration review checklist and pull request gates.

---

## 4. Failure examples
- **Failure:** An application configures `synchronize: true` in production or staging.
  - *Symptom:* A temporary failure to load an entity file causes TypeORM/Hibernate to drop the corresponding table and all user data.
- **Failure:** A migration drops column `status` while old app instances are still processing HTTP requests.
  - *Symptom:* Immediate HTTP 500 spike as running queries select the now-missing column.

---

## 5. Checklist for review
- [ ] Migration has reversible `up()` and `down()` operations.
- [ ] No `synchronize: true` anywhere in project configuration.
- [ ] New columns on existing tables are nullable or have safe defaults.
- [ ] Adding an index on large tables uses non-blocking syntax (e.g. `CREATE INDEX CONCURRENTLY` in Postgres).

---

## 6. How to prove it
- **Integration Boundary:** Test runs `down()` then `up()` on a real PostgreSQL test database container.
- **Deployment Gate:** Migration step executes in isolated job before app pods spin up.
