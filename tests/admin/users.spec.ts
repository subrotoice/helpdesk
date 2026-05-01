import { expect, test } from "@playwright/test";

// Storage state is admin.json (set as default in playwright.config.ts).

const USER = {
  name: "Eve Tester",
  email: "eve.tester@example.com",
  password: "password123",
  updatedName: "Eve Updated",
};

// Serial so create → edit → delete share the same DB row in order.
test.describe.serial("User management — CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/users");
    await expect(
      page.getByRole("heading", { name: "Users", level: 1 }),
    ).toBeVisible();
  });

  // ── Read ────────────────────────────────────────────────────────────────────

  test("lists users — table is visible and the seed admin row is present", async ({
    page,
  }) => {
    await expect(page.getByRole("table")).toBeVisible();

    // The seed always creates the admin user; their email is our proof the API
    // responded and the table rendered real data (not just skeletons).
    await expect(
      page.getByRole("cell", { name: process.env.ADMIN_EMAIL! }),
    ).toBeVisible();
  });

  // ── Create ──────────────────────────────────────────────────────────────────

  test("creates a new agent user and shows them in the table", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /create user/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: /create user/i }),
    ).toBeVisible();

    await dialog.getByLabel("Name").fill(USER.name);
    await dialog.getByLabel("Email").fill(USER.email);
    await dialog.getByLabel("Password").fill(USER.password);
    await dialog.getByRole("button", { name: /^create user$/i }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("cell", { name: USER.name, exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: USER.email, exact: true })).toBeVisible();
  });

  // ── Edit ────────────────────────────────────────────────────────────────────

  test("edits the user's name and shows the updated name in the table", async ({
    page,
  }) => {
    await page.getByRole("button", { name: `Edit ${USER.name}` }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: /edit user/i }),
    ).toBeVisible();

    // Form should be pre-filled
    await expect(dialog.getByLabel("Name")).toHaveValue(USER.name);
    await expect(dialog.getByLabel("Email")).toHaveValue(USER.email);
    await expect(dialog.getByLabel(/new password/i)).toHaveValue("");

    await dialog.getByLabel("Name").clear();
    await dialog.getByLabel("Name").fill(USER.updatedName);
    await dialog.getByRole("button", { name: /save changes/i }).click();

    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: USER.updatedName, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: USER.name, exact: true }),
    ).not.toBeVisible();
  });

  // ── Delete ──────────────────────────────────────────────────────────────────

  test("deletes the user after confirmation and removes them from the table", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: `Delete ${USER.updatedName}` })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: /delete user/i }),
    ).toBeVisible();
    await expect(dialog.getByText(USER.updatedName)).toBeVisible();

    await dialog.getByRole("button", { name: /^delete$/i }).click();

    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: USER.updatedName, exact: true }),
    ).not.toBeVisible();
  });
});
