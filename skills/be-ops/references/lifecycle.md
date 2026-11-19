# Health Probes, Lifecycle & Graceful Shutdown

## 1. When to read this
Read this when configuring container health endpoints (`/healthz`, `/ready`), orchestrator lifecycle probes (Kubernetes, AWS ECS), or handling `SIGTERM` / `SIGINT` signals.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Are liveness and readiness the same check? | **NO.** Liveness checks if the process is alive; readiness checks if backing dependencies are ready (BE-22). | Never; conflating liveness with database readiness causes cascading restart storms. |
| What should a `/live` probe check? | Returns HTTP 200 immediately if event loop is unblocked; zero external network I/O. | Process has hung or deadlocked internally. |
| What should a `/ready` probe check? | Pings required critical backing services (DB, Redis); returns HTTP 503 if unavailable. | Non-critical optional dependencies (e.g. analytics) can fail without failing readiness. |
| How to handle process termination (`SIGTERM`)? | Stop accepting new ingress traffic, drain ongoing requests, flush logs, close DB pools, exit 0 (BR-6). | Hard timeout (e.g. 15s) reached, then force exit 1. |

---

## 3. Rules

### BE-22 Liveness, readiness, and functional checks are separate
Liveness, readiness, and functional checks must be exposed as separate endpoints. A liveness probe checks only whether the application process is alive and responsive. A readiness probe verifies that required backing connections (database, message broker) are established and ready to process traffic. A functional check runs end-to-end smoke tests for synthetic monitoring.
- **Why:** If a database experiences a temporary 5-second network hiccup, a combined probe will fail liveness, causing Kubernetes to restart all application containers simultaneously. When 100 containers restart, they reconnect to the database all at once, creating a reconnection storm that prevents the database from ever recovering.
- **Enforced by:** Health endpoint integration tests and container probe configuration reviews.

---

## 4. Failure examples
- **Failure:** Liveness probe executes `SELECT 1 FROM users`.
  - *Symptom:* Database CPU spikes to 95%; liveness probe times out; orchestrator restarts all pods, crashing the entire cluster.
- **Failure:** Container exits immediately on `SIGTERM` without waiting for ongoing HTTP requests to finish.
  - *Symptom:* In-flight checkout requests receive connection reset errors during every routine deploy.

---

## 5. Checklist for review
- [ ] `/health/liveness` returns 200 without querying external databases.
- [ ] `/health/readiness` checks required connections and returns 503 during startup or shutdown.
- [ ] `SIGTERM` signal handler triggers graceful drain period (e.g. 10-15 seconds).
- [ ] Database connections and queue workers closed cleanly during shutdown.

---

## 6. How to prove it
- **Lifecycle Integration Test:** Send `SIGTERM` to application instance while sending active HTTP requests; assert that active requests complete with HTTP 200 and subsequent readiness probe returns 503.
