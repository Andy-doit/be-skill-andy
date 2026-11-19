# Changelog — be-skill-andy

All notable changes to the `be-skill-andy` backend engineering skill set are documented in this file.

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
