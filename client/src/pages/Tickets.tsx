import { useState } from "react";
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import TicketsTable, { type Ticket } from "./TicketsTable";

function sortingToParams(sorting: SortingState) {
  const first = sorting[0];
  if (!first) return {};
  return { sortBy: first.id, order: first.desc ? "desc" : "asc" };
}

async function fetchTickets(sortBy?: string, order?: string): Promise<Ticket[]> {
  const res = await axios.get<{ tickets: Ticket[] }>("/api/tickets", {
    withCredentials: true,
    params: { sortBy, order },
  });
  return res.data.tickets;
}

export default function Tickets() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const sortParams = sortingToParams(sorting);

  const { data: tickets, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["tickets", sortParams],
    queryFn: () => fetchTickets(sortParams.sortBy, sortParams.order),
    placeholderData: keepPreviousData,
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">Tickets</h1>
        <p className="text-gray-600">All support tickets, newest first.</p>
      </div>

      {isError && <p className="text-red-600">Error: {error.message}</p>}

      {(isPending || tickets) && (
        <TicketsTable
          tickets={tickets}
          isPending={isPending}
          isFetching={isFetching}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      )}
    </section>
  );
}
