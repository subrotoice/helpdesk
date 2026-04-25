# CLAUDE.md

## Project

A ticket management system that uses AI to classify, respond to and route support ticket. Agents get AI-generated summaries and suggested replies backed by a knowledge base.

See `project-scope.md` for full feature list and `implementation-plan.md` for the phased task breakdown.

---

## Tech Stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Frontend   | React 19, TypeScript, Tailwind CSS v4, React Router v7 |
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

## Fetching Up-to-Date Documentation

**Always use context7 before writing code that touches a library, framework, or SDK.** Training data may be outdated — context7 provides current docs.

---

## Conventions

- All server routes are prefixed with `/api`
- TypeScript strict mode is enabled on both client and server
- No comments unless the WHY is non-obvious
- Tailwind v4 — use `@import "tailwindcss"` in CSS; no `tailwind.config.js` needed
- Bun is the runtime and package manager for both apps (`bun add`, `bun run`, `bun --watch`), no npm
