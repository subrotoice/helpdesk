export const TicketStatus = {
  open: "open",
  inProgress: "inProgress",
  closed: "closed",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
