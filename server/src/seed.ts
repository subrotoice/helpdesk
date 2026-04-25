import "dotenv/config";
import { auth } from "./auth";
import { db } from "./db";
import { UserRole } from "./generated/prisma/client";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error(
    "Missing env: ADMIN_EMAIL and ADMIN_PASSWORD must be set (see .env.example)",
  );
  process.exit(1);
}

async function main() {
  const ctx = await auth.$context;

  const existing = await ctx.adapter.findOne<{ id: string; role: UserRole }>({
    model: "user",
    where: [{ field: "email", value: email! }],
  });

  if (existing) {
    if (existing.role !== UserRole.admin) {
      await ctx.adapter.update({
        model: "user",
        where: [{ field: "id", value: existing.id }],
        update: { role: UserRole.admin, updatedAt: new Date() },
      });
      console.log(`Promoted ${email} to ${UserRole.admin} (id=${existing.id})`);
    } else {
      console.log(`${UserRole.admin} ${email} already exists (id=${existing.id})`);
    }
    return;
  }

  const hashed = await ctx.password.hash(password!);
  const now = new Date();

  const user = await ctx.adapter.create<{ id: string }>({
    model: "user",
    data: {
      email: email!,
      name: "Admin",
      emailVerified: true,
      role: UserRole.admin,
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

  console.log(`Created ${UserRole.admin} ${email} (id=${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
