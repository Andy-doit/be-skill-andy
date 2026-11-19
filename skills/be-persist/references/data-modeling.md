# Data Modeling, Ownership & Relational Integrity

## 1. When to read this
Read this when designing entity schemas, declaring relationships, foreign keys, soft delete policies, or addressing N+1 query performance problems.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Who owns a database table? | Exactly one module / bounded context. | Read-only analytics tables populated by CDC pipelines. |
| Can Module A query Module B's database table directly? | **NO.** Module A queries Module B's service or reads an asynchronous projection. | Shared database views explicitly exposed as public read contracts. |
| Should foreign keys be indexed? | **YES, always.** Every foreign key column must have an explicit B-tree index. | Write-heavy append-only log tables with zero lookup by foreign key. |
| How to handle deletions? | Hard delete if data has no legal audit obligation; explicit soft delete with `deleted_at` index if auditable. | Anonymization / tombstone records required by GDPR / data retention laws. |
| How to avoid N+1 query waterfalls? | Explicit join queries, query builder selections, or dataloader batching. | Single-record lookups where related collections are not rendered. |

---

## 3. Rules

### BE-4 One owner per table; no cross-owner joins
Each table has exactly one owning bounded context. Services in other modules must not perform cross-boundary table joins or direct write operations to another owner's tables. Cross-context data is retrieved via module APIs or dedicated read-model projections.
- **Why:** Cross-module joins destroy bounded context autonomy, prevent independent database scaling or schema evolution, and cause cross-module deployment coupling.
- **Enforced by:** Schema modularity audits and linter rules.

### BE-5 Consistent ID conventions and indexed foreign keys
Primary keys follow a single project convention (e.g. UUIDv7 or auto-increment bigint). Every foreign key column must be backed by an explicit database index.
- **Why:** Unindexed foreign keys cause full table scans on relational joins and trigger cascade delete table locks in PostgreSQL, devastating query performance.
- **Enforced by:** Database migration linter script.

---

## 4. Failure examples
- **Failure:** A foreign key `author_id` on an `articles` table with 500,000 rows has no index.
  - *Symptom:* Deleting a user or querying `WHERE author_id = $1` locks the entire `articles` table during a full sequential scan.
- **Failure:** Looping over an order list and executing `await itemRepo.find({ orderId })` inside each iteration.
  - *Symptom:* N+1 query waterfall: 100 orders trigger 101 separate SQL network roundtrips, exhausting connection pools.

---

## 5. Checklist for review
- [ ] Every foreign key column (`*_id`) is accompanied by `CREATE INDEX idx_... ON ... (...)`.
- [ ] No cross-context database foreign key constraints between separate domain capabilities.
- [ ] Queries fetching collections use joins or batch loaders instead of in-loop queries.
- [ ] Soft-deleted tables include `deleted_at IS NULL` in unique constraint indexes.

---

## 6. How to prove it
- **Query Plan:** Run `EXPLAIN ANALYZE` on relational lookup queries; assert that `Index Scan` is used and sequential scan is avoided.
