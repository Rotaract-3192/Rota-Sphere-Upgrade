import { Skeleton, TicketPassSkeleton } from "@/components/ui/LoadingSkeleton";

export default function TicketsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in" aria-busy="true">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="w-64 sm:w-80 h-9 rounded-2xl" />
          <Skeleton className="w-72 sm:w-96 h-4 rounded-md" />
        </div>
        <Skeleton className="w-48 h-11 rounded-xl" />
      </div>

      {/* Tab Switcher Strip Skeleton */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit border border-gray-200 dark:border-gray-700">
        <Skeleton className="w-36 h-9 rounded-xl" />
        <Skeleton className="w-36 h-9 rounded-xl" />
      </div>

      {/* Tickets 2-Column Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <TicketPassSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
