import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "./db";
import { boss } from "./boss";
import { CLASSIFY_QUEUE } from "./workers";
import { AI_AGENT_ID } from "./ai-agent";

const headerSchema = z.object({ name: z.string(), value: z.string() });

const inboundEmailSchema = z.object({
  from: z.string(),
  to: z.string(),
  subject: z.string().default("(no subject)"),
  text: z.string().optional(),
  html: z.string().optional(),
  headers: z.array(headerSchema).default([]),
});

export function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim().toLowerCase() };
  return { name: "", email: from.trim().toLowerCase() };
}

export function findHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string | undefined {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s{2,}/g, " ").trim();
}

export const webhooksRouter = Router();

webhooksRouter.post("/email", async (req: Request, res: Response) => {
  if (process.env.WEBHOOK_SECRET) {
    const signature = req.headers["svix-signature"];
    if (!signature) {
      console.warn("[webhook] WEBHOOK_SECRET set but svix-signature header missing");
    }
  }

  const parsed = inboundEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "ValidationError",
      issues: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { from, subject, text, html, headers } = parsed.data;

  const messageId =
    findHeader(headers, "Message-ID") ?? `generated-${crypto.randomUUID()}`;

  const duplicate = await db.ticket.findUnique({ where: { messageId } });
  if (duplicate) {
    res.json({ received: true, ticketId: duplicate.id, duplicate: true });
    return;
  }

  const inReplyTo = findHeader(headers, "In-Reply-To") ?? null;
  if (inReplyTo) {
    const parent = await db.ticket.findUnique({ where: { messageId: inReplyTo } });
    if (parent) {
      res.json({ received: true, ticketId: parent.id, threaded: true });
      return;
    }
  }

  const body = text?.trim() ?? (html ? stripTags(html) : "(empty body)");
  const { name: senderName, email: senderEmail } = parseSender(from);

  const ticket = await db.ticket.create({
    data: { subject, body, senderName, senderEmail, messageId, inReplyTo, assignedToId: AI_AGENT_ID },
  });

  res.status(201).json({ received: true, ticketId: ticket.id });
  void boss.send(CLASSIFY_QUEUE, { id: ticket.id, subject: ticket.subject, body: ticket.body, senderName: ticket.senderName });
});
