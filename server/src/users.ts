import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import { requireAdmin, requireAuth } from "./require-auth";
import { UserRole } from "./generated/prisma/client";
import { AI_AGENT_ID } from "./ai-agent";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerified: true,
  createdAt: true,
} as const;

const userBaseSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

const createUserSchema = userBaseSchema.extend({
  password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

const updateUserSchema = userBaseSchema.extend({
  password: z
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});

function validate<T>(schema: z.ZodSchema<T>, body: unknown, res: Response): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({
      error: "ValidationError",
      issues: parsed.error.flatten().fieldErrors,
    });
    return null;
  }
  return parsed.data;
}

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
      where: { deletedAt: null },
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
    const data = validate(createUserSchema, req.body, res);
    if (!data) return;
    const { name, email, password } = data;
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

usersRouter.patch(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const data = validate(updateUserSchema, req.body, res);
    if (!data) return;

    const id = String(req.params.id);
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { name, email, password } = data;

    if (email !== existing.email) {
      const conflict = await db.user.findUnique({ where: { email } });
      if (conflict && conflict.id !== id) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }
    }

    const now = new Date();
    await db.user.update({
      where: { id },
      data: { name, email, updatedAt: now },
    });

    if (password) {
      const ctx = await auth.$context;
      const hashed = await ctx.password.hash(password);
      await db.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: hashed, updatedAt: now },
      });
    }

    const user = await db.user.findUnique({
      where: { id },
      select: userSelect,
    });
    res.json({ user });
  },
);

usersRouter.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = String(req.params.id);

    if (id === AI_AGENT_ID) {
      res.status(403).json({ error: "AI agent cannot be deleted" });
      return;
    }

    const user = await db.user.findUnique({ where: { id } });

    if (!user || user.deletedAt !== null) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.role === UserRole.admin) {
      res.status(403).json({ error: "Admin accounts cannot be deleted" });
      return;
    }

    await db.$transaction([
      db.session.deleteMany({ where: { userId: id } }),
      db.ticket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } }),
      db.user.update({ where: { id }, data: { deletedAt: new Date() } }),
    ]);
    res.status(204).end();
  },
);
