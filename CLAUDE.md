# CLAUDE.md

Ticket management system: AI-assisted classification, replies, and routing for support tickets. Full scope in `project-scope.md`; phased plan in `implementation-plan.md`.

**Stack:** React 19 + Vite (`client/`, port 5173) · Express 5 + Bun (`server/`, port 4000) · PostgreSQL + Prisma · Better Auth · TanStack Query + axios (client data fetching) · Anthropic SDK · Resend.

---

## Dev Commands

```bash
cd server && bun run dev    # Express, watch mode
cd client && bun run dev    # Vite HMR
```

Vite proxies `/api/*` → `http://localhost:4000` (no CORS in dev). For E2E commands and infrastructure, see Testing.

---

## Authentication

Better Auth, email/password, DB sessions. Sign-up disabled — users seeded via `bun run seed` (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `server/.env`).

- **Roles** (`admin` | `agent`, default `agent`) — Prisma enum + Better Auth additional field with `input: false` (clients can't self-assign).
- **Mount order matters**: `toNodeHandler(auth)` at `/api/auth/*splat` is mounted **before** `express.json()` — the auth handler reads the raw body.
- **Auth middlewares** in `server/src/require-auth.ts`: `requireAuth` attaches session to `res.locals.session` or 401s; `requireAdmin` reads `res.locals.session.user.role` or 403s. Chain admin routes as `requireAuth, requireAdmin, handler`.
- **Rate limiting** (`server/src/auth.ts`) is gated on `NODE_ENV === "production"` — global 100/60s, `/sign-in/email` 5/60s. Off in dev/test (Better Auth's `toNodeHandler` can't read the IP through Express). In prod the request must arrive with `x-forwarded-for` set or limits silently skip.
- **Prod startup assertion**: `server/src/index.ts` throws if `NODE_ENV=production` and `CLIENT_ORIGIN` is unset.
- **Client** (`client/src/lib/auth-client.ts`): `createAuthClient` with `inferAdditionalFields({ user: { role: { type: "string" } } } as const)` — `as const` is required or `role` silently drops from the typed user. Always use `getRole(user)`, never `session.user.role` (the helper hides a cast that works around a sticky VS Code phantom diagnostic; don't refactor it away).
- **Env vars** (`server/.env.example` is placeholders only): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (min 16 chars enforced by `seed.ts`).

---

## Testing

### E2E (Playwright)

Delegate ALL E2E test work — writing specs, running them, modifying `playwright.config.ts` or `tests/global-setup.ts` — to the `playwright-e2e-writer` agent. Don't write Playwright tests inline.

For quick test-related questions ("what command runs the tests?"), read `.claude/agents/playwright-e2e-writer.md` directly instead of spawning the agent.

### Component (Vitest + React Testing Library)

Stack: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/jest-dom`. Config lives in `client/vite.config.ts` under the `test` block (globals on, setup file at `client/src/test/setup.ts`).

Commands (run from `client/`):

```bash
bun run test              # vitest run — all tests, single pass
bun run test:watch        # watch mode
bun run test:components   # vitest run .test.tsx — component tests only (substring filter, NOT a glob)
```

Conventions:

- Co-locate tests next to source: `Foo.tsx` → `Foo.test.tsx`. The `.tsx` suffix is what `test:components` filters on.
- Wrap components that use TanStack Query in a fresh `QueryClient` per render via `renderWithQuery` (`@/test/renderWithQuery`) — it sets `retry: false` so error cases resolve fast.
- Mock axios at the module level: `vi.mock("axios", () => ({ default: { get: vi.fn() } }))`, then drive each case with `vi.mocked(axios.get).mockResolvedValue(...)` / `.mockRejectedValue(...)`. Call `vi.clearAllMocks()` in `afterEach`.
- Prefer role/text queries over class/structure. Use `within(row)` to scope assertions to a specific table row when text repeats across rows.
- Canonical example: `client/src/pages/Users.test.tsx`.

---

## Conventions

- Always use context7 before writing code that touches a library/SDK — training data may be outdated.
- All server routes prefixed with `/api`. TypeScript strict on both sides.
- No comments unless the WHY is non-obvious.
- Tailwind v4 — `@import "tailwindcss"` in CSS; no `tailwind.config.js`.
- Bun is the runtime and package manager (`bun add`/`bun run`/`bun --watch`), no npm.
- shadcn/ui — install with `bunx --bun shadcn@latest add <name>`. Radix-nova preset uses `Field`/`FieldGroup`/`FieldLabel`/`FieldError` (from `@/components/ui/field`) — no `Form` component. Wire RHF via `Controller` with `data-invalid={fieldState.invalid}` on `Field` and `aria-invalid` on the input. Canonical example: `client/src/pages/Login.tsx`.
- Use TanStack React Query ('useQuery', 'useMutation') for server state management (not 'useEffect' + 'useState')
- Path alias `@/*` → `client/src/*` (set in `client/tsconfig.json`, `client/tsconfig.app.json`, `client/vite.config.ts`). TS 6 deprecates `baseUrl`, so `paths` is used alone.
