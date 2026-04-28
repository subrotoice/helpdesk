import { expect, test } from "@playwright/test";

// Each test creates its own session via fresh UI login. We must NOT share the
// admin.json storageState here: signOut deletes the DB session row, which would
// invalidate the cookie for every other parallel test using that same state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Logout flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("clicking Sign out redirects to /login", async ({ page }) => {
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("after logout GET /api/me returns 401", async ({ page }) => {
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("/login");

    // Use page.request so the cookie jar is the same as the browser context
    // after the Better Auth sign-out has cleared the session cookie.
    const response = await page.request.get("http://localhost:4000/api/me");
    expect(response.status()).toBe(401);

    const body = await response.json() as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  test("after logout navigating to / redirects to /login", async ({ page }) => {
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("/login");

    await page.goto("/");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("after logout the navbar is no longer rendered", async ({ page }) => {
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("/login");

    await expect(page.getByRole("navigation")).not.toBeVisible();
  });
});
