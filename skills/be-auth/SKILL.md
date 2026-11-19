---
name: be-auth
description: >
  Authentication, sessions, tokens, cookie security, and cryptographic verification.
  Use when: managing user authentication, issuing and verifying JWTs, implementing session cookie flags
  (HttpOnly, Secure, SameSite), preventing CSRF attacks, performing constant-time secret comparisons,
  and hashing credentials with Argon2id or bcrypt.
  DO NOT USE FOR: resource-level permissions and role checks (see be-authz), frontend session UI state (see fe-sec),
  or API contract definitions (see be-api).
---

# be-auth — Authentication & Session Management

Defines standards for authentication flows, session cookie security, token rotation, and cryptographic verification.

---

## 1. Core Reference Guides

- [session-and-tokens.md](./references/session-and-tokens.md) — Cookie security flags, token lifetimes, rotation, revocation, and CSRF protection (BE-17).
- [credentials-crypto.md](./references/credentials-crypto.md) — Constant-time comparisons, password hashing, and cryptographic primitives (BE-17).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-17** | Secrets compared in constant time; cookies with strict flags (HttpOnly, Secure, SameSite); origin checks for cookie auth; trusted hops declared. | Security test + Static audit |
| **BW-P6** | No secret is read, printed or committed; credentials come only from sanctioned loaders. | Secret scanner (`check-secrets.mjs`) |
