import type { Ticket } from "@/lib/ticket";

type Props = { ticket: Ticket };

export function TicketMessageCard({ ticket }: Props) {
  const initials = ticket.senderName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{ticket.senderName}</p>
          <p className="text-sm text-gray-500">{ticket.senderEmail}</p>
        </div>
      </div>
      <div className="p-8">
        <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
          {ticket.body}
        </p>
      </div>
    </div>
  );
}
