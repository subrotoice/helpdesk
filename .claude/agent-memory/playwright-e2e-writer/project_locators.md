---
name: Locators verified against source
description: Playwright locators verified against rendered HTML for this app's components
type: project
---

Verified against `client/src/pages/Login.tsx` and `client/src/components/Navbar.tsx`:

**Login form:**
- Email input: `page.getByLabel("Email")` — FieldLabel renders as `<label>` (via shadcn Label), htmlFor="email" matches Input id="email"
- Password input: `page.getByLabel("Password")` — same pattern
- Submit button: `page.getByRole("button", { name: /sign in/i })` — shadcn Button renders as `<button>`; text alternates "Sign in" / "Signing in…"
- Field validation errors: `page.getByRole("alert")` — FieldError renders `<div role="alert">`; when multiple errors, use `.filter({ hasText: "..." })` for specificity
- Root error (server error): `page.locator("p.text-destructive")` — rendered as `<p className="text-sm text-destructive">` with no ARIA role

**Navbar:**
- Sign-out: `page.getByRole("button", { name: /sign out/i })` — plain `<button>` (NOT shadcn Button component)
- Users link: `page.getByRole("link", { name: "Users" })` — React Router Link renders as `<a>`
- Navbar visible check: `page.getByRole("navigation")` — the `<nav>` element; returns null if no session

**FieldError rendering:** when there is exactly one error, renders the message text directly (not a list). With multiple errors, renders `<ul>`.
