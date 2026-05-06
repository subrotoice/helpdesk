import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/lib/ticket";

const replySchema = z.object({
  body: z.string().min(1, "Reply cannot be empty"),
});
type ReplyFormValues = z.infer<typeof replySchema>;

type Props = { ticket: Ticket };

export function ReplyForm({ ticket }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormValues>({ resolver: zodResolver(replySchema) });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ReplyFormValues) =>
      axios.post(`/api/tickets/${ticket.id}/replies`, data, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", String(ticket.id)] });
      reset();
    },
  });

  return (
    <div className="rounded-xl border bg-white shadow-sm px-6 py-5">
      <p className="mb-3 text-sm font-semibold text-gray-700">Add a reply</p>
      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <Textarea
            {...register("body")}
            placeholder="Write your reply…"
            rows={5}
            disabled={isPending}
            aria-invalid={!!errors.body}
            className="resize-none"
          />
          {errors.body && (
            <p className="text-xs text-red-600">{errors.body.message}</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}
