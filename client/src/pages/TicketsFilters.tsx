import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
  ticketCategories,
  ticketStatuses,
  ticketStatusLabels,
  type TicketFilters,
  type TicketStatus,
} from "@/lib/ticket-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

type Props = {
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
};

export default function TicketsFilters({ filters, onChange }: Props) {
  const [searchInput, setSearchInput] = useState(filters.searchInput ?? "");
  // Sync local input when parent resets filters (e.g. clear all)
  useEffect(() => {
    setSearchInput(filters.searchInput ?? "");
  }, [filters.searchInput]);

  useEffect(() => {
    const t = setTimeout(
      () =>
        onChange({ ...filters, searchInput: searchInput.trim() || undefined }),
      300,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input
          className="h-8 w-56 pl-8 text-sm"
          placeholder="Search tickets…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Select
        value={filters.status ?? ALL}
        onValueChange={(v) =>
          onChange({
            ...filters,
            status: v === ALL ? undefined : (v as TicketStatus),
          })
        }
      >
        <SelectTrigger className="h-8 w-40 text-sm">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {ticketStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {ticketStatusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category ?? ALL}
        onValueChange={(v) =>
          onChange({ ...filters, category: v === ALL ? undefined : v })
        }
      >
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {ticketCategories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {Object.keys(filters).length > 0 && (
        <Button
          size="sm"
          className="h-8 px-3 text-sm"
          variant="ghost"
          onClick={() => {
            setSearchInput("");
            onChange({});
          }}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
