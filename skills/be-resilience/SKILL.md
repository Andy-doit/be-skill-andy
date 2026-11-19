---
name: be-resilience
description: >
  Outbound integrations, timeouts, resilience, caching strategies, and object storage.
  Use when: making outbound HTTP/gRPC calls to third-party providers (Stripe, Twilio, OpenAI, partner APIs),
  enforcing required timeouts and circuit breaking (BE-23), designing cache-aside layers with Redis,
  preventing cache stampedes, and generating secure signed URLs for file uploads and object storage.
  DO NOT USE FOR: inbound HTTP API design (see be-api), database query tuning and transactions (see be-persist),
  or container lifecycle probes (see be-ops).
---

# be-resilience — Outbound Resilience, Caching & Storage

Defines standards for third-party outbound integrations, network resilience, caching consistency, and object storage.

---

## 1. Core Reference Guides

- [outbound-resilience.md](./references/outbound-resilience.md) — Required timeouts, single owner per provider, circuit breaking, bounded retries (BE-23, BR-5).
- [caching.md](./references/caching.md) — Cache-aside patterns, single owner per key, del-on-write, stampede control (BR-3).
- [storage-files.md](./references/storage-files.md) — Object storage access control, signed upload/download URLs, file limits (BE-16, BR-4).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-23** | Dependencies point one way; one owner per raw library/provider; every outbound call has a required timeout. | Linter / Timeout test |
| **BR-3** | State names its authority and lifecycle: caches never become a second source of truth; del-on-write is correctness path. | Cache invalidation test |
| **BR-5** | Every effect has a failure and recovery contract; an unknown remote outcome stays unknown until reconciled. | Resilience integration test |
