import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Tag } from "lucide-react";
import { type TicketStatus } from "@/lib/ticket-status";

type TicketDetail = {
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
};

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

async function fetchTicket(id: string): Promise<TicketDetail> {
  const res = await axios.get<TicketDetail>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: ticket,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  if (isPending) {
    return (
      <section className="flex flex-col gap-8 py-4">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
        <div className="flex flex-col gap-3">
          <div className="h-9 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
      </section>
    );
  }

  if (isError) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  const initials = ticket.senderName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="flex flex-col gap-8 py-4">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

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

      <div className="rounded-xl border bg-white shadow-sm px-6 py-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p className="text-gray-700">
            <span className="font-medium text-gray-500">From: </span>
            {ticket.senderName}
            <span className="ml-1 text-gray-400">({ticket.senderEmail})</span>
          </p>
          <p className="text-gray-700">
            <span className="font-medium text-gray-500">Assigned To: </span>
            {ticket.assignedTo?.name ?? <span className="text-gray-400">Unassigned</span>}
          </p>
          <p className="text-gray-700">
            <span className="font-medium text-gray-500">Created: </span>
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
          <p className="text-gray-700">
            <span className="font-medium text-gray-500">Last Updated: </span>
            {new Date(ticket.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

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
    </section>
  );
}
