import { expect, test } from "@playwright/test";

// All tests start as authenticated admin.
test.use({ storageState: "tests/.auth/admin.json" });

const API = "http://localhost:4000";

test.describe("Session persistence", () => {
  test("reloading the page keeps the user authenticated and on /", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    // Verify the session cookie is still accepted by the server.
    const response = await page.request.get(`${API}/api/me`);
    expect(response.status()).toBe(200);
  });

  test("two independent browser contexts with the same storage state can both authenticate", async ({
    browser,
  }) => {
    // Each context gets an independent cookie jar initialised from the same
    // saved storage state — simulating two tabs / windows opened separately.
    const ctx1 = await browser.newContext({
      storageState: "tests/.auth/admin.json",
    });
    const ctx2 = await browser.newContext({
      storageState: "tests/.auth/admin.json",
    });

    const [res1, res2] = await Promise.all([
      ctx1.request.get(`${API}/api/me`),
      ctx2.request.get(`${API}/api/me`),
    ]);

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);

    const [body1, body2] = await Promise.all([
      res1.json() as Promise<Record<string, unknown>>,
      res2.json() as Promise<Record<string, unknown>>,
    ]);

    expect(body1.role).toBe("admin");
    expect(body2.role).toBe("admin");

    await ctx1.close();
    await ctx2.close();
  });

  test("navigating between protected routes preserves authentication", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();

    await page.goto("/tickets");
    await expect(page).toHaveURL("/tickets");
    await expect(page.getByRole("navigation")).toBeVisible();

    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  // ── Skipped ────────────────────────────────────────────────────────────────

  test.skip("session expires after TTL and redirects to /login", () => {
    // Testing session expiry requires advancing the server clock or setting a
    // very short TTL in the test config. Neither is currently supported without
    // additional infrastructure. Skip until clock-manipulation helpers exist.
  });
});
