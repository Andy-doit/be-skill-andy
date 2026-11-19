# TypeORM Data Access, Migrations & Transactions

## 1. Migration Authority (Rule BE-1)
In NestJS with TypeORM, database schema synchronization must be disabled in configuration:

```typescript
// ormconfig.ts / data-source.ts
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  synchronize: false, // MANDATORY: BE-1 forbids auto-synchronize in all environments
  migrationsRun: false, // Migrations are run via dedicated CLI step, not on app boot
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
};
```

---

## 2. Transactions Without External Calls (Rule BE-3)
Use `dataSource.transaction(...)` or `entityManager.transaction(...)` strictly for database writes. Prepare data and execute external calls outside the transaction block:

```typescript
// CORRECT: External call completed BEFORE transaction starts
const paymentReceipt = await this.paymentClient.charge(amount);

await this.entityManager.transaction(async (tx) => {
  const order = tx.create(OrderEntity, { status: 'PAID', receiptId: paymentReceipt.id });
  await tx.save(order);
  
  // Transactional outbox entry in same transaction (BE-2)
  const outbox = tx.create(OutboxEntity, { event: 'ORDER_PAID', payload: { orderId: order.id } });
  await tx.save(outbox);
});
```

---

## 3. Entity Conventions & Foreign Keys (Rule BE-5)
Every relation must explicitly index its foreign key column:

```typescript
@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_orders_customer_id') // MANDATORY: BE-5 index on foreign key
  @Column('uuid')
  customerId: string;

  @ManyToOne(() => CustomerEntity)
  @JoinColumn({ name: 'customerId' })
  customer: CustomerEntity;
}
```
