---
name: be-api
description: >
  API design, contracts, error handling, webhooks, and realtime transports.
  Use when: authoring REST or GraphQL endpoints, managing OpenAPI / GraphQL committed schemas, designing
  versioning and deprecation policies, implementing closed-enum error architectures, verifying inbound
  webhook signatures, and building resumable realtime streams (SSE / WebSockets).
  DO NOT USE FOR: client-side data fetching hooks (see fe-data), database transactions (see be-persist),
  or authentication credential hashing (see be-auth).
---

# be-api — APIs, Contracts & Transports

Defines standards for API design, schema contracts, error handling, webhooks, and realtime transports.

---

## 1. Core Reference Guides

- [api-design.md](./references/api-design.md) — Public contracts (OpenAPI/GraphQL), versioning, pagination, stable IDs (BE-7, BE-27).
- [error-handling.md](./references/error-handling.md) — Closed error code enums, error kinds, sanitized protocol mapping, client copy ownership (BE-20).
- [webhooks.md](./references/webhooks.md) — Inbound webhooks, immediate signature validation, raw body, durable ingestion (BE-18, BE-8).
- [realtime.md](./references/realtime.md) — Realtime streams, auth-derived topics, resumable sequence IDs, heartbeat buffers (BR-3, BR-4).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-7** | Event and API contracts only add; remove only after all consumers have migrated (expand, then contract). | API diff review + CI check |
| **BE-18** | A webhook's signature check is the first statement of its door. | Unit test on webhook door |
| **BE-20** | Error codes are a closed enum with a kind per code; no prose in errors; one throw per refusal; never swallow; never leak internals to clients. | Schema validation + test |
| **BE-27** | Public contract (OpenAPI / GraphQL schema) is committed, generated or checked in CI, and breaking changes need explicit approval. | Schema diff gate in CI |
