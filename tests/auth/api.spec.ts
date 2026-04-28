import { expect, test } from "@playwright/test";

// These tests use Playwright's `request` fixture to call the Express server
// directly (port 4000). The Vite dev-server proxy only applies to browser
// requests, not to APIRequestContext, so we target the backend URL explicitly.
//
// Override the chromium project's default `storageState: tests/.auth/admin.json`
// so the request fixture starts with no cookies — these tests manage their own
// auth. Per-test browser contexts created below set their own storageState.
test.use({ storageState: { cookies: [], origins: [] } });

const API = "http://localhost:4000";

// ── sign-in endpoint ───────────────────────────────────────────────────────

test.describe("POST /api/auth/sign-in/email", () => {
  test("valid admin credentials return 200 and set a session cookie", async ({
    request,
  }) => {
    const response = await request.post(`${API}/api/auth/sign-in/email`, {
      data: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
    });

    expect(response.status()).toBe(200);

    const setCookie = response.headers()["set-cookie"];
    expect(setCookie).toBeTruthy();
  });

  test("wrong password returns 4xx and does not set a session cookie", async ({
    request,
  }) => {
    const response = await request.post(`${API}/api/auth/sign-in/email`, {
      data: {
        email: process.env.ADMIN_EMAIL,
        password: "definitely-wrong-password",
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    // Better Auth should not issue a session cookie on failure.
    const setCookie = response.headers()["set-cookie"] ?? "";
    // The cookie header either absent or does not contain a session token value.
    expect(setCookie).not.toMatch(/better-auth\.session_token=[^;]+/);
  });

  test("non-existent email returns 4xx", async ({ request }) => {
    const response = await request.post(`${API}/api/auth/sign-in/email`, {
      data: {
        email: "nobody@nowhere.invalid",
        password: "SomePassword123",
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

// ── sign-up endpoint (disabled) ────────────────────────────────────────────

test.describe("POST /api/auth/sign-up/email", () => {
  test("returns an error because sign-up is disabled", async ({ request }) => {
    const response = await request.post(`${API}/api/auth/sign-up/email`, {
      data: {
        email: "newuser@example.com",
        password: "SomeStr0ngPassword!",
        name: "New User",
      },
    });

    // Better Auth returns a non-2xx status when disableSignUp is true.
    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

// ── /api/me endpoint ───────────────────────────────────────────────────────

test.describe("GET /api/me", () => {
  test("without cookies returns 401 with { error: Unauthorized }", async ({
    request,
  }) => {
    const response = await request.get(`${API}/api/me`);

    expect(response.status()).toBe(401);

    const body = await response.json() as Record<string, unknown>;
    expect(body).toEqual({ error: "Unauthorized" });
  });

  test("with admin session returns 200 and exactly { id, name, email, role } — no extra fields", async ({
    browser,
  }) => {
    // Create a context that carries the admin session cookie.
    const ctx = await browser.newContext({
      storageState: "tests/.auth/admin.json",
    });

    const response = await ctx.request.get(`${API}/api/me`);
    expect(response.status()).toBe(200);

    const body = await response.json() as Record<string, unknown>;

    // Assert the response contains exactly the four scoped fields.
    // This is a security property: password, createdAt, updatedAt, image, etc.
    // must NOT be present (see server/src/index.ts line 33).
    const keys = Object.keys(body).sort();
    expect(keys).toEqual(["email", "id", "name", "role"]);

    expect(body.email).toBe(process.env.ADMIN_EMAIL);
    expect(body.role).toBe("admin");
    expect(typeof body.id).toBe("string");
    expect(typeof body.name).toBe("string");

    await ctx.close();
  });

  test("with agent session returns 200 and role agent", async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: "tests/.auth/agent.json",
    });

    const response = await ctx.request.get(`${API}/api/me`);
    expect(response.status()).toBe(200);

    const body = await response.json() as Record<string, unknown>;
    expect(body.role).toBe("agent");
    expect(body.email).toBe(process.env.AGENT_EMAIL);

    await ctx.close();
  });

  // ── Skipped ──────────────────────────────────────────────────────────────

  test.skip("returns 429 after too many failed sign-in attempts", () => {
    // Rate limiting is gated on NODE_ENV === "production" in server/src/auth.ts.
    // It is disabled in the test environment; enable only when testing against
    // a production-like build.
  });
});
