---
name: be-test
description: >
  Testing strategy, real-store integration tests, typed test doubles, and contract tests.
  Use when: structuring backend test pyramids, writing real-world integration tests against real databases
  and message brokers (BE-28), proving concurrency and race condition invariants (BE-6), implementing typed test doubles,
  and verifying API provider/consumer contracts (BE-29).
  DO NOT USE FOR: frontend UI component testing or Playwright browser E2E (see fe-test in fe-skill-andy),
  or load/soak testing infrastructure orchestration.
---

# be-test — Testing Strategy & Verification

Defines standards for backend testing tiers, proving claims at real boundaries, strict typed test doubles, and contract testing.

---

## 1. Core Reference Guides

- [test-pyramid.md](./references/test-pyramid.md) — Real-store integration tests, proving transaction/lock/race claims, evidence boundaries (BE-28, BW-P10, BR-7).
- [doubles-and-builders.md](./references/doubles-and-builders.md) — Strict typed doubles over loose mocks, test data builders over hand-written rows (BE-28).
- [contract-tests.md](./references/contract-tests.md) — Consumer/provider contract testing against committed schemas, async boundary testing (BE-29, BE-30).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-28** | Tests live by a single placement rule; unit tests use typed strict doubles; transaction/lock/fence/idempotency claims are proved with real-world integration tests; builders instead of hand-written rows. | Test suite execution |
| **BE-29** | Provider/consumer contracts are tested against the committed contract, not the other side's source. | Contract test in CI |
| **BE-30** | Asynchronous flows are tested across the boundary (delivery, redelivery, crash), not only per side. | Asynchronous integration test |
| **BW-P10** | Evidence matches the claim: claims are proved at the boundary they name on real stores/brokers; state the boundary in reports. | Verification report audit |
