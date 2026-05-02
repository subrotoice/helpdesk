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

const ticketQuerySchema = z.object({
  sortBy: z.enum(SORTABLE_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

function buildOrderBy(
  sortBy: SortableField | undefined,
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

export const ticketsRouter = Router();

ticketsRouter.get(
  "/tickets",
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = ticketQuerySchema.safeParse(req.query);
    const { sortBy, order } = parsed.success
      ? parsed.data
      : { sortBy: "createdAt" as const, order: "desc" as const };

    const tickets = await db.ticket.findMany({
      select: ticketSelect,
      orderBy: buildOrderBy(sortBy, order),
    });
    res.json({ tickets });
  },
);
