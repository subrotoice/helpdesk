import { expect, test } from "@playwright/test";

// All tests in this file start unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  // ── Happy paths ────────────────────────────────────────────────────────────

  test("valid admin credentials redirect to / and show Users nav link", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("valid agent credentials redirect to / and do not show Users nav link", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill(process.env.AGENT_EMAIL!);
    await page.getByLabel("Password").fill(process.env.AGENT_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Users" }),
    ).not.toBeVisible();
  });

  // ── Validation errors ──────────────────────────────────────────────────────

  test("submitting with empty email shows Email is required alert", async ({
    page,
  }) => {
    await page.getByLabel("Password").fill("anything");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Email is required" }),
    ).toBeVisible();
  });

  test("submitting with empty password shows Password is required alert", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Password is required" }),
    ).toBeVisible();
  });

  test("submitting both fields empty shows both required alerts", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Email is required" }),
    ).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: "Password is required" }),
    ).toBeVisible();
  });

  test("malformed email shows Enter a valid email alert", async ({ page }) => {
    await page.getByLabel("Email").fill("notanemail");
    await page.getByLabel("Password").fill("anything");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Enter a valid email" }),
    ).toBeVisible();
  });

  // ── Server-side errors ─────────────────────────────────────────────────────

  test("wrong password shows root error message and stays on /login", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("Password").fill("definitelywrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Root error is a plain <p>, not role="alert" — match by text presence
    await expect(page.locator("p.text-destructive")).toBeVisible();
    expect(page.url()).toContain("/login");
  });

  test("non-existent user shows root error message and stays on /login", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("SomePassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.locator("p.text-destructive")).toBeVisible();
    expect(page.url()).toContain("/login");
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  test("submit button shows Signing in… and is disabled while request is in flight", async ({
    page,
  }) => {
    // Intercept the sign-in request and delay it so we can observe the loading state.
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);

    const submitButton = page.getByRole("button", { name: /sign in/i });
    await submitButton.click();

    // While the delayed request is in flight the button should be disabled
    // and show the loading label.
    const loadingButton = page.getByRole("button", { name: /signing in/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();

    // Wait for the navigation to complete — the route.continue() resolves the delay.
    await page.waitForURL("/");
  });

  // ── Already authenticated ──────────────────────────────────────────────────

  test("already-authenticated user navigating to /login is redirected to /", async ({
    browser,
  }) => {
    // Use a context with admin storage state to simulate an already-logged-in user.
    const ctx = await browser.newContext({
      storageState: "tests/.auth/admin.json",
    });
    const authedPage = await ctx.newPage();

    await authedPage.goto("/login");
    await authedPage.waitForURL("/");
    await expect(authedPage.getByRole("navigation")).toBeVisible();

    await ctx.close();
  });

  // ── Skipped: known gaps ────────────────────────────────────────────────────

  test.skip("rate limiting returns 429 after repeated failed attempts", () => {
    // Rate limiting is gated on NODE_ENV === "production" in server/src/auth.ts.
    // It is disabled in the test environment, so this behaviour cannot be tested here.
  });

  test.skip("email address matching is case-insensitive", () => {
    // Case normalisation behaviour is not documented in the local source.
    // Better Auth may or may not lower-case emails; verify before enabling.
  });

  test.skip("whitespace around email is trimmed before submission", () => {
    // Trim-on-input behaviour is not documented in the local source.
    // Verify Better Auth or the zod schema trims before enabling.
  });
});
