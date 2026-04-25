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

Better Auth with email/password and database sessions (Prisma adapter, PostgreSQL).

- **Sign-up is disabled** (`disableSignUp: true` in `server/src/auth.ts`). Users are created via `bun run seed` in `server/`, which reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env` and creates a new admin or promotes an existing user.
- **Roles**: Prisma enum `UserRole = admin | agent`, default `agent`. Declared as a Better Auth additional field with `input: false`, so clients cannot self-assign a role on sign-up — role changes go through the server (e.g. the seed script).
- **Server mount**: `server/src/index.ts` mounts all Better Auth routes at `/api/auth/*splat` via `toNodeHandler(auth)`. The auth handler is mounted **before** `express.json()` — keep that order, the handler reads the raw body itself. CORS uses `credentials: true` so the session cookie travels cross-origin in dev.
- **Server-side guard**: `requireAuth` middleware in `server/src/require-auth.ts` resolves the session with `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`, returns `401` if absent, otherwise attaches it to `res.locals.session`. Apply per-route (see `/api/me` in `server/src/index.ts`).
- **Client**: `authClient = createAuthClient()` in `client/src/lib/auth-client.ts` exports `signIn`, `signOut`, `useSession`. Route guard is `client/src/components/RequireAuth.tsx` — returns `null` while `isPending`, redirects to `/login` when there's no session.
- **Trusted origins** come from `CLIENT_ORIGIN` (defaults to `http://localhost:5173`); set this in production to the deployed client URL.
- **Env vars** (see `server/.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

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
