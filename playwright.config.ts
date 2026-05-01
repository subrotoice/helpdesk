import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "server", ".env.test") });

// Never reuse a running dev server: a process started against the dev DB
// would silently serve test traffic against the wrong database.
const REUSE = false;

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  globalSetup: "./tests/global-setup.ts",
  projects: [
    { name: "auth setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/admin.json",
      },
      dependencies: ["auth setup"],
    },
  ],
  webServer: [
    {
      command: "bun src/index.ts",
      cwd: "./server",
      url: "http://localhost:4001/api/health",
      reuseExistingServer: REUSE,
      timeout: 60_000,
    },
    {
      command: "bun run dev --port 5174",
      cwd: "./client",
      url: "http://localhost:5174",
      reuseExistingServer: REUSE,
      timeout: 60_000,
    },
  ],
});
