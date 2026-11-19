# Phase 1: Coverage Matrix & Gap Analysis

**Repository:** `be-skill-andy`  
**Date:** 2026-11-19  
**Status:** READ-ONLY Analysis  

---

## 1. Appendix A Topic Coverage Matrix

Each topic from Appendix A is evaluated across:
- **Covered Where:** File and heading / rule citation in existing `be-skill-andy` (`skills/*` and `cannon/CODE-CANNON.md`).
- **Quality:**
  - `none`: Completely unaddressed.
  - `thin`: Mentioned or partially addressed, but missing `Why:`, enforcement mechanism, or failure examples.
  - `ok`: Substantially covered with clear rationale and checks.
- **Gap Type:** `missing` | `shallow` | `contradictory` | `not enforceable`.
- **Proposed Action:** `new` | `extend` | `merge` | `remove`.

| # | Topic | Covered Where in Existing Repo | Quality | Gap Type | Proposed Action | Target Owner Skill / Reference |
|---|---|---|:---:|:---:|:---:|---|
| 1 | **Architecture & Layering** (tiers, dependency direction, thin composition root, no cycles, durable handovers) | `cannon/CODE-CANNON.md` §1.5–1.6, §3.7; `skills/be-conventions/SKILL.md` §1 | thin | shallow | extend / new | `be-arch/references/layering.md` |
| 2 | **Folder / Feature Shape** (by trigger kind: HTTP, webhook, job, CLI; flat shape per op) | `skills/be-conventions/SKILL.md` §1, §6; `skills/be-new-module/SKILL.md` §2 | thin | shallow | extend / new | `be-arch/references/folder-structure.md` |
| 3 | **API Design & Transport** (one default door, OpenAPI/GraphQL schema committed, stable IDs, named types, versioning) | `cannon/CODE-CANNON.md` §2, §3; `skills/be-conventions/SKILL.md` §1b | thin | shallow | extend / new | `be-api/references/api-design.md` |
| 4 | **Authentication & Session** (constant-time compare, HttpOnly/Secure/SameSite cookies, CSRF/origin, token rotation, hash) | `cannon/CODE-CANNON.md` §3.6 | none | missing | new | `be-auth/references/session-and-tokens.md` |
| 5 | **Authorization** (default-deny, public reason declared, resource check in domain service, tenant isolation, DB RLS) | `cannon/CODE-CANNON.md` §3.6 (guards only) | none | missing | new | `be-authz/references/resource-authz.md` |
| 6 | **Input Validation & Abuse Limits** (schema validation, bounded sizes/lengths, rate tiers, opaque cursor, SSRF safe) | `cannon/CODE-CANNON.md` §2.4–2.5, §3.4 | thin | shallow | extend / new | `be-sec/references/input-and-abuse.md` |
| 7 | **Errors** (closed code enum, kind per code, one throw per refusal, never swallow, sanitized protocol map, client text) | `cannon/CODE-CANNON.md` §6.4, §7.4; `skills/be-conventions/SKILL.md` §9 | ok (for StarCi) | shallow | extend / new | `be-api/references/error-handling.md` |
| 8 | **Persistence & Migrations** (migrations sole authority, dedicated step, 1 owner/table, expand-contract, backfills) | `cannon/CODE-CANNON.md` §4; `skills/be-conventions/SKILL.md` §7; `skills/be-local-run/SKILL.md` §1 | contradictory | contradictory | extend / new | `be-persist/references/migrations-and-schema.md` |
| 9 | **Transactions & Concurrency** (invariants by store constraints/conditions, no external call in tx, optimistic lock, race tests) | `cannon/CODE-CANNON.md` §4.2 | thin | shallow | extend / new | `be-persist/references/transactions-concurrency.md` |
| 10 | **Idempotency** (stable operation identity, committed outcome replay, inbox claim for deliveries) | `cannon/CODE-CANNON.md` §7.7 (NATS only) | thin | shallow | new | `be-async/references/idempotency.md` |
| 11 | **Outbox, Events & Queues** (outbox row in same tx, at-least-once relay, deterministic IDs, dead letter, thin consumers) | `cannon/CODE-CANNON.md` §5.2–5.3, §7.6 | thin | shallow | extend / new | `be-async/references/outbox-and-events.md` |
| 12 | **Jobs & Scheduling** (fenced job rows, guarded writes, declared retry ladder, dead letter visible, 1 fire per deploy) | `cannon/CODE-CANNON.md` §5.2; `skills/be-conventions/SKILL.md` §9 | contradictory | contradictory | extend / new | `be-async/references/jobs-scheduling.md` |
| 13 | **Sagas / Long Flows** (undo per step, park visibly on failure, owner alert, version fence) | none | none | missing | new | `be-async/references/sagas.md` |
| 14 | **Webhooks (Incoming)** (signature first statement, raw body, durable intake in 1 tx, slow work to job) | none | none | missing | new | `be-api/references/webhooks.md` |
| 15 | **Realtime** (read-only doors, topics from auth principal, resumable streams with IDs, heartbeat, shared hub) | `cannon/CODE-CANNON.md` §5.4–5.8 (broker CDC only) | thin | missing | new | `be-api/references/realtime.md` |
| 16 | **Outbound Integrations & Resilience** (1 owner/raw provider, required timeout, retry ladder only, circuit breaker) | `skills/be-conventions/SKILL.md` §6 | thin | shallow | extend / new | `be-resilience/references/outbound-resilience.md` |
| 17 | **Configuration & Secrets** (1 env reader, parsed/validated before listeners, no default secrets, sealed custody) | `cannon/CODE-CANNON.md` §7.5; `skills/be-conventions/SKILL.md` §8–9; `skills/be-local-run/SKILL.md` §1 | contradictory | contradictory | extend / new | `be-ops/references/config-secrets.md` |
| 18 | **Logging, Tracing, Metrics, Audit** (logger as port, enum event IDs, cause preserved, correlation ID across hops, no PII) | none | none | missing | new | `be-ops/references/observability.md` |
| 19 | **Health & Lifecycle** (separate liveness/readiness/functional, dependency classes, graceful shutdown, startup order) | `cannon/CODE-CANNON.md` §5.6–5.7 | thin | shallow | extend / new | `be-ops/references/lifecycle.md` |
| 20 | **Time, IDs & Determinism** (injected clock and ID generator, UTC storage, no Date.now()/random in domain) | `cannon/CODE-CANNON.md` §4.3 (UUID entity only) | thin | shallow | extend / new | `be-arch/references/determinism.md` |
| 21 | **Caching** (1 owner per key, declared type & TTL, never second truth, invalidation story, stampede control) | `cannon/CODE-CANNON.md` §7.1–7.3, §7.8 | ok (for StarCi) | shallow | extend / new | `be-resilience/references/caching.md` |
| 22 | **Search, Files & Storage** (object storage via BE access control, signed URLs, size/type check, lifecycle/cleanup) | `skills/be-local-run/SKILL.md` (infra only) | none | missing | new | `be-resilience/references/storage-files.md` |
| 23 | **AI / LLM Integration** (gateway for keys/quotas/failover, code chains vs agent loops, caller authority, tool audit) | none (only in `starci-harness`) | none | missing | new | `be-ai/references/llm-integration.md` |
| 24 | **Testing** (test pyramid, real store/broker integration tests, builders > hand rows, strict doubles, contract tests) | `skills/be-conventions/SKILL.md` §10 | thin | shallow | extend / new | `be-test/references/testing-strategy.md` |
| 25 | **Performance & Capacity** (query plans, connection pool sizing, backpressure, queue concurrency, bulk ops, profiling) | `cannon/CODE-CANNON.md` §2.4–2.5 | thin | shallow | extend / new | `be-ops/references/performance-capacity.md` |
| 26 | **Security Hardening & Supply Chain** (dep audit, least privilege DB/cloud, headers/CORS/proxy hops, secret scan, SAST) | `cannon/CODE-CANNON.md` §3.6 | thin | shallow | extend / new | `be-sec/references/security-hardening.md` |
| 27 | **Delivery & Operations** (pinned Dockerfile images, CI gates, migration deploy step, zero-downtime rollout, runbooks) | `skills/be-local-run/SKILL.md` | thin | shallow | extend / new | `be-ops/references/delivery-operations.md` |
| 28 | **Documentation** (API docs from contract, feature design records, ADRs, repo conventions doc read first) | `skills/be-conventions/SKILL.md` §5 (JSDoc only) | thin | shallow | extend / new | `be-arch/references/documentation.md` |
| 29 | **Data Privacy & Compliance** (PII inventory, retention/deletion, export, consent, encryption at rest/in transit) | none | none | missing | new | `be-sec/references/privacy-compliance.md` |
| 30 | **Code Quality** (naming/suffix, typed boundaries, no leaked DB rows in API, function budgets, no service-locator) | `cannon/CODE-CANNON.md` §6; `skills/be-conventions/SKILL.md` §2–5, §11–12 | ok (for StarCi) | shallow | extend / new | `be-arch/references/code-quality.md` |

---

## 2. Contradictions Between Existing Skills and Appendix B Rules

| Appendix B Rule | What the Rule Mandates | Existing Skill Statement | Violation Impact |
|---|---|---|---|
| **BE-1** Migrations sole schema authority | Schema changes applied only via versioned migrations by a dedicated deploy step; never by serving apps at boot, never raced. | `be-local-run/SKILL.md` §1: *"TypeORM `synchronize=true` builds the schema on first boot."* | **Critical:** Auto-sync causes schema drift, table locks, data loss in production, and race conditions between container replicas. |
| **BE-13** Schedules fire once per deployment | Schedules fire once per deployment (leader-elected or external scheduler), never once per container replica. | `be-conventions/SKILL.md` §9: *"Plain `setInterval` + random jitter for recurring polls"* | **High:** In multi-replica deployments, recurring tasks execute $N$ times concurrently, causing race conditions and database load spikes. |
| **BW-P6 / BE-19** No secrets committed | Never commit or echo credentials; config parsed and validated at boot; no default credentials. | `be-local-run/SKILL.md` §1: Hardcodes `Cuong123_A`, `123456`, `minioadmin123`, `starci@2026`. | **High:** Security leak; exposes plaintext database, cache, S3, and message broker passwords in agent skill files. |
| **BE-3** No tx across external calls | No database transaction spans an external network call (HTTP, message broker, email, payment). | `cannon/CODE-CANNON.md` §4.2: Mandates wrapping in `entityManager.transaction(...)` without warning against external I/O inside the block. | **High:** Long external latency holds DB locks, exhausts connection pool, and causes 2PC dual-write failures if external call succeeds but DB rollback occurs. |
| **BE-2** Transactional outbox | Changes requiring external jobs/events must write an outbox row in the same DB transaction. | `cannon/CODE-CANNON.md` §5.2: Directly bridges CQRS events to a BullMQ enqueue service without an outbox table. | **High:** Dual-write vulnerability; event emitted even if DB transaction rolls back, or DB commits while Redis queue is unreachable. |
| **BE-20** Closed error code enum | Error codes are a closed enum with a kind per code; no raw prose; one throw per refusal; never leak SQL/stacks. | `be-conventions/SKILL.md` §9: Custom errors throw ad-hoc string constants; no standardized mapping to HTTP/gRPC status codes. | **Medium:** Inconsistent error responses across endpoints; leaks implementation details. |

---

## 3. Folklore Rules in Existing Skills (No Technical Justification)

| Folklore Rule | Found In | Claim Made | Why It Is Folklore (Missing `Why:`) |
|---|---|---|---|
| **Arrow functions only** | `be-conventions` §3; `CODE-CANNON` §6.5 | *"Declaration style — `export const` arrow, never `export function` (STRICT)"* | Stylistic preference cargo-culted from React component patterns. Standard `export function` has better stack trace hoisting in Node.js and poses zero architectural risk. |
| **Banning JSON config** | `be-conventions` §8 | *"Never write JSON config; config must be YAML."* | No technical reason provided. JSON is natively supported by Node without YAML parser dependencies. The real invariant is schema validation at boot, not file serialization format. |
| **Global leaf modules** | `be-conventions` §1b; `CODE-CANNON` §1.1 | *"Every leaf module must register with `.register({ isGlobal: true })`"* | Making every leaf module global disables NestJS dependency encapsulation, making circular dependencies and unintended provider access trivial. Contradicts `CODE-CANNON` §1.6 which says globality belongs in `AppModule`. |
| **Entity manager over repository** | `be-conventions` §7; `CODE-CANNON` §4.1 | *"Inject `EntityManager`, never a `Repository`"* | While preventing multiple disconnected repository instances in transactions, injecting raw `EntityManager` everywhere bypasses repository unit-testing isolation and encourages direct SQL/query manipulation in services without clear boundaries. |
| **Mandatory line-by-line comments** | `be-conventions` §5 | *"Inline `//` comments explaining logic — MANDATORY, line-by-line"* | Forces noise comments (`// set user id: entity.userId = id`) which rot quickly. Engineering rule should be: comments explain *why*, code explains *what*; decision-bearing logic documented, trivial assignments left clean. |

---

## 4. Proposed Restructuring & Action Plan

To transform `be-skill-andy` into a complete, portable backend engineering standard that installs cleanly across Claude Code, Codex, and Antigravity:

1. **Central Router (`be`)**: Single router skill classifying requests by trigger kind (HTTP, GraphQL, Job, Webhook, CLI, DB, Audit, Build) and domain, dispatching to focused topic skills.
2. **Modular Topic Skills (10 domain skills + profile)**:
   - `be-arch`: Architecture, layering, folder structure, code quality, determinism.
   - `be-api`: API design (REST/GraphQL), OpenAPI contracts, error handling, webhooks, realtime.
   - `be-auth`: Authentication, sessions, cookies, tokens, password security.
   - `be-authz`: Authorization, default-deny, domain-level resource authorization, multi-tenancy.
   - `be-persist`: Persistence, migrations (BE-1), transactions (BE-3), concurrency, constraints.
   - `be-async`: Idempotency (BE-9), transactional outbox (BE-2), jobs & scheduling (BE-10–13), sagas.
   - `be-resilience`: Outbound integrations, timeouts, retries, caching, object storage.
   - `be-ops`: Config & secrets (BE-19), observability (BE-21), lifecycle & health (BE-22), delivery.
   - `be-sec`: Security hardening, abuse limits, input validation, supply chain.
   - `be-test`: Testing pyramid, real-store integration tests, strict doubles, contracts.
   - `be-audit`: Read-only audit mode checking any codebase against BE-* and BR-* rules.
3. **Framework Profile Mechanism**:
   - Generic rules remain 100% stack-neutral in the core skills.
   - `profiles/nestjs/`: Dedicated profile implementing the rules for NestJS + TypeORM + PostgreSQL + BullMQ + Redis.
   - `profiles/template/`: Template for other frameworks (Express, Fastify, Prisma, Drizzle, etc.).

---

## 5. Final Implemented State Matrix (All 30 Topics Completed)

| # | Topic | Implemented Location | Quality | Status | Rules Enforced |
|---|---|---|:---:|:---:|---|
| 1 | Architecture & Layering | `skills/be-arch/references/layering.md` | ok | Complete | BE-23, BE-24, BR-2 |
| 2 | Folder / Feature Shape | `skills/be-arch/references/folder-structure.md` | ok | Complete | BE-24, BR-1 |
| 3 | API Design & Transport | `skills/be-api/references/api-design.md` | ok | Complete | BE-7, BE-27, BR-1 |
| 4 | Authentication & Session | `skills/be-auth/references/session-and-tokens.md` | ok | Complete | BE-17 |
| 5 | Authorization | `skills/be-authz/references/resource-authz.md` | ok | Complete | BE-14, BE-15, BR-4 |
| 6 | Input Validation & Abuse Limits | `skills/be-sec/references/abuse-limits.md` | ok | Complete | BE-16 |
| 7 | Errors | `skills/be-api/references/error-handling.md` | ok | Complete | BE-20 |
| 8 | Persistence & Migrations | `skills/be-persist/references/migrations-schema.md` | ok | Complete | BE-1, BE-7 |
| 9 | Transactions & Concurrency | `skills/be-persist/references/transactions.md` | ok | Complete | BE-3, BE-6 |
| 10| Idempotency | `skills/be-async/references/idempotency.md` | ok | Complete | BE-8, BE-9 |
| 11| Outbox, Events & Queues | `skills/be-async/references/outbox-and-events.md` | ok | Complete | BE-2, BE-7 |
| 12| Jobs & Scheduling | `skills/be-async/references/jobs-scheduling.md` | ok | Complete | BE-10, BE-11, BE-13 |
| 13| Sagas / Long Flows | `skills/be-async/references/sagas.md` | ok | Complete | BE-12, BR-5 |
| 14| Webhooks (Incoming) | `skills/be-api/references/webhooks.md` | ok | Complete | BE-18, BE-8 |
| 15| Realtime | `skills/be-api/references/realtime.md` | ok | Complete | BR-3, BR-4 |
| 16| Outbound Integrations & Resilience | `skills/be-resilience/references/outbound-resilience.md` | ok | Complete | BE-23, BR-5 |
| 17| Configuration & Secrets | `skills/be-ops/references/config-secrets.md` | ok | Complete | BE-19, BW-P6 |
| 18| Logging, Tracing, Metrics, Audit | `skills/be-ops/references/observability.md` | ok | Complete | BE-21, BW-P6 |
| 19| Health & Lifecycle | `skills/be-ops/references/lifecycle.md` | ok | Complete | BE-22, BR-6 |
| 20| Time, IDs & Determinism | `skills/be-arch/references/determinism.md` | ok | Complete | BE-25 |
| 21| Caching | `skills/be-resilience/references/caching.md` | ok | Complete | BR-3 |
| 22| Search, Files & Storage | `skills/be-resilience/references/storage-files.md` | ok | Complete | BE-16, BR-4 |
| 23| AI / LLM Integration | `skills/be-ai/references/llm-gateway.md` | ok | Complete | BE-31, BE-32, BE-33 |
| 24| Testing Strategy | `skills/be-test/references/test-pyramid.md` | ok | Complete | BE-28, BW-P10, BR-7 |
| 25| Performance & Capacity | `skills/be-ops/references/performance-capacity.md` | ok | Complete | BE-16 |
| 26| Security Hardening & Supply Chain | `skills/be-sec/references/security-hardening.md` | ok | Complete | BE-17, BE-19 |
| 27| Delivery & Operations | `skills/be-ops/references/delivery-operations.md` | ok | Complete | BE-1, BR-6 |
| 28| Documentation | `skills/be-arch/references/documentation.md` | ok | Complete | BW-P1, BW-P4 |
| 29| Data Privacy & Compliance | `skills/be-sec/references/privacy-compliance.md` | ok | Complete | BE-21, BR-3 |
| 30| Code Quality | `skills/be-arch/references/code-quality.md` | ok | Complete | BE-26, BR-2 |
