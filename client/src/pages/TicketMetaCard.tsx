import type { Ticket } from "@/lib/ticket";

type Props = { ticket: Ticket };

export function TicketMetaCard({ ticket }: Props) {
  return (
    <div className="rounded-xl border bg-white shadow-sm px-6 py-4">
      <div className="flex flex-col gap-3 text-sm text-gray-700">
        <p>
          <span className="font-medium text-gray-500">From: </span>
          {ticket.senderName}
          <span className="ml-1 text-gray-400">({ticket.senderEmail})</span>
        </p>
        <p>
          <span className="font-medium text-gray-500">Created: </span>
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
        <p>
          <span className="font-medium text-gray-500">Last Updated: </span>
          {new Date(ticket.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
