# Changelog — be-skill-andy

All notable changes to the `be-skill-andy` backend engineering skill set are documented in this file.

## [1.1.1] - 2026-11-19

### Audit Synchronization, Fast-Path Protocol & Architecture Nuances
Refined the backend skill set based on comprehensive peer evaluation: synchronized audit checklists, relaxed overly rigid distributed rules with controlled exceptions, introduced Fast-Path protocol for small edits, and eliminated duplicate static scanner warnings.

### Changed
- **Synchronized `be-audit` to `BE-1..36`:** Updated `skills/be-audit/SKILL.md` and `skills/be-audit/references/audit-checklist.md` with inspection criteria and severities for `BE-34` (Replica Lag), `BE-35` (Distributed Rate Limiting), and `BE-36` (Sharded Queries).
- **Nuanced Distributed Rules (`BE-36` & `BE-31`):**
  - `BE-36`: Scoped scatter-gather restrictions to the user-facing OLTP path; added controlled exceptions for asynchronous offline sagas, reconciliation jobs, and data migrations.
  - `BE-31`: Clarified that the single LLM gateway mandate refers to a unified architectural facade/policy layer (whether an in-process platform module or standalone proxy), not necessarily an isolated physical microservice.
- **Fast-Path Protocol Added:** Formalized Fast-Path protocol in `skills/be/SKILL.md` and `references/conventions.md` ($\le 5$ lines, non-protected zone, 1-turn execute + verify) to eliminate bureaucratic overhead on trivial fixes.
- **Static Scanner Fixed:** Removed duplicate `Date.now()` / `new Date()` check in `scripts/audit-backend.mjs` that caused double-flagging on service files; added heuristic notice.
- **Hardened Consistent Hashing Example:** Upgraded `skills/be-persist/references/sharding-and-partitioning.md` to 64-bit BigInt hash (preventing 32-bit vnode collisions), added `removeNode()` method, and included explicit production caveats regarding topology rebalancing and distributed engines (Citus, Vitess, Envoy).

## [1.1.0] - 2026-11-19

### Hyper-Scale & Distributed Systems Expansion
Expanded `be-skill-andy` to support high-throughput, distributed, and hyper-scale architectures with 3 new engineering laws, 4 deep reference guides, and 2 production playbooks.

### Added
- **New Engineering Rules (`BE-34..36`):**
  - **`BE-34` Read-After-Write Consistency:** Mandates session write pinning or LSN/WAL replication token tracking following mutations; forbids blind reads against asynchronous replicas.
  - **`BE-35` Atomic Distributed Rate Limiting:** Enforces single-boundary atomic evaluation (Redis Lua script) for distributed rate limits; bans non-atomic `GET-then-SET` sequences and $O(N)$ ZSET memory explosion under DDoS; requires declared `fail-open` vs `fail-close` modes.
  - **`BE-36` Shard Key Invariance & Scatter-Gather Fencing:** Requires immutable high-cardinality shard keys; fences or rejects non-sharded OLTP queries; bans cross-shard Two-Phase Commit (2PC) transactions in online request paths.
- **Deep Reference Guides:**
  - `skills/be-sec/references/distributed-rate-limiting.md`: Sliding Window Counter ($O(1)$ memory), production Redis Lua script, and failover strategies.
  - `skills/be-persist/references/replica-lag.md`: Session write pinning (Sticky Window) and causal consistency via PostgreSQL commit LSN tracking.
  - `skills/be-persist/references/sharding-and-partitioning.md`: Native declarative partitioning, consistent hashing router with virtual nodes, and scatter-gather avoidance.
  - `skills/be-async/references/cdc-debezium.md`: Zero-polling Transactional Outbox via PostgreSQL WAL / MySQL Binlog, heartbeat tables to prevent disk exhaustion, and Avro schema evolution.
- **Production Case Studies (`references/case-studies.md`):**
  - **Case Study 5:** Distributed Tiered Rate Limiting under 100,000 RPS Attack (Edge IP bounding -> Redis Lua Sliding Window Counter -> Downstream isolation).
  - **Case Study 6:** Read-After-Write Consistency across Multi-Region PostgreSQL Read Replicas (US-East Primary to Asia Replicas, resolving phantom 404s via LSN cookies and write pinning).

## [1.0.0] - 2026-11-19

### Major Architecture Upgrade
Upgraded `be-skill-andy` into a complete, portable backend engineering standard supporting **Claude Code**, **Codex**, and **Antigravity**.

### Added
- **Central Router Skill (`be`):** Autonomous router classifying backend requests by trigger kind and concern; enforces the mandatory Per-Project Context step (BW-P1, BW-P3).
- **10 Modular Topic Skills:**
  - `be-arch`: Architecture, tiers, dependency direction, composition root, cycles, folder structure, determinism (BE-23, BE-24, BE-25, BE-26).
  - `be-api`: API design, REST/GraphQL schemas, closed-enum errors, webhooks, realtime streams (BE-7, BE-18, BE-20, BE-27).
  - `be-auth`: Authentication, session cookies (HttpOnly, Secure, SameSite), token rotation, constant-time comparisons (BE-17).
  - `be-authz`: Authorization, default-deny at every door, domain-level resource authorization, multi-tenancy (BE-14, BE-15).
  - `be-persist`: Persistence, migrations as sole schema authority, transactions without external calls, store constraints (BE-1, BE-3, BE-4, BE-5, BE-6).
  - `be-async`: Idempotency keys, transactional outbox, fenced background jobs, declared retry ladders, single-fire schedules, sagas (BE-2, BE-8, BE-9, BE-10, BE-11, BE-12, BE-13).
  - `be-resilience`: Outbound timeouts, circuit breaking, single owner per provider, cache-aside consistency, S3 storage (BE-16, BE-23).
  - `be-ops`: Config schema validation at boot, structured logging with correlation IDs and PII redaction, separate health probes, zero-downtime rollouts (BE-19, BE-21, BE-22).
  - `be-sec`: Input boundary validation, collection limits, SSRF protection, CORS allowlists, trusted proxy hops, privacy (BE-16, BE-17).
  - `be-test`: Test pyramid, real-store integration tests on real databases/brokers, typed doubles, contract tests (BE-28, BE-29, BE-30).
  - `be-ai`: LLM gateway, model quotas, deterministic code chains vs bounded agent loops, scoped RAG retrieval, tool authority (BE-31, BE-32, BE-33).
- **Read-Only Audit Skill (`be-audit`):** Automated inspection producing structured findings tables with rule IDs, file:line, severity, and remedies.
- **Framework Profile System (`profiles/`):**
  - `profiles/nestjs/`: Stack profile for NestJS 10+ / TypeORM / PostgreSQL / BullMQ / Redis / NATS.
  - `profiles/template/`: Universal template for authoring stack profiles for any backend framework.
- **Shared Reference Governance:**
  - `references/conventions.md`: Process rules (BW-P1..P14) and review obligations (BR-1..7).
  - `references/project-profile.template.md`: Template for repo architecture declarations.
  - `references/design-record.template.md`: Feature design record / ADR template.
  - `references/api-contract-change.md`: Additive vs breaking changes checklist.
  - `references/incident-loop.md`: Hardening loop for missed rules (BW-P8).
- **Automated Zero-Dependency Node.js Verification Scripts:**
  - `scripts/check-skills.mjs`: Frontmatter, description limits, two-way triggers, link validation, no `/slash-command` references.
  - `scripts/check-loosening.mjs`: Scans for banned loosening markers (`eslint-disable`, `@ts-ignore`, skipped tests, `|| true`).
  - `scripts/check-secrets.mjs`: Scans for committed credentials and real `.env` files.
  - `scripts/audit-backend.mjs`: Static rule scanner and dry-run executor.
  - `scripts/install-skills.ps1`: Multi-tool Windows junction installer.

### Changed
- Standardized multi-tool installation across Claude Code (`.claude/skills`), Codex (`.agents/skills`), and Antigravity (`.gemini/config/plugins/be-skill-andy`).
- Neutralized all rules to be framework-neutral and business-neutral. Stack specifics moved to `profiles/nestjs/`.
- Replaced monolithic 1,081-line `be-conventions` with focused modular skills.

### Removed
- Removed legacy monolithic folders: `skills/be-conventions/`, `skills/be-local-run/`, `skills/be-new-module/`, `skills/starci-be-cannon-apply/`, and `skills/starci-be-cannon-audit/` (all patterns, conventions, and audit rules preserved in neutral topic skills and `profiles/nestjs/`).
- Removed committed plaintext dev passwords from `be-local-run`; replaced with safe `.env.example` guidance in `profiles/nestjs/local-run.md`.
- Eliminated conflicting rules: `synchronize: true` in dev and multi-replica `setInterval`.
