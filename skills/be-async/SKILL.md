---
name: be-async
description: >
  Asynchronous messaging, transactional outbox, idempotency, background jobs, scheduling, and sagas.
  Use when: implementing transactional outbox patterns (BE-2), enforcing client mutation idempotency
  (BE-9), processing background queues with fenced execution (BE-10), configuring bounded retry ladders
  and dead letters (BE-11), scheduling singleton cron tasks (BE-13), or coordinating multi-step sagas (BE-12).
  DO NOT USE FOR: synchronous database transactions (see be-persist), API door contracts (see be-api),
  or outbound HTTP retry wrappers (see be-resilience).
---

# be-async — Asynchronous Processing, Outbox, Queues & Jobs

Defines standards for transactional messaging, mutation idempotency, queue processing, distributed scheduling, and sagas.

---

## 1. Core Reference Guides

- [idempotency.md](./references/idempotency.md) — Stable operation identities, committed receipt replay, inbox delivery claims (BE-8, BE-9).
- [outbox-and-events.md](./references/outbox-and-events.md) — Transactional outbox pattern, atomic database emission, at-least-once relay (BE-2, BE-7).
- [jobs-scheduling.md](./references/jobs-scheduling.md) — Fenced background jobs, declared retry ladders, dead letters, single-fire schedules (BE-10, BE-11, BE-13).
- [sagas.md](./references/sagas.md) — Multi-step distributed flows, compensating undo actions, parked failure alerts (BE-12, BR-5).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-2** | A change that must cause a job/event writes its outbox row in the same transaction. | Transaction integration test |
| **BE-8** | Every inbound delivery is at-least-once: claim it (inbox) in the receiver's transaction before the effect. | Duplicate delivery test |
| **BE-9** | Client mutations that must not double carry a stable operation identity and replay the committed outcome. | Concurrency idempotency test |
| **BE-10** | Jobs are fenced: claim by conditional update, guard every write by the fence, record a remote effect before performing it. | Fenced worker race test |
| **BE-11** | Retry is only a job's declared ladder; classify failures once; every wait is bounded; end state is a visible dead letter. | Dead letter queue test |
| **BE-12** | Sagas only with a declared undo per step; failures park visibly and alert the owner. | Saga compensation test |
| **BE-13** | Schedules fire once per deployment, not once per replica. | Clustered scheduler test |
