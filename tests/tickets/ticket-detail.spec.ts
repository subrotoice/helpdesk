import { expect, test } from "@playwright/test";

// The server runs on PORT from the test env (4001); fall back to 4000 for
// local runs that haven't loaded .env.test explicitly.
const API_BASE = `http://localhost:${process.env.PORT ?? 4000}`;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Create a ticket via the public webhook endpoint and return its id.
 * Using the inbound-email webhook avoids any auth requirement at creation
 * time and keeps each test self-contained.
 */
async function createTicket(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  subject: string,
): Promise<number> {
  const res = await request.post(`${API_BASE}/webhooks/email`, {
    data: {
      from: "E2E Tester <e2e@example.com>",
      to: "support@helpdesk.local",
      subject,
      text: "This is the ticket body created by an E2E test.",
      headers: [],
    },
  });
  expect(res.status()).toBe(201);
  const body = (await res.json()) as { ticketId: number };
  return body.ticketId;
}

// ── 1. Auth guard ──────────────────────────────────────────────────────────

test.describe("TicketDetailPage — auth guard", () => {
  // Override the project-level storageState so this context has no session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated visit to /tickets/:id redirects to /login", async ({
    page,
    request,
  }) => {
    const ticketId = await createTicket(request, "Auth guard test ticket");

    await page.goto(`/tickets/${ticketId}`);

    // RequireAuth renders <Navigate to="/login" replace> when there is no session.
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });
});

// ── 2. Reply submission round-trip ─────────────────────────────────────────

test.describe("TicketDetailPage — reply submission", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("submitting the reply form persists the reply and shows it in the thread", async ({
    page,
    request,
  }) => {
    const ticketId = await createTicket(request, "Reply round-trip test ticket");

    await page.goto(`/tickets/${ticketId}`);

    // Wait for the skeleton to be replaced by the actual heading.
    await expect(
      page.getByRole("heading", { name: "Reply round-trip test ticket" }),
    ).toBeVisible();

    const replyText = "E2E reply — unique marker xkq9z2";

    const textarea = page.getByPlaceholder("Write your reply…");
    await expect(textarea).toBeVisible();
    await textarea.fill(replyText);

    // Click "Send reply" and wait for the POST to the replies endpoint to settle.
    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/tickets/${ticketId}/replies`) &&
          res.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Send reply" }).click(),
    ]);

    expect(postResponse.status()).toBe(201);

    // onSuccess invalidates the replies query → refetch → new ReplyCard appears.
    await expect(page.getByText(replyText)).toBeVisible();

    // The textarea is reset to empty after a successful submission.
    await expect(textarea).toHaveValue("");
  });
});

// ── 3. Status change UI sync ───────────────────────────────────────────────

test.describe("TicketDetailPage — status change syncs header badge", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("changing status via sidebar select updates the status badge in the header", async ({
    page,
    request,
  }) => {
    const ticketId = await createTicket(request, "Status sync test ticket");

    await page.goto(`/tickets/${ticketId}`);

    // Wait for page load.
    await expect(
      page.getByRole("heading", { name: "Status sync test ticket" }),
    ).toBeVisible();

    // The sidebar renders three labelled sections inside a `divide-y` wrapper.
    // Each section is a `div` containing a `<p>` label and a Radix Select trigger.
    // The Select trigger renders as role="combobox".
    //
    // Locate the Status section by finding the <p> whose text content is
    // "Status", then walking up to its parent div which owns the combobox.
    const statusSection = page
      .locator("p")
      .filter({ hasText: /^Status$/ })
      .locator("..")  // parent div of the <p> label
      ;

    // Tickets are created with status "open" by default.
    const statusCombobox = statusSection.getByRole("combobox");
    await expect(statusCombobox).toBeVisible();

    // Open the dropdown.
    await statusCombobox.click();

    // Radix renders options into a portal; query from the full page.
    await page.getByRole("option", { name: "Resolved" }).click();

    // Wait for the PATCH to complete before asserting the header update.
    await page.waitForResponse(
      (res) =>
        res.url().includes(`/api/tickets/${ticketId}`) &&
        res.request().method() === "PATCH" &&
        res.status() === 200,
    );

    // invalidateQueries triggers a GET refetch → TicketHeader re-renders
    // with the new status badge text.
    //
    // The status badge in TicketHeader is a <span> with the human-readable
    // label. The sidebar only ever renders combobox triggers for status, so
    // bare spans containing exactly "Resolved" or "Open" are unambiguous.
    await expect(
      page.locator("span").filter({ hasText: /^Resolved$/ }).first(),
    ).toBeVisible();

    // The "Open" badge is replaced — it should no longer appear.
    await expect(
      page.locator("span").filter({ hasText: /^Open$/ }),
    ).not.toBeVisible();
  });
});
