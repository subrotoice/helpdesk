export type SenderType = "agent" | "customer";

export type Reply = {
  id: number;
  body: string;
  senderType: SenderType;
  createdAt: string;
  author: { id: string; name: string } | null;
};

type Props = {
  reply: Reply;
  fallbackName: string;
};

export function ReplyCard({ reply, fallbackName }: Props) {
  const isAgent = reply.senderType === "agent";
  const displayName = reply.author?.name ?? fallbackName;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isAgent
              ? "bg-emerald-100 text-emerald-700"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{displayName}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isAgent
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {isAgent ? "Agent" : "Customer"}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {new Date(reply.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="p-8">
        <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
          {reply.body}
        </p>
      </div>
    </div>
  );
}
