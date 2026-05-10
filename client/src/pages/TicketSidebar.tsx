import {
  ticketCategories,
  ticketStatuses,
  ticketStatusLabels,
  type TicketStatus,
} from "@/lib/ticket-status";
import type { Ticket } from "@/lib/ticket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Agent = { id: string; name: string };

export type TicketPatch = {
  assignedToId?: string | null;
  status?: TicketStatus;
  category?: string | null;
};

type Props = {
  ticket: Ticket;
  agents: Agent[] | undefined;
  isUpdating: boolean;
  onUpdate: (patch: TicketPatch) => void;
};

export function TicketSidebar({ ticket, agents, isUpdating, onUpdate }: Props) {
  return (
    <div className="col-span-3 rounded-xl border bg-white shadow-sm divide-y">
      <div className="flex flex-col gap-1.5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Assigned To
        </p>
        <Select
          value={ticket.assignedTo?.id ?? "unassigned"}
          onValueChange={(v) =>
            onUpdate({ assignedToId: v === "unassigned" ? null : v })
          }
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {agents?.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Status
        </p>
        <Select
          value={ticket.status}
          onValueChange={(v) => onUpdate({ status: v as TicketStatus })}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ticketStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {ticketStatusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Category
        </p>
        <Select
          value={ticket.category ?? "none"}
          onValueChange={(v) =>
            onUpdate({ category: v === "none" ? null : v })
          }
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {Object.entries(ticketCategories).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
