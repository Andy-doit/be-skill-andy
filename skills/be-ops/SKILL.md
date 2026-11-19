---
name: be-ops
description: >
  Configuration, secrets, logging, observability, health lifecycle, and delivery operations.
  Use when: parsing and validating environment variables at boot (BE-19), ensuring no secrets or PII are logged,
  configuring structured logging ports and correlation IDs (BE-21), separating liveness from readiness probes (BE-22),
  implementing graceful shutdown, and sizing connection pools.
  DO NOT USE FOR: application database migrations (see be-persist), API error shapes (see be-api),
  or unit/integration test suites (see be-test).
---

# be-ops — Configuration, Observability & Runtime Lifecycle

Defines standards for configuration safety, secret custody, structured observability, lifecycle probes, and operational delivery.

---

## 1. Core Reference Guides

- [config-secrets.md](./references/config-secrets.md) — Single env reader, schema validation at boot, no default secrets, sealed custody (BE-19, BW-P6).
- [observability.md](./references/observability.md) — Logger as a port, enum event IDs, correlation IDs, PII redaction (BE-21).
- [lifecycle.md](./references/lifecycle.md) — Separate liveness, readiness, and functional checks, graceful shutdown (BE-22, BR-6).
- [delivery-operations.md](./references/delivery-operations.md) — Image pinning, zero-downtime deployment, migration order, runbooks.
- [performance-capacity.md](./references/performance-capacity.md) — Connection pool sizing, query plan reviews, queue concurrency, and backpressure.

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-19** | No default secrets or default addresses in config; config parsed and validated per capability at boot; missing key fails boot by name. | Boot validation check |
| **BE-21** | Logging goes through one logger port with enum event identities and cause preserved; correlation identity carried explicitly across async boundaries; no secrets/PII in logs. | Log sanitizer test |
| **BE-22** | Liveness, readiness, and functional checks are separate. | Health probe test |
| **BR-6** | A runnable component exposes its lifecycle: startup, shutdown, dependency classes, and configuration validated before listeners start. | Lifecycle test |
