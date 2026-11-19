# NestJS + TypeORM + BullMQ Stack Profile

This profile translates the neutral backend engineering rules into idiomatic NestJS (v10+) patterns.

---

## 1. Stack Components
- **Framework:** NestJS 10+ (TypeScript)
- **Data Access:** TypeORM 0.3+ with PostgreSQL 16
- **Transports:** GraphQL (Apollo Federation) & REST (Express/Fastify)
- **Background Jobs:** BullMQ with Redis 7
- **Event Bus:** NATS JetStream
- **Validation:** `class-validator` & `class-transformer`

---

## 2. Topic References
- [di-and-modules.md](./di-and-modules.md) — Module hierarchy, `ConfigurableModuleBuilder`, provider injection.
- [orm-typeorm.md](./orm-typeorm.md) — Safe TypeORM data access, migrations, transactions without external calls.
- [transports.md](./transports.md) — Clean REST controllers, GraphQL resolvers, interceptors, and DTOs.
- [async-bullmq-nats.md](./async-bullmq-nats.md) — Reliable background queue processing and event publishing.
- [local-run.md](./local-run.md) — Running infrastructure locally via Docker compose with safe credential management.
