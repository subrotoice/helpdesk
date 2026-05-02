---
name: Webhook endpoint response shapes
description: Exact response shapes for POST /webhooks/email — the 201/200 paths do NOT include all flags; assert only what the code actually returns.
type: project
---

`POST /webhooks/email` (mounted without `/api` prefix, no auth required) returns:

- **201 new ticket**: `{ received: true, ticketId: number }` — NO `duplicate` or `threaded` fields
- **200 duplicate** (same Message-ID seen before): `{ received: true, ticketId: number, duplicate: true }` — NO `threaded` field
- **200 threaded** (In-Reply-To matches known messageId): `{ received: true, ticketId: number, threaded: true }` — NO `duplicate` field
- **400 validation error**: `{ error: "ValidationError", issues: { fieldName: string[] } }`

**Why:** The spec description listed `duplicate: false` and `threaded: false` in some cells, but the actual server code (`server/src/webhooks.ts`) only emits the positive flags. Tests that assert `.toBeUndefined()` on absent flags will catch if this ever changes.

**How to apply:** When writing webhook response assertions, do not assert `duplicate: false` or `threaded: false` — assert `toBeUndefined()` instead. Ticket IDs are numeric (`number`), not strings.
