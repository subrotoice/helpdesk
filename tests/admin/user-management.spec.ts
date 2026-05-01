import { expect, test } from "@playwright/test";

// The chromium project injects tests/.auth/admin.json as storageState, so
// every test here runs with an active admin session.

// Unique-enough values to avoid collisions if a previous run left debris.
const TIMESTAMP = Date.now();
const NEW_USER_NAME = `E2E Agent ${TIMESTAMP}`;
const NEW_USER_EMAIL = `e2e-agent-${TIMESTAMP}@test.local`;
const NEW_USER_PASSWORD = "TestPassword1!";
const UPDATED_USER_NAME = `E2E Agent Updated ${TIMESTAMP}`;

test.describe("User management — CRUD (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/users");
    // Wait for the table to finish loading before each test.
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    // The skeleton rows disappear and real rows appear; wait for at least the
    // seeded admin row, which is always present after global-setup.
    await expect(
      page.getByRole("cell", { name: process.env.ADMIN_EMAIL!, exact: true }),
    ).toBeVisible();
  });

  // ── Read ─────────────────────────────────────────────────────────────────

  test("navigating to /users shows the page heading and at least one user row", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Users" }),
    ).toBeVisible();

    // The table renders inside a region with column headers.
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Email" }),
    ).toBeVisible();

    // The seeded admin user must always be present.
    await expect(
      page.getByRole("cell", { name: process.env.ADMIN_EMAIL!, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: process.env.ADMIN_EMAIL! }),
    ).toBeVisible();
  });

  // ── Create ────────────────────────────────────────────────────────────────

  test("clicking Create user opens the dialog and submitting creates a new user row", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create user" }).click();

    // Dialog should be visible with the correct title.
    await expect(
      page.getByRole("dialog", { name: "Create user" }),
    ).toBeVisible();

    await page.getByLabel("Name").fill(NEW_USER_NAME);
    await page.getByLabel("Email").fill(NEW_USER_EMAIL);
    await page.getByLabel("Password").fill(NEW_USER_PASSWORD);

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/users") && r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Create user" }).last().click(),
    ]);

    expect(response.status()).toBe(201);

    // Dialog closes on success.
    await expect(
      page.getByRole("dialog", { name: "Create user" }),
    ).not.toBeVisible();

    // New user row should appear in the table.
    await expect(page.getByRole("cell", { name: NEW_USER_NAME, exact: true })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: NEW_USER_EMAIL, exact: true }),
    ).toBeVisible();
  });

  // ── Edit ──────────────────────────────────────────────────────────────────

  test("clicking the edit button on a user opens the dialog pre-filled and saving updates the row", async ({
    page,
  }) => {
    // Create the target user first so this test is self-contained.
    const editName = `Edit Target ${TIMESTAMP}`;
    const editEmail = `edit-target-${TIMESTAMP}@test.local`;

    await page.getByRole("button", { name: "Create user" }).click();
    await page.getByLabel("Name").fill(editName);
    await page.getByLabel("Email").fill(editEmail);
    await page.getByLabel("Password").fill(NEW_USER_PASSWORD);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/users") && r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Create user" }).last().click(),
    ]);
    await expect(
      page.getByRole("dialog", { name: "Create user" }),
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name: editName, exact: true })).toBeVisible();

    // Now open the edit dialog for this user.
    await page.getByRole("button", { name: `Edit ${editName}` }).click();

    await expect(
      page.getByRole("dialog", { name: "Edit user" }),
    ).toBeVisible();

    // Form should be pre-filled with the existing name.
    await expect(page.getByLabel("Name")).toHaveValue(editName);
    await expect(page.getByLabel("Email")).toHaveValue(editEmail);

    // Clear and enter the updated name.
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill(UPDATED_USER_NAME);

    const [patchResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/users/") &&
          r.request().method() === "PATCH",
      ),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);

    expect(patchResponse.status()).toBe(200);

    // Dialog closes on success.
    await expect(
      page.getByRole("dialog", { name: "Edit user" }),
    ).not.toBeVisible();

    // Updated name appears in the table; old name is gone.
    await expect(
      page.getByRole("cell", { name: UPDATED_USER_NAME, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: editName, exact: true }),
    ).not.toBeVisible();
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  test("clicking delete on a user and confirming removes them from the table", async ({
    page,
  }) => {
    // Create the target user first so this test is self-contained.
    const deleteName = `Delete Target ${TIMESTAMP}`;
    const deleteEmail = `delete-target-${TIMESTAMP}@test.local`;

    await page.getByRole("button", { name: "Create user" }).click();
    await page.getByLabel("Name").fill(deleteName);
    await page.getByLabel("Email").fill(deleteEmail);
    await page.getByLabel("Password").fill(NEW_USER_PASSWORD);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/users") && r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Create user" }).last().click(),
    ]);
    await expect(
      page.getByRole("dialog", { name: "Create user" }),
    ).not.toBeVisible();
    await expect(page.getByRole("cell", { name: deleteName, exact: true })).toBeVisible();

    // Open the delete confirmation dialog.
    await page.getByRole("button", { name: `Delete ${deleteName}` }).click();

    await expect(
      page.getByRole("dialog", { name: "Delete user" }),
    ).toBeVisible();

    // Confirmation description mentions the user's name.
    await expect(
      page.getByRole("dialog", { name: "Delete user" }),
    ).toContainText(deleteName);

    const [deleteResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/users/") &&
          r.request().method() === "DELETE",
      ),
      page.getByRole("button", { name: "Delete" }).click(),
    ]);

    expect(deleteResponse.status()).toBe(204);

    // Dialog closes on success.
    await expect(
      page.getByRole("dialog", { name: "Delete user" }),
    ).not.toBeVisible();

    // User row is gone from the table.
    await expect(
      page.getByRole("cell", { name: deleteName, exact: true }),
    ).not.toBeVisible();
  });
});
