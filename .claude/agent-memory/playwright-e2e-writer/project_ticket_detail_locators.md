---
name: TicketDetailPage locators and structure
description: Verified locator patterns for /tickets/:id — heading, status badge, reply form, sidebar selects
type: project
---

Page file: `client/src/pages/TicketDetailPage.tsx`. Route: `/tickets/:id`. Guard: RequireAuth.

**Outer structure:** `<section>` wrapper → BackToTickets + TicketHeader + 12-col grid. Left 9 cols: MetaCard, MessageCard, ReplyThread, ReplyForm. Right 3 cols: TicketSidebar.

**Heading:** `getByRole("heading", { name: ticket.subject })` — TicketHeader renders `<h1>`.

**Status badge:** A `<span>` in TicketHeader with the human-readable label ("Open", "Resolved", "Closed"). The sidebar never renders these labels as bare spans — only as combobox trigger text — so `page.locator("span").filter({ hasText: /^Open$/ })` is unambiguous.

**Reply form:** `getByPlaceholder("Write your reply…")` for the textarea; `getByRole("button", { name: "Send reply" })` for submit. After successful POST the textarea value resets to "".

**Sidebar selects:** Three Radix Select components, each inside a `<div>` containing a `<p>` label ("Assigned To", "Status", "Category"). The trigger renders as `role="combobox"`. Locate the correct one by:
```ts
const statusSection = page.locator("p").filter({ hasText: /^Status$/ }).locator("..");
const statusCombobox = statusSection.getByRole("combobox");
```
Options render into a Radix portal — query them from `page`, not from `statusSection`.

**Ticket creation in tests:** Use `POST /webhooks/email` (public, no auth). Returns `{ ticketId: number }` on 201. Subject is unique per test to avoid false positive matches.

**Key query invalidation pattern:** After PATCH status, the `onSuccess` handler calls `queryClient.invalidateQueries({ queryKey: ["ticket", id] })`. Use `waitForResponse` on the PATCH, then assert the header badge change with auto-retrying `expect`.

**Why this matters:** The sidebar has three comboboxes with no aria-label; the `<p>` label → parent div → combobox traversal is the only reliable way to target a specific one without nth-based selectors.
