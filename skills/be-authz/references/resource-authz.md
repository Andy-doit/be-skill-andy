# Resource-Level Authorization in Domain Services

## 1. When to read this
Read this when controlling access to specific records (e.g. "Can User X edit Document Y?"), designing role or permission models, or securing service boundaries.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where does resource permission verification live? | In the domain service handling the operation. | Pre-filter database queries with caller's tenant ID for defense in depth. |
| Can the client supply the `userId` or `role` to authorize against? | **NEVER.** Identity is taken strictly from the verified authentication context. | Admin impersonation with strict cryptographic audit trail. |
| Can route guards be the sole authorization mechanism? | **NO.** Guards check protocol roles; domain service checks specific resource ownership. | Static global routes with no entity-specific state. |

---

## 3. Rules

### BE-15 Resource authorization lives in domain services
Resource authorization checks (verifying that the authenticated principal has permission to act on the specific target entity) must reside inside the domain service and execute on every operation path. Caller-supplied roles or scopes are never trusted.
- **Why:** Placing authorization checks solely in HTTP controllers or GraphQL guards leaves background jobs, internal service-to-service calls, and CLI commands completely unprotected against unauthorized actions (Insecure Direct Object Reference - IDOR).
- **Enforced by:** Domain unit tests proving refusal when attempting unauthorized resource mutations.

---

## 4. Failure examples
- **Failure:** Controller checks `if (user.role === 'USER')` and passes `req.body.documentId` to `deleteDocument(id)`.
  - *Symptom:* Attacker changes `documentId` to another user's document ID and deletes it (classic IDOR vulnerability).
- **Failure:** Background queue worker blindly executes `deleteDocument(payload.id)` without checking whether the task was authorized by the resource owner.
  - *Symptom:* Attacker injects unauthorized job into Redis queue, wiping data.

---

## 5. Checklist for review
- [ ] Domain service queries resource, verifies `resource.ownerId === principal.id` or `hasPermission(principal, resource, Action.DELETE)`.
- [ ] Throws structured `ForbiddenException('FORBIDDEN', ...)` on unauthorized attempts.
- [ ] Domain service takes verified `PrincipalContext` parameter, never loose strings.

---

## 6. How to prove it
- **Service Test Boundary:** Test invokes domain service with valid entity ID but non-owner `PrincipalContext`; asserts immediate refusal with `FORBIDDEN` error.
