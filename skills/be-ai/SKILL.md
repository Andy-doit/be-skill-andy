---
name: be-ai
description: >
  AI and LLM integrations, model gateways, agent loops, prompt safety, and tool execution authority.
  Use when: integrating Large Language Models (LLMs) into backend services, establishing unified model gateways
  for key/quota/failover management (BE-31), determining code chains vs autonomous agent loops (BE-32),
  scoping RAG retrieval to caller authority (BE-33), and ensuring tool calls pass security checks.
  DO NOT USE FOR: generative UI rendering on the frontend (see generative_ui), static heuristic validation
  (see be-sec), or general API contracts (see be-api).
---

# be-ai — AI & Large Language Model (LLM) Integration

Defines standards for backend LLM gateways, agent autonomy boundaries, scoped retrieval, and tool execution security.

---

## 1. Core Reference Guides

- [llm-gateway.md](./references/llm-gateway.md) — Unified model gateway, quota management, code chains vs agent loops, scoped retrieval, and attributable tool calls (BE-31, BE-32, BE-33).

---

## 2. Invariant Rules Summary

| Rule ID | Law in One Sentence | Enforced by |
|---|---|---|
| **BE-31** | One gateway for all model calls (keys, quotas, failover, usage); the client never holds a model key. | Architecture audit + Gateway check |
| **BE-32** | Chains with fixed shape are code; agent loops run only where authority and audit are enforced; parsed output is typed and bounded. | Code review + Schema test |
| **BE-33** | Retrieved context is fetched within the caller's authority; tool calls pass the same checks as a human request and are attributable. | RAG authorization tests |
