# Backend Engineering Conventions & Process Standards

> Authoritative process rules (BW-P1..P14) and review obligations (BR-1..7) for backend engineering agents.
> Every backend agent operation must comply with these laws.

---

## 1. Process Rules (How the Agent Works)

### BW-P1 Read before you write
Before proposing or applying any code changes, read the repository's own declarations first (`project-profile.md`, stack configuration, ports, backing services, and which gates are disabled and why), then read the relevant conventions/architecture documentation, then the folders touched by the task, and only then the code.
- **Why:** An agent that reads code first reconstructs the product's concepts and invariants from whichever random files it opened first, missing project-wide decisions.
- **Enforced by:** Review of the agent's plan and work log.

### BW-P2 Look the rule up; never quote it from memory
Translate the user's request into backend engineering concepts, look up the authoritative rule in the skill's reference files, open the file, and cite the stable rule ID (e.g. `BE-1`, `BE-3`, `BW-P5`) in the plan, the code review, and the commit/work log. Repeat after any context compaction.
- **Why:** Remembered rules drift over sessions and hallucinate non-existent exceptions.
- **Enforced by:** Review of rule citations in plans and PRs.

### BW-P3 A repo's own declaration beats generic rules, but contradictions are raised immediately
If a task requires something the repository's stack declaration forbids (or a gate declared off, a port, or an unapproved dependency), stop immediately and raise the contradiction to the user with both statements quoted. Never resolve a contradiction silently.
- **Why:** Silent overrides undo team decisions and introduce unapproved architecture drift.
- **Enforced by:** Review.

### BW-P4 Smallest mechanism that holds the invariant
For every design choice, name the architectural question that applied, the mechanism chosen, the simpler mechanism rejected and why, and the concrete behavior that proves it. "Not applicable" with a documented reason is valid.
- **Why:** Every mechanism adds state, failure modes, and maintenance burden. A mechanism taken for its resume value is pure liability; one missing is a latent race condition that no serial test catches.
- **Enforced by:** Feature design record review (`references/design-record.template.md`).

### BW-P5 No loosening
Never add or suggest inline linter suppressions (`eslint-disable`), TypeScript suppressions (`@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`), static analysis bypasses (`// NOSONAR`), skipped or focused tests (`it.skip`, `test.only`), short-circuit conditions (`|| true`), `--no-verify`, or widened allowlists to pass a gate. Change the code, not the gate.
- **Why:** A loosened gate silently stops providing the safety guarantees it was created to enforce.
- **Enforced by:** Automated check script (`scripts/check-loosening.mjs`) and CI lint checks.

### BW-P6 No secret is read, printed, or committed
Never open, read, or print `.env`, private keys, or credential files. Judge files strictly by name and pattern. Never echo tokens or secrets in logs, chat output, or commit messages. Take credentials only from the project's sanctioned loader or environment variables.
- **Why:** Agent contexts, session logs, and git histories are durable and easily leaked.
- **Enforced by:** Automated secret scanning (`scripts/check-secrets.mjs`) and pre-commit hooks.

### BW-P7 Safe git hygiene
Never run `git stash`, `git reset --hard`, `git checkout -- .`, `git clean -f`, force pushes (`git push --force`), or branch switches in a working tree containing uncommitted user changes. Each agent operates in its own worktree or isolated workspace.
- **Why:** Protects uncommitted work from silent and irreversible loss.
- **Enforced by:** Review.

### BW-P8 When a rule was missed, harden it
When a rule violation or regression occurs, record the miss (what, where, which rule ID), then convert it into an automated linter rule, test, gate, or sharper rule text, and re-run verification proving the miss is caught.
- **Why:** Without systemic hardening, the same regression will recur across future sessions.
- **Enforced by:** Entry in `work_log.md` and the newly committed check.

### BW-P9 Public or irreversible actions wait for the owner
Deploying to staging/production, publishing packages, pushing to main branches, posting messages outside the repository, dropping database tables/data, and rotating credentials must wait for explicit user confirmation.
- **Why:** Limits blast radius on critical infrastructure and production data.
- **Enforced by:** User approval barrier.

### BW-P10 Evidence matches the claim
A claim about concurrency, transactions, idempotency, or crash recovery must be proven at the boundary it names on the real backing store or broker. A unit mock or in-memory double proves control flow only. Static passes or running processes prove only what they measured.
- **Why:** A green unit test with an in-memory mock provides zero guarantee about database locks or broker deliveries.
- **Enforced by:** Review of the verification section.

### BW-P11 Say what you believe after checking
State findings grounded in real code, metrics, or settled decisions. Agree when the owner is right and explain why; disagree only with reproducible evidence. Always state the real trade-off and operational cost of any recommendation; never hedge with baseless alternatives.
- **Why:** The owner relies on accurate technical assessments to make architectural decisions.
- **Enforced by:** Review.

### BW-P12 Worker never judges itself
Verification of non-trivial architectural changes must run on a clean checkout, and for high-stakes work, by an independent review pass that did not write the change.
- **Why:** Self-grading inherently suffers from confirmation bias and misses blind spots.
- **Enforced by:** Multi-agent review protocol and CI pipelines.

### BW-P13 Plan first, small batches, log everything (Fast-Path vs Full Protocol)
Work in disciplined stages based on task risk tier:
- **Fast-Path Protocol:** Trivial changes ($\le 5$ lines in 1 file, pure cosmetic, typo, comment, non-breaking config) that do NOT touch Protected Zones (Money, Auth, Transactions, Migrations, Public API contracts) may execute and verify in one turn without proposal ceremony.
- **Full Protocol:** Any task $> 5$ lines, multi-file changes, migrations, or architectural modifications requires: Audit / Plan -> User Approval ("chốt") -> Implement in small batches (at most 3 modules or skills at a time) -> Verify with real output -> Update `work_log.md` and `CHANGELOG.md`.
- **Why:** Prevents large-scale divergent refactoring and ensures high-stakes architectural changes are traceable and explicitly confirmed, while avoiding bureaucratic ceremony for trivial cosmetic edits.
- **Enforced by:** Process.

### BW-P14 Neutral shared rules
Rules written into shared skills must be framework-neutral and business-neutral. App-specific domain logic, specific external SaaS integrations, or proprietary conventions belong in the project's own documentation or a stack profile.
- **Why:** Prevents unrelated backend projects from inheriting one specific application's design choices.
- **Enforced by:** Review.

---

## 2. Review Obligations (BR-1..7)

Reviewers and audit agents evaluate non-obvious architecture against these 7 obligations:

### BR-1 One accountable owner
Every capability, state, table, and contract has exactly one accountable owner; consumers read the owner's public contract, never copy its internal policy or read its private database tables directly.
- **Why:** Dual ownership leads to diverging business logic, split-brain database updates, and inability to safely evolve internal schemas.
- **Enforced by:** Architectural boundary audit and code review.

### BR-2 An abstraction carries a responsibility
An abstraction must carry a concrete architectural responsibility (contract translation, retry policy, lifecycle management, or coordination). Forwarding layers that merely pass arguments through without adding validation, policy, or mapping are removed; shared packages are cut when a second product genuinely needs them, not ahead of time.
- **Why:** Pointless pass-through classes add cognitive load, slow down refactoring, and obscure real runtime behavior without providing architectural isolation.
- **Enforced by:** Code review.

### BR-3 State names its authority and lifecycle
Every piece of state declares its source of truth, who writes, identity scope key, expiry, and recovery plan; caches and read models declare how they stay in step and what maximum lag a reader sees; scopes with different identity or lifetime (tenant, workspace, request) are never collapsed.
- **Why:** Undeclared state lifecycles cause cache stampedes, stale data corruption across tenants, and unbounded memory leaks.
- **Enforced by:** Design record review and data modeling inspection.

### BR-4 Authority holds at every entry point
Resource authorization checks live at the domain layer and are invoked from every entry point (HTTP, GraphQL, Webhook, Job worker, CLI). Caller-supplied role or scope claims are never trusted as permission.
- **Why:** Restricting authorization to HTTP middleware leaves asynchronous queue workers, scheduled tasks, and CLI administrative tools vulnerable to unauthorized privilege escalation.
- **Enforced by:** Domain service unit tests and security reviews.

### BR-5 Every effect has a failure and recovery contract
Every external mutation declares its atomicity, operation identity, timeout deadline, failure behavior, and retry ladder. An unknown remote outcome stays unknown until reconciled; a local acknowledgement is not proof of what the remote side did.
- **Why:** Network calls fail partially. Treating a network timeout as an outright failure leads to duplicate charges; treating it as a success leads to phantom state.
- **Enforced by:** Resilience tests and reconciliation jobs.

### BR-6 A runnable component exposes its lifecycle
Every runnable component exposes its startup sequence, dependency classes (required vs degraded vs optional), graceful shutdown triggers, and redacted failure evidence. Liveness, readiness, and functional checks are separate; configuration is validated before the first listener, migration, consumer, or outbound call starts.
- **Why:** Conflating lifecycle probes causes cascading restart loops during transient database blips, while starting listeners before validating configuration causes partial corrupted boot states.
- **Enforced by:** Health probe checks and lifecycle integration tests.

### BR-7 Evidence matches the claim
A claim about concurrency, crash recovery, authorization, or idempotency must be proven at the boundary it names on the real backing store or broker. A unit double proves control flow only; a static pass proves only what it measured. State in the report which boundary each claim was proved at (same as BW-P10).
- **Why:** False confidence from green unit tests with in-memory doubles allows concurrency deadlocks and race conditions to escape to production.
- **Enforced by:** Review of verification outputs.

---

## 3. Hyper-Scale & Distributed Systems Invariants (BE-34..36)

### BE-34 Read-After-Write Consistency
Immediately following a mutating operation, any subsequent read query within the same client session or causality chain that depends on the mutated state must route to the primary database or verify that the chosen read replica has replayed past the mutation's Log Sequence Number (LSN); routing reads blindly to asynchronous read replicas immediately after a write is forbidden.
- **Why:** Physical replication lag causes phantom 404s and stale reads immediately following mutations.
- **Enforced by:** Connection router integration tests and session write-pinning verification. (Owned by `be-persist`).

### BE-35 Atomic Distributed Rate Limiting
All distributed rate limiting counters, quotas, and token allowances shared across application nodes must be evaluated and mutated within a single atomic execution boundary (such as an atomic Redis Lua script). Multi-step GET-then-SET sequences across network hops are forbidden. Every rate-limiting door must explicitly declare its degradation mode (fail-open vs fail-close).
- **Why:** Non-atomic checks allow concurrent bursts to bypass quotas by $N\times$; in-memory node counters fail behind load balancers; ZSET logs cause $O(N)$ memory explosions under DDoS.
- **Enforced by:** Concurrency tests and Lua script review. (Owned by `be-sec`).

### BE-36 Shard Key Invariance & Scatter-Gather Fencing
Every entity stored in a sharded architecture must declare an immutable, high-cardinality Shard Key that deterministically partitions data across database instances. User-facing OLTP mutation paths must enforce Shard Key routing; cross-shard distributed transactions (Two-Phase Commit) are forbidden in the primary OLTP write path. Controlled Exceptions: Asynchronous offline sagas, administrative/reconciliation background jobs, or dual-write data migrations are permitted cross-shard access when wrapped with explicit latency budgets and failure compensations.
- **Why:** Scatter-gather queries suffer from $\max(T_1, \dots, T_N)$ latency and multi-node failure amplification; mutating shard keys requires distributed locks that degrade throughput.
- **Enforced by:** Repository query linting and schema constraint review. (Owned by `be-persist`).

---

## 4. Definition of Done (DoD)

A backend task is strictly **NOT done** until:
- [ ] Code follows the 4-tier dependency direction (`domain` <- `platform` <- `integrations`).
- [ ] Every mutation has an idempotency story or transaction boundary.
- [ ] Input schemas validate boundaries, collection lengths, and file types.
- [ ] No plaintext secrets or loosening markers left in code.
- [ ] Verification tests ran with real output reported.
- [ ] `work_log.md` updated with phase, changes, decisions, and proof.
- [ ] Reusable patterns recorded into relevant skill documentation.
