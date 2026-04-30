import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import { requireAdmin, requireAuth } from "./require-auth";
import { UserRole } from "./generated/prisma/client";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerified: true,
  createdAt: true,
} as const;

const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, (_req: Request, res: Response) => {
  const { id, name, email, role } = res.locals.session.user;
  res.json({ id, name, email, role });
});

usersRouter.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const users = await db.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  },
);

usersRouter.post(
  "/users",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "ValidationError",
        issues: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password } = parsed.data;
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const ctx = await auth.$context;
    const hashed = await ctx.password.hash(password);
    const now = new Date();
    const userId = crypto.randomUUID();

    const user = await db.user.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: false,
        role: UserRole.agent,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            providerId: "credential",
            accountId: userId,
            password: hashed,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      select: userSelect,
    });

    res.status(201).json({ user });
  },
);
