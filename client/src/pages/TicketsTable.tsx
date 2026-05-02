import { TicketStatus } from "@/lib/ticket-status";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Ticket = {
  id: number;
  subject: string;
  senderEmail: string;
  senderName: string;
  status: TicketStatus;
  category: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
};

const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.open]:
    "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800",
  [TicketStatus.inProgress]:
    "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800",
  [TicketStatus.closed]:
    "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600",
};

const statusLabels: Record<TicketStatus, string> = {
  [TicketStatus.open]: "Open",
  [TicketStatus.inProgress]: "In Progress",
  [TicketStatus.closed]: "Closed",
};

type Props = {
  tickets: Ticket[] | undefined;
  isPending: boolean;
};

export default function TicketsTable({ tickets, isPending }: Props) {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          {tickets?.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="max-w-xs font-medium">
                <span className="block truncate" title={t.subject}>
                  {t.subject}
                </span>
              </TableCell>
              <TableCell>
                <span className="block font-medium">{t.senderName}</span>
                <span className="block text-xs text-gray-500">
                  {t.senderEmail}
                </span>
              </TableCell>
              <TableCell>
                <span className={statusStyles[t.status]}>
                  {statusLabels[t.status]}
                </span>
              </TableCell>
              <TableCell className="text-gray-600">
                {t.category ?? <span className="text-gray-400">—</span>}
              </TableCell>
              <TableCell className="text-gray-600">
                {t.assignedTo?.name ?? (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="text-gray-600">
                {new Date(t.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {tickets?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                No tickets found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
