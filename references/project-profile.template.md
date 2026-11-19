# Project Profile (Backend Architecture Declaration)

> Copy this template to the root of your backend repository as `project-profile.md`.
> Agents read this file FIRST before reading any code (Rule BW-P1).

---

## 1. Stack & Runtime
- **Language / Runtime:** Node.js 20+ (or Python 3.12, Go 1.22, etc.)
- **Primary Framework:** NestJS 10 / Express / Fastify / Spring Boot
- **API Doors:** GraphQL (Apollo Federation), REST (OpenAPI 3.1), gRPC, Webhooks
- **Primary Database:** PostgreSQL 16
- **ORM / Query Builder:** TypeORM 0.3 / Prisma / Drizzle / Kysely
- **Cache & Key-Value:** Redis 7
- **Message Broker & Event Bus:** NATS JetStream / Kafka / RabbitMQ
- **Job Queue:** BullMQ / Temporal / Celery
- **Object Storage:** S3 / MinIO

---

## 2. Network & Ports
| Service | Internal Port | Host Port | Role / Notes |
|---|---|---|---|
| HTTP API Server | 3000 | 3000 | Serving GraphQL & REST endpoints |
| PostgreSQL | 5432 | 5433 | Primary relational store |
| Redis | 6379 | 6380 | Cache, sessions, queue backend |
| NATS | 4222 | 4222 | Asynchronous event bus |

---

## 3. Protected Zones & Non-Negotiable Boundaries
- **Billing & Ledger:** Any modification to calculation, currency decimals, or transaction history requires explicit human approval.
- **Auth & Tokens:** Token verification and password hashing algorithms are sealed.
- **Migration Authority:** No table alteration outside versioned migrations applied via migration pipeline.

---

## 4. Gates & Exceptions (Why Off)
| Gate | Status | Why Disabled / Exception Reason | Ticket / Expiry |
|---|---|---|---|
| Strict NULL checks in legacy module X | OFF | Legacy module undergoing staged migration | TECH-104 (Q1) |
| E2E test suite in local pre-commit | OFF | Slow startup of Kafka container; runs in CI | CI-202 |
