# API Design, Public Contracts & Transports

## 1. When to read this
Read this when designing new HTTP REST endpoints, GraphQL schemas, choosing pagination mechanisms, versioning APIs, or updating public contracts.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Which door protocol to choose? | Pick one default door per capability (e.g. REST or GraphQL); do not duplicate. | Dual-protocol required by legacy mobile clients. |
| How to paginate list results? | Opaque cursor-based pagination (`cursor`, `limit`). | Dataset is small (< 100 rows total) and static. |
| How to handle API changes? | Additive evolution (new fields/endpoints optional); 2-phase expand-contract for deprecation. | Full major versioning (`/v2/`) when paradigm shifts fundamentally. |
| Where does the public schema live? | Committed OpenAPI 3.1 YAML/JSON or GraphQL SDL in repository checked by CI. | Static internal RPC interfaces with no external consumers. |

---

## 3. Rules

### BE-27 Public contract is committed and checked in CI
The public contract (OpenAPI specification or GraphQL SDL) must be committed to the repository or verified during CI. Breaking schema changes (removing fields, changing types, adding required inputs) are caught by automated schema comparison tools and require explicit approval.
- **Why:** Unchecked API changes break web, mobile, and third-party partner applications without warning.
- **Enforced by:** Schema diff check in CI (`graphql-inspector` or `openapi-diff`).

### BE-7 Additive-only API evolution
New fields, parameters, and endpoints must be additive. Deprecated fields remain supported until telemetry proves zero client usage before removal.
- **Why:** Immediate deletion of fields causes immediate failure for out-of-date mobile apps that cannot be forcibly upgraded.
- **Enforced by:** Pull request contract checklist (`references/api-contract-change.md`).

---

## 4. Failure examples
- **Failure:** Changing response `{ id: "123", amount: 50 }` to `{ id: "123", pricing: { amount: 50 } }` in place.
  - *Symptom:* Existing mobile apps crash with `TypeError: Cannot read property amount of undefined`.
- **Failure:** Using deep SQL offset pagination `OFFSET 100000 LIMIT 20`.
  - *Symptom:* Database CPU spikes to 100% as Postgres scans and discards 100,000 index rows for every page.

---

## 5. Checklist for review
- [ ] List endpoints use opaque cursor pagination (`cursor: Buffer.from(id).toString('base64')`).
- [ ] No raw database IDs or sequential auto-increment keys exposed in public URLs.
- [ ] Response payloads do not wrap results in a custom error envelope that duplicates HTTP transport status.
- [ ] OpenAPI / GraphQL schema files updated and committed alongside code.

---

## 6. How to prove it
- **Contract Test Boundary:** Consumer contract tests or schema diff validation passes with zero breaking changes.
