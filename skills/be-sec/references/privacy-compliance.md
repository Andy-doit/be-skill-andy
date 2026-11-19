# Data Privacy, Retention & Compliance (GDPR / PII)

## 1. When to read this
Read this when designing tables storing Personally Identifiable Information (PII), handling user data deletion requests, or configuring data encryption.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Where is PII documented? | Explicit PII data catalog identifying columns storing sensitive user data. | Small internal microservice with zero user data. |
| How to handle user deletion requests (GDPR Right to be Forgotten)? | Anonymize or overwrite PII fields (`email`, `name`, `phone`) with deterministic hashes/tombstones while preserving financial ledger rows. | Hard delete if no legal record-keeping obligations exist. |
| How should sensitive data at rest be stored? | Field-level encryption using AES-256-GCM for high-risk attributes (SSN, banking tokens) + DB disk encryption. | Standard database-level encryption (AWS RDS KMS) for general user records. |

---

## 3. Rules

### PII Handling & Privacy Compliance (Applying Rule BE-21 & BR-3)
Personal data must be isolated, documented, and protected against unauthorized access, adhering to rules `BE-21` (no secrets/PII in logs) and `BR-3` (state lifecycle). Deletion requests must clean or anonymize personal attributes across application databases, backups, and caches without corrupting historical financial audit ledgers.
- **Why:** Storing unencrypted sensitive identifiers or failing to fulfill legal data erasure requests triggers regulatory fines (GDPR, CCPA) and severe legal liabilities.
- **Enforced by:** Privacy compliance audit and deletion flow tests.

---

## 4. Checklist for review
- [ ] PII columns identified and excluded from automated error reporting and debug logs.
- [ ] Deletion endpoint anonymizes personal details (`name -> 'Anonymized User'`, `email -> 'anon-uuid@deleted'`).
- [ ] Data retention job purges expired transient logs and session records periodically.

---

## 5. How to prove it
- **Anonymization Test:** Execute user deletion request; assert that user profile PII fields are overwritten with anonymized values while linked historical order rows retain foreign key integrity.
