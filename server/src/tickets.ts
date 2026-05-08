import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "./db";
import { requireAuth } from "./require-auth";
import type { Prisma } from "./generated/prisma/client";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

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
  "/tickets/:id/replies",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }
    const ticket = await db.ticket.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    const replies = await db.reply.findMany({
      where: { ticketId: id },
      select: {
        id: true,
        body: true,
        senderType: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(replies);
  },
);

const replySchema = z.object({
  body: z.string().min(1).max(10000),
});

ticketsRouter.post(
  "/tickets/:id/replies",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }
    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "ValidationError", issues: parsed.error.issues });
      return;
    }
    const ticket = await db.ticket.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    const session = res.locals.session as { user: { id: string } };
    const reply = await db.reply.create({
      data: {
        body: parsed.data.body,
        ticketId: id,
        authorId: session.user.id,
        senderType: "agent",
      },
      select: {
        id: true,
        body: true,
        senderType: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(reply);
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

const polishBodySchema = z.object({
  body: z.string().min(1).max(1000),
});

ticketsRouter.post(
  "/tickets/:id/summarize",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }
    const ticket = await db.ticket.findUnique({
      where: { id },
      select: { subject: true, body: true, senderName: true, senderEmail: true },
    });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    const replies = await db.reply.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      select: { body: true, senderType: true, author: { select: { name: true } }, createdAt: true },
    });

    const conversation = [
      `[Original message from ${ticket.senderName} <${ticket.senderEmail}>]\n${ticket.body}`,
      ...replies.map((r) => {
        const sender = r.senderType === "agent" ? (r.author?.name ?? "Agent") : ticket.senderName;
        return `[${r.senderType === "agent" ? "Agent" : "Customer"}: ${sender}]\n${r.body}`;
      }),
    ].join("\n\n---\n\n");

    try {
      const { text } = await generateText({
        model: groq("openai/gpt-oss-120b"),
        system:
          "You are a helpful assistant summarizing customer support tickets. Given the full ticket conversation below, produce a concise summary (3-5 sentences) that covers: the customer's issue, what steps have been taken, and the current status. Be clear and factual.",
        prompt: conversation,
      });
      res.json({ summary: text });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      res.status(502).json({ error: message });
    }
  },
);

ticketsRouter.post(
  "/tickets/:id/polish",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }
    const parsed = polishBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "ValidationError", issues: parsed.error.issues });
      return;
    }
    const session = res.locals.session as { user: { id: string; name: string } };
    const ticket = await db.ticket.findUnique({
      where: { id },
      select: { senderName: true },
    });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    try {
      const { text } = await generateText({
        model: groq("openai/gpt-oss-120b"),
        system:
          `You are an expert customer support agent. Improve the following draft reply to be more professional, clear, empathetic, and helpful. Address the customer by their first name: ${ticket.senderName}. Return only the improved reply text with no extra commentary.`,
        prompt: parsed.data.body,
      });
      const signature = `\n\n${session.user.name}\nhttps://edeves.com`;
      res.json({ body: text + signature });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      res.status(502).json({ error: message });
    }
  },
);
