# Error Handling, Error Families & Protocol Mapping

## 1. When to read this
Read this when designing error response shapes, defining error codes, throwing exceptions in business logic, or writing global error handling filters.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should error codes be defined? | Closed enum with stable machine-readable codes (e.g. `USER_NOT_FOUND`). | Never use arbitrary human prose strings as error identities. |
| Who owns user-facing error text? | The frontend client (maps machine code to localized message). | Specific regulatory disclosures required by law in backend responses. |
| How to handle refusals in domain logic? | One throw per refusal with typed metadata; never swallow exceptions. | Operation is an optional best-effort optimization. |
| How to map internal errors to HTTP/gRPC? | Single central mapping filter; internal 500s redacted without stack traces. | Specific developer debug mode explicitly enabled in local development. |

---

## 3. Rules

### BE-20 Error codes are a closed enum with kind per code
Error codes must be defined as a closed enum where every code belongs to a standard error family (`NOT_FOUND`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`, `INVALID_ARGUMENT`, `RATE_LIMITED`, `INTERNAL`). Errors must never contain arbitrary prose as machine identifiers. One throw per refusal. Never swallow unexpected errors. Database errors, SQL queries, and internal stack traces must never leak to clients.
- **Why:** Ad-hoc error messages break client error handling logic. Leaking database queries or internal exception traces exposes database schema, table names, and server paths to attackers.
- **Enforced by:** Schema enum validation and integration error testing.

---

## 4. Standard Error Response Shape

```json
{
  "code": "INSUFFICIENT_FUNDS",
  "kind": "CONFLICT",
  "message": "The account does not have sufficient balance for this transaction.",
  "metadata": {
    "currentBalance": 1200,
    "requiredAmount": 5000
  }
}
```

---

## 5. Failure examples
- **Failure:** Returning raw database error to client: `{ "error": "QueryFailedError: relation 'users' does not exist" }`.
  - *Symptom:* Security scanner flags SQL information leakage; attackers discover internal database structure.
- **Failure:** Swallowing an error in a try/catch block: `try { ... } catch (e) { return null; }`.
  - *Symptom:* Silent failures cause corrupt system state; logs show zero errors while orders fail to process.

---

## 6. Checklist for review
- [ ] Error codes are members of a closed enum (no inline strings).
- [ ] No `console.log(err)` without propagating or recording to structured logger port.
- [ ] Global error filter redacts unhandled 500 errors to a generic `INTERNAL_SERVER_ERROR`.
- [ ] Every thrown exception includes relevant context in its metadata dictionary.

---

## 7. How to prove it
- **Unit Boundary:** Triggering an invalid operation asserts that the exact enum code and HTTP status are returned.
- **Penetration Check:** Malformed inputs or simulated database disconnections return generic sanitized 500 responses without stacks.
