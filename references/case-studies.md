# Backend Engineering Case Studies & Production Playbooks

> Real-world architectural playbooks demonstrating how `be-skill-andy` rules are applied to solve high-stakes backend challenges.

---

## Case Study 1: High-Volume Flash Sale & Checkout (Concurrency, Idempotency & Zero Oversell)

### 1. The Challenge
- **Traffic:** 10,000 concurrent requests hitting `POST /api/v1/orders/checkout` at 12:00:00 to buy 50 limited-edition items.
- **Hazards to Prevent:**
  - Overselling inventory past 50 units (race condition).
  - Double-charging customers when mobile networks retry dropped connections.
  - Database connection pool exhaustion caused by external payment gateway latency.
  - Dual-write inconsistency if payment succeeds but local database write fails.

### 2. Architectural Blueprint & Applied Rules
- **Rule BE-9 (Mutation Idempotency):** Client provides `Idempotency-Key: <uuid>`. Request leases the key in Redis with a 30s TTL. If key is currently being processed, return `409 Conflict`. If already completed, replay the cached receipt.
- **Rule BE-6 (Atomic Store Constraints):** Never do `if (item.stock > 0) item.stock--` in memory. Execute atomic SQL with threshold check:
  ```sql
  UPDATE inventory 
  SET stock = stock - :quantity, version = version + 1
  WHERE item_id = :itemId AND stock >= :quantity;
  ```
  If affected rows is `0`, refuse immediately with `INSUFFICIENT_STOCK` (BE-20).
- **Rule BE-3 (No Transaction Across External Calls):** The database transaction decrements inventory and persists the pending order. It commits **BEFORE** calling Stripe:
  ```text
  [Ingress Door] (Check Idempotency Key)
        │
        ▼
  [Step 1: DB Tx] (Atomic Inventory Decrement + Order PENDING)
        │
        ▼ (Commit DB Tx)
  [Step 2: External HTTP] (Call Stripe Charge with 5s timeout - BE-23)
        │
        ├──▶ Success: [Step 3: DB Tx] (Order PAID + Outbox row ORDER_PAID - BE-2)
        └──▶ Fail/Timeout: [Step 3: DB Tx] (Order FAILED + Revert Inventory)
  ```
- **Rule BE-2 (Transactional Outbox):** When marking order `PAID`, write `outbox_events` record in the same transaction to notify shipping and email services reliably.

### 3. Verification & Proof Boundary (BW-P10, BE-28)
- Test script executes 100 concurrent workers via `Promise.all()` against real PostgreSQL test container:
  - Exactly 50 orders marked `PAID`.
  - Exactly 50 orders rejected with `INSUFFICIENT_STOCK`.
  - Database inventory column ends at exactly `0`.
  - Zero deadlocks or duplicate card charges.

---

## Case Study 2: Webhook Intake & Async Event Bus Relay (Dual-Write Prevention)

### 1. The Challenge
- External payment gateway sends `POST /webhooks/stripe` notifications for subscription renewals.
- Gateway enforces strict 2-second HTTP timeout and retries up to 12 times upon network failure.
- Downstream logic requires generating PDF invoices, sending confirmation emails, and updating user access tiers.

### 2. Architectural Blueprint & Applied Rules
- **Rule BE-18 (Signature First Statement):** Webhook door inspects raw unparsed request buffer and computes HMAC-SHA256 using `crypto.timingSafeEqual` (BE-17) before JSON deserialization.
- **Rule BE-8 (Inbox Claim in Same Transaction):**
  ```sql
  INSERT INTO webhook_inbox (delivery_id, provider, payload, status)
  VALUES (:deliveryId, 'STRIPE', :payload, 'RECEIVED')
  ON CONFLICT (delivery_id) DO NOTHING;
  ```
  If conflict occurs, return `200 OK` immediately (acknowledged duplicate).
- **Rule BE-24 (Thin Door):** Handlers do not execute PDF generation or email delivery inline. The door returns `200 OK` within 50ms.
- **Rule BE-10 & BE-11 (Fenced Job Worker with Retry Ladder):**
  A background BullMQ worker picks up the inbox record:
  - Processes renewal and updates user subscription.
  - Emits events through transactional outbox (BE-2).
  - Retry ladder: `[10s, 1m, 5m, 30m, 2h]` with dead letter queue on final failure.

---

## Case Study 3: Zero-Downtime Database Migration (Expand-and-Contract)

### 1. The Challenge
- Need to split `users.full_name` into `users.first_name` and `users.last_name` on a production table with 5,000,000 rows without taking the application offline.
- Dropping `full_name` or altering it in place would crash running application instances.

### 2. Step-by-Step 3-Phase Playbook
```text
Phase 1: Expand (Deploy 1)
  - Run migration: ADD COLUMN first_name VARCHAR NULL, ADD COLUMN last_name VARCHAR NULL.
  - Deploy App Version 1.1: Reads full_name, writes to BOTH full_name AND (first_name, last_name).
  - Run asynchronous backfill job: Migrates historical 5M rows in batches of 1,000 (BE-10).

Phase 2: Migrate Readers (Deploy 2)
  - Verify backfill progress reaches 100%.
  - Deploy App Version 1.2: Reads from (first_name, last_name); writes to both.

Phase 3: Contract (Deploy 3)
  - Deploy App Version 1.3: Stops writing to full_name entirely.
  - Run migration: DROP COLUMN full_name.
```
- **Rule BE-1:** Migrations are executed via a dedicated CI deployment step; auto-sync disabled.
- **Rule BE-7:** Schema changes are strictly additive during Phase 1 and 2.

---

## Case Study 4: Multi-Tenant Data Isolation & IDOR Defense

### 1. The Challenge
- Multi-tenant enterprise platform where Tenant A and Tenant B share the same PostgreSQL database schema.
- Prevent malicious or accidental data access where User A modifies `invoice_id` in URL to read or delete Tenant B's confidential financial invoices.

### 2. Multi-Layer Defense Blueprint
1. **Layer 1: Entry Door Default-Deny (BE-14):**
   - Global auth guard verifies JWT, extracts `tenant_id` and `user_id`, and binds to `RequestContext`.
2. **Layer 2: Domain Service Ownership Verification (BE-15):**
   - Domain service receives verified `PrincipalContext`.
   - Never trusts client-supplied query parameters for tenant identity:
     ```typescript
     const invoice = await this.invoiceRepo.findByIdAndTenant(id, principal.tenantId);
     if (!invoice) throw new NotFoundException('INVOICE_NOT_FOUND');
     ```
3. **Layer 3: Database Row-Level Security (RLS) Defense in Depth:**
   - PostgreSQL RLS policy activated on sensitive tenant tables:
     ```sql
     ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
     CREATE POLICY tenant_isolation_policy ON invoices
       USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
     ```
   - Connection pool sets session variable upon acquiring connection:
     `SET LOCAL app.current_tenant_id = :tenantId`.
   - Even if a developer accidentally writes `SELECT * FROM invoices WHERE id = :id` without a tenant filter, PostgreSQL blocks Tenant B's rows at the database engine level.
