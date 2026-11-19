# Framework Profile Template: <Framework Name>

> Copy and customize this template under `profiles/<framework-name>/` to define framework-specific translations of the neutral backend engineering rules.

---

## 1. Overview & Stack Identity
- **Framework:** `<e.g. Express / Fastify / Spring Boot / Go Chi / ASP.NET Core>`
- **Language / Version:** `<e.g. TypeScript 5.4, Go 1.22>`
- **ORM / Persistence:** `<e.g. Prisma / Drizzle / Hibernate / GORM>`
- **Key References:** `<Link to official documentation>`

---

## 2. Dependency Injection & Module Organization (BE-23, BE-24)
- How modules or service containers are wired in this stack:
  - Composition root location: `<e.g. src/app.ts or src/bootstrap.ts>`
  - Singleton vs scoped service lifecycle declarations:
  - Preventing circular dependencies:

---

## 3. Data Access & Transactions (BE-1, BE-3, BE-6)
- How database transactions are created and managed:
  - Code pattern for wrapping atomic writes:
  - Rule enforcement: ensure no HTTP client or queue call is passed inside transaction lambdas.
  - How schema migrations are executed:

---

## 4. API Doors & Error Mapping (BE-14, BE-20, BE-27)
- Controller / Route handler conventions:
- Middleware for authentication and default-deny:
- Error filter / interceptor mapping closed error enums to HTTP status codes:

---

## 5. Asynchronous Jobs & Outbox (BE-2, BE-10, BE-13)
- Background job worker pattern:
- Transactional outbox polling / CDC pattern:
- Distributed scheduling (ensuring jobs run once per deployment):
