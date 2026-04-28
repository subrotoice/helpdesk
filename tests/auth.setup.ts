import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup } from "@playwright/test";
import { auth } from "../server/src/auth";

// playwright.config.ts runs dotenv.config({ path: "server/.env.test" }) before
// any test or setup file is imported, so AGENT_EMAIL / AGENT_PASSWORD are
// already in process.env when this module loads.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.resolve(__dirname, ".auth");

// Ensure the directory exists so storageState({ path }) calls don't throw.
fs.mkdirSync(AUTH_DIR, { recursive: true });

setup("create agent user and save auth storage states", async ({ browser }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const agentEmail = process.env.AGENT_EMAIL;
  const agentPassword = process.env.AGENT_PASSWORD;

  if (!adminEmail || !adminPassword || !agentEmail || !agentPassword) {
    throw new Error(
      "Missing env vars: ADMIN_EMAIL, ADMIN_PASSWORD, AGENT_EMAIL and " +
        "AGENT_PASSWORD must all be set in server/.env.test",
    );
  }

  // ── 1. Idempotently provision the agent user via the Better Auth adapter ──
  //
  // We mirror the same pattern as server/src/seed.ts: check for an existing
  // user by email, then create user + account rows if absent.
  // Do NOT call the public sign-up endpoint — it is disabled (disableSignUp: true).

  const ctx = await auth.$context;

  const existing = await ctx.adapter.findOne<{ id: string }>({
    model: "user",
    where: [{ field: "email", value: agentEmail }],
  });

  if (!existing) {
    const hashed = await ctx.password.hash(agentPassword);
    const now = new Date();

    const user = await ctx.adapter.create<{ id: string }>({
      model: "user",
      data: {
        email: agentEmail,
        name: "Agent",
        emailVerified: true,
        role: "agent",
        createdAt: now,
        updatedAt: now,
      },
    });

    await ctx.adapter.create({
      model: "account",
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // ── 2. Admin UI login — isolate in its own browser context ────────────────

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto("/login");
  await adminPage.getByLabel("Email").fill(adminEmail);
  await adminPage.getByLabel("Password").fill(adminPassword);
  await adminPage.getByRole("button", { name: /sign in/i }).click();
  await adminPage.waitForURL("/");

  await adminContext.storageState({ path: path.join(AUTH_DIR, "admin.json") });
  await adminContext.close();

  // ── 3. Agent UI login — fresh context so no admin cookie leaks through ────

  const agentContext = await browser.newContext();
  const agentPage = await agentContext.newPage();

  await agentPage.goto("/login");
  await agentPage.getByLabel("Email").fill(agentEmail);
  await agentPage.getByLabel("Password").fill(agentPassword);
  await agentPage.getByRole("button", { name: /sign in/i }).click();
  await agentPage.waitForURL("/");

  await agentContext.storageState({ path: path.join(AUTH_DIR, "agent.json") });
  await agentContext.close();
});
