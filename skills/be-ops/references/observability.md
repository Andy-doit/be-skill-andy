# Logging, Tracing, Metrics & Observability

## 1. When to read this
Read this when adding log statements, configuring structured loggers (Pino, Winston), setting up OpenTelemetry tracing, or sanitizing sensitive logs.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should logs be output? | JSON-structured logs emitted to `stdout` through a single logger port (BE-21). | Local human-readable pretty-print formatting enabled only in dev mode. |
| Can `console.log` be used in application code? | **NO.** All logs must pass through the structured logger port. | One-off CLI setup scripts running outside the server application. |
| How to trace requests across asynchronous hops? | Correlation ID (`x-correlation-id`) propagated via AsyncLocalStorage context (BE-21). | Distributed trace headers (W3C `traceparent`) propagated across microservices. |
| Can passwords, tokens, or PII appear in logs? | **NEVER.** Redact sensitive keys (`password`, `token`, `secret`, `ssn`, `cardNumber`) automatically. | Never; logging secrets is a severe security violation. |

---

## 3. Rules

### BE-21 Structured logging port with correlation IDs and redaction
All logging must pass through a single logger port using structured JSON format with enum event identities (`event: 'ORDER_PLACED'`) and cause exceptions preserved. A correlation ID must be generated at ingress and propagated explicitly across asynchronous boundaries, database queries, and outbound calls. Passwords, authorization tokens, credit cards, and personal identifiable information (PII) must be scrubbed automatically by log formatters.
- **Why:** Plain string logs cannot be indexed, queried, or aggregated by log management systems (Datadog, Elasticsearch, Loki). Lack of correlation IDs makes debugging concurrent requests in production impossible. Logging secrets exposes sensitive credentials in log storage.
- **Enforced by:** Linter ban on `console.log` and log sanitizer automated tests.

---

## 4. Failure examples
- **Failure:** `console.log("User logged in with password:", req.body.password)`.
  - *Symptom:* Plaintext passwords stored in cloud log archives, readable by any employee with log access.
- **Failure:** Emitting unstructured text `logger.info("payment failed for user " + id)`.
  - *Symptom:* Cannot alert or filter by structured `code: 'PAYMENT_FAILED'` in dashboard.

---

## 5. Checklist for review
- [ ] Logger port implemented with JSON serialization.
- [ ] Correlation ID attached to every log record.
- [ ] Redaction filter configured for sensitive field names.
- [ ] Uncaught exceptions log full error object with stack trace and correlation context.

---

## 6. How to prove it
- **Log Sanitizer Test:** Log an object containing `{ password: 'my-secret', token: 'jwt-123' }`; assert that logged JSON outputs `{ password: '[REDACTED]', token: '[REDACTED]' }`.
