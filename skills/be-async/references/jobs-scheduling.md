# Background Jobs, Distributed Scheduling & Retries

## 1. When to read this
Read this when creating queue workers (BullMQ, Celery, Temporal), configuring retry ladders, dead letter queues, or setting up recurring cron jobs.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How to ensure multiple worker pods do not execute the same job concurrently? | Fenced job claim: conditional update setting `locked_until` or worker lease token (BE-10). | Full distributed lock service (Redlock / etcd) with heartbeat renewal. |
| How to handle temporary job failures? | Declared bounded retry ladder with exponential backoff and jitter (BE-11). | Complex compensation flow requiring multi-service rollback (see sagas.md). |
| What happens when all retries are exhausted? | Move job payload and error trace to visible Dead Letter Queue / failed table (BE-11). | Auto-park with alert to engineering team; never silently discard. |
| How to schedule recurring tasks across replicas? | Leader election or external scheduler (e.g. Kubernetes CronJob, BullMQ repeatable jobs) ensuring 1 fire per deploy (BE-13). | Never use plain in-process `setInterval` or `setTimeout` in containerized apps. |

---

## 3. Rules

### BE-10 Jobs are fenced
Background job workers must claim execution using a conditional atomic update (fencing token or monotonic lock version). Every mutation executed by the worker must verify the fence token remains valid. Remote side-effects must be recorded before performing them.
- **Why:** If Worker A stalls due to garbage collection pause, its lease may expire. Worker B takes over and begins work. When Worker A wakes up, without fencing it will continue executing, writing stale data over Worker B's work (split-brain write).
- **Enforced by:** Concurrency test with simulated worker delay.

### BE-11 Declared retry ladders & visible dead letters
Job retries must follow a declared ladder with exponential backoff and upper bounds (e.g. 1s, 5s, 30s, 5m, 30m). Failures must be classified once as retryable (transient network glitch) vs non-retryable (validation failure, invalid input). When retries are exhausted, the job must enter a visible dead letter queue or table where an engineer can inspect the failure. Never drop failed jobs silently.
- **Why:** Unbounded retries cause retry storms that DDoS recovering external systems. Silently dropping failed jobs causes data loss that goes unnoticed until customer complaints arrive.
- **Enforced by:** Dead letter queue integration test.

### BE-13 Schedules fire once per deployment
Scheduled recurring tasks must fire exactly once per deployment, not once per running container replica. Tasks must be triggered by an external scheduler, leader-elected runner, or database-fenced job table.
- **Why:** Running recurring cron loops in multi-replica deployments executes the job $N$ times simultaneously, producing duplicate notifications, double billing runs, and database deadlocks.
- **Enforced by:** Clustered multi-replica scheduler test.

---

## 4. Failure examples
- **Failure:** Using `setInterval(() => runBilling(), 60000)` inside the application server:
  - *Symptom:* In production with 4 replicas, `runBilling()` executes 4 times simultaneously every minute.
- **Failure:** Retrying a payment job indefinitely in a `while (true)` loop on HTTP 400 Bad Request.
  - *Symptom:* Worker thread hangs forever, burning CPU and exhausting memory.

---

## 5. Checklist for review
- [ ] No `setInterval` or `cron` decorators running without distributed locking or leader election.
- [ ] Job processor sets maximum retry count (e.g. `attempts: 5`).
- [ ] Failed jobs route to dead letter queue with exception stack and last payload intact.
- [ ] Worker verifies lease / fence token before writing final state.

---

## 6. How to prove it
- **Multi-Replica Test:** Spin up 3 instances of the queue worker simultaneously; enqueue 1 job; assert that exactly 1 worker executes the job to completion and 0 duplicate actions occur.
