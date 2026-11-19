# Time, IDs & Determinism

## 1. When to read this
Read this when generating timestamps, IDs, random values, token expiration, scheduling dates, or testing time-sensitive business logic.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should current time be accessed in domain logic? | Injected `Clock` port interface. | Never use ambient `new Date()` or `Date.now()` in business logic. |
| How should dates be stored in the database? | UTC ISO-8601 timestamps (`TIMESTAMPTZ`) or plain dates (`YYYY-MM-DD`). | Storing local timezone offset if required for historical audit logs. |
| How are IDs generated? | Injected `IdGenerator` producing monotonic or cryptographically secure UUIDv7 / ULID. | Distributed database sequence generation required by legacy store. |

---

## 3. Rules

### BE-25 Time and IDs are injected
Domain services and entities must receive clock and ID generation capabilities via dependency injection. Ambient calls to `Date.now()`, `new Date()`, or `Math.random()` inside domain calculations are forbidden.
- **Why:** Ambient non-determinism makes unit tests flaky, makes edge-of-month / leap-second calculations un-testable, and prevents deterministic replaying of financial or audit events.
- **Enforced by:** Linter ban (`no-restricted-globals: Date`) in domain directories and unit tests.

---

## 4. Failure examples
- **Failure:** A subscription expiration calculation calls `new Date()` directly inside `isSubscriptionActive()`.
  - *Symptom:* Tests fail intermittently on CI at midnight or during Daylight Saving Time shifts.
- **Failure:** Storing local wall-clock string without timezone offset in database.
  - *Symptom:* Daylight Saving Time transition produces duplicate or missing billable hours.

---

## 5. Checklist for review
- [ ] Domain classes accept `clock: ClockPort` in constructor.
- [ ] Database columns use `TIMESTAMP WITH TIME ZONE` or UTC epoch integers.
- [ ] IDs generated with time-sortable algorithms (UUIDv7 or ULID) for index efficiency.

---

## 6. How to prove it
- **Unit Boundary:** Test simulates leap year, DST transitions, and expired subscriptions by advancing a mock clock deterministically without `setTimeout` sleeps.
