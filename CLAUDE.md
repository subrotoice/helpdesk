# CLAUDE.md

Ticket management system: AI-assisted classification, replies, routing. Full scope in `project-scope.md`; plan in `implementation-plan.md`.

**Stack:** React 19 + Vite (`client/`, :5173) · Express 5 + Bun (`server/`, :4000) · PostgreSQL + Prisma · Better Auth · TanStack Query + axios · Vercel AI SDK (`ai`) + `@ai-sdk/groq` · Resend.

**AI:** Use Vercel AI SDK `generateText` with Groq, model `groq("openai/gpt-oss-120b")`, key `GROQ_API_KEY` in `server/.env`. Never use the Anthropic SDK directly.

---

## Dev / Test

```bash
cd server && bun run dev    # Express, watch
cd client && bun run dev    # Vite HMR
```

- Vite proxies `/api/*` → `localhost:4000` (no CORS in dev).
- Test ports: server **4001**, client **5174** (`server/.env.test`). Specs hitting the API must use `` `http://localhost:${process.env.PORT ?? 4000}` `` — never hardcode `4000`.

---

## Authentication

Better Auth, email/password, DB sessions. Sign-up disabled — `bun run seed` reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `server/.env` (password min 16 chars, enforced by `seed.ts`).

- **Roles** (`admin` | `agent`, default `agent`): Prisma enum + Better Auth additional field with `input: false` (no client self-assignment). Client must use `UserRole` from `@/lib/roles` — never raw `"admin"`/`"agent"` strings.
- **Mount order**: `toNodeHandler(auth)` at `/api/auth/*splat` mounts **before** `express.json()` (auth reads raw body).
- **Middlewares** (`server/src/require-auth.ts`): `requireAuth` → 401 or sets `res.locals.session`; `requireAdmin` → 403 unless role is admin. Chain admin routes as `requireAuth, requireAdmin, handler`.
- **Rate limiting** (`server/src/auth.ts`): gated on `NODE_ENV === "production"` (global 100/60s, `/sign-in/email` 5/60s). Off in dev/test (`toNodeHandler` can't read IP through Express). In prod requires `x-forwarded-for` or limits silently skip.
- **Prod startup** (`server/src/index.ts`) throws if `NODE_ENV=production` and `CLIENT_ORIGIN` unset.
- **Client** (`client/src/lib/auth-client.ts`): `inferAdditionalFields({ user: { role: { type: "string" } } } as const)` — `as const` required or `role` silently drops from the typed user. Always use `getRole(user)`, never `session.user.role` (works around a sticky VS Code phantom diagnostic — don't refactor away).
- **Env vars** (`.env.example` is placeholders only): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

---

## Testing

### E2E (Playwright)

- Delegate **all** E2E work (specs, runs, `playwright.config.ts`, `tests/global-setup.ts`) to the `playwright-e2e-writer` agent. Never write Playwright tests inline.
- For quick lookups (commands, etc.), read `.claude/agents/playwright-e2e-writer.md` directly.
- **Scope**: only E2E what unit tests cannot — real auth flows (session guards, redirects), DB round-trips (submit → re-fetch), cross-process concerns (query invalidation w/ real server). Never duplicate mocked-axios unit coverage.

### Component (Vitest 4 + jsdom + RTL + jest-dom)

Config in `client/vite.config.ts` `test` block (globals on, setup `client/src/test/setup.ts`). Run from `client/`:

```bash
bun run test              # all, single pass
bun run test:watch        # watch
bun run test:components   # filters .test.tsx (substring, not glob)
```

- Co-locate: `Foo.tsx` → `Foo.test.tsx` (`.tsx` suffix is what `test:components` filters on).
- Wrap TanStack Query components with `renderWithQuery` (`@/test/renderWithQuery`) — sets `retry: false`.
- Mock axios at module level: `vi.mock("axios", () => ({ default: { get: vi.fn() } }))`; drive with `vi.mocked(axios.get).mockResolvedValue/mockRejectedValue`. `vi.clearAllMocks()` in `afterEach`.
- Prefer role/text queries; use `within(row)` for repeated text in tables.
- Canonical: `client/src/pages/Users.test.tsx`.

---

## Conventions

- **Keep CLAUDE.md lean** — when adding rules, compress/merge with existing bullets; never duplicate, narrate, or add fluff. Drop anything derivable from code.
- **context7** before any code touching a library/SDK — training data may be stale.
- All server routes under `/api`. TypeScript strict on both sides.
- No comments unless the WHY is non-obvious.
- **Tailwind v4**: `@import "tailwindcss"` in CSS; no `tailwind.config.js`.
- **Bun** is runtime + package manager (`bun add`/`run`/`--watch`); no npm.
- **shadcn/ui**: install via `bunx --bun shadcn@latest add <name>`. Radix-nova preset uses `Field`/`FieldGroup`/`FieldLabel`/`FieldError` (`@/components/ui/field`) — **no `Form` component**. Wire RHF via `Controller` with `data-invalid={fieldState.invalid}` on `Field` and `aria-invalid` on the input. Example: `client/src/pages/Login.tsx`.
- **Forms**: `react-hook-form` + `zod` via `zodResolver(schema)`. Single schema, derive types with `z.infer`, surface server errors via `setError("root", …)`. Mirror server-side with `safeParse` → `{ error: "ValidationError", issues }` on 400. Examples: `Login.tsx`, `CreateUserDialog.tsx` (`useMutation` dialog), `server/src/users.ts`.
- **Server state**: TanStack React Query (`useQuery`/`useMutation`), not `useEffect` + `useState`.
- **Ticket sub-components**: accept a `ticket` prop typed as a structural subset (only fields read), never individual scalar props. Page passes `ticket={ticket}`; structural typing handles compat.
- **Path alias** `@/*` → `client/src/*` (set in `client/tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`). TS 6 drops `baseUrl`; use `paths` alone.
