import { Skeleton, EventCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans animate-fade-in" aria-busy="true">
      {/* ── 1. Hero Section Skeleton ── */}
      <div className="relative bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          <div className="max-w-3xl space-y-4">
            <Skeleton className="w-48 h-6 rounded-full" />
            <Skeleton className="w-full sm:w-5/6 h-12 sm:h-16 rounded-2xl" />
            <Skeleton className="w-full sm:w-3/4 h-5 rounded-lg" />
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Skeleton className="w-40 h-12 rounded-2xl" />
            <Skeleton className="w-36 h-12 rounded-2xl" />
          </div>

          {/* Stats Bar Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="w-16 h-8 rounded-lg" />
                <Skeleton className="w-28 h-3.5 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Category Strip & Event Feed Skeleton ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Section Title & Category Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="w-48 h-7 rounded-xl" />
            <Skeleton className="w-72 h-4 rounded-md" />
          </div>

          <div className="flex gap-2 overflow-x-hidden py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-24 h-9 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* 4-Column Event Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
