<div align="center">

# ⚙️ Andy · Backend Architecture & Quality Harness

<p align="center">
  <strong>Bộ khung gầm kỹ thuật (Quality Harness) biến AI Coding Agents thành Senior Backend Architect.</strong><br/>
  <em>Dành riêng cho Google Antigravity · Claude Code · Codex · Gemini CLI</em>
</p>

<p align="center">
  <a href="#tại-sao-bạn-cần-backend-quality-harness"><img src="https://img.shields.io/badge/Vấn_đề-AI_Backend_Ẩu-dc2626?style=flat-square" alt="Problem" /></a>
  <a href="#3-vũ-khí-kỹ-thuật-cốt-lõi"><img src="https://img.shields.io/badge/Kiến_trúc-4--Tier_Inversion-38bdf8?style=flat-square" alt="Architecture" /></a>
  <a href="#kỷ-luật-cổng-thép-zero-loosening-gate"><img src="https://img.shields.io/badge/Cổng_chất_lượng-Zero_Loosening-10b981?style=flat-square" alt="Gates" /></a>
  <a href="#thư-mục-13-kỹ-năng-rành-mạch-skills-directory"><img src="https://img.shields.io/badge/Hệ_kỹ_năng-13_Skills-818cf8?style=flat-square" alt="Skills" /></a>
  <a href="#6-case-studies-thực-chiến-bao-gồm-hyper-scale"><img src="https://img.shields.io/badge/Thực_chiến-6_Case_Studies-eab308?style=flat-square" alt="Case Studies" /></a>
  <a href="#cài-đặt-trong-30-giây-1-click-setup"><img src="https://img.shields.io/badge/Cài_đặt-1--Click_Setup-f59e0b?style=flat-square" alt="Install" /></a>
  <img src="https://img.shields.io/badge/Phiên_bản-v1.1.1-blue?style=flat-square" alt="Version" />
</p>

</div>

---

### Tại sao bạn cần Backend Quality Harness?

Bao nhiêu lần bạn giao việc cho Claude Code hay Cursor viết backend, để rồi nhận lại:
1. **Transaction ôm trọn API ngoài:** Agent bọc `db.transaction()` xung quanh cả cuộc gọi HTTP Stripe hay gửi email. Mạng lag 5 giây là cạn kiệt Connection Pool, sập toàn bộ database!
2. **Thảm họa Dual-Write:** Agent vừa `db.save(order)` vừa bắn event ra Kafka/NATS trực tiếp. Nếu DB rollback mà event đã bắn thì hệ thống thành "bóng ma"; nếu bắn event lỗi thì đơn hàng biến mất không ai hay!
3. **Ảo tưởng Concurrency:** Agent kiểm tra tồn kho bằng `if (stock > 0)` trong RAM. Chạy thực tế 100 request song song là bán lố (oversell) âm cả kho hàng!
4. **Tự tiện phá hỏng Schema:** Agent bật `synchronize: true` trên production hoặc tự ý `DROP COLUMN` làm sập toàn bộ các container cũ đang chạy rolling deployment!
5. **Lén lách luật kiểm tra:** Khi gặp lỗi TypeScript hay linter, Agent **lén chèn `// @ts-ignore` hoặc ép kiểu `as any`** để qua mặt bạn?

> **Andy Backend sinh ra để chấm dứt toàn bộ những trò hề đó.**  
> Nguyên tắc bất biến: **Đứa viết ra code KHÔNG BAO GIỜ là đứa tự chấm điểm. Mọi tuyên bố an toàn concurrency hay idempotency phải được chứng minh trên database thật (BW-P10).**

---

### Xem Code thực tế: AI thường vs AI có Andy Backend Harness

#### ❌ Code AI thường hay sinh (Spaghetti, Race Condition & Dual-Write Hazard)
```typescript
// orderService.ts — Tai họa tiềm ẩn: ôm HTTP ngoài, race condition, dual-write
export class OrderService {
  async checkout(userId: any, items: any) { // Lỏng lẻo: any khắp nơi
    return await this.db.transaction(async (tx) => {
      // 1. Race condition: Check in-memory, 2 request cùng vào là trừ kho âm
      const product = await tx.products.findOne(items[0].id);
      if (product.stock > 0) {
        product.stock -= 1;
        await tx.products.save(product);
      }

      // 2. Vi phạm BE-3: Gọi Stripe bên trong DB transaction!
      // Mạng chập chờn sẽ giữ lock DB đến chết pool; nếu commit sau đó fail thì tiền đã trừ mà đơn mất!
      const charge = await this.stripe.charges.create({ amount: 100 });

      const order = await tx.orders.save({ userId, chargeId: charge.id });

      // 3. Vi phạm BE-2: Bắn Kafka trực tiếp không có Outbox
      await this.kafka.emit('order.created', order); // Dual-write hazard!

      return order;
    });
  }
}
```

#### ✅ Code chuẩn Senior Architect khi có Andy Backend Harness
```typescript
// orders.service.ts — An toàn tuyệt đối: Idempotent, Atomic SQL, Transactional Outbox
export class OrderService {
  constructor(
    private readonly db: DataSource,
    private readonly paymentGateway: PaymentGatewayPort, // BE-23: Bọc qua Adapter
    private readonly clock: ClockPort,                   // BE-25: Injected Clock
  ) {}

  async checkout(params: CheckoutOrderParams): Promise<CheckoutOrderResult> {
    // 1. Kiểm tra & Giữ Idempotency Lease (BE-9)
    const existingReceipt = await this.idempotency.claim(params.idempotencyKey);
    if (existingReceipt.isCompleted) return existingReceipt.result;

    // 2. Trừ kho bằng Atomic Conditional SQL trên database (BE-6)
    const affected = await this.db.query(
      `UPDATE inventory SET stock = stock - :qty WHERE item_id = :id AND stock >= :qty`,
      { id: params.itemId, qty: params.quantity }
    );
    if (affected === 0) throw new DomainException('INSUFFICIENT_STOCK'); // BE-20

    // 3. Gọi thanh toán BÊN NGOÀI Transaction với Timeout bắt buộc (BE-3, BE-23)
    const payment = await this.paymentGateway.charge({
      amount: params.amount,
      idempotencyKey: params.idempotencyKey,
      timeoutMs: 5000,
    });

    // 4. Lưu đơn hàng VÀ Outbox event trong cùng 1 Transaction nguyên tử nội bộ (BE-2)
    return await this.db.transaction(async (tx) => {
      const order = await tx.getRepository(OrderEntity).save({
        customerId: params.customerId,
        amount: params.amount,
        status: OrderStatus.PAID,
        createdAt: this.clock.now(),
      });

      // Transactional Outbox: Đảm bảo event được gửi nếu và chỉ nếu DB commit thành công!
      await tx.getRepository(OutboxEntity).save({
        topic: 'orders.placed',
        payload: { orderId: order.id, customerId: order.customerId },
      });

      await this.idempotency.saveReceipt(params.idempotencyKey, order);
      return order;
    });
  }
}
```
*Kết quả: **0 nguy cơ Dual-write**; **0 nguy cơ giữ lock database khi gọi Stripe**; **0 trường hợp bán lố kho**; **Idempotent 100%** khi client retry.*

---

### 3 "Vũ Khí" Kỹ Thuật Cốt Lõi

#### 1. Transactional Outbox & Inbox Pattern (Diệt tận gốc Dual-Write)
Không bao giờ gửi message ra broker (Kafka, NATS, RabbitMQ, BullMQ) trực tiếp trong luồng ghi database:
- **Outbox (BE-2):** Ghi sự kiện vào bảng `outbox_events` trong cùng transaction với dữ liệu. Một worker nền bền bỉ đọc outbox và đẩy ra broker. Nếu DB rollback, outbox tự biến mất.
- **Inbox (BE-8):** Mọi consumer phía nhận đều claim message ID vào bảng `inbox` trước khi xử lý, đảm bảo an toàn tuyệt đối trước tình trạng mạng redelivery (at-least-once delivery).

#### 2. Expand-and-Contract & Schema Authority (Deploy Zero-Downtime)
- **Migrations là thẩm quyền duy nhất (BE-1):** Cấm tiệt ORM auto-synchronize (`synchronize: true`). Mọi thay đổi cấu trúc dữ liệu phải đi qua file migration có kiểm soát.
- **Quy trình 2 pha (BE-7):** Không bao giờ xóa hay đổi tên cột lập tức. Thêm cột mới nullable (Expand) -> Deploy code mới ghi cả 2 cột -> Chạy job backfill dữ liệu cũ -> Chuyển code sang đọc cột mới -> Xóa cột cũ (Contract).

#### 3. Kỷ luật Cổng Thép (Zero-Loosening & Real-Store Concurrency Proof)
- **Cấm hạ tiêu chuẩn (BW-P5):** Script `check-loosening.mjs` quét sạch mọi dòng `@ts-ignore`, `eslint-disable`, `it.skip` hay `|| true`. Muốn pass thì phải sửa code, không được nới lỏng gate.
- **Bằng chứng thực tế (BW-P10, BE-28):** Mọi khẳng định về chống double-spend, locking, hay race conditions bắt buộc phải có Integration Test chạy trên **PostgreSQL/Redis thật** bằng Testcontainers hoặc Docker, không chấp nhận mock trong RAM.

---

### Hội thoại thực tế: Cách Andy Backend làm việc cùng bạn

Andy trao đổi trực diện, chuẩn xác như một Senior Backend Architect ngồi cạnh bạn:

```text
Bạn: "Andy, mình cần thêm tính năng hoàn tiền cho đơn hàng qua cổng VNPay."

Andy:
"Mình soi thấy 3 rủi ro cần kiểm soát ở `src/modules/billing/refund.service.ts`:
 1. Cần bảo vệ Idempotency: Nếu VNPay timeout mà kế toán bấm nút hoàn tiền 2 lần, khách sẽ được hoàn tiền gấp đôi.
 2. Gọi HTTP VNPay không được nằm trong DB transaction (vi phạm BE-3).
 3. Khi hoàn tiền thành công, trạng thái đơn phải đổi sang REFUNDED và bắn sự kiện ra Outbox cho kho (vi phạm BE-2 nếu bắn trực tiếp).

Giải pháp thiết kế (Rule BW-P4 - cơ chế nhỏ nhất giữ vững invariant):
 - Nhận `Idempotency-Key` từ request kế toán, khóa lease trong Redis 30 giây (BE-9).
 - Gọi API refund VNPay với timeout cứng 5000ms bên ngoài transaction (BE-23).
 - Bắt đầu local DB transaction: Cập nhật `order.status = REFUNDED` + Thêm dòng vào `outbox_events` (BE-2).
 - Commit transaction và lưu receipt phản hồi.

Bạn gõ 'go' là mình lên design record và tiến hành theo batch ngay."
```

---

### Thư mục 13 Kỹ Năng Rành Mạch (Skills Directory)

Router trung tâm `be` tự động phân loại yêu cầu và điều phối đến đúng topic skill chuyên sâu:

| Nhóm chuyên môn | Kỹ năng | Nhiệm vụ chính & Các luật cốt lõi |
|---|---|---|
| **Điều phối trung tâm** | [`be`](./skills/be/) | Hub router phân loại trigger (HTTP, job, webhook, CLI) & nạp context dự án (BW-P1, BW-P3) |
| **Kiến trúc & Cấu trúc** | [`be-arch`](./skills/be-arch/) | 4-tier layering, composition root, cấu trúc theo trigger, determinism time/ID (BE-23, BE-24, BE-25, BE-26) |
| **API, Hợp đồng & Transport** | [`be-api`](./skills/be-api/) | Hợp đồng OpenAPI/GraphQL committed, closed-enum errors, webhook signature first, SSE/WS (BE-7, BE-18, BE-20, BE-27) |
| **Xác thực & Phiên làm việc** | [`be-auth`](./skills/be-auth/) | Cookie bảo mật (HttpOnly, Secure, SameSite), CSRF origin check, so sánh constant-time, Argon2id (BE-17) |
| **Phân quyền & Multi-Tenant** | [`be-authz`](./skills/be-authz/) | Default-deny tại mọi cửa vào, kiểm tra quyền tài nguyên ở domain service, Postgres RLS (BE-14, BE-15) |
| **Dữ liệu & Giao dịch** | [`be-persist`](./skills/be-persist/) | Migrations là thẩm quyền duy nhất (BE-1), cấm gọi ngoài trong transaction (BE-3), ràng buộc atomic SQL (BE-6), Read-After-Write consistency (BE-34), sharding & partitioning (BE-36) |
| **Bất đồng bộ & Hàng đợi** | [`be-async`](./skills/be-async/) | Transactional outbox (BE-2), idempotency key (BE-9), job fencing (BE-10), retry ladder (BE-11), sagas (BE-12), CDC outbox qua Debezium |
| **Khả năng phục hồi & Cache** | [`be-resilience`](./skills/be-resilience/) | Timeout bắt buộc (BE-23), circuit breaker, cache delete-on-write (BR-3), pre-signed URL S3 (BE-16) |
| **Vận hành & Cấu hình** | [`be-ops`](./skills/be-ops/) | Validate config tại boot (BE-19), structured logger có correlation ID (BE-21), tách riêng liveness/readiness (BE-22) |
| **Bảo mật & Giới hạn** | [`be-sec`](./skills/be-sec/) | Chặn đứng SSRF, giới hạn kích thước mảng/string (BE-16), Rate Limiting phân tán nguyên tử bằng Redis Lua (BE-35), CORS, PII/GDPR |
| **Chiến lược Kiểm thử** | [`be-test`](./skills/be-test/) | Kiểm thử tích hợp trên DB/Broker thật (BE-28), strict typed doubles, contract testing với schema (BE-29, BE-30) |
| **Tích hợp Trí tuệ Nhân tạo**| [`be-ai`](./skills/be-ai/) | Cổng Gateway LLM tập trung (BE-31), chuỗi code cố định vs agent loop, bảo mật RAG theo tenant (BE-32, BE-33) |
| **Kiểm toán Mã nguồn (Audit)**| [`be-audit`](./skills/be-audit/) | Chế độ đọc soát lỗi (Read-Only) toàn bộ 36 luật BE-1..36, xuất bảng vi phạm chi tiết kèm rule ID, `file:line`, severity và cách sửa |

---

### 6 Case Studies Thực Chiến (Bao gồm Hyper-Scale)

Xem tài liệu chi tiết tại: [references/case-studies.md](references/case-studies.md)

1. **High-Volume Flash Sale & Checkout:** Xử lý 10.000 request đồng thời mua 50 món hàng giới hạn; triệt tiêu oversell bằng atomic SQL threshold, bảo vệ Stripe bằng idempotency key, và lưu order + outbox nguyên tử.
2. **Webhook Intake & Async Event Bus Relay:** Nhận webhook Stripe với chữ ký HMAC constant-time, nạp vào bảng inbox trong 50ms và đẩy công việc nặng cho BullMQ worker với thang retry có giới hạn.
3. **Zero-Downtime Database Migration:** Kỹ thuật Expand-and-Contract chia tách cột trên bảng 5 triệu dòng mà không cần downtime, không làm sập các container phiên bản cũ.
4. **Multi-Tenant B2B SaaS Isolation & Row-Level Security:** Kết hợp phòng thủ 3 lớp (Door Default-Deny -> Domain Service Verification -> PostgreSQL Row-Level Security) ngăn chặn hoàn toàn lỗ hổng IDOR.
5. **Distributed Tiered Rate Limiting under 100,000 RPS Attack:** Phòng thủ 3 tầng (Edge IP drop -> Redis Lua Sliding Window Counter $O(1)$ RAM -> Downstream Semaphore Protection) chặn đứng bão request mà không nổ bộ nhớ.
6. **Read-After-Write Consistency across Multi-Region PostgreSQL Replicas:** Giải quyết bài toán trễ replication xuyên lục địa (US Primary -> Tokyo Replica) bằng Session Write Pinning & LSN Tracking, triệt tiêu 100% lỗi phantom 404 sau khi đặt hàng.

---

### Cài đặt trong 30 giây (1-Click Setup)

Sử dụng Windows Directory Junctions (zero-copy), giúp mọi cập nhật trong repository có hiệu lực ngay lập tức trên tất cả công cụ:

```powershell
# Chạy từ thư mục be-skill-andy (tự động link vào Claude Code, Codex, Antigravity)
powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1
```

Hoặc cài riêng cho từng công cụ:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Tools antigravity
powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Tools claude,codex
```

*(Xem hướng dẫn chi tiết lệnh thủ công và gỡ cài đặt tại [install-guide.md](install-guide.md))*

---

### 🔍 Bộ Scripts Kiểm Định Zero-Dependency (Node.js)

```bash
# 1. Kiểm tra tính hợp lệ của toàn bộ Skills (frontmatter, links, trigger)
node scripts/check-skills.mjs

# 2. Quét phát hiện các pattern lách luật chất lượng (`eslint-disable`, `@ts-ignore`)
node scripts/check-loosening.mjs

# 3. Quét phát hiện rò rỉ secrets, private keys hoặc file .env thật
node scripts/check-secrets.mjs

# 4. Quét kiểm toán tĩnh mã nguồn backend bất kỳ đối chiếu theo bộ luật BE-*
node scripts/audit-backend.mjs ../my-backend-project
```

---

### 📜 Quy chuẩn Chia sẻ & Governance

- [conventions.md](references/conventions.md) — 14 Luật quy trình (`BW-P1..P14`) & 7 Nghĩa vụ review (`BR-1..7`).
- [case-studies.md](references/case-studies.md) — 6 Kịch bản thực chiến chi tiết từ A-Z (kèm Hyper-Scale).
- [project-profile.template.md](references/project-profile.template.md) — File mẫu khai báo kiến trúc dự án (agent đọc đầu tiên).
- [design-record.template.md](references/design-record.template.md) — Mẫu Architectural Decision Record (ADR) chứng minh cơ chế nhỏ nhất (BW-P4).
- [api-contract-change.md](references/api-contract-change.md) — Checklist thay đổi hợp đồng API additive vs breaking.
- [incident-loop.md](references/incident-loop.md) — Vòng lặp đóng băng lỗi khi vi phạm luật (BW-P8).

---

### 📜 License

MIT © [StarCi](https://github.com/starci183) & Andy — *Xây dựng chuẩn mực kỹ thuật cho kỷ nguyên Agentic AI.*
