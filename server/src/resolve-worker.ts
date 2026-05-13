import { readFileSync } from "fs";
import { join } from "path";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { type Job } from "pg-boss";
import { boss } from "./boss";
import { db } from "./db";
import { AI_AGENT_ID } from "./ai-agent";

const knowledgeBase = readFileSync(join(import.meta.dir, "..", "knowledge-base.md"), "utf-8");

export const AUTO_RESOLVE_QUEUE = "auto-resolve-ticket";

type ResolveJob = { id: number; subject: string; body: string; senderName: string };

const CANNOT_RESOLVE = "CANNOT_RESOLVE";

export async function registerResolveWorker() {
  await boss.createQueue(AUTO_RESOLVE_QUEUE, { retryLimit: 3, retryDelay: 1000 });

  await boss.work<ResolveJob>(AUTO_RESOLVE_QUEUE, async ([job]: Job<ResolveJob>[]) => {
    const { id, subject, body, senderName } = job.data;

    const firstName = senderName.split(" ")[0] || senderName;
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      system: `You are Subroto Biswas, a support agent for eDeves online courses. Your only source of truth is the knowledge base below.\n\nRules:\n- If the customer's question can be fully and accurately answered using the knowledge base, write a reply following the format guidelines below.\n- If the question involves legal threats, chargebacks, refund disputes outside the 30-day window, account security concerns, or anything not covered in the knowledge base, reply with exactly: ${CANNOT_RESOLVE}\n- Do not invent information not in the knowledge base.\n- Do not explain why you cannot resolve — just reply ${CANNOT_RESOLVE}.\n\nReply format:\n- Open with "Hi [first name]," on its own line.\n- Write 1–3 short paragraphs in a warm, professional, and customer-friendly tone.\n- Use bullet points or numbered lists only when listing steps or multiple items.\n- Close with a friendly sign-off, your full name, and your title on separate lines, e.g.:\n  Best regards,\n  Subroto Biswas\n  Code with Mosh Support\n\nKNOWLEDGE BASE:\n${knowledgeBase}`,
      prompt: `Customer first name: ${firstName}\nSubject: ${subject}\n\n${body}`,
    });

    const aiResponse = text.trim();
    if (aiResponse === CANNOT_RESOLVE) {
      await db.ticket.update({ where: { id }, data: { status: "open", assignedToId: null } });
      console.log(`[auto-resolve] ticket ${id} → cannot resolve, moved to open`);
      return;
    }

    await db.$transaction([
      db.reply.create({ data: { body: aiResponse, senderType: "agent", authorId: null, ticketId: id } }),
      db.ticket.update({ where: { id }, data: { status: "resolved" } }),
    ]);
    console.log(`[auto-resolve] ticket ${id} → resolved by AI`);
  });
}
