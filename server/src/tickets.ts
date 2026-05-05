import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "./db";
import { requireAuth } from "./require-auth";
import type { Prisma } from "./generated/prisma/client";

const ticketSelect = {
  id: true,
  subject: true,
  senderEmail: true,
  senderName: true,
  status: true,
  category: true,
  createdAt: true,
  assignedTo: {
    select: { id: true, name: true },
  },
} as const;

const SORTABLE_FIELDS = [
  "subject",
  "senderEmail",
  "status",
  "category",
  "createdAt",
  "assignedTo",
] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

const VALID_STATUSES = ["open", "resolved", "closed"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

const ticketQuerySchema = z.object({
  sortBy: z.enum(SORTABLE_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

function buildOrderBy(
  sortBy: SortableField,
  order: "asc" | "desc",
): Prisma.TicketOrderByWithRelationInput {
  switch (sortBy) {
    case "subject":
      return { subject: order };
    case "senderEmail":
      return { senderEmail: order };
    case "status":
      return { status: order };
    case "category":
      return { category: order };
    case "assignedTo":
      return { assignedTo: { name: order } };
    default:
      return { createdAt: order };
  }
}

function buildWhere(
  statuses: ValidStatus[],
  category: string | undefined,
  search: string | undefined,
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};
  if (statuses.length > 0) where.status = { in: statuses };
  if (category) where.category = category;
  if (search)
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { senderName: { contains: search, mode: "insensitive" } },
      { senderEmail: { contains: search, mode: "insensitive" } },
    ];
  return where;
}

const ticketDetailSelect = {
  id: true,
  subject: true,
  body: true,
  senderEmail: true,
  senderName: true,
  status: true,
  category: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: {
    select: { id: true, name: true },
  },
} as const;

export const ticketsRouter = Router();

ticketsRouter.get(
  "/tickets/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }
    const ticket = await db.ticket.findUnique({
      where: { id },
      select: ticketDetailSelect,
    });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json(ticket);
  },
);

ticketsRouter.patch(
  "/tickets/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }
    const schema = z.object({
      assignedToId: z.string().nullable().optional(),
      status: z.enum(VALID_STATUSES).optional(),
      category: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "ValidationError", issues: parsed.error.issues });
      return;
    }
    const { assignedToId, status, category } = parsed.data;

    if (assignedToId !== undefined && assignedToId !== null) {
      const agent = await db.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, role: true, deletedAt: true },
      });
      if (!agent || agent.deletedAt !== null) {
        res.status(400).json({ error: "Invalid agent" });
        return;
      }
    }

    const existing = await db.ticket.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    const updated = await db.ticket.update({
      where: { id },
      data: {
        ...(assignedToId !== undefined && { assignedToId }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
      },
      select: ticketDetailSelect,
    });
    res.json(updated);
  },
);

ticketsRouter.get(
  "/tickets",
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = ticketQuerySchema.safeParse(req.query);
    const { sortBy, order, status, category, search, page, pageSize } =
      parsed.success
        ? parsed.data
        : {
            sortBy: "createdAt" as const,
            order: "desc" as const,
            status: undefined,
            category: undefined,
            search: undefined,
            page: 1,
            pageSize: 10,
          };

    const statuses = status
      ? status
          .split(",")
          .filter((s): s is ValidStatus =>
            (VALID_STATUSES as readonly string[]).includes(s),
          )
      : [];

    const where = buildWhere(statuses, category, search);

    const [tickets, total] = await db.$transaction([
      db.ticket.findMany({
        select: ticketSelect,
        orderBy: buildOrderBy(sortBy, order),
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.ticket.count({ where }),
    ]);

    res.json({ tickets, total, page, pageSize });
  },
);
