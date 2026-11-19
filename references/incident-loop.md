# Incident & Rule-Missed Hardening Loop (BW-P8)

> Rule BW-P8: When a rule was missed or a defect escaped, harden it. Record the miss (what, where, which rule ID), then convert it into an automated lint rule, test, gate, or sharper rule text, and re-run verification proving the rule is now found. Feedback becomes a check, not a reminder.

---

## 1. The Hardening Workflow

Whenever an error, bug, security vulnerability, or rule deviation is caught during review, staging, or production:

```text
[Defect Detected]
       │
       ▼
1. Identify Root Rule
   (Which BE-* or BR-* rule was violated or missing?)
       │
       ▼
2. Write Failing Regression Check
   (Add a unit/integration test, ESLint rule, or script check that FAILS on the current code)
       │
       ▼
3. Fix the Code / Invariant
   (Change the implementation to satisfy the invariant — DO NOT LOOSEN THE GATE)
       │
       ▼
4. Verify Check Passes
   (Run the test/script to confirm the fix passes cleanly)
       │
       ▼
5. Record in Work Log
   (Document root cause, rule cited, and permanent automated barrier created)
```

---

## 2. Incident Record Format (Append to `work_log.md`)

```markdown
### Incident Hardening Record: <Incident Title>
- **Date:** YYYY-MM-DD
- **Incident Summary:** What happened and what symptom was observed.
- **Rule Violated:** e.g. `BE-3` (Transaction spanned external Stripe call, causing DB pool exhaustion).
- **Escape Analysis:** Why existing tests or reviews did not catch it.
- **Automated Check Created:** Added AST linter / integration timeout test in `test/lint/no-external-in-transaction.spec.ts`.
- **Proof Output:** Ran test suite before and after fix.
```
