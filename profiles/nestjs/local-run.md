# Local Infrastructure Setup for NestJS Stack

Run supporting backing services (Postgres, Redis, NATS, MinIO) locally using Docker Compose without hardcoding credentials in git.

---

## 1. Environment Variables Configuration
Copy `.env.example` to `.env.local` and define local development passwords:

```bash
cp .env.example .env.local
```

Sample `.env.example`:
```ini
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_local_dev_password_here
POSTGRES_DB=app_development

REDIS_PORT=6380
REDIS_PASSWORD=your_redis_password_here

NATS_PORT=4222
NATS_TOKEN=your_nats_dev_token_here

MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ROOT_USER=minio_dev_admin
MINIO_ROOT_PASSWORD=your_minio_dev_password_here
```

---

## 2. Booting Infrastructure
Start containers with docker compose:

```bash
docker compose -f docker-compose.infra.yml --env-file .env.local up -d
```

Verify service readiness:
- PostgreSQL: `pg_isready -h localhost -p 5433`
- Redis: `redis-cli -p 6380 -a "$REDIS_PASSWORD" ping`
- NATS: `curl http://localhost:8222/varz`

---

## 3. Running Database Migrations
Apply schema migrations before launching the application:

```bash
npm run typeorm:migration:run
```

---

## 4. Starting the Application
```bash
npm run start:dev
```
