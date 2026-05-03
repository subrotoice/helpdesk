export const ticketStatuses = ["open", "resolved", "closed"] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const ticketStatusLabels: Record<TicketStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

export const ticketCategories = [
  "General Question",
  "Technical Question",
  "Refund Request",
] as const;
export type TicketCategory = (typeof ticketCategories)[number];

export interface TicketFilters {
  searchInput?: string;
  status?: TicketStatus;
  category?: string;
}
