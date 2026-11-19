---
name: be
description: >
  Central router and architecture dispatcher for backend engineering.
  Use when: designing, planning, building, refactoring, or reviewing backend services, APIs, databases,
  transactions, authentication, queues, and distributed systems. Classifies requests and routes to
  specialized topic skills (be-arch, be-api, be-auth, be-authz, be-persist, be-async, be-resilience,
  be-ops, be-sec, be-test, be-audit).
  DO NOT USE FOR: purely frontend UI styling or layouts (route to fe-layout or fe-ux in fe-skill-andy),
  browser skeletons (route to fe-skel), client data fetching hooks (route to fe-data), or cloud terraform
  infrastructure orchestration.
---

# be — Backend Architecture Router & Dispatcher

Authoritative router for the backend engineering skill set. Evaluates incoming backend tasks, enforces the **Per-Project Context Step**, and dispatches to specialized topic skills.

All skills adhere to the core engineering laws in [conventions.md](../../references/conventions.md).

---

## 1. Operating Modes & Protocols

The backend skill set operates in two distinct modes:

### 1.1 Build Mode Protocol (Fast-Path vs Full Protocol)

- **Fast-Path (Execute + Verify in one turn without proposal ceremony):**
  - **Scope:** $\le 5$ lines in a single file.
  - **Nature:** Pure cosmetic, typo in logs or comments, error message wording fix, dev port configuration tweak, or single-line import fix.
  - **Hard Barrier:** Does **NOT** touch Protected Zones (financial/ledger transactions, authentication, permissions, database migrations, or public API contracts).
- **Full Protocol (Audit → Proposal → User Approval → Implement → Verify):**
  - **Required for:** Any task $> 5$ lines, multi-file modifications, schema migrations, concurrency control, or touching architectural data flow.
  - Read project context first (BW-P1).
  - Produce a design record proposal citing governing rule IDs (BW-P2, BW-P4).
  - Wait for explicit user confirmation ("chốt", "approved") before touching code.
  - Implement in small batches ($\le 3$ modules) without loosening gates (BW-P5).
  - Prove invariants at the real boundary (BW-P10).

### 1.2 Audit Mode (Read-Only Code Review)
- Read-only inspection of existing code against `BE-*` and `BR-*` rules.
- Outputs a findings table: Rule ID, `file:line`, severity, violation snippet, and proposed remedy.
- Never mutates code silently (dispatches to `be-audit`).

---

## 2. Mandatory First Step: Per-Project Context (BW-P1, BW-P3)

Before modifying code or creating a plan in any repository:
1. Locate and read `project-profile.md` at the repo root (see template in [project-profile.template.md](../../references/project-profile.template.md)).
2. Identify declared language version, primary framework, ORM/DB, broker, active dev ports, and intentionally disabled gates.
3. If `project-profile.md` is absent, inspect `package.json` (or dependency manifest) and `docker-compose.yml`.
4. Check if the active framework has a dedicated profile in `profiles/` (e.g. `profiles/nestjs/`).
5. **Rule BW-P3:** If the requested change requires a mechanism or port forbidden by the project declaration, **stop immediately and report the contradiction** to the user.

---

## 3. Routing Table

Identify the primary concern and dispatch to the owning skill by name:

| Concern | Primary Keywords (EN / VI) | Owning Skill | Key References |
|---|---|:---:|---|
| **Architecture & Tiers** | layering, composition root, cycles, folder structure, determinism, clock | `be-arch` | [layering.md](../be-arch/references/layering.md) |
| **API Design & Contracts** | REST, GraphQL, OpenAPI, endpoints, error codes, webhooks, SSE, realtime | `be-api` | [api-design.md](../be-api/references/api-design.md) |
| **Authentication & Session** | login, JWT, session, cookies, HttpOnly, SameSite, tokens, password hash | `be-auth` | [session-and-tokens.md](../be-auth/references/session-and-tokens.md) |
| **Authorization & Tenant** | permission, roles, default-deny, domain check, multi-tenancy, RLS | `be-authz` | [resource-authz.md](../be-authz/references/resource-authz.md) |
| **Persistence & Schema** | database, migrations, expand-contract, transactions, locking, index, SQL, read replica lag, sharding, partitioning | `be-persist` | [migrations-schema.md](../be-persist/references/migrations-schema.md) |
| **Async, Queues & Jobs** | idempotency key, outbox, CDC, Debezium, BullMQ, NATS, Kafka, background jobs, sagas | `be-async` | [idempotency.md](../be-async/references/idempotency.md) |
| **Outbound & Resilience** | external HTTP, timeouts, circuit breaker, caching, Redis, S3 upload | `be-resilience` | [outbound-resilience.md](../be-resilience/references/outbound-resilience.md) |
| **Operations & Runtime** | env config, secrets, logging, tracing, liveness, readiness, Docker, deploy | `be-ops` | [config-secrets.md](../be-ops/references/config-secrets.md) |
| **Security & Limits** | rate limit, distributed rate limiting, token bucket, payload size, file limits, SSRF, CORS, privacy, PII | `be-sec` | [abuse-limits.md](../be-sec/references/abuse-limits.md) |
| **Testing Strategy** | integration test, race conditions, unit doubles, contract test, fixtures | `be-test` | [test-pyramid.md](../be-test/references/test-pyramid.md) |
| **AI / LLM Integration** | LLM gateway, model quotas, prompt safety, agent loops, tool authority | `be-ai` | [llm-gateway.md](../be-ai/references/llm-gateway.md) |
| **Code Review & Auditing** | review, audit, check standards, inspect PR, find violations | `be-audit` | [audit-checklist.md](../be-audit/references/audit-checklist.md) |

---

## 4. Multi-Concern Tasks

When a request spans multiple topics (e.g. "Add a webhook endpoint that saves records and triggers a background email job"):
1. Decompose into ordered sub-tasks:
   - Contract & Ingestion door (`be-api`: signature check first, raw body).
   - Persistence & Outbox (`be-persist` + `be-async`: atomic DB write with outbox row).
   - Async Job execution (`be-async`: fenced job, retry ladder).
2. Execute each sub-task under its owning skill's discipline.
3. Verify invariants at the real integration boundary (`be-test`).
