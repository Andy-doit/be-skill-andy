# Phase 2: Design Decisions & Implementation Plan

**Repository:** `be-skill-andy`  
**Date:** 2026-11-19  
**Status:** PROPOSED PLAN (Awaiting User Item-by-Item Approval)  

---

## 1. Target Skill Architecture & Directory Tree

We adopt the modular, multi-tool architecture proven by `fe-skill-andy`, organized into a central router (`be`), 10 domain topic skills, 1 audit skill (`be-audit`), a stack profile system (`profiles/`), and shared engineering conventions.

```text
be-skill-andy/
├── .agents/
│   └── skills.json                     # Codex registration
├── .antigravity-plugin/
│   ├── plugin.json                     # Antigravity plugin manifest
│   └── rules/
│       └── AGENTS.md                   # Antigravity agent instructions
├── .claude-plugin/
│   └── plugin.json                     # Claude Code plugin manifest
├── profiles/                           # Swappable Framework Profiles
│   ├── nestjs/                         # Default: NestJS + TypeORM + BullMQ + Redis + PostgreSQL
│   │   ├── README.md                   # Stack overview & conventions
│   │   ├── di-and-modules.md           # ConfigurableModuleBuilder, dynamic modules, providers
│   │   ├── orm-typeorm.md              # EntityManager, transactions, migrations, entities
│   │   ├── transports.md               # GraphQL (Apollo) & REST controllers/interceptors
│   │   └── async-bullmq-nats.md        # BullMQ job workers, NATS events, CDC projections
│   └── template/
│       └── profile-template.md         # Template for authoring a profile for any stack
├── references/                         # Shared Cross-Cutting References
│   ├── conventions.md                  # Core process rules (BW-P1..P14), review obligations (BR-1..7)
│   ├── project-profile.template.md     # Per-project declaration file to copy to target repos
│   ├── design-record.template.md       # ADR / feature design record template (BW-P4)
│   ├── api-contract-change.md          # Additive vs breaking changes checklist
│   └── incident-loop.md                # Rule-missed hardening loop (BW-P8)
├── scripts/                            # Zero-Dependency Node-only Verification Scripts
│   ├── check-skills.mjs                # Validates name==folder, desc<=1024, use when/not, links, no /cmd
│   ├── check-loosening.mjs             # Scans code for banned loosening markers (BW-P5)
│   ├── check-secrets.mjs               # Scans for committed credentials/keys (BW-P6, BE-19)
│   └── install-skills.ps1              # Multi-tool Windows junction installer (Claude, Codex, Antigravity)
├── skills/                             # The Skills
│   ├── be/                             # CENTRAL ROUTER HUB
│   │   └── SKILL.md                    # Classifies request, enforces per-project context, dispatches
│   ├── be-arch/                        # ARCHITECTURE & CODE QUALITY
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── layering.md             # Tiers, dependency direction, composition root, cycles
│   │       ├── folder-structure.md     # Flat trigger-based operation layout (HTTP/job/webhook/CLI)
│   │       ├── determinism.md          # Injected clock, ID generator, UTC storage
│   │       └── code-quality.md         # Typed boundaries, function budgets, naming
│   ├── be-api/                         # APIS, CONTRACTS & TRANSPORTS
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── api-design.md           # OpenAPI/GraphQL committed contract, stable IDs, versioning
│   │       ├── error-handling.md       # Closed error code enum, kinds, no leaked SQL/stacks
│   │       ├── webhooks.md             # Inbound webhooks, signature first, raw body, durable intake
│   │       └── realtime.md             # Topics from auth principal, resumable streams, heartbeat
│   ├── be-auth/                        # AUTHENTICATION & SESSIONS
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── session-and-tokens.md   # Cookie flags, token rotation/revocation, CSRF/origin
│   │       └── credentials-crypto.md   # Constant-time comparison, password hashing (Argon2/bcrypt)
│   ├── be-authz/                       # AUTHORIZATION & MULTI-TENANCY
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── default-deny.md         # Default-deny doors, public declarations
│   │       ├── resource-authz.md       # Domain-service resource checks, never caller scope
│   │       └── multi-tenancy.md        # Tenant isolation, schema/row separation, DB RLS
│   ├── be-persist/                     # PERSISTENCE & TRANSACTIONS
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── migrations-schema.md    # Migrations sole authority (BE-1), expand-contract, backfills
│   │       ├── transactions.md         # No external calls in tx (BE-3), store constraints (BE-6)
│   │       └── data-modeling.md        # 1 owner/table (BE-4), indexed FKs (BE-5), soft deletes
│   ├── be-async/                       # ASYNC, QUEUES & JOBS
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── idempotency.md          # Operation identity (BE-9), inbox delivery claims (BE-8)
│   │       ├── outbox-and-events.md    # Transactional outbox (BE-2), at-least-once relay
│   │       ├── jobs-scheduling.md      # Fenced jobs (BE-10), declared retry ladders (BE-11), 1 fire (BE-13)
│   │       └── sagas.md                # Multi-step sagas, declared undo per step, parked failures (BE-12)
│   ├── be-resilience/                  # OUTBOUND, CACHING & STORAGE
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── outbound-resilience.md  # Required timeouts, circuit breaking, 1 owner/provider (BE-23)
│   │       ├── caching.md              # 1 owner/key, TTL, del-on-write, stampede control
│   │       └── storage-files.md        # Object storage via backend, signed URLs, upload limits
│   ├── be-ops/                         # CONFIG, OBSERVABILITY & RUNTIME
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── config-secrets.md       # 1 validated env reader at boot, no default secrets (BE-19)
│   │       ├── observability.md        # Logger port, enum event IDs, correlation ID (BE-21)
│   │       ├── lifecycle.md            # Separate liveness/readiness/functional, graceful exit (BE-22)
│   │       └── delivery-operations.md  # Pinned Docker images, zero-downtime deploy, rollback
│   ├── be-sec/                         # SECURITY HARDENING & ABUSE LIMITS
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── abuse-limits.md         # Input sizes, collection limits, opaque cursor pagination (BE-16)
│   │       ├── security-hardening.md   # Security headers, CORS, trusted proxy hops, SSRF safety
│   │       └── privacy-compliance.md   # PII handling, retention, encryption at rest/transit
│   ├── be-test/                        # TESTING STRATEGY & VERIFICATION
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── test-pyramid.md         # Real-store integration tests for tx/lock/race claims (BE-28)
│   │       ├── doubles-and-builders.md # Typed strict doubles, row builders > hand rows
│   │       └── contract-tests.md       # Consumer/provider contract testing against schema (BE-29)
│   ├── be-ai/                          # AI & LLM INTEGRATION (Conditional)
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── llm-gateway.md          # 1 gateway, code chains vs agent loops, caller authority (BE-31–33)
│   └── be-audit/                       # READ-ONLY AUDIT MODE
│       ├── SKILL.md                    # Audits code against BE-* and BR-* rules, outputs findings table
│       └── references/
│           └── audit-checklist.md      # Matrix of checks citing rule IDs
├── CHANGELOG.md
├── README.md
└── work_log.md
```

---

## 2. Ownership Matrix: Topic, Rule IDs & Exact Owner Skill

Every concern in Appendix A and every rule in Appendix B is assigned to **exactly one owner skill**:

| Appendix A Topic | Appendix B Rules Embedded | Owner Skill | Owning Reference File |
|---|---|---|---|
| **Architecture & Layering** | BW-P4, BE-23, BE-24, BR-2 | `be-arch` | `skills/be-arch/references/layering.md` |
| **Folder / Feature Shape** | BE-24, BR-1 | `be-arch` | `skills/be-arch/references/folder-structure.md` |
| **Time, IDs & Determinism** | BE-25 | `be-arch` | `skills/be-arch/references/determinism.md` |
| **Code Quality & Typing** | BE-26, BR-2 | `be-arch` | `skills/be-arch/references/code-quality.md` |
| **Documentation & ADRs** | BW-P1, BW-P2, BW-P4 | `be-arch` | `skills/be-arch/references/documentation.md` |
| **API Design & Contracts** | BE-7, BE-27, BR-1 | `be-api` | `skills/be-api/references/api-design.md` |
| **Error Handling** | BE-20 | `be-api` | `skills/be-api/references/error-handling.md` |
| **Webhooks (Inbound)** | BE-18, BE-8 | `be-api` | `skills/be-api/references/webhooks.md` |
| **Realtime Streams** | BR-3, BR-4 | `be-api` | `skills/be-api/references/realtime.md` |
| **Authentication & Sessions**| BE-17 | `be-auth` | `skills/be-auth/references/session-and-tokens.md` |
| **Credentials & Crypto** | BE-17, BW-P6 | `be-auth` | `skills/be-auth/references/credentials-crypto.md` |
| **Authorization (Doors)** | BE-14, BR-4 | `be-authz` | `skills/be-authz/references/default-deny.md` |
| **Resource Authorization** | BE-15, BR-4 | `be-authz` | `skills/be-authz/references/resource-authz.md` |
| **Multi-Tenancy & Isolation**| BE-15, BR-3 | `be-authz` | `skills/be-authz/references/multi-tenancy.md` |
| **Migrations & Schema Authority**| BE-1, BE-7 | `be-persist` | `skills/be-persist/references/migrations-schema.md` |
| **Transactions & Concurrency** | BE-3, BE-6 | `be-persist` | `skills/be-persist/references/transactions.md` |
| **Table Ownership & Models** | BE-4, BE-5, BR-3 | `be-persist` | `skills/be-persist/references/data-modeling.md` |
| **Idempotency & Inbox** | BE-8, BE-9 | `be-async` | `skills/be-async/references/idempotency.md` |
| **Outbox & Events** | BE-2, BE-7 | `be-async` | `skills/be-async/references/outbox-and-events.md` |
| **Jobs & Scheduling** | BE-10, BE-11, BE-13 | `be-async` | `skills/be-async/references/jobs-scheduling.md` |
| **Sagas & Long Flows** | BE-12, BR-5 | `be-async` | `skills/be-async/references/sagas.md` |
| **Outbound Integrations** | BE-23, BR-5 | `be-resilience` | `skills/be-resilience/references/outbound-resilience.md` |
| **Caching** | BR-3 | `be-resilience` | `skills/be-resilience/references/caching.md` |
| **Search, Files & Storage** | BE-16, BR-4 | `be-resilience` | `skills/be-resilience/references/storage-files.md` |
| **Configuration & Secrets** | BE-19, BW-P6 | `be-ops` | `skills/be-ops/references/config-secrets.md` |
| **Logging, Tracing & Audit** | BE-21, BW-P6 | `be-ops` | `skills/be-ops/references/observability.md` |
| **Health & Lifecycle** | BE-22, BR-6 | `be-ops` | `skills/be-ops/references/lifecycle.md` |
| **Delivery & Deployment** | BE-1, BR-6 | `be-ops` | `skills/be-ops/references/delivery-operations.md` |
| **Performance & Capacity** | BE-16 | `be-ops` | `skills/be-ops/references/performance-capacity.md` |
| **Input Validation & Limits**| BE-16 | `be-sec` | `skills/be-sec/references/abuse-limits.md` |
| **Security Hardening** | BE-17, BE-19 | `be-sec` | `skills/be-sec/references/security-hardening.md` |
| **Data Privacy & Compliance**| BE-21 | `be-sec` | `skills/be-sec/references/privacy-compliance.md` |
| **Testing Strategy** | BE-28, BW-P10, BR-7 | `be-test` | `skills/be-test/references/test-pyramid.md` |
| **Doubles & Row Builders** | BE-28 | `be-test` | `skills/be-test/references/doubles-and-builders.md` |
| **Contract Testing** | BE-29, BE-30 | `be-test` | `skills/be-test/references/contract-tests.md` |
| **AI / LLM Integration** | BE-31, BE-32, BE-33 | `be-ai` | `skills/be-ai/references/llm-gateway.md` |
| **Code Review & Audits** | BR-1..7, BE-1..33 | `be-audit` | `skills/be-audit/references/audit-checklist.md` |

### FE / BE Boundary Ownership

| Concern | Frontend (`fe-skill-andy`) Responsibility | Backend (`be-skill-andy`) Responsibility |
|---|---|---|
| **API Contract** | Consumes typed clients (`fe-data`); triggers codegen; reports schema mismatches. | **Owns schema authority** (`be-api`); generates & commits OpenAPI/GraphQL schemas; enforces additive-only evolution (BE-7, BE-27). |
| **Authentication** | Stores session cookies/tokens (`fe-sec`); manages token refresh triggers; client route guards for UX. | **Enforces authentication** (`be-auth`); issues/revokes tokens; constant-time secret check; sets HttpOnly/Secure/SameSite cookies (BE-17). |
| **Authorization** | Hides/disables UI affordances per user role (`fe-sec`, `fe-ux`). Never treated as security. | **Enforces authorization** (`be-authz`); default-deny at every door (BE-14); domain-level resource check on every call (BE-15). |
| **Errors** | Maps machine error codes to localized copy, toast messages, and error boundaries (`fe-ux`, `fe-skel`). | **Produces error codes** (`be-api`); closed enum with machine code and kind; never leaks SQL/stacks; client owns copy (BE-20). |
| **Realtime** | Socket connection lifecycle, auto-reconnect backoff, presence indicator (`fe-data`). | **Owns realtime hub** (`be-api`); authenticates stream; derives topics from principal; resumable event stream with sequential IDs. |
| **i18n & Dates** | Renders localized messages, formats numbers, currency, and local timezone displays (`fe-i18n`). | **Stores UTC & plain dates** (`be-arch`); deterministic clock arithmetic; serves entity translation keys or raw data. |

---

## 3. Detailed Skeleton for Topic References

Every reference document in `skills/*/references/*.md` strictly follows this **6-part skeleton**:

1. **When to read this:** Clear, actionable triggers indicating when an engineer or agent should open this file.
2. **Decision table:**
   ```text
   | Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
   ```
3. **Rules:**
   - Stable ID (e.g. `## BE-1 Migrations are the sole schema authority`)
   - Law in one sentence
   - Full body text
   - `Why:` Clear rationale explaining the hazard prevented.
   - `Enforced by:` Specific machine check, test tier, or "review only".
4. **Failure examples:** Concrete code snippet or scenario showing what goes wrong and the real symptom.
5. **Checklist for review:** Quick bullet list for reviewers or `be-audit` to inspect.
6. **How to prove it:** Exact test boundary (unit with typed doubles, integration on real database/broker, or e2e).

---

## 4. Framework Profile Mechanism

To keep the core skills 100% stack-neutral while providing concrete implementation guidance:
- **Core Skills (`skills/*`)**: Neutral concepts (e.g. "transaction boundary", "fenced job", "opaque cursor", "domain service authorization").
- **Profiles (`profiles/<stack>/`)**:
  - `profiles/nestjs/`: Translates neutral rules into NestJS 10+ idioms:
    - Module layout: `ConfigurableModuleBuilder`, `.module-definition.ts`.
    - Data Access: TypeORM `EntityManager`, migration scripts, transaction management.
    - Transports: Apollo GraphQL resolvers, REST controllers, custom interceptors.
    - Async: BullMQ processor classes, NATS JetStream event handlers.
    - Config: `@nestjs/config` or schema-validated env loaders.
  - `profiles/template/profile-template.md`: A fill-in guide for any other framework (Express, Fastify, Spring Boot, Go Chi, etc.).

---

## 5. Per-Project Context Step (BW-P1 & BW-P3)

Before writing any code or proposing a plan, the agent executing `be` MUST perform the **Per-Project Context Step**:
1. Look for `project-profile.md` or repo declaration docs at the root of the target repository:
   - Framework & version, ORM/DB driver, message broker, caching store.
   - Declared ports, environment variables, backing services.
   - Disabled gates or known exceptions (and why they are off).
2. If `project-profile.md` is missing, inspect `package.json` / dependency file, docker-compose, and `.env.example`.
3. If the user's task requires a mechanism that contradicts the repo's declared architecture, **stop and raise the contradiction immediately** citing BW-P3.

---

## 6. Router Test Cases (27 Scenarios)

The router skill `be` will be tested against 27 diverse prompts across 3 categories:

### A. Clear Triggers (15 prompts)
1. *"Thiết kế bảng orders và các migration để hỗ trợ expand-contract khi đổi tên cột"* -> **`be-persist`**
2. *"Viết endpoint POST /webhooks/stripe kiểm tra signature trước khi parse body"* -> **`be-api`**
3. *"Thêm cơ chế idempotency key cho API thanh toán bằng Redis"* -> **`be-async`**
4. *"Cấu hình rate limiting và giới hạn kích thước file upload"* -> **`be-sec`**
5. *"Chạy job đồng bộ dữ liệu người dùng định kỳ hàng ngày bằng cron"* -> **`be-async`**
6. *"Kiểm tra quyền truy cập tài liệu ở tầng domain service cho user và tenant"* -> **`be-authz`**
7. *"Tạo session cookie bảo mật với cờ HttpOnly, Secure, SameSite"* -> **`be-auth`**
8. *"Tách lỗi thành closed enum với mã lỗi chuẩn và không leak stack trace"* -> **`be-api`**
9. *"Viết integration test kiểm tra race condition khi 2 request cùng mua voucher"* -> **`be-test`**
10. *"Tạo service port để bọc HTTP client ra ngoài kèm timeout bắt buộc"* -> **`be-resilience`**
11. *"Setup graceful shutdown và health check riêng biệt liveness / readiness"* -> **`be-ops`**
12. *"Review toàn bộ module billing hiện có xem có vi phạm quy tắc backend không"* -> **`be-audit`**
13. *"Tạo module mới trong NestJS theo chuẩn monorepo của dự án"* -> **`be`** (routes to `be-arch` + `profiles/nestjs`)
14. *"Xây dựng luồng saga có compensation rollback khi bước thanh toán thất bại"* -> **`be-async`**
15. *"Lưu trữ ngày giờ và xử lý múi giờ với clock injection"* -> **`be-arch`**

### B. Ambiguous Prompts (6 prompts)
16. *"Làm sao để tối ưu hệ thống chạy nhanh hơn?"* -> **`be` router disambiguates**: asks whether bottleneck is slow database queries (`be-persist`), cache stampede (`be-resilience`), queue backlog (`be-async`), or connection pools (`be-ops`).
17. *"API trả về lỗi 500 khi mạng chập chờn"* -> **`be-resilience`** (if outbound integration failure) or **`be-api`** (if unhandled exception mapping).
18. *"Thêm tính năng đăng nhập bằng Google"* -> **`be-auth`** (for OAuth token exchange and session cookie) + **`be-api`** (for endpoint contract).
19. *"Dữ liệu đơn hàng thỉnh thoảng bị trùng"* -> **`be-persist`** (unique constraints) or **`be-async`** (idempotency key / outbox duplicate delivery).
20. *"Refactor lại một service quá dài"* -> **`be-arch`** (layering and single responsibility) + **`be-test`** (lock in behavior before refactor).
21. *"Bảo vệ API khỏi bị spam"* -> **`be-sec`** (rate limiting / input bounds) or **`be-authz`** (authentication & permission gate).

### C. "Should NOT Trigger" Prompts (6 prompts)
22. *"Nút bấm Submit bị lệch 4px trên màn hình mobile"* -> **NOT `be`** -> Route to `fe-layout` in `fe-skill-andy`.
23. *"Thêm skeleton loading khi đợi API trả về"* -> **NOT `be`** -> Route to `fe-skel` in `fe-skill-andy`.
24. *"Viết terraform script để tạo VPC và EKS cluster trên AWS"* -> **NOT `be`** -> Out of backend scope (DevOps / Infra).
25. *"Thêm hook useQuery để fetch danh sách sản phẩm và debounce ô search"* -> **NOT `be`** -> Route to `fe-data` in `fe-skill-andy`.
26. *"Chỉnh lại màu sắc biểu đồ doanh thu theo chuẩn WCAG AA"* -> **NOT `be`** -> Route to `fe-contrast` / `fe-viz` in `fe-skill-andy`.
27. *"Tối ưu bundle size của ứng dụng Next.js"* -> **NOT `be`** -> Route to `fe-perf` in `fe-skill-andy`.

### Manual Test Procedure per Tool
- **Claude Code:**
  Run `claude` in terminal, enter the prompt directly (e.g. `Thiết kế bảng orders...`). Verify in output that Claude activates the expected skill by name (e.g. `Using skill: be-persist`).
- **Codex:**
  In Codex chat, enter prompt. Verify Codex matches the trigger keywords in `.agents/skills.json` and loads the correct skill.
- **Antigravity:**
  In Antigravity IDE, enter prompt. Check the internal dispatcher / skill activation tag in thinking trace to verify it invokes `be` and resolves to the target skill.

---

## 7. Plan for Batch Implementation (Phase 3)

We will implement in **small batches (maximum 3 skill folders per batch)**, running verification scripts after each batch:

- **Batch 1 (Core Foundations & Router):**
  - Scripts: `scripts/check-skills.mjs`, `scripts/check-loosening.mjs`, `scripts/check-secrets.mjs`.
  - Shared conventions: `references/conventions.md`, `references/project-profile.template.md`, `references/design-record.template.md`.
  - Central Router: `skills/be/SKILL.md`.
  - Tool manifests: `.claude-plugin/plugin.json`, `.agents/skills.json`, `.antigravity-plugin/plugin.json`, `.antigravity-plugin/rules/AGENTS.md`.

- **Batch 2 (Architecture & Persistence):**
  - `skills/be-arch/`: Layering, folder structure, determinism, code quality.
  - `skills/be-persist/`: Migrations (BE-1), transactions (BE-3), constraints (BE-6), table ownership (BE-4).
  - Stack profile: `profiles/nestjs/` (re-anchoring StarCi Code Cannon rules into clean modular docs) + `profiles/template/`.

- **Batch 3 (APIs, Authentication & Authorization):**
  - `skills/be-api/`: API design, error handling (BE-20), webhooks (BE-18), realtime.
  - `skills/be-auth/`: Session cookies, tokens, credentials, crypto (BE-17).
  - `skills/be-authz/`: Default-deny (BE-14), domain resource authorization (BE-15), multi-tenancy.

- **Batch 4 (Async Operations, Resilience & Operations):**
  - `skills/be-async/`: Idempotency (BE-9), outbox & events (BE-2), jobs & scheduling (BE-10–13), sagas.
  - `skills/be-resilience/`: Outbound calls (BE-23), caching, storage & files.
  - `skills/be-ops/`: Config & secrets (BE-19), observability (BE-21), lifecycle (BE-22), delivery.

- **Batch 5 (Security, Testing, AI & Audit):**
  - `skills/be-sec/`: Abuse limits (BE-16), security hardening, privacy.
  - `skills/be-test/`: Test pyramid, integration tests (BE-28), doubles & builders, contract tests (BE-29).
  - `skills/be-ai/`: LLM gateway & authority (BE-31–33).
  - `skills/be-audit/`: Read-only audit skill with rules matrix.

---

## 8. Questions for User Approval

Before editing any file, please decide on the following 4 items:

1. **Retaining `starci-be-cannon-*` names vs clean unified naming:**
   - *Option A (Recommended):* Rename to clean neutral names: central router `be`, domain skills `be-arch`, `be-api`, `be-persist`, etc., and audit skill `be-audit`. The StarCi-specific patterns are preserved in `profiles/nestjs/`.
   - *Option B:* Keep legacy names `starci-be-cannon-apply` and `starci-be-cannon-audit` alongside new skills.
   - *Real Cost of B:* Violates portability and neutrality; causes confusion with duplicate entry points.

2. **Removal of committed plaintext credentials in `be-local-run`:**
   - *Recommendation:* Remove all hardcoded passwords (`Cuong123_A`, `123456`, etc.) and replace with environment variable references and `.env.example` placeholders, moving local compose instructions into `profiles/nestjs/local-run.md`.
   - *Real Cost:* The developer must copy `.env.example` to `.env` once when running locally.

3. **Handling of Existing Monolithic `be-conventions` (1,081 lines):**
   - *Recommendation:* Dissect and distribute its sections into the corresponding modular topic skills (`be-arch`, `be-api`, `be-persist`) and `profiles/nestjs/`, then deprecate the monolithic file.
   - *Real Cost:* Requires updating any user bookmarks to point to specific topic skills or `profiles/nestjs/`.

4. **Approval to proceed with Batch 1 implementation upon your approval:**
   - *Recommendation:* Approve starting Batch 1 (scripts, core references, router `be`, tool manifests).
