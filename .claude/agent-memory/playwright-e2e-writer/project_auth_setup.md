---
name: Auth test setup pattern
description: How auth.setup.ts provisions agent user and saves storage states for admin/agent roles
type: project
---

Setup project (`tests/auth.setup.ts`) uses `setup` from `@playwright/test` with the `browser` fixture (not `page`) to get independent contexts.

**Agent user creation:** imports `auth` from `../server/src/auth`, awaits `auth.$context`, calls `ctx.adapter.findOne` to check, then `ctx.password.hash` + `ctx.adapter.create` for user and account rows — identical pattern to `server/src/seed.ts`. Public sign-up endpoint is disabled (`disableSignUp: true`).

**Storage states:** `tests/.auth/admin.json` and `tests/.auth/agent.json`. Directory created with `fs.mkdirSync(AUTH_DIR, { recursive: true })` at module load time.

**Context isolation:** admin login in `browser.newContext()` → close; agent login in a separate `browser.newContext()` → close. Prevents cookie bleed between sessions.

**Why:** `page` fixture shares one context; using `browser` allows creating fresh isolated contexts for each role login.

**How to apply:** Always use `browser` fixture in setup files that need to save multiple role storage states.
