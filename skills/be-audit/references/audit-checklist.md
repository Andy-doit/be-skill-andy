# Backend Engineering Audit Checklist Matrix

Audit checklist for human reviewers and the `be-audit` skill. Every finding must cite a stable rule ID from this matrix.

---

## 1. Engineering Rules Audit Matrix (BE-1..33)

| Rule ID | Core Law | Inspection Target & Failure Indicators | Default Severity |
|---|---|---|:---:|
| **BE-1** | Migrations sole schema authority | Check for `synchronize: true` in ORM config or migrations run at app boot. | **BLOCKER** |
| **BE-2** | Transactional outbox | Check for direct broker publish (`kafka.send`, `nats.publish`) in business writes without outbox. | **BLOCKER** |
| **BE-3** | No tx across external calls | Check for `fetch`, HTTP calls, payment SDKs, or email calls inside `db.transaction()` callbacks. | **BLOCKER** |
| **BE-4** | One owner per table | Check for direct cross-module table joins or foreign keys across bounded context boundaries. | **WARN** |
| **BE-5** | Indexed foreign keys | Check schema migrations and entities for foreign key columns (`*_id`) missing an index. | **WARN** |
| **BE-6** | Invariants held by constraints | Check for application-level read-then-write checks on balances/counters without atomic SQL or unique constraints. | **BLOCKER** |
| **BE-7** | Additive-only evolution | Check git diff for removed fields, renamed columns, or new required inputs without expand-contract. | **BLOCKER** |
| **BE-8** | Inbound delivery inbox claims | Check event / webhook receivers for missing `inbox` deduplication claim inside processing transaction. | **WARN** |
| **BE-9** | Client mutation idempotency | Check mutating endpoints (charge, order, transfer) for missing `Idempotency-Key` handling. | **WARN** |
| **BE-10**| Fenced background jobs | Check queue workers for missing lease/fence token validation before mutating state. | **BLOCKER** |
| **BE-11**| Declared retry ladders | Check job retries for infinite loops or missing dead-letter queue routing on final failure. | **WARN** |
| **BE-12**| Sagas declared undo per step | Check multi-service sagas for missing compensating action handlers on failure paths. | **BLOCKER** |
| **BE-13**| Schedules fire 1x per deploy | Check for in-process `setInterval` or cron tasks running without leader election across replicas. | **BLOCKER** |
| **BE-14**| Default-deny at every door | Check for endpoints missing authentication guards without explicit `@Public()` reason. | **BLOCKER** |
| **BE-15**| Resource authz in domain | Check for controllers passing IDs to services without verifying principal ownership of target resource. | **BLOCKER** |
| **BE-16**| Bound external inputs & SSRF | Check for schemas with unbounded string/array lengths or unvalidated outbound URLs. | **BLOCKER** |
| **BE-17**| Secret comparison & cookie flags| Check for `===` on secrets/tokens, cookies missing `HttpOnly; Secure; SameSite`, or missing origin check. | **BLOCKER** |
| **BE-18**| Webhook signature first | Check for webhook endpoints parsing body or executing logic before validating HMAC signature. | **BLOCKER** |
| **BE-19**| Boot config validation | Check for scattered `process.env` reads, missing boot schema validation, or default secrets. | **BLOCKER** |
| **BE-20**| Closed error code enums | Check for `throw new Error("prose")`, swallowed exceptions in `catch`, or SQL error leaks. | **WARN** |
| **BE-21**| Structured logger & no PII | Check for `console.log`, missing correlation IDs, or passwords/tokens logged in cleartext. | **BLOCKER** |
| **BE-22**| Separate health probes | Check for liveness probe pinging database or conflated health endpoints. | **BLOCKER** |
| **BE-23**| Outbound timeouts & 1 owner | Check for HTTP/gRPC client calls without explicit timeout configurations. | **BLOCKER** |
| **BE-24**| Doors are thin | Check for business logic, math, or direct database queries inside controllers/resolvers. | **WARN** |
| **BE-25**| Injected time and IDs | Check for ambient `new Date()`, `Date.now()`, or `Math.random()` in domain logic. | **WARN** |
| **BE-26**| Typed boundaries | Check for `any`, raw DB entities returned from API doors, or missing DTO contracts. | **WARN** |
| **BE-27**| Public contract checked in CI | Check for uncommitted OpenAPI/GraphQL schema files or breaking changes without review. | **BLOCKER** |
| **BE-28**| Real-store integration tests | Check for persistence/concurrency claims verified only with in-memory doubles or loose mocks. | **BLOCKER** |
| **BE-29**| Contract tests vs schema | Check for consumer tests mocked against source code instead of committed schema. | **WARN** |
| **BE-30**| Async boundary testing | Check for asynchronous event flows tested only on publisher side without consumer test. | **WARN** |
| **BE-31**| Single LLM gateway | Check for frontend holding model keys or scattered un-budgeted LLM API calls. | **BLOCKER** |
| **BE-32**| Code chains vs agent loops | Check for unconstrained LLM decision loops without loop budgets or output schemas. | **BLOCKER** |
| **BE-33**| Scoped RAG & tool authority | Check for vector searches without tenant isolation or tools executing without domain checks. | **BLOCKER** |

---

## 2. Review Obligations Matrix (BR-1..7)

- **BR-1 One accountable owner:** Is there any cross-module table read or duplicated capability owner?
- **BR-2 Abstractions carry responsibility:** Are there useless passthrough wrapper classes that add zero value?
- **BR-3 State authority & lifecycle:** Does cache or read model have an invalidation and lag contract?
- **BR-4 Authority at every entry point:** Is resource authorization invoked from CLI and background jobs as well as HTTP?
- **BR-5 Failure & recovery contract:** Does every mutation declare its failure behavior, deadline, and retry ladder?
- **BR-6 Runnable lifecycle:** Are startup dependencies validated, liveness separate from readiness, and shutdown graceful?
- **BR-7 Evidence matches claim:** Was the concurrency or transaction claim proven on real database containers?
