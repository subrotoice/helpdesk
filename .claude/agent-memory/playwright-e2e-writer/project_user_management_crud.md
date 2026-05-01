---
name: User management CRUD spec patterns
description: Patterns for testing /users page CRUD — test isolation strategy, key locators, and API response codes.
type: project
---

The `/users` page is admin-only. After `global-setup` + `auth.setup.ts` the DB always has two users: "Admin" (`admin@test.local`, role=admin) and "Agent" (`agent@test.local`, role=agent).

Key patterns from `tests/admin/user-management.spec.ts`:

- Tests inherit admin storageState from the chromium project — no `test.use` override needed.
- Each mutating test (edit, delete) creates its own user first with a `Date.now()` timestamp in name/email to avoid inter-test collisions if cleanup fails.
- Wait for the page to finish loading in `beforeEach` by asserting `getByRole("cell", { name: "Admin" })` is visible — this ensures the skeleton rows have resolved.
- Use `Promise.all([page.waitForResponse(...), button.click()])` to race the network call with the click — never click and then wait separately.
- API response codes: POST /api/users → 201, PATCH /api/users/:id → 200, DELETE /api/users/:id → 204.
- Admin row has no delete button (confirmed in UsersTable.tsx: `u.role !== UserRole.admin` guards the Trash2 button).
- Dialog titles: "Create user" / "Edit user" / "Delete user" — use `getByRole("dialog", { name: "..." })` to scope assertions.
- Edit form pre-fills: `getByLabel("Name")` / `getByLabel("Email")` — password field is `getByLabel("New password (optional)")` in edit mode.
- "Create user" button appears both in the page header AND as the submit button inside the dialog; use `.last()` to click the dialog submit when both are mounted.

**Why:** The `.last()` trick is non-obvious — `getByRole("button", { name: "Create user" })` matches two elements when the dialog is open (page header button + form submit button).

**How to apply:** Always use `.last()` on the "Create user" submit click when the dialog is open, or scope with `page.getByRole("dialog").getByRole("button", { name: "Create user" })`.
