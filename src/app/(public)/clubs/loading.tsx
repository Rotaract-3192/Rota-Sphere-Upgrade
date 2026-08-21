import { Skeleton, ClubCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ClubsLoading() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen animate-fade-in" aria-busy="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
        
        {/* Header Skeleton */}
        <div className="max-w-3xl space-y-3 mb-10 sm:mb-12">
          <Skeleton className="w-56 h-6 rounded-full" />
          <Skeleton className="w-3/4 sm:w-2/3 h-10 sm:h-14 rounded-2xl" />
          <div className="space-y-2 pt-1">
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-4/5 h-4 rounded-md" />
          </div>
        </div>

        {/* Search & Filter Bar Box Skeleton */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            <div className="md:col-span-8">
              <Skeleton className="w-full h-12 rounded-2xl" />
            </div>
            <div className="md:col-span-4">
              <Skeleton className="w-full h-12 rounded-2xl" />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <Skeleton className="w-28 h-3.5 rounded-md" />
              <Skeleton className="w-32 h-3.5 rounded-md" />
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="w-24 h-8 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* 3-Column Club Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
