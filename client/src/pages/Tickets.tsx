import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import TicketsTable, { type Ticket } from "./TicketsTable";

async function fetchTickets(): Promise<Ticket[]> {
  const res = await axios.get<{ tickets: Ticket[] }>("/api/tickets", {
    withCredentials: true,
  });
  return res.data.tickets;
}

export default function Tickets() {
  const { data: tickets, isPending, isError, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">Tickets</h1>
        <p className="text-gray-600">All support tickets, newest first.</p>
      </div>

      {isError && <p className="text-red-600">Error: {error.message}</p>}

      {(isPending || tickets) && (
        <TicketsTable tickets={tickets} isPending={isPending} />
      )}
    </section>
  );
}
