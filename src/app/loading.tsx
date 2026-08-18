import { Skeleton, EventCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function RootLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fade-in">
      {/* Hero Section Skeleton */}
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="w-36 h-6 rounded-full" />
        <Skeleton className="w-full sm:w-4/5 h-10 sm:h-12 rounded-2xl" />
        <Skeleton className="w-full sm:w-3/4 h-5 rounded-lg" />
      </div>

      {/* Filter / Category Strip Skeleton */}
      <div className="flex gap-2.5 overflow-x-hidden py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-24 sm:w-28 h-10 rounded-full shrink-0" />
        ))}
      </div>

      {/* Event Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
