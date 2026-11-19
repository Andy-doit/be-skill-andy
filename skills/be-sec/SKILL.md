---
name: be-sec
description: >
  Backend security hardening, input validation, abuse limits, SSRF protection, and privacy compliance.
  Use when: bounding external inputs and collection counts (BE-16), preventing Server-Side Request Forgery (SSRF),
  configuring CORS and security headers, auditing third-party dependencies, and handling user data retention (GDPR/PII).
  DO NOT USE FOR: authentication and password hashing (see be-auth), resource-level authorization (see be-authz),
  or frontend XSS sink auditing (see fe-sec in fe-skill-andy).
---

# be-sec — Security Hardening, Abuse Limits & Privacy

Defines standards for input boundary enforcement, network perimeter security, SSRF defense, and data privacy.

---

## 1. Core Reference Guides

- [abuse-limits.md](./references/abuse-limits.md) — Input size bounds, collection limits, rate-limit tiers, SSRF defense (BE-16).
- [distributed-rate-limiting.md](./references/distributed-rate-limiting.md) — Atomic sliding window counters, Redis Lua evaluation, fail-open/fail-close strategies (BE-35).
- [security-hardening.md](./references/security-hardening.md) — Security headers, CORS policy, trusted proxy hops, dependency audits (BE-17).
- [privacy-compliance.md](./references/privacy-compliance.md) — PII data handling, retention policies, encryption at rest and in transit (BE-21).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-16** | Bound everything external: input sizes, collection lengths, page sizes, rate tiers; cursor pagination is opaque; outbound fetches are SSRF-safe. | Schema validator + Security tests |
| **BE-17** | Secrets compared in constant time; cookies with strict flags; trusted proxy hops declared explicitly. | Security tests + Config check |
| **BE-35** | All distributed rate limiting counters and token allowances must evaluate atomically in a single script boundary; multi-step GET-then-SET sequences are forbidden. | Concurrency tests + Lua reviews |
| **BW-P6** | No secret is read, printed or committed. | Scanner (`check-secrets.mjs`) |
