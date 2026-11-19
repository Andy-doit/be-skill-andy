# Configuration & Secrets Management

## 1. When to read this
Read this when adding environment variables, reading configuration, setting up secret management, or configuring service bootstrap.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where are environment variables read and validated? | In a single dedicated config module that parses and validates schema at boot (BE-19). | Never read `process.env` ad-hoc across scattered service files. |
| Can secrets or database passwords have default fallback values? | **NEVER.** Production secrets must fail boot if missing. | Strictly non-sensitive local development defaults (e.g. `PORT=3000`). |
| How to handle missing environment variables? | Process crashes immediately at boot naming the missing key. | Variable is explicitly declared optional with a safe default. |

---

## 3. Rules

### BE-19 Validated configuration at boot; no default secrets
All environment variables and configuration parameters must be parsed and schema-validated by a single central configuration reader before the first database migration, message listener, or HTTP server starts. Missing required keys must crash the boot process immediately naming the exact missing variable. Default secrets (e.g. `secret = 'secret123'`) or default database passwords in code are strictly forbidden.
- **Why:** Scattered `process.env` reads cause applications to boot successfully and then crash hours later during peak traffic when a specific unconfigured code path executes. Default secrets left in code are immediately exploited in production.
- **Enforced by:** Startup schema validation (Zod, Joi, class-validator) and automated secret scan (`scripts/check-secrets.mjs`).

---

## 4. Validated Configuration Pattern (Zod Example)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
});

export const config = (() => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ FATAL: Configuration validation failed at boot:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
})();
```

---

## 5. Checklist for review
- [ ] No `process.env.*` reads outside the central configuration module.
- [ ] Configuration schema validates types, URLs, ports, and string lengths.
- [ ] No real secrets or `.env` files committed to repository.
- [ ] Boot crashes immediately if a required secret is missing.

---

## 6. How to prove it
- **Boot Validation Test:** Unset `JWT_SECRET`; launch application bootstrap; assert process exits with code 1 and error names `JWT_SECRET`.
