import { expect, test } from "@playwright/test";

// ── Unauthenticated ────────────────────────────────────────────────────────

test.describe("Unauthenticated route guards", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/ redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("/tickets redirects to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/tickets");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("/users redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/users");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });
});

// ── Agent role ─────────────────────────────────────────────────────────────

test.describe("Agent role access", () => {
  test.use({ storageState: "tests/.auth/agent.json" });

  test("/users redirects agent to / (not admin)", async ({ page }) => {
    await page.goto("/users");
    await page.waitForURL("/");
    expect(page.url()).not.toContain("/users");
  });

  test("/ renders for agent", async ({ page }) => {
    await page.goto("/");
    // RequireAuth renders children — the page should not redirect.
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("/tickets renders for agent", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page).toHaveURL("/tickets");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("navbar has no Users link for agent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Users" }),
    ).not.toBeVisible();
  });
});

// ── Admin role ─────────────────────────────────────────────────────────────

test.describe("Admin role access", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  test("/users renders for admin", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("navbar shows Users link for admin", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });
});
