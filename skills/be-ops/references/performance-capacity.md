# Performance, Capacity & Connection Pool Sizing

## 1. When to read this
Read this when tuning throughput, sizing database connection pools, configuring queue worker concurrency, or troubleshooting high latency under load.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How many database connections should a backend pod open? | Small, bounded pool (e.g. 5 to 20 connections per pod) sized based on Postgres CPU cores. | Dedicated connection pooler (PgBouncer) deployed between backend pods and PostgreSQL. |
| How to handle high-volume bulk inserts/updates? | Batch into chunks of 500-1,000 rows within a single multi-row `INSERT ... VALUES` statement. | Streaming bulk load using Postgres `COPY` protocol for millions of rows. |
| How to troubleshoot slow database queries? | Run `EXPLAIN (ANALYZE, BUFFERS)` on slow queries captured in slow query log. | Comprehensive APM database transaction profiling. |

---

## 3. Capacity Formulas

### Database Connection Pool Sizing
$$\text{Max DB Connections per Pod} = \frac{\text{PostgreSQL Max Connections} - \text{Superuser Reserved}}{\text{Max Application Pods Replicas}}$$

*Rule of Thumb:* More connections does NOT mean more speed. If a database server has 8 CPU cores, setting total connections to 500 causes severe CPU context switching. Keep total connections across all pods below $2 \times \text{CPU cores} + \text{spindle count}$.

---

## 4. Failure examples
- **Failure:** Setting TypeORM `poolSize: 100` on 10 Kubernetes pods (1,000 total connections) connected to a 4-core Postgres database.
  - *Symptom:* Database CPU hits 100% due to OS context switching; query latencies jump from 2ms to 2,000ms.
- **Failure:** Performing 10,000 single-row inserts in a loop `for (const r of rows) await repo.save(r)`.
  - *Symptom:* Massive network latency overhead; job takes 45 minutes instead of 1.2 seconds.

---

## 5. Checklist for review
- [ ] Database connection pool limits configured explicitly in environment config.
- [ ] Bulk writes batched in chunks of 500-1000 items.
- [ ] Slow query logging enabled for queries exceeding 200ms.
- [ ] Queue worker concurrency bounded based on available CPU/memory.

---

## 6. How to prove it
- **Load Test Boundary:** Run k6 or autocannon benchmark; assert that response latency stays within SLI budget and database connections remain strictly bounded.
