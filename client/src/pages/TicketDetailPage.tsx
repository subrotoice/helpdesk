import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { BackToTickets } from "./BackToTickets";
import type { Ticket } from "@/lib/ticket";
import { TicketHeader } from "./TicketHeader";
import { TicketMetaCard } from "./TicketMetaCard";
import { TicketMessageCard } from "./TicketMessageCard";
import { ReplyThread } from "./ReplyThread";
import type { Reply } from "./ReplyCard";
import { ReplyForm } from "./ReplyForm";
import { TicketSidebar, type Agent, type TicketPatch } from "./TicketSidebar";
import { TicketDetailSkeleton } from "./TicketDetailSkeleton";

async function fetchTicket(id: string): Promise<Ticket> {
  const res = await axios.get<Ticket>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await axios.get<{ users: Agent[] }>("/api/users", {
    withCredentials: true,
  });
  return res.data.users;
}

async function fetchReplies(id: string): Promise<Reply[]> {
  const res = await axios.get<Reply[]>(`/api/tickets/${id}/replies`, {
    withCredentials: true,
  });
  return res.data;
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: replies } = useQuery({
    queryKey: ["replies", id],
    queryFn: () => fetchReplies(id!),
    enabled: !!id,
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (patch: TicketPatch) =>
      axios.patch(`/api/tickets/${id}`, patch, { withCredentials: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ticket", id] }),
  });

  if (isPending) return <TicketDetailSkeleton />;

  if (isError) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  return (
    <section className="flex flex-col gap-6 py-4">
      <BackToTickets />

      <TicketHeader ticket={ticket} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9 flex flex-col gap-6">
          <TicketMetaCard ticket={ticket} />
          <TicketMessageCard ticket={ticket} />
          <ReplyThread replies={replies ?? []} ticket={ticket} />
          <ReplyForm ticket={ticket} />
        </div>

        <TicketSidebar
          ticket={ticket}
          agents={agents}
          isUpdating={isUpdating}
          onUpdate={update}
        />
      </div>
    </section>
  );
}
