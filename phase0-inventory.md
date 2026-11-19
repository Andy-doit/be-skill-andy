# Phase 0: Inventory of `be-skill-andy` (Real State)

**Date:** 2026-11-19  
**Status:** Read-only survey complete  
**Repository Location:** `D:\work\AI\be-skill-andy`  

---

## 1. Skill Folder Tree & Frontmatter Analysis

The current repository contains **5 skill folders** under `skills/`, a single `cannon/CODE-CANNON.md` file, and a minimal `.claude-plugin/plugin.json`.

| Skill Folder | `name` in FM | Name Match | `description` Length | Limit $\le 1024$ | Has "use when" | Has "do NOT use for" | Line Count (`SKILL.md`) | References / Scripts |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `be-conventions` | `be-conventions` | YES | 500 chars | YES | NO (uses "Use this skill whenever...") | NO | 1,081 lines | None (all monolithic) |
| `be-local-run` | `be-local-run` | YES | 486 chars | YES | NO (uses "Use this skill whenever...") | NO | 89 lines | None |
| `be-new-module` | `be-new-module` | YES | 519 chars | YES | YES ("Use whenever...") | NO | 118 lines | None |
| `starci-be-cannon-apply` | `starci-be-cannon-apply` | YES | 648 chars | YES | NO (uses "Trigger khi...") | NO | 44 lines | None |
| `starci-be-cannon-audit` | `starci-be-cannon-audit` | YES | 627 chars | YES | NO (uses "Dùng cho... Trigger khi...") | NO | 42 lines | None |

### Additional Non-Skill Files
- `cannon/CODE-CANNON.md`: 763 lines (51,177 bytes). Monolithic code cannon with 53 rules across 7 domains.
- `README.md`: 95 lines. Mentions Claude Code plugin install and list of skills.
- `.claude-plugin/plugin.json`: Minimal metadata for Claude Code plugin (`name: "starci-be-skills"`).
- `LICENSE`: MIT License.

---

## 2. Hygiene, Portability & Code Quality Findings

### 2.1 Broken Relative Links
- **Result:** 0 broken markdown links found. All markdown links resolve within the repo.

### 2.2 Absolute Paths
- **Occurrences:** 5 occurrences in `cannon/CODE-CANNON.md` (lines 123, 138, 148, 161, 200) citing paths like `/users/user-xp/graphql-types/response.ts:77-88` (missing leading `src/modules` and rooted with a leading slash).

### 2.3 Non-Portable `/slash-command` Syntax
- **Occurrences:** 31 instances found.
  - `README.md`: `/starci-be-cannon-apply`, `/starci-be-cannon-audit`, `/plugin`, `/merge`
  - `starci-be-cannon-apply/SKILL.md`: `/starci-be-cannon-apply`, `/starci-be-cannon-audit`, `/merge`
  - `starci-be-cannon-audit/SKILL.md`: `/starci-be-cannon-audit`, `/starci-be-cannon-apply`, `/merge`
- **Issue:** Skills must refer to each other **by name** (e.g. `be-cannon-apply`), never by `/slash-command`, which breaks Codex and Antigravity.

### 2.4 Scripts
- **Result:** Currently **0 scripts** exist in `be-skill-andy` (no install script, no verification script, no validation script).

### 2.5 Duplicated Content Between Skills
- **`be-conventions/SKILL.md` vs `cannon/CODE-CANNON.md`**:
  - Module folder structure and NestJS dynamic module registration (`.module-definition.ts`) are duplicated almost verbatim.
  - TypeORM `InjectEntityManager` vs `InjectRepository` guidance is duplicated.
  - Type-safety (branded primitives, discriminated unions, `{Action}Params/{Action}Result`, `export const` arrow) is duplicated.
  - Cache and environment variable rules are duplicated.
- **`be-new-module/SKILL.md` vs `be-conventions/SKILL.md` §1b**:
  - The module scaffolding templates (`.module-definition.ts`, `.module.ts`, parent aggregator) are duplicated in both files.

---

## 3. Appendix A Coverage in Existing Skills

| # | Topic | Covered Where in Existing Repo | Quality | Evaluation / Gap |
|---|---|---|:---:|---|
| 1 | Architecture & Layering | `cannon/CODE-CANNON.md` §3.7 ("Controller → thin Service → CQRS Command"), §1.5–1.6; `skills/be-conventions/SKILL.md` §1 | Thin | NestJS-specific; no neutral domain/platform/integration tiers, no durable handover rule, no cycle rules. |
| 2 | Folder / Feature Shape | `skills/be-conventions/SKILL.md` §1, §6; `skills/be-new-module/SKILL.md` §2 | Thin | Bound to NestJS module structure (`types/`, `enums/`, `classes/`), not organized by flat trigger kind (HTTP, webhook, job, CLI). |
| 3 | API Design & Transport | `cannon/CODE-CANNON.md` §2 (GraphQL), §3 (REST); `skills/be-conventions/SKILL.md` §1b | Thin | App-specific wrappers (`AbstractGraphQLResponse`, `AbstractRestResponse`, `httpConfig()`). Lacks neutral OpenAPI contract rules, versioning, deprecation policy. |
| 4 | Authentication & Session | `cannon/CODE-CANNON.md` §3.6 (Auth guard template method) | None | No constant-time secret comparison, cookie flags (HttpOnly, Secure, SameSite), CSRF/origin checks, token lifetime/rotation/revocation, password hashing, MFA. |
| 5 | Authorization | `cannon/CODE-CANNON.md` §3.6 | None | No default-deny declaration, resource authorization in domain service missing, multi-tenant isolation missing, row security missing. |
| 6 | Input Validation & Abuse Limits | `cannon/CODE-CANNON.md` §2.4 (throttling), §2.5 (pagination base), §3.4 (class-validator) | Thin | Mentions class-validator and throttler, but lacks bounded collection counts, file upload limits, SSRF protection, opaque cursor pagination invariant. |
| 7 | Errors | `cannon/CODE-CANNON.md` §6.4, §7.4; `skills/be-conventions/SKILL.md` §9 ("Strict: never throw new Error in app code") | Ok | Good error codes/metadata for StarCi, but lacks closed error families with a code enum + kind per code, one throw per refusal, client owns user text. |
| 8 | Persistence & Migrations | `cannon/CODE-CANNON.md` §4 (TypeORM Data Access); `skills/be-conventions/SKILL.md` §7; `skills/be-local-run/SKILL.md` §1 | Contradictory | Covers `EntityManager` and table entities, but lacks migration authority rules, expand-contract rules, backfill as fenced jobs. Worse: `be-local-run` specifies `synchronize=true` in dev (violates BE-1). |
| 9 | Transactions & Concurrency | `cannon/CODE-CANNON.md` §4.2 ("Multi-step writes go inside entityManager.transaction(...)") | Thin | Lacks rule against transactions spanning external calls, concurrency constraints/conditions in store, optimistic concurrency, race tests on real store. |
| 10 | Idempotency | `cannon/CODE-CANNON.md` §7.7 (NATS digest-stamped deduplication) | Shallow | No client mutation idempotency (stable operation identity, outcome replay), inbox claim pattern missing. |
| 11 | Outbox, Events & Queues | `cannon/CODE-CANNON.md` §5.2 (BullMQ bridge), §5.3 (single payload), §7.6 (event configMap) | Shallow | Outbox pattern in same transaction missing (BE-2), at-least-once relay with deterministic job IDs missing, dead letter handling missing. |
| 12 | Jobs & Scheduling | `cannon/CODE-CANNON.md` §5.2; `skills/be-conventions/SKILL.md` §9 ("Plain setInterval + random jitter") | Contradictory | Recommending `setInterval` directly contradicts BE-13 (schedules fire once per deployment, not once per replica). Fenced jobs, retry ladders, dead letter visible missing. |
| 13 | Sagas / Long Flows | None | None | Not covered anywhere. |
| 14 | Webhooks (Incoming) | None | None | Not covered anywhere. |
| 15 | Realtime | `cannon/CODE-CANNON.md` §5.4–5.8 (Kafka/NATS/CDC listeners) | Shallow | Covers backend broker listeners, but no client realtime (WebSockets, SSE, topics from auth principal, resumable streams). |
| 16 | Outbound Integrations & Resilience | `skills/be-conventions/SKILL.md` §6 ("Service with subdirs per concern (e.g. CEX integrations)") | Shallow | No required timeout on outbound calls, no circuit breaking policy, no declared retry ladder, no provider isolation. |
| 17 | Configuration & Secrets | `cannon/CODE-CANNON.md` §7.5; `skills/be-conventions/SKILL.md` §8–9; `skills/be-local-run/SKILL.md` §1 | Contradictory / High Risk | While conventions advise `parseEnv*`, `be-local-run` commits plain-text dev passwords into the skill (`Cuong123_A`, `elastic/123456`, `starci@2026`). Direct violation of BW-P6 / BE-19! |
| 18 | Logging, Tracing, Metrics, Audit | None | None | Not covered anywhere. |
| 19 | Health & Lifecycle | `cannon/CODE-CANNON.md` §5.6 (Kafka non-fatal `onModuleInit`), §5.7 | Shallow | Missing separate liveness vs readiness vs functional check, graceful shutdown, startup dependency classes. |
| 20 | Time, IDs & Determinism | `cannon/CODE-CANNON.md` §4.3 (UUID-PK tables extend `UuidAbstractEntity`) | Thin | Missing injected clock/id generator, UTC storage, no `Date.now()` / random in domain code. |
| 21 | Caching | `cannon/CODE-CANNON.md` §7.1–7.3, §7.8 | Ok (StarCi stack) | Covers StarCi `CacheService`, SuperJSON, del-on-write. Lacks neutral stampede control, cache ownership, invalidation strategy. |
| 22 | Search, Files & Storage | `skills/be-local-run/SKILL.md` (mentions MinIO, Elasticsearch, Qdrant) | None | No architectural rules (signed URLs, backend access control, file lifecycle, upload scanning). |
| 23 | AI / LLM Integration | None | None | Not covered in `be-skill-andy` (only in `starci-harness/contexts/code/be/ai.md`). |
| 24 | Testing | `skills/be-conventions/SKILL.md` §10 ("Unit tests — Always use Test.createTestingModule") | Thin | Only NestJS unit tests with Jest. Missing test pyramid, real integration tests on real DB/broker, builders over hand-written rows, strict doubles, contract tests. |
| 25 | Performance & Capacity | `cannon/CODE-CANNON.md` §2.4–2.5 (throttling, pagination) | Thin | Missing query plans, connection pool sizing, backpressure, queue concurrency, profiling workflow. |
| 26 | Security Hardening & Supply Chain | `cannon/CODE-CANNON.md` §3.6 | Shallow | Missing dependency audit, least-privilege DB/cloud roles, security headers, CORS, trusted proxy hops, secret scanning. |
| 27 | Delivery & Operations | `skills/be-local-run/SKILL.md` (local Docker infra) | Thin | Local Docker only. Missing Dockerfile/image pinning, CI gates, migration step in deploy pipeline, zero-downtime rollout, rollback, backup/restore. |
| 28 | Documentation | `skills/be-conventions/SKILL.md` §5 ("Comment / JSDoc patterns") | Thin | Only covers JSDoc. Missing API docs generated from contract, design records (ADRs), repo conventions doc. |
| 29 | Data Privacy & Compliance | None | None | Not covered anywhere. |
| 30 | Code Quality | `cannon/CODE-CANNON.md` §6; `skills/be-conventions/SKILL.md` §2–5, §11–12 | Ok (StarCi style) | Detailed for StarCi naming, arrow functions, param/result shapes, JSDoc. Missing function budgets, typed boundaries preventing leaked DB rows in API, no service-locator rule. |

---

## 4. Current Tool Installation State

| Tool | Expected Path | Current Installation Status | Verification Detail |
|---|---|:---:|---|
| **Claude Code** | `%USERPROFILE%\.claude\skills` | Needs confirmation | Only `.claude-plugin/plugin.json` exists in repo. No active junction/symlink verified in `.claude/skills`. |
| **Codex** | `%USERPROFILE%\.agents\skills` | Needs confirmation | No `.agents/skills.json` or `.agents/skills` entries present in `be-skill-andy`. |
| **Antigravity** | `%USERPROFILE%\.gemini\config\plugins` or `skills` | Needs confirmation | No `.antigravity-plugin/` directory or plugin registration exists in `be-skill-andy`. (Sandbox restricts inspecting user profile root without explicit command). |

---

## 5. Framework & Tech Stack Assumptions

The existing `be-skill-andy` assumes a single, rigid tech stack:
- **Framework:** NestJS (v10+), tightly relying on `@Module()`, `ConfigurableModuleBuilder`, `@InjectEntityManager()`, `@Query()`, `@Mutation()`.
- **ORM / Persistence:** TypeORM with PostgreSQL, UUID primary keys, and raw `EntityManager`.
- **API Transports:** GraphQL (Apollo Federation) with custom `AbstractGraphQLResponse` and REST with `AbstractRestResponse`.
- **Async & Infrastructure:** BullMQ for jobs, NATS JetStream for event bus, Kafka KRaft for Debezium CDC projections.
- **Cache:** Redis with SuperJSON serialization via custom `CacheService`.
- **App Specifics:** Directly targets `starci-academy-backend` monorepo (`apps/core`, `src/modules/...`), including hardcoded local credentials and ports.

---

## 6. Boundary Comparison with `fe-skill-andy`

`fe-skill-andy` (`D:\work\AI\fe-skill-andy`) has 21 skills routed via `fe-andy`. The frontend/backend ownership boundary must align as follows:

| Concern | `fe-skill-andy` (Frontend) Ownership | `be-skill-andy` (Backend) Target Ownership |
|---|---|---|
| **API Contract** | `fe-data`: Consumes typed clients (generated from OpenAPI/GraphQL schema), handles SWR/TanStack caching, query keys, request cancellation, optimistic UI. | Backend owns the committed contract schema (OpenAPI / GraphQL schema), stable IDs, named types, additive-only evolution, deprecation policy. |
| **Authentication** | `fe-sec`: Manages session tokens/cookies in browser, refresh timing, route guards (*purely UX affordance*). | Backend owns token issuance/revocation, constant-time secret comparison, HttpOnly/Secure/SameSite cookie flags, CSRF/origin checks, password hashing. |
| **Authorization** | `fe-sec` / `fe-ux`: Conditional UI rendering based on roles. Never trusted. | Backend owns default-deny at every door, resource-level authorization in domain service for every entry point (HTTP, job, service). |
| **Errors** | `fe-ux` / `fe-skel` / `fe-data`: Maps machine error codes to localized copy, retry toasts, loading/error boundary states. | Backend owns closed error code enums, error kinds, sanitized protocol mapping (never leaking SQL or stack traces), stable machine codes. |
| **Realtime** | `fe-data`: WebSocket/SSE client connection lifecycle, reconnect backoff, presence state. | Backend owns auth-derived topics, resumable event streams with IDs, heartbeat, broker fanout. |
| **i18n & Dates** | `fe-i18n`: Locale dictionaries, formatting currency/numbers/relative time, client timezone display. | Backend stores UTC/plain dates, deterministically calculates wall-clock dates with injected clocks, provides raw data or translation keys. |
