import { useEffect, useState } from "react";
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, ChevronsUpDown } from "lucide-react";
import { type TicketFilters, type TicketStatus } from "@/lib/ticket-status";
import { Button } from "@/components/ui/button";
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

type TicketsResponse = {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

const statusStyles: Record<TicketStatus, string> = {
  open: "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800",
  resolved: "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800",
  closed: "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  closed: "Closed",
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
        <span className="block font-medium">{info.row.original.senderName}</span>
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
      info.getValue()?.name ?? <span className="text-gray-400">Unassigned</span>,
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    enableSorting: true,
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

const PAGE_SIZE = 10;

async function fetchTickets(
  params: Record<string, string | number | undefined>,
): Promise<TicketsResponse> {
  const defined = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  );
  const res = await axios.get<TicketsResponse>("/api/tickets", {
    withCredentials: true,
    params: defined,
  });
  return res.data;
}

function sortingToParams(sorting: SortingState) {
  const first = sorting[0];
  if (!first) return {};
  return { sortBy: first.id, order: first.desc ? "desc" : "asc" };
}

type Props = {
  filters: TicketFilters;
};

export default function TicketsTable({ filters }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [page, setPage] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState(
    filters.searchInput ?? "",
  );
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(filters.searchInput?.trim() ?? ""),
      300,
    );
    return () => clearTimeout(t);
  }, [filters.searchInput]);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.category, debouncedSearch, sorting]);

  const sortParams = sortingToParams(sorting);
  const queryParams: Record<string, string | number | undefined> = {
    ...sortParams,
    status: filters.status,
    category: filters.category,
    search: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["tickets", queryParams],
    queryFn: () => fetchTickets(queryParams),
    placeholderData: keepPreviousData,
  });

  const tickets = data?.tickets;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const table = useReactTable({
    data: tickets ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isError) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  return (
    <div className="space-y-3">
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
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
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

      {!isPending && total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {total} ticket{total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
