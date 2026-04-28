---
name: API direct calls use port 4000
description: Playwright APIRequestContext must target port 4000 directly, not 5173
type: project
---

The Vite dev server proxies `/api/*` → `http://localhost:4000` for browser requests only. Playwright's `request` fixture and `context.request` / `page.request` are not browser processes and do NOT go through the Vite proxy.

Always use `http://localhost:4000/api/...` for direct API calls in tests. Using `http://localhost:5173/api/...` from a non-browser context will fail.

Exception: `page.request` shares the browser page's cookie jar and does send requests through the network stack — but still needs the full `http://localhost:4000` URL since the Vite proxy doesn't apply.

**How to apply:** In api.spec.ts and any test using `request`, `browser.newContext().request`, or `page.request` for server calls, always prefix with `http://localhost:4000`.
