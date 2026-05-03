import { useState } from "react";
import { type TicketFilters } from "@/lib/ticket-status";
import TicketsFilters from "./TicketsFilters";
import TicketsTable from "./TicketsTable";

export default function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({});

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">Tickets</h1>
        <p className="text-gray-600">All support tickets, newest first.</p>
      </div>
      <TicketsFilters filters={filters} onChange={setFilters} />
      <TicketsTable filters={filters} />
    </section>
  );
}
