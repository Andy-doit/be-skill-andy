# Delivery, Docker & Zero-Downtime Rollouts

## 1. When to read this
Read this when authoring Dockerfiles, setting up CI/CD pipelines, configuring rolling updates, or executing production database migrations.

---

## 2. Decision table

| Question | Smallest mechanism that holds the invariant | Take more complex mechanism only when |
|---|---|---|
| How should container base images be pinned? | Pin exact digest or specific minor/patch version tag (e.g. `node:20.12.2-alpine3.19`). | Never use floating `latest` tag in production Dockerfiles. |
| When should migrations run in the deployment pipeline? | In a single dedicated pre-deploy container step before new pods roll out (BE-1). | Zero-downtime rolling deploy requires all schema changes to be backward-compatible (BE-7). |
| How to handle deployment rollback? | Roll back application image to previous version; database schema remains backward-compatible. | Disaster recovery restoring database snapshot. |

---

## 3. Rules

### Pinned container images & zero-downtime deploy order
Production container images must never use moving tags (`:latest`, `:alpine`). Base images and production dependencies must be pinned to immutable versions or sha256 digests. The deployment sequence must execute: (1) Run non-destructive database migrations, (2) Start new application pods, (3) Wait for readiness probes, (4) Switch ingress traffic, (5) Terminate old pods.
- **Why:** Moving tags break builds unexpectedly when an upstream maintainer publishes an untested patch. Running migrations after deploying new code causes the new app to fail on boot due to missing columns.
- **Enforced by:** CI Dockerfile linter and deployment pipeline definitions.

---

## 4. Failure examples
- **Failure:** Using `FROM node:alpine` in Dockerfile.
  - *Symptom:* Upstream releases Node 22; Docker build pulls new version; native dependencies fail to compile unexpectedly during urgent hotfix deploy.
- **Failure:** App containers start and attempt to run migrations concurrently.
  - *Symptom:* Migration race locks migration lock table; deployment stalls indefinitely.

---

## 5. Checklist for review
- [ ] Dockerfile uses multi-stage build running as non-root user (`USER node`).
- [ ] Base images pinned to exact minor/patch versions.
- [ ] Database migration step runs as a single isolated job in pipeline.
- [ ] Rolling update configured with `maxUnavailable: 0`.

---

## 6. How to prove it
- **Deployment Dry Run:** Verify CI pipeline configuration runs migration job successfully before updating container image tags.
