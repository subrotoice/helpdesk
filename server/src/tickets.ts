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

export const ticketsRouter = Router();

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
