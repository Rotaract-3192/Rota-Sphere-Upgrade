import { Skeleton, TicketPassSkeleton } from "@/components/ui/LoadingSkeleton";

export default function TicketsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="w-64 h-9 rounded-xl" />
          <Skeleton className="w-80 h-4 rounded-md" />
        </div>
        <Skeleton className="w-44 h-10 rounded-xl" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="w-36 h-10 rounded-2xl" />
        <Skeleton className="w-36 h-10 rounded-2xl" />
      </div>

      {/* Tickets List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <TicketPassSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
