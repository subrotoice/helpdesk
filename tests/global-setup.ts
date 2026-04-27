import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, "..", "server");

dotenv.config({ path: path.join(SERVER_DIR, ".env.test") });

async function ensureDatabase(url: string) {
  const parsed = new URL(url);
  const dbName = decodeURIComponent(parsed.pathname.slice(1));
  if (!dbName) throw new Error("DATABASE_URL has no database name");

  parsed.pathname = "/postgres";
  const admin = new Client({ connectionString: parsed.toString() });
  await admin.connect();
  try {
    const exists = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (exists.rowCount === 0) {
      const safe = dbName.replace(/"/g, '""');
      await admin.query(`CREATE DATABASE "${safe}"`);
      console.log(`[global-setup] created database "${dbName}"`);
    }
  } finally {
    await admin.end();
  }
}

export default async function globalSetup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL not set — ensure server/.env.test exists and defines it",
    );
  }
  // Hard guard: refuse to wipe a database whose name does not contain "test".
  const dbName = new URL(url).pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to reset database "${dbName}" — its name must contain "test"`,
    );
  }

  await ensureDatabase(url);

  execSync("bunx --bun prisma db push --force-reset", {
    cwd: SERVER_DIR,
    stdio: "inherit",
    env: process.env,
  });

  execSync("bun src/seed.ts", {
    cwd: SERVER_DIR,
    stdio: "inherit",
    env: process.env,
  });
}
