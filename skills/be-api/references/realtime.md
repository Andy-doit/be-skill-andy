# Realtime Transports (SSE & WebSockets)

## 1. When to read this
Read this when designing live streaming doors (Server-Sent Events, WebSockets), real-time notifications, or subscriptions.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| Which realtime protocol to choose? | Server-Sent Events (SSE) for unidirectional server-to-client updates. | Bidirectional low-latency interaction (e.g. collaborative editing, gaming) requires WebSockets. |
| How are topic subscriptions authorized? | Topics derived strictly from authenticated user principal on handshake. | Public non-sensitive broadcast channels (e.g. public ticker prices). |
| How to handle client disconnections? | Resumable stream with sequential message IDs and `Last-Event-ID` header. | Ephemeral transient notifications that have zero historical value. |
| How to distribute messages across replicas? | Redis Pub/Sub or NATS JetStream shared across application instances. | Single-process monolith running on a single non-scaled server. |

---

## 3. Rules

### BR-4 Realtime doors enforce authorization on topic derivation
Realtime subscription doors must derive permitted topics from the authenticated principal token during connection handshake. Clients must never be allowed to subscribe to arbitrary tenant or user topics by passing caller-supplied room names.
- **Why:** Allowing clients to supply topic names enables unauthorized eavesdropping on private user notifications or cross-tenant business events.
- **Enforced by:** Handshake authentication and subscription guard unit tests.

---

## 4. Failure examples
- **Failure:** A WebSocket connection allows client to emit `{ "action": "subscribe", "topic": "orders:tenant-999" }` without checking user's tenant membership.
  - *Symptom:* Tenant A eavesdrops on Tenant B's live orders.
- **Failure:** Long-lived SSE connection sends no heartbeat.
  - *Symptom:* Cloud load balancers and NAT gateways terminate idle connections silently after 60 seconds without client notice.

---

## 5. Checklist for review
- [ ] Authentication token verified during HTTP upgrade or SSE initial GET request.
- [ ] Heartbeat ping frames sent every 15-30 seconds to keep proxy buffers alive.
- [ ] Events carry incremental sequential sequence IDs (`id: 1042`).
- [ ] Reconnecting client provides `Last-Event-ID` to replay missed events from buffer.

---

## 6. How to prove it
- **Integration Boundary:** Test establishes SSE connection, triggers domain event, asserts message arrives with correct ID, simulates disconnect and reconnect with `Last-Event-ID`, asserts missed message is replayed.
