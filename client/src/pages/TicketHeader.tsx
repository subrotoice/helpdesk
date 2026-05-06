import { Tag } from "lucide-react";
import type { Ticket } from "@/lib/ticket";
import type { TicketStatus } from "@/lib/ticket-status";

const statusStyles: Record<TicketStatus, string> = {
  open: "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800",
  resolved:
    "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800",
  closed:
    "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
};

type Props = { ticket: Ticket };

export function TicketHeader({ ticket }: Props) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">
          {ticket.subject}
        </h1>
        <div className="flex items-center gap-2">
          <span className={statusStyles[ticket.status]}>
            {statusLabels[ticket.status]}
          </span>
          {ticket.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
              <Tag className="h-3 w-3" />
              {ticket.category}
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 rounded-md bg-gray-100 px-2.5 py-1 font-mono text-sm text-gray-500">
        #{ticket.id}
      </span>
    </div>
  );
}
