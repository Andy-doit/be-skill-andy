# Strict Test Doubles & Test Data Builders

## 1. When to read this
Read this when mocking dependencies in unit tests, preparing test fixtures, or constructing test entities.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should external ports be doubled in unit tests? | Strict typed double implementing the domain port interface (BE-28). | Third-party SDK with 50+ methods requiring dynamic spy stubs. |
| How to construct test entities and records? | Test Data Builders with sensible default values (e.g. `UserBuilder.aUser().withEmail(...).build()`). | Raw literal objects with 30 boilerplate fields scattered across tests. |
| What should unit tests assert? | State, returned values, and business outcomes. | Never assert exclusively on mock call counts (`expect(fn).toHaveBeenCalled()`). |

---

## 3. Rules

### BE-28 Typed strict doubles & row builders
Unit tests must use typed test doubles that implement the full port interface. Spies and mocks must be strictly typed (`jest.Mocked<Port>`). Hand-written database rows with 20 dummy fields repeated across test files are banned in favor of reusable Test Data Builders.
- **Why:** Hand-crafted literal objects rot when schema columns are added or modified, breaking dozens of unrelated test files. Loose untyped mocks pass tests even when the underlying interface signature changes.
- **Enforced by:** Type checker and code review.

---

## 4. Test Data Builder Pattern

```typescript
export class OrderBuilder {
  private order: Partial<OrderEntity> = {
    id: '018f3a20-0000-7000-8000-000000000001',
    customerId: '018f3a20-0000-7000-8000-000000000002',
    totalAmount: 1000,
    status: OrderStatus.PENDING,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  static anOrder(): OrderBuilder {
    return new OrderBuilder();
  }

  withAmount(amount: number): this {
    this.order.totalAmount = amount;
    return this;
  }

  withStatus(status: OrderStatus): this {
    this.order.status = status;
    return this;
  }

  build(): OrderEntity {
    return this.order as OrderEntity;
  }
}
```

---

## 5. Checklist for review
- [ ] Builders provide valid, realistic default attributes.
- [ ] Test specifies only the fields relevant to the scenario under test.
- [ ] No `as unknown as Type` casts to bypass missing required mock methods.

---

## 6. How to prove it
- **Type Check:** Adding a new required method to a domain port causes compiler errors in doubles that fail to implement it.
