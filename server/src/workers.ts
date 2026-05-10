import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { type Job } from "pg-boss";
import { ticketCategories } from "@ticket-status";
import { boss } from "./boss";
import { db } from "./db";

const categories = Object.keys(ticketCategories);

export const CLASSIFY_QUEUE = "classify-ticket";

type ClassifyJob = { id: number; subject: string; body: string };

export async function registerWorkers() {
  await boss.createQueue(CLASSIFY_QUEUE, { retryLimit: 3, retryDelay: 1000 });
  await boss.work<ClassifyJob>(CLASSIFY_QUEUE, async ([job]: Job<ClassifyJob>[]) => {
    const { id, subject, body } = job.data;
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      system: `Classify the support ticket into exactly one of these categories: ${categories.join(", ")}. Reply with only the category name, nothing else.`,
      prompt: `Subject: ${subject}\n\n${body}`,
    });
    const category = categories.find((c) => c === text.trim().toLowerCase()) ?? "general_question";
    await db.ticket.update({ where: { id }, data: { category } });
    console.log(`[classify] ticket ${id} → ${category}`);
  });
}
