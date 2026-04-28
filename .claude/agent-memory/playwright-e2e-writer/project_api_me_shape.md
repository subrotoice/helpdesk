---
name: /api/me response shape is scoped
description: GET /api/me returns exactly {id, name, email, role} — asserting key set is a security test
type: project
---

`server/src/index.ts` line 33 destructures only `{ id, name, email, role }` from `res.locals.session.user` and returns those four fields. Fields like `password`, `emailVerified`, `createdAt`, `updatedAt`, `image` are intentionally excluded.

Test assertion pattern:
```typescript
const keys = Object.keys(body).sort();
expect(keys).toEqual(["email", "id", "name", "role"]);
```

This is a **security property** — if someone widens the destructuring accidentally, this test catches it.

`role` values: `"admin"` for admin users, `"agent"` for agent users (matches Prisma UserRole enum values).

**How to apply:** Include the exact-keys assertion in any test that hits /api/me with an authenticated context.
