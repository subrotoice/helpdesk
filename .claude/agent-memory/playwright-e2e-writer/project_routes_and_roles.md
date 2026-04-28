---
name: Route map and roles
description: Which routes exist, their auth requirements, and redirect behaviour
type: project
---

Routes defined in `client/src/App.tsx`:

| Path | Guard | Unauthenticated | Non-admin authenticated |
|------|-------|-----------------|------------------------|
| `/login` | none (public) | renders | renders (redirected away by useEffect if session present) |
| `/` | RequireAuth | → `/login` | renders |
| `/tickets` | RequireAuth | → `/login` | renders |
| `/users` | RequireAdmin | → `/login` | → `/` |

`RequireAuth` (client/src/components/RequireAuth.tsx): `isPending` → null; no session → `Navigate to="/login"`; else renders children.

`RequireAdmin` (client/src/components/RequireAdmin.tsx): `isPending` → null; no session → `Navigate to="/login"`; role !== admin → `Navigate to="/"`.

Login page redirect: `useEffect` watches `session` — if truthy, `navigate("/", { replace: true })`.

**Why:** Knowing redirect targets lets tests use `waitForURL` with the right path rather than timing-based waits.
