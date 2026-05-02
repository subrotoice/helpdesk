import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
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

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
    enableSorting: true,
    cell: (info) => (
      <span className="block truncate font-medium" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("senderEmail", {
    header: "Sender",
    enableSorting: true,
    cell: (info) => (
      <>
        <span className="block font-medium">
          {info.row.original.senderName}
        </span>
        <span className="block text-xs text-gray-500">{info.getValue()}</span>
      </>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    enableSorting: true,
    cell: (info) => (
      <span className={statusStyles[info.getValue()]}>
        {statusLabels[info.getValue()]}
      </span>
    ),
  }),
  columnHelper.accessor("category", {
    header: "Category",
    enableSorting: true,
    cell: (info) => info.getValue() ?? <span className="text-gray-400">—</span>,
  }),
  columnHelper.accessor("assignedTo", {
    header: "Assigned To",
    enableSorting: true,
    cell: (info) =>
      info.getValue()?.name ?? (
        <span className="text-gray-400">Unassigned</span>
      ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    enableSorting: true,
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

type Props = {
  tickets: Ticket[] | undefined;
  isPending: boolean;
  isFetching?: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

export default function TicketsTable({
  tickets,
  isPending,
  isFetching = false,
  sorting,
  onSortingChange,
}: Props) {
  const table = useReactTable({
    data: tickets ?? [],
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={`rounded-lg border bg-white transition-opacity${isFetching && !isPending ? " opacity-60" : ""}`}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.column.getCanSort() ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === "asc" && (
                        <ChevronUp className="h-4 w-4" />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {!header.column.getIsSorted() && (
                        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={
                    cell.column.id === "subject" ? "max-w-xs" : "text-gray-600"
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {tickets?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-gray-500"
              >
                No tickets found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
