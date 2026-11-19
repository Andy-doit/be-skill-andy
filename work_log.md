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
  1. Renaming to clean neutral names (`be`, `be-arch`, `be-api`, `be-persist`, etc., `be-audit`), moving StarCi specifics to `profiles/nestjs/`.
  2. Removal of plaintext credentials in `be-local-run`, moving local compose guide to `profiles/nestjs/local-run.md`.
  3. Decomposing the monolithic 1,081-line `be-conventions` into modular topic skills and `profiles/nestjs/`.
  4. Approving Batch 1 implementation (validation scripts, shared conventions, router `be`, and tool manifests).
