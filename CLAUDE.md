# CLAUDE.md

## Project

A ticket management system that uses AI to classify, respond to and route support ticket. Agents get AI-generated summaries and suggested replies backed by a knowledge base.

See `project-scope.md` for full feature list and `implementation-plan.md` for the phased task breakdown.

---

## Tech Stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Frontend   | React 19, TypeScript, Tailwind CSS v4, React Router v7, shadcn/ui (radix-nova preset) |
| Backend    | Express 5, TypeScript, Bun runtime                     |
| Database   | PostgreSQL + Prisma ORM                                |
| Auth       | Better Auth (email/password, database sessions)        |
| AI         | Anthropic Claude API (`@anthropic-ai/sdk`)             |
| Email      | Resend (inbound webhook + outbound)                    |
| Deployment | Docker + cloud provider                                |

---

## Project Structure

```
ticket-management-app/
├── client/          # React + Vite frontend (port 5173)
│   └── src/
│       ├── pages/   # Route-level components
│       └── App.tsx  # Root component + React Router setup
├── server/          # Express backend (port 4000)
│   └── src/
│       └── index.ts # Entry point, all API routes under /api
├── project-scope.md
├── tech-stack.md
└── implementation-plan.md
```

---

## Dev Commands

```bash
# Server (watch mode, auto-restarts on file change)
cd server && bun run dev

# Client (Vite HMR)
cd client && bun run dev
```

The Vite dev server proxies `/api/*` → `http://localhost:4000`, so the client never hits CORS issues in dev.

---

## Authentication

Better Auth, email/password, DB sessions (Prisma + PostgreSQL). Sign-up disabled — users created via `bun run seed` (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `server/.env`; creates or promotes to admin).

- **Roles** (`admin` | `agent`, default `agent`) — Prisma enum + Better Auth additional field with `input: false` (clients can't self-assign).
- **Server mount order matters**: `toNodeHandler(auth)` at `/api/auth/*splat` is mounted **before** `express.json()` — the auth handler reads the raw body. `requireAuth` (`server/src/require-auth.ts`) attaches the session to `res.locals.session` or returns 401.
- **Server-side admin gating doesn't exist yet.** `requireAuth` checks session only; any admin-only API route must add its own role check. `RequireAdmin` on the client is UX, not a security boundary.
- **Client** (`client/src/lib/auth-client.ts`): `createAuthClient` is configured with `inferAdditionalFields({ user: { role: { type: "string" } } } as const)` — the **`as const` is required**, without it the literal widens and `role` silently drops from the typed user. Exports: `signIn`, `signOut`, `useSession`, `getRole(user)`. Guards: `RequireAuth`, `RequireAdmin`.
- **Always use `getRole(user)`, never `session.user.role`** at call sites. The helper hides a `as unknown as { role: string }` cast that works around a sticky VS Code Problems-panel phantom diagnostic; `tsc -b` is unaffected. Don't refactor it away.
- **Env vars** (`server/.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGIN` (default `http://localhost:5173` — set to deployed client URL in prod), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

---

## Fetching Up-to-Date Documentation

**Always use context7 before writing code that touches a library, framework, or SDK.** Training data may be outdated — context7 provides current docs.

---

## Conventions

- All server routes are prefixed with `/api`
- TypeScript strict mode is enabled on both client and server
- No comments unless the WHY is non-obvious
- Tailwind v4 — use `@import "tailwindcss"` in CSS; no `tailwind.config.js` needed
- Bun is the runtime and package manager for both apps (`bun add`, `bun run`, `bun --watch`), no npm
- shadcn/ui — install components with `bunx --bun shadcn@latest add <name>`. The radix-nova preset uses **`Field`/`FieldGroup`/`FieldLabel`/`FieldError`** (from `@/components/ui/field`) for forms — there is no `Form` component. Wire react-hook-form via `Controller` with `data-invalid={fieldState.invalid}` on `Field` and `aria-invalid` on the input. See `client/src/pages/Login.tsx` for the canonical example.
- Path alias `@/*` resolves to `client/src/*` — set in `client/tsconfig.json`, `client/tsconfig.app.json`, and `client/vite.config.ts`. TS 6 deprecates `baseUrl`, so `paths` is used alone.
