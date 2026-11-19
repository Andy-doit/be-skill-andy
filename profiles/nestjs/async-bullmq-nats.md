# Asynchronous Processing: BullMQ & NATS

## 1. BullMQ Workers & Fenced Execution (Rule BE-10)
Background queue processors must declare idempotent execution and bounded retry ladders:

```typescript
@Processor('order-processing')
export class OrderProcessor extends WorkerHost {
  constructor(private readonly orderService: OrderService) {
    super();
  }

  async process(job: Job<{ orderId: string; attempt: number }>): Promise<void> {
    // BE-10: Fenced execution with idempotency key
    await this.orderService.processOrder(job.data.orderId, job.id);
  }
}
```

---

## 2. NATS JetStream Event Publishing (Rule BE-2)
Events must not be published directly inside database transaction methods. Instead, write an outbox record in the transaction and let a dedicated outbox poller relay events to NATS:

```typescript
@Injectable()
export class OutboxRelayService {
  constructor(
    private readonly outboxRepo: OutboxRepository,
    private readonly natsClient: ClientNats,
  ) {}

  @Cron('*/5 * * * * *')
  async relayPendingEvents() {
    const events = await this.outboxRepo.claimPending(50);
    for (const event of events) {
      await this.natsClient.emit(event.topic, event.payload).toPromise();
      await this.outboxRepo.markPublished(event.id);
    }
  }
}
```
