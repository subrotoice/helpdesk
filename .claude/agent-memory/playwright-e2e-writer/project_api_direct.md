---
name: API direct calls use port 4000
description: Playwright APIRequestContext must target port 4000 directly, not 5173
type: project
---

The Vite dev server proxies `/api/*` → `http://localhost:4000` for browser requests only. Playwright's `request` fixture and `context.request` / `page.request` are not browser processes and do NOT go through the Vite proxy.

In test mode the server runs on port 4001 (set in `server/.env.test` as `PORT=4001`). Always use `http://localhost:${process.env.PORT ?? 4000}` so the same spec works both in test mode (4001) and locally without `.env.test` (4000).

Note: the webhook endpoint has no `/api` prefix — it lives at `/webhooks/email` on the server root, not under `/api`.

**How to apply:** In any test using `request` for direct server calls, use the `API_BASE` pattern: `` `http://localhost:${process.env.PORT ?? 4000}` ``. Prefix auth calls with `/api/auth/...` and ticket API calls with `/api/tickets/...`. Webhook calls use `/webhooks/email` (no `/api` prefix).
