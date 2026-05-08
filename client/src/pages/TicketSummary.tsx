import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/lib/ticket";

type Props = { ticket: Pick<Ticket, "id"> };

export function TicketSummary({ ticket }: Props) {
  const { mutate, isPending, data, error, reset } = useMutation({
    mutationFn: () =>
      axios.post<{ summary: string }>(
        `/api/tickets/${ticket.id}/summarize`,
        {},
        { withCredentials: true },
      ),
  });

  const summary = data?.data.summary;
  const hasResult = summary || error;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            reset();
            mutate();
          }}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isPending ? "Summarizing…" : hasResult ? "Re-generate summary" : "Summarize"}
        </Button>
      </div>

      {hasResult && (
        <div className="rounded-xl border bg-white shadow-sm px-6 py-5">
          <p className="mb-2 text-sm font-semibold text-gray-700">Summary</p>
          {error ? (
            <p className="text-xs text-red-600">
              {axios.isAxiosError(error)
                ? (error.response?.data?.error ?? error.message)
                : "Failed to generate summary. Please try again."}
            </p>
          ) : (
            <p className="text-sm leading-7 text-gray-700 whitespace-pre-wrap">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
