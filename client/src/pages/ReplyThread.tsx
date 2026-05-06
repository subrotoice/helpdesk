import { ReplyCard, type Reply } from "./ReplyCard";
import type { Ticket } from "@/lib/ticket";

type Props = {
  replies: Reply[];
  ticket: Ticket;
};

export function ReplyThread({ replies, ticket }: Props) {
  if (replies.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {replies.map((reply) => (
        <ReplyCard key={reply.id} reply={reply} fallbackName={ticket.senderName} />
      ))}
    </div>
  );
}
