# LLM Gateways, Chains, Retrieval & Tool Authority

## 1. When to read this
Read this when integrating AI models (Gemini, Claude, OpenAI), implementing Retrieval-Augmented Generation (RAG), orchestrating tool/function calls, or managing AI API budgets.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where are LLM API keys and rate quotas managed? | In a single backend LLM gateway service (BE-31); clients never receive model keys. | Multi-tenant BYOK (Bring Your Own Key) stored in vault. |
| When to use static code chains vs autonomous agent loops? | **Chains with fixed shapes are standard code;** agent loops are restricted to bounded tasks with explicit permission walls (BE-32). | Open-ended research or exploration explicitly supervised by user. |
| How to authorize RAG context retrieval? | Filter embeddings and document chunks strictly within caller's authenticated `tenant_id` and permission scope (BE-33). | Public knowledge base documents accessible to all users. |
| How are LLM tool / function calls authorized? | Routed through the exact same domain authorization checks as human API requests (BE-33). | Read-only idempotent calculations (e.g. calculator tool). |

---

## 3. Rules

### BE-31 Unified model gateway policy
All LLM and AI model invocations must route through a unified architectural gateway facade (whether an in-process platform module or a dedicated standalone proxy service) responsible for secret custody, rate quotas, budget tracking, fallbacks, and usage telemetry. Direct un-metered calls to third-party model providers from feature domains or frontend clients are forbidden.
- **Why:** Embedding AI keys in client applications results in immediate key theft and uncontrolled billings. Scattered API calls bypass corporate cost caps and privacy governance. Architectural encapsulation allows swapping model providers without touching business code.
- **Enforced by:** Architecture audit and network egress inspection.

### BE-32 Fixed-shape chains are code; agent loops require authority boundaries
Sequential pipelines with predictable inputs and outputs must be implemented as deterministic code chains, not dynamic LLM decision loops. Autonomous agent loops run only where explicit capability boundaries, loop iteration limits, and human audit logs are enforced. LLM outputs must be parsed and bounded by strict schema validators.
- **Why:** Giving LLMs unconstrained loop authority results in runaway token consumption, infinite loops, and hallucinations triggering unintended mutations.
- **Enforced by:** Schema bounds checks and code review.

### BE-33 Retrieved context and tool calls respect caller authority
Vector search and document retrieval must be scoped to the caller's authorized permissions. An LLM tool call has no ambient superuser privilege; every tool execution must be authenticated, authorized against target resources, and attributed to the triggering user in audit trails.
- **Why:** An attacker can craft prompts (indirect prompt injection) that trick the LLM into retrieving other users' confidential documents or invoking administrative deletion tools.
- **Enforced by:** RAG authorization integration tests and tool execution permission tests.

---

## 4. Failure examples
- **Failure:** RAG search queries vector database with raw user query `SELECT * FROM embeddings ORDER BY cosine(e, q)` without tenant filter.
  - *Symptom:* Attacker asks: "What are the secret salary figures for executive team in Tenant B?" and the LLM returns confidential chunks.
- **Failure:** Exposing a tool `deleteUserAccount(userId)` to an agent loop without checking caller authority.
  - *Symptom:* Prompt injection tricks agent into calling `deleteUserAccount('admin-id')`.

---

## 5. Checklist for review
- [ ] No client holds raw Gemini / OpenAI / Anthropic API keys.
- [ ] LLM JSON output parsed with strict Zod/schema parser with bounded lengths.
- [ ] Vector database queries enforce `tenant_id = :tenantId` filter.
- [ ] Tool calls invoke standard domain services carrying authenticated `PrincipalContext`.

---

## 6. How to prove it
- **RAG Authority Test:** Perform semantic search for Tenant B's confidential document using Tenant A's session context; assert zero records returned.
- **Tool Injection Test:** Inject adversarial prompt instructing model to invoke tool on unauthorized entity; assert that domain service rejects execution with `FORBIDDEN`.
