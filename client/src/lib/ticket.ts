import type { TicketStatus } from "@/lib/ticket-status";

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  status: TicketStatus;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string } | null;
}
