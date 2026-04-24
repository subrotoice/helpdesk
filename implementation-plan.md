# Implementation Plan

An ordered breakdown of the work, grouped into phases. Each phase delivers a working slice of the system. Within a phase, tasks are sized to be completed in a single sitting.

---

## Phase 1 — Project Setup

Goal: A runnable skeleton with backend, frontend, and database talking locally.

- [ ] Create repo structure (`/client`, `/server`)
- [ ] Initialize backend: Node.js + Express + TypeScript
- [ ] Configure backend tooling: ESLint, Prettier, `tsx`/`ts-node-dev`, `dotenv`
- [ ] Initialize frontend: React + TypeScript (Vite)
- [ ] Set up PostgreSQL database

---

## Phase 2 — Authentication & User Management

Goal: Admin can log in and create agent accounts. Protected routes work end-to-end.

### Backend

- [ ] Password hashing helper (bcrypt)
- [ ] `POST /auth/login` — verify credentials, create DB session, return session cookie
- [ ] `POST /auth/logout` — invalidate session
- [ ] `GET /auth/me` — return current user
- [ ] Session middleware (reads cookie, attaches user to request)
- [ ] Role middleware (`requireAdmin`, `requireAgent`)
- [ ] `POST /users` (admin only) — create new agent
- [ ] `GET /users` (admin only) — list all users
- [ ] `DELETE /users/:id` (admin only)

### Frontend

- [ ] Auth context + `useAuth` hook
- [ ] Login page
- [ ] Protected route wrapper
- [ ] Admin-only route wrapper
- [ ] User management page (list, create, delete agents)
- [ ] App layout with top nav and logout button

---

## Phase 3 — Ticket Core

Goal: Agents can view, filter, and respond to tickets through the UI. No email or AI yet — create tickets manually.

### Backend

- [ ] `GET /tickets` — list with filters (status, category) and sort
- [ ] `GET /tickets/:id` — ticket with replies
- [ ] `POST /tickets` — manual ticket creation (for development)
- [ ] `PATCH /tickets/:id` — update status
- [ ] `POST /tickets/:id/replies` — add agent reply
- [ ] Pagination on the list endpoint

### Frontend

- [ ] Ticket list page with status/category filters and sort controls
- [ ] Ticket detail page showing thread of messages
- [ ] Reply composer
- [ ] Status change control (Open → Resolved → Closed)
- [ ] Empty and loading states

---

## Phase 4 — Email Integration

Goal: Real emails create tickets; agent replies get sent back to the student.

- [ ] Set up Resend account and domain verification
- [ ] Outbound: `sendEmail()` helper using Resend
- [ ] Wire agent reply endpoint to send email via Resend
- [ ] Inbound: `POST /webhooks/email` endpoint to receive Resend Inbound payloads
- [ ] Parse incoming email → create ticket (sender, subject, body)
- [ ] Link follow-up emails to existing ticket via message headers (`In-Reply-To` / `References`)
- [ ] Store raw email metadata for debugging
- [ ] End-to-end test: send email in → ticket appears; agent replies → email goes out

---

## Phase 5 — AI Features

Goal: Classification, summaries, suggested replies, and knowledge-base-driven auto-responses.

- [ ] Install `@anthropic-ai/sdk`, add API key to env
- [ ] Create `ai/` service module with a typed wrapper
- [ ] **Classification**: on ticket creation, call Claude Haiku to assign a category
- [ ] **Summary**: generate when ticket is created (stored on ticket record)
- [ ] **Suggested reply**: endpoint that returns a draft given ticket context + KB
- [ ] **Knowledge base**: `KnowledgeArticle` CRUD for admin; seed a few articles
- [ ] **Auto-response**: on new ticket, generate and send an initial KB-grounded reply
- [ ] Enable prompt caching on the knowledge base portion of prompts
- [ ] Frontend: show AI summary on ticket details; "Use suggested reply" button in composer
- [ ] Admin UI for managing knowledge base articles

---

## Phase 6 — Dashboard & Polish

Goal: An at-a-glance dashboard and a UI that feels finished.

- [ ] Dashboard page: open tickets, resolved today, avg response time, tickets by category
- [ ] Skeleton loaders on list and detail pages
- [ ] Toast notifications for success/error
- [ ] Form validation on all inputs
- [ ] Responsive layout check (mobile, tablet)
- [ ] Basic accessibility pass (labels, focus states, keyboard nav)

---

## Phase 7 — Deployment

Goal: Production deploy on a cloud provider, reproducible with Docker.

- [ ] `Dockerfile` for backend (multi-stage build)
- [ ] `Dockerfile` for frontend (build + nginx or static hosting)
- [ ] `docker-compose.yml` for production-like local run
- [ ] Environment variable documentation (`.env.example`)
- [ ] Pick and provision cloud provider (Railway / Render / Fly.io / AWS)
- [ ] Provision managed PostgreSQL
- [ ] Deploy backend and frontend
- [ ] Configure Resend webhook to point at deployed backend
- [ ] Run migrations and admin seed in production
- [ ] Smoke test: full flow in production (email in → AI reply out)

---

## Out of Scope (for v1)

These are deliberately deferred — revisit after v1 is stable:

- Multi-channel support (chat, phone)
- Student-facing portal to view their own tickets
- SLA tracking and escalation rules
- AI feedback loop (agent edits improving future suggestions)
- Analytics beyond the basic dashboard
- Multi-language support
