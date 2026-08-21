import { Skeleton, GalleryCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function GalleryLoading() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen font-sans animate-fade-in" aria-busy="true">
      {/* ── 1. Hero Header Skeleton ── */}
      <section className="py-8 sm:py-14 px-4 sm:px-6 md:px-8 text-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto space-y-3">
          <Skeleton className="w-64 sm:w-80 h-10 sm:h-12 rounded-2xl mx-auto" />
          <Skeleton className="w-full max-w-md h-4 rounded-md mx-auto" />
          <div className="pt-2">
            <Skeleton className="w-48 h-10 rounded-full mx-auto" />
          </div>
        </div>

        {/* Filter Pills Skeleton */}
        <div className="mt-6 flex items-center justify-center gap-2 overflow-x-hidden pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-24 sm:w-28 h-9 rounded-full shrink-0" />
          ))}
        </div>
      </section>

      {/* ── 2. 3-Column Photo Grid Skeleton ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <GalleryCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
