# API Contract Change Checklist (BE-7, BE-27)

> Rule BE-7: Event and API contracts only add; remove only after all consumers have migrated (expand, then contract).
> Rule BE-27: The public contract (OpenAPI / GraphQL schema) is committed, generated or checked in CI; breaking changes require explicit approval.

---

## 1. Classification: Additive vs Breaking

| Change Type | Classification | Allowed in Normal Release? | Required Migration Path |
|---|---|:---:|---|
| Adding a new nullable field or optional query parameter | **Additive** | YES | Direct deploy. |
| Adding a new endpoint or mutation | **Additive** | YES | Direct deploy. |
| Adding a new value to an enum returned to clients | **Breaking** (for clients with strict enum parsers) | NO | Announce new enum variant; update client schemas before emitting. |
| Making an optional request parameter required | **Breaking** | NO | Version endpoint (`v2`) or add new endpoint. |
| Renaming or removing a response field | **Breaking** | NO | Two-phase expand-then-contract: add new field, deprecate old, wait for client rollout, then remove. |
| Changing field type (e.g. `number` to `string`) | **Breaking** | NO | Use new field name (e.g. `amountFormatted`) or new version. |
| Restricting validation limits (e.g. max length 100 -> 50) | **Breaking** | NO | Verify existing stored data and client submission patterns first. |

---

## 2. Two-Phase Expand-and-Contract Procedure

When a contract change is necessary:

1. **Phase 1: Expand (Additive):**
   - Add new field or endpoint alongside the existing one.
   - Decorate old field as `@deprecated(reason: "Use newField instead, removal in v2.4")`.
   - Update API documentation and schema artifacts in git.
   - Deploy backend.
2. **Phase 2: Migrate Consumers:**
   - Update web, mobile, and third-party consumers to read/write the new field.
   - Monitor usage telemetry/logs to ensure traffic to the deprecated field drops to zero.
3. **Phase 3: Contract (Removal):**
   - Remove the deprecated field in a subsequent planned release.

---

## 3. Pull Request Review Checklist
- [ ] Schema diff (`git diff schema.gql` or `openapi.json`) reviewed.
- [ ] No existing required fields were removed or made optional in responses.
- [ ] No optional input fields were made required.
- [ ] Error response formats remain identical.
- [ ] Consumer teams notified if any deprecation notice was added.
