---
name: be-persist
description: >
  Database persistence, schema migrations, transactions, concurrency, read replicas, sharding, and data modeling.
  Use when: writing database schema migrations, designing relational tables and indexes, managing database
  transactions, handling read replica lag (BE-34), database sharding (BE-36), preventing race conditions under concurrent writers, implementing optimistic concurrency,
  and enforcing table ownership boundaries.
  DO NOT USE FOR: API response formatting (see be-api), in-memory caching strategies (see be-resilience),
  or asynchronous event queue workers (see be-async).
---

# be-persist — Persistence, Migrations & Transactions

Defines standards for schema authority, migration safety, transactional boundaries, concurrency control, and relational modeling.

---

## 1. Core Reference Guides

- [migrations-schema.md](./references/migrations-schema.md) — Migrations as sole schema authority, zero-downtime expand-contract, backfills (BE-1, BE-7).
- [transactions.md](./references/transactions.md) — Transaction boundaries, forbidding external calls in transactions, conditional writes, race tests (BE-3, BE-6).
- [data-modeling.md](./references/data-modeling.md) — One owner per table, indexed foreign keys, soft delete policies, N+1 query avoidance (BE-4, BE-5, BR-3).
- [replica-lag.md](./references/replica-lag.md) — Read-after-write consistency, session write pinning, and LSN replication tracking (BE-34).
- [sharding-and-partitioning.md](./references/sharding-and-partitioning.md) — Declarative partitioning, consistent hashing, and shard key immutability (BE-36).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-1** | Migrations are the sole schema authority; applied by one dedicated step, never by serving processes, never raced. | Deploy pipeline check + review |
| **BE-3** | No transaction spans an external call (it either commits half or rolls back a success it cannot undo). | Lint / Code Review |
| **BE-4** | One owner per table; no reads or foreign keys across owners' tables; cross-context data comes through contracts or read models. | Architecture audit |
| **BE-5** | IDs and foreign keys follow one convention; every foreign key is indexed. | Schema lint / Migration check |
| **BE-6** | Invariants under concurrent writers are held by a constraint or conditional statement in the store, and proved by a real-store race test. | Real-store integration test |
| **BE-34** | Reads following a mutation must route to Primary or verify replica LSN replay; blind asynchronous replica reads are forbidden. | Integration test + connection router |
| **BE-36** | Sharded entities require immutable high-cardinality shard keys; cross-shard distributed transactions in OLTP are forbidden. | Repository lint + schema check |
