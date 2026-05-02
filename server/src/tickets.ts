import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { requireAuth } from "./require-auth";

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

export const ticketsRouter = Router();

ticketsRouter.get(
  "/tickets",
  requireAuth,
  async (_req: Request, res: Response) => {
    const tickets = await db.ticket.findMany({
      select: ticketSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json({ tickets });
  },
);
