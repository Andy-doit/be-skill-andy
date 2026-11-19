# Work Log — be-skill-andy

## 2026-11-19 — Phase 0: Inventory the real state (READ-ONLY)

- **Phase:** Phase 0 (Read-only real state survey)
- **What was read:**
  - `be-skill-andy`: `README.md`, `.claude-plugin/plugin.json`, `cannon/CODE-CANNON.md`, `skills/be-conventions/SKILL.md`, `skills/be-local-run/SKILL.md`, `skills/be-new-module/SKILL.md`, `skills/starci-be-cannon-apply/SKILL.md`, `skills/starci-be-cannon-audit/SKILL.md`.
  - `starci-harness`: `contexts/harness/rules.md`, `contexts/code/README.md`, `contexts/code/be/*` (35 files).
  - `fe-skill-andy`: `skills/fe-andy/SKILL.md`, `rules/AGENTS.md`, `.antigravity-plugin/plugin.json`, `.agents/skills.json`, `scripts/install-skills.ps1`.
- **What changed:**
  - `phase0-inventory.md`: Created detailed inventory of real state, hygiene issues, Appendix A mapping, tool installation status, and FE/BE boundary.
  - `work_log.md`: Initialized work log.
- **Decisions taken:**
  - Kept all existing skill files and cannon files untouched (read-only mode strictly enforced).
  - Verified 0 broken relative markdown links; flagged 5 absolute paths in `CODE-CANNON.md` and 31 non-portable `/slash-command` instances.
  - Identified severe framework-coupling to NestJS/TypeORM and security risk of committed plain-text credentials in `be-local-run/SKILL.md`.
- **Open questions / Needs user confirmation:**
  1. Default stack profile: NestJS + TypeORM + PostgreSQL (as reflected in current codebase) or another stack? -> *Confirmed: NestJS + TypeORM (PostgreSQL) + BullMQ/Redis.*
  2. Installation paths: Confirm intended install mode (junctions vs plugin) for Claude Code, Codex, and Antigravity. -> *Confirmed: Standardize multi-tool install (junctions + plugin manifests).*

## 2026-11-19 — Phase 1: Coverage matrix & gap analysis (READ-ONLY)

- **Phase:** Phase 1 (Coverage matrix, contradictions, and folklore audit)
- **What was read:**
  - `phase0-inventory.md`
  - Appendix A topics (30 concerns) and Appendix B rules (BW-P1..P14, BR-1..7, BE-1..33)
  - `cannon/CODE-CANNON.md` and all existing skills
- **What changed:**
  - `phase1-coverage.md`: Created detailed coverage matrix of 30 Appendix A topics, 6 critical contradictions against Appendix B, and 5 folklore rules.
  - `work_log.md`: Appended Phase 1 log.
- **Decisions taken:**
  - Marked 6 severe contradictions to eliminate (auto-sync schema in dev, setInterval recurring jobs, plain-text credentials, transactions over external calls, dual-write broker enqueue, ad-hoc string error codes).
  - Categorized 5 folklore rules to replace with neutral engineering justifications with `Why:`.
  - Defined target skill structure: 1 Router (`be`), 10 domain topic skills, 1 Audit skill (`be-audit`), and 1 stack profile (`profiles/nestjs/`).
- **Open questions / Needs user confirmation:**
  - Confirm the proposed target topology (1 router + 10 topic skills + 1 audit skill + stack profile mechanism) before drafting Phase 2 detailed plan. -> *Confirmed: User approved proceeding with Phase 2.*

## 2026-11-19 — Phase 2: Design decisions & implementation plan (READ-ONLY)

- **Phase:** Phase 2 (Design decisions, ownership matrix, router test cases, batch implementation plan)
- **What was read:**
  - `phase1-coverage.md`, `phase0-inventory.md`, Appendix A topics, Appendix B rules.
  - `fe-skill-andy` convention documents and test suites.
- **What changed:**
  - `phase2-plan.md`: Created comprehensive design plan covering target directory tree, 30-topic ownership matrix, FE/BE boundary assignment, 6-part topic reference skeleton, framework profile mechanism, per-project context protocol, 27 router test cases (15 clear, 6 ambiguous, 6 negative), and a 5-batch rollout strategy.
  - `work_log.md`: Appended Phase 2 log.
- **Decisions proposed for user approval:**
  1. Renaming to clean neutral names (`be`, `be-arch`, `be-api`, `be-persist`, etc., `be-audit`), moving StarCi specifics to `profiles/nestjs/`. -> *Confirmed & approved by user.*
  2. Removal of plaintext credentials in `be-local-run`, moving local compose guide to `profiles/nestjs/local-run.md`. -> *Confirmed & approved by user.*
  3. Decomposing the monolithic 1,081-line `be-conventions` into modular topic skills and `profiles/nestjs/`. -> *Confirmed & approved by user.*
  4. Approving Batch 1 implementation (validation scripts, shared conventions, router `be`, and tool manifests). -> *Confirmed & approved by user.*

## 2026-11-19 — Phase 3: Small-batch modular implementation

- **Phase:** Phase 3 (Batch 1 through Batch 5b implementation)
- **What was changed:**
  - **Batch 1:**
    - `scripts/check-skills.mjs`, `scripts/check-loosening.mjs`, `scripts/check-secrets.mjs`.
    - `references/conventions.md` (BW-P1..P14, BR-1..7), `references/project-profile.template.md`, `references/design-record.template.md`, `references/api-contract-change.md`, `references/incident-loop.md`.
    - `profiles/template/profile-template.md`.
    - `skills/be/SKILL.md` (Central Router).
    - Multi-tool manifests: `.claude-plugin/plugin.json`, `.agents/skills.json`, `.antigravity-plugin/plugin.json`, `.antigravity-plugin/rules/AGENTS.md`.
  - **Batch 2:**
    - `skills/be-arch/`: `SKILL.md`, `layering.md`, `folder-structure.md`, `determinism.md`, `code-quality.md`.
    - `skills/be-persist/`: `SKILL.md`, `migrations-schema.md`, `transactions.md`, `data-modeling.md`.
    - `profiles/nestjs/`: `README.md`, `di-and-modules.md`, `orm-typeorm.md`, `transports.md`, `async-bullmq-nats.md`, `local-run.md`.
  - **Batch 3:**
    - `skills/be-api/`: `SKILL.md`, `api-design.md`, `error-handling.md`, `webhooks.md`, `realtime.md`.
    - `skills/be-auth/`: `SKILL.md`, `session-and-tokens.md`, `credentials-crypto.md`.
    - `skills/be-authz/`: `SKILL.md`, `default-deny.md`, `resource-authz.md`, `multi-tenancy.md`.
  - **Batch 4:**
    - `skills/be-async/`: `SKILL.md`, `idempotency.md`, `outbox-and-events.md`, `jobs-scheduling.md`, `sagas.md`.
    - `skills/be-resilience/`: `SKILL.md`, `outbound-resilience.md`, `caching.md`, `storage-files.md`.
    - `skills/be-ops/`: `SKILL.md`, `config-secrets.md`, `observability.md`, `lifecycle.md`, `delivery-operations.md`, `performance-capacity.md`.
  - **Batch 5:**
    - `skills/be-sec/`: `SKILL.md`, `abuse-limits.md`, `security-hardening.md`, `privacy-compliance.md`.
    - `skills/be-test/`: `SKILL.md`, `test-pyramid.md`, `doubles-and-builders.md`, `contract-tests.md`.
    - `skills/be-ai/`: `SKILL.md`, `llm-gateway.md`.
    - `skills/be-audit/`: `SKILL.md`, `audit-checklist.md`.
    - Retired 5 legacy folders (`be-conventions`, `be-local-run`, `be-new-module`, `starci-be-cannon-apply`, `starci-be-cannon-audit`) after migrating patterns to modular skills and `profiles/nestjs/`.
- **Verification:** `node scripts/check-skills.mjs` passed on all 13 skills (0 errors, 0 warnings); `check-loosening.mjs` and `check-secrets.mjs` passed cleanly.

## 2026-11-19 — Phase 4: Audit mode and templates

- **Phase:** Phase 4 (Read-only audit workflow, templates, and dry run)
- **What was changed:**
  - `skills/be-audit/SKILL.md` and `skills/be-audit/references/audit-checklist.md` created.
  - `scripts/audit-backend.mjs` created as static scanner.
  - Executed end-to-end dry run on scratch backend (`C:\Users\Endy\.gemini\antigravity\brain\...\scratch\sample-backend`); identified 8 violations (2 BLOCKERs, 6 WARNs) citing BE-3, BE-20, BE-25, BE-26.

## 2026-11-19 — Phase 5: Portability and install

- **Phase:** Phase 5 (Multi-tool install guide and junction script)
- **What was changed:**
  - `scripts/install-skills.ps1`: Windows junction installer supporting Claude Code, Codex, and Antigravity with `-Uninstall` flag.
  - `install-guide.md`: Complete install, update, uninstall guide with manual copy and junction commands, plus 3 verify-install prompt tests.
  - `README.md` and `CHANGELOG.md`: Updated with full documentation.
- **Verification:** All validation scripts rerun and passed.

## 2026-11-19 — Global Antigravity Installation

- **Action:** Installed `be-skill-andy` globally into Antigravity per user request.
- **Paths Linked:**
  - Plugin registered: `C:\Users\Endy\.gemini\config\plugins\be-skill-andy` -> `D:\work\AI\be-skill-andy`
  - Skills linked: `C:\Users\Endy\.gemini\config\skills\` (13 skills linked: `be`, `be-ai`, `be-api`, `be-arch`, `be-async`, `be-audit`, `be-auth`, `be-authz`, `be-ops`, `be-persist`, `be-resilience`, `be-sec`, `be-test`).
  - Rules mirrored: `rules/AGENTS.md` and `.antigravity-plugin/rules/AGENTS.md`.
- **Status:** Complete & verified. All 3 verification scripts (`check-skills`, `check-loosening`, `check-secrets`) pass with 0 errors.

## 2026-11-19 — README Redesign & Case Studies Playbook

- **Action:** Upgraded `README.md` to match the style, structure, and depth of `fe-skill-andy`; added production case studies.
- **What was changed:**
  - `README.md`: Completely redesigned with custom badges, pain-point analysis, before/after code comparison (AI Spaghetti vs Senior Architect Twin), 3 core technical weapons (Outbox/Inbox, Expand-Contract, Zero-Loosening), real conversational dialog, skills directory table, and quickstart commands.
  - `references/case-studies.md`: Authored 4 comprehensive real-world production case studies:
    1. High-Volume Flash Sale & Checkout (Concurrency, Idempotency & Zero Oversell).
    2. Webhook Intake & Async Event Bus Relay (Dual-Write Prevention & Inbox Claims).
    3. Zero-Downtime Database Migration (Expand-and-Contract column split).
    4. Multi-Tenant B2B SaaS Isolation & PostgreSQL Row-Level Security.
- **Verification:** Ran `check-skills.mjs`, `check-loosening.mjs`, and `check-secrets.mjs` — all passed cleanly with 0 errors.

## 2026-11-19 — Antigravity Plugin Slash-Command Autocomplete Fix

- **Issue:** User reported typing `/be` in a new workspace (`nestjs-backend`) did not show `/be` in the slash command popup, while `/fe-*` commands showed up under "Andy Frontend Agent Skills".
- **Root Cause Analysis:**
  1. `C:\Users\Endy\.gemini\config\plugins\be-skill-andy` was initially a junction to repo root instead of a structured plugin directory with `plugin.json` at root.
  2. In `plugin.json`, `suggestedPrompts` entries lacked the leading `/` (had `"be"`, `"be-arch"` instead of `"/be"`, `"/be-arch"`).
  3. `C:\Users\Endy\.gemini\config\skills.json` was missing `D:/work/AI/be-skill-andy/skills`.
- **Fix Applied:**
  1. Staged `C:\Users\Endy\.gemini\config\plugins\be-skill-andy` as a clean plugin folder with `plugin.json`, `README.md`, `rules/AGENTS.md`, and a junction `skills` -> `D:\work\AI\be-skill-andy\skills` (identical structure to `fe-skill-andy`).
  2. Fixed `suggestedPrompts` in `plugin.json` to include explicit leading `/` on all 13 prompts (`/be`, `/be-arch`, `/be-api`, ...).
  3. Added `D:/work/AI/be-skill-andy/skills` to `C:\Users\Endy\.gemini\config\skills.json`.
  4. Re-ran `scripts/install-skills.ps1 -Tools antigravity` and verified all paths.
  5. Committed and pushed to GitHub remote (commit `92ca8ef`).

## 2026-11-19 — Hyper-Scale Distributed Systems Expansion

- **Phase:** Feature Enhancement (Hyper-scale Distributed Systems)
- **Objective:** Expand `be-skill-andy` with deep distributed systems knowledge covering Distributed Rate Limiting, Read/Write Replica Lag, Database Sharding, and CDC via Debezium.
- **Files Created / Modified:**
  - `skills/be-sec/references/distributed-rate-limiting.md` (Created — Sliding Window Counter, atomic Redis Lua, fail-open/fail-close, BE-35).
  - `skills/be-persist/references/replica-lag.md` (Created — Session write pinning, LSN tracking, BE-34).
  - `skills/be-persist/references/sharding-and-partitioning.md` (Created — Consistent hashing, declarative partitions, scatter-gather fencing, BE-36).
  - `skills/be-async/references/cdc-debezium.md` (Created — Zero-polling outbox, Debezium WAL streaming, heartbeat table, schema registry).
  - `skills/be-sec/SKILL.md` (Updated — Added BE-35 and reference link).
  - `skills/be-persist/SKILL.md` (Updated — Added BE-34, BE-36 and reference links).
  - `skills/be-async/SKILL.md` (Updated — Added CDC reference link).
  - `skills/be/SKILL.md` (Updated — Expanded routing table keywords).
  - `references/conventions.md` (Updated — Registered BE-34, BE-35, BE-36).
  - `references/case-studies.md` (Updated — Added Case Study 5 and Case Study 6).
  - `CHANGELOG.md` (Updated — Version 1.1.0 release notes).
- **Verification:**
  - Ran `node scripts/check-skills.mjs`: 13 skills checked, 0 errors, 0 warnings.
  - Ran `node scripts/check-loosening.mjs`: 0 violations.
  - Ran `node scripts/check-secrets.mjs`: 0 leaks.
- **Status:** Complete & verified.

## 2026-11-19 — Installation for Claude Code

- **Action:** Installed `be-skill-andy` globally into Claude Code via Windows directory junctions.
- **Target Path:** `C:\Users\Endy\.claude\skills\`
- **Skills Linked (13 total):** `be`, `be-ai`, `be-api`, `be-arch`, `be-async`, `be-audit`, `be-auth`, `be-authz`, `be-ops`, `be-persist`, `be-resilience`, `be-sec`, `be-test`.
- **Status:** Complete & verified. All 13 directory junctions active and pointing directly to `D:\work\AI\be-skill-andy\skills\*`.

## 2026-11-19 — Peer Review Hardening & Quality Gate Refinement (v1.1.1)

- **Phase:** Quality Hardening & Rule Nuancing
- **Feedback Addressed:**
  1. Synchronized `be-audit` matrix with `BE-34..36`.
  2. Relaxed overly absolute distributed rules (`BE-36` sharding exceptions, `BE-31` unified facade clarity).
  3. Reduced ceremony for small tasks by establishing Fast-Path protocol ($\le 5$ lines, non-protected).
  4. Sửa lỗi duplicate `Date.now()` trong `scripts/audit-backend.mjs` và tài liệu hóa heuristic scanning.
  5. Nâng cấp Consistent Hashing lên 64-bit BigInt với `removeNode` và cảnh báo production.
- **Files Modified:**
  - `skills/be-audit/SKILL.md` (Updated to BE-1..36)
  - `skills/be-audit/references/audit-checklist.md` (Added BE-34, BE-35, BE-36)
  - `skills/be-persist/references/sharding-and-partitioning.md` (BE-36 controlled exceptions + 64-bit hash router)
  - `skills/be-ai/references/llm-gateway.md` (BE-31 unified architectural policy)
  - `skills/be/SKILL.md` (Fast-Path vs Full Protocol)
  - `references/conventions.md` (BE-36 update + Fast-Path rule in BW-P13)
  - `scripts/audit-backend.mjs` (Removed duplicate Date.now check)
  - `scripts/check-loosening.mjs` (Added heuristic documentation)
  - `CHANGELOG.md` (v1.1.1 release notes)
- **Verification:**
  - `node scripts/check-skills.mjs`: 13 skills passed, 0 errors, 0 warnings.
  - `node scripts/check-loosening.mjs`: 0 violations.
  - `node scripts/check-secrets.mjs`: 0 leaks.
  - `node scripts/audit-backend.mjs skills`: 0 violations.
- **Status:** Complete & verified.
