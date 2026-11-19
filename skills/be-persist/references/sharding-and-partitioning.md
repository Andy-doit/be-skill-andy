# Database Sharding & Table Partitioning at Hyper-Scale

## 1. When to read this
Read this when database tables exceed 50–100 million rows, index sizes exceed available RAM (buffer pool), single-node write IOPS saturate disk hardware, or designing multi-tenant partitioning for enterprise scale.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Table growing rapidly but within one machine's RAM/disk? | **PostgreSQL Declarative Partitioning** (Range by date or List by tenant). | Physical application-level sharding when write IOPS exceed single hardware limits. |
| Single node write IOPS saturated? | **Application-Level Sharding** with Consistent Hashing over immutable Shard Key (BE-36). | Distributed SQL engines (Citus, CockroachDB, TiDB) when cross-shard query flexibility is mandatory. |
| How to query across multiple shards? | **Search Index / Read Model** (Elasticsearch, ClickHouse, or dedicated read replica). | Asynchronous scatter-gather batch jobs; never allowed in user-facing OLTP request path. |

---

## 3. Rules

### BE-36 Shard Key Invariance & Scatter-Gather Fencing
Every entity stored in a sharded architecture must declare an immutable, high-cardinality Shard Key that deterministically partitions data across database instances; cross-shard distributed transactions (Two-Phase Commit) are forbidden in the online transaction processing (OLTP) path, and OLTP queries omitting the Shard Key (Scatter-Gather fan-out) must be rejected or routed to an asynchronous read index.
- **Why:** Scatter-Gather queries broadcast a single request to all $N$ physical database shards simultaneously. The query's latency is bounded by the *slowest* shard in the cluster ($\max(T_1, \dots, T_N)$), and a failure on any single shard fails the entire user request. Mutating a Shard Key requires moving physical rows across different database nodes, which necessitates distributed locks (2PC) that lock tables, introduce distributed deadlocks, and degrade throughput by orders of magnitude.
- **Enforced by:** Query boundary audit checking that every OLTP query repository method includes the shard key parameter; schema review verifying immutability of shard key columns.

---

## 4. Consistent Hashing & Routing Architecture

### Shard Router with Virtual Nodes

To prevent "Hot Shards" and minimize data migration when expanding shard nodes, use Consistent Hashing with virtual node replication:

```typescript
import { createHash } from 'node:crypto';

export class ConsistentHashRouter {
  private readonly ring = new Map<number, string>();
  private readonly sortedKeys: number[] = [];
  private readonly virtualNodeCount = 100;

  constructor(nodes: string[]) {
    for (const node of nodes) {
      this.addNode(node);
    }
  }

  addNode(node: string): void {
    for (let i = 0; i < this.virtualNodeCount; i++) {
      const hash = this.hash(`${node}#vn${i}`);
      this.ring.set(hash, node);
      this.sortedKeys.push(hash);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  getShardNode(shardKey: string): string {
    if (this.ring.size === 0) throw new Error('No shard nodes available.');
    const hash = this.hash(shardKey);

    // Binary search for first node >= hash on the ring
    let low = 0;
    let high = this.sortedKeys.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.sortedKeys[mid] >= hash) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    const targetIndex = low >= this.sortedKeys.length ? 0 : low;
    return this.ring.get(this.sortedKeys[targetIndex])!;
  }

  private hash(value: string): number {
    const md5 = createHash('md5').update(value).digest();
    return md5.readUInt32BE(0);
  }
}
```

### Native PostgreSQL Declarative Partitioning (Step 1 before Sharding)

Before introducing the operational overhead of physical multi-cluster sharding, partition large append-only tables natively:

```sql
-- 1. Create partitioned parent table
CREATE TABLE audit_logs (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    action VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id, created_at) -- Partition key MUST be part of primary key
) PARTITION BY RANGE (created_at);

-- 2. Create monthly partitions with automatic index local bounds
CREATE TABLE audit_logs_2026_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE audit_logs_2026_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Query pruning: PostgreSQL automatically scans ONLY the relevant partition table
EXPLAIN SELECT * FROM audit_logs 
WHERE created_at >= '2026-11-15' AND created_at < '2026-11-20';
```

---

## 5. Checklist for review
- [ ] Every sharded entity includes an immutable Shard Key (e.g. `tenant_id` or `user_id`).
- [ ] Shard Key is included in all compound primary keys and unique indexes.
- [ ] No cross-shard transactions (Two-Phase Commit / XA transactions) exist in the OLTP path.
- [ ] User-facing OLTP endpoints reject queries that do not supply the Shard Key.
- [ ] Cross-shard reporting, aggregation, or full-text search is offloaded to a read model (Elasticsearch, ClickHouse, or read replica).

---

## 6. How to prove it
- **Scatter-Gather Prevention Test:** Invoke the query repository method without specifying the Shard Key. Assert that the router throws a `MissingShardKeyException` or compiler-enforced type error before executing against any database node.
- **Hash Distribution Test:** Route 100,000 synthetic shard keys across 4 shards; assert standard deviation across nodes is $< 5\%$, proving uniform balance without hot shards.
