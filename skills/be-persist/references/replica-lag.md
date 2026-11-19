# Read-After-Write Consistency & Replica Lag Mitigation

## 1. When to read this
Read this when designing database read/write splitting, introducing asynchronous read replicas, resolving "entity not found immediately after creation" bugs, or managing replication lag across multi-region database topologies.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How to prevent stale reads immediately after a user mutation? | **Session-Based Write Pinning** (route all reads to Primary for $N$ seconds after a write) (BE-34). | LSN / WAL Token verification when Primary read traffic must be minimized to absolute minimum. |
| Where should sensitive auth or financial checks read? | **Always Primary**. Never route permission grants or ledger balances to asynchronous replicas. | Synchronous replication clusters (e.g. CockroachDB / Spanner) with Raft consensus. |
| What if a read replica falls too far behind? | Automatic circuit breaker cutting traffic to replicas where lag exceeds SLA (e.g. $> 2$ seconds). | Dynamic query shedder routing non-critical analytics queries to stale replicas. |

---

## 3. Rules

### BE-34 Read-After-Write Consistency
Immediately following a mutating operation, any subsequent read query within the same client session or causality chain that depends on the mutated state must route to the primary database or verify that the chosen read replica has replayed past the mutation's Log Sequence Number (LSN); routing reads blindly to asynchronous read replicas immediately after a write is forbidden.
- **Why:** Asynchronous database replication has unavoidable physical latency (network transit, WAL transfer, replay queue). In a typical Web/Mobile flow, a user performs a write (`POST /api/v1/orders`), receives a redirect, and immediately fetches the resource (`GET /api/v1/orders/123`). If that read hits a replica lagging by even 50ms, the response is HTTP 404 Not Found. This causes user panic, duplicate checkout clicks, and phantom data loss bugs.
- **Enforced by:** Integration tests simulating 200ms replica lag during a write-then-read workflow; architecture review of database connection pool dispatchers.

---

## 4. Implementation Patterns

### Pattern A: Session-Based Write Pinning (Sticky Window)

The simplest and most resilient approach for 95% of web applications. Following any mutation, set a cookie or context flag pinning reads to the Primary database for a bounded window (e.g., 5 seconds):

```typescript
export interface DbConnectionRouter {
  getReader(sessionContext?: { lastWriteTime?: number }): DatabaseConnection;
  getWriter(): DatabaseConnection;
}

export class PostgresReplicaRouter implements DbConnectionRouter {
  private readonly PIN_WINDOW_MS = 5000;

  constructor(
    private readonly primaryDb: DatabaseConnection,
    private readonly replicaPool: DatabaseConnectionPool
  ) {}

  getWriter(): DatabaseConnection {
    return this.primaryDb;
  }

  getReader(sessionContext?: { lastWriteTime?: number }): DatabaseConnection {
    // If the session wrote recently, pin reads to Primary to guarantee consistency
    if (sessionContext?.lastWriteTime && Date.now() - sessionContext.lastWriteTime < this.PIN_WINDOW_MS) {
      return this.primaryDb;
    }

    // Otherwise, route to healthy read replica
    return this.replicaPool.getHealthyReplica();
  }
}
```

### Pattern B: Causal Consistency via LSN Tracking (PostgreSQL)

For high-throughput systems where routing all post-write reads to Primary would overload the master node. The Primary returns its current Write-Ahead Log position (LSN) upon commit, which the client passes back to prove consistency:

1. **On Mutation (Primary DB):**
   ```sql
   -- Execute mutation
   INSERT INTO orders (id, user_id, total) VALUES ($1, $2, $3);
   -- Capture commit LSN
   SELECT pg_current_wal_lsn() AS commit_lsn; -- e.g. '0/16B3740'
   ```
2. **On Read (Replica Gateway):**
   Client sends header `X-Min-LSN: 0/16B3740`. The gateway checks the replica:
   ```sql
   SELECT pg_last_wal_replay_lsn() AS current_replay_lsn;
   ```
   - If `current_replay_lsn >= commit_lsn`: Serve query from read replica.
   - If `current_replay_lsn < commit_lsn`: Wait up to 50ms for catch-up; if still lagging, fallback to Primary.

---

## 5. Checklist for review
- [ ] Mutations (`POST`, `PUT`, `PATCH`, `DELETE`) return or record a write timestamp/LSN.
- [ ] Post-mutation redirect routes or read queries route to Primary if within the pin window (typically 3–5 seconds).
- [ ] Authorization checks (`hasRole`, `canAccess`) and balance queries NEVER execute on asynchronous replicas.
- [ ] Replica health checks monitor `pg_stat_replication` (`replay_lag`, `write_lag`) and evict degraded replicas.
- [ ] Connection router defaults to Primary when replica health is ambiguous or failing.

---

## 6. How to prove it
- **Replication Lag Invariant Test:**
  1. In a test environment, introduce artificial 200ms delay on replica WAL replay.
  2. Execute mutation `createOrder()`.
  3. Immediately invoke `getOrderDetails()` within the same session context.
  4. **Assertion:** Query routes to Primary or waits for LSN catch-up; assert status HTTP 200 with full order details; zero HTTP 404 or missing records.
