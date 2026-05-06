export function TicketDetailSkeleton() {
  return (
    <section className="flex flex-col gap-6 py-4">
      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      <div className="flex flex-col gap-3">
        <div className="h-9 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9 flex flex-col gap-6">
          <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
        </div>
        <div className="col-span-3 h-56 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </section>
  );
}
