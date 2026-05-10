export const ticketStatuses = ["new", "processing", "open", "resolved", "closed"] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const ticketStatusLabels: Record<TicketStatus, string> = {
  new: "New",
  processing: "Processing",
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

export const ticketCategories = {
  general_question: "General Question",
  technical_question: "Technical Question",
  refund_request: "Refund Request",
} as const;
export type TicketCategory = keyof typeof ticketCategories;

export interface TicketFilters {
  searchInput?: string;
  status?: TicketStatus;
  category?: string;
}
