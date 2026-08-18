import { Skeleton, GalleryCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function GalleryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="w-56 h-9 rounded-xl" />
          <Skeleton className="w-80 h-4 rounded-md" />
        </div>
        <Skeleton className="w-44 h-10 rounded-xl" />
      </div>

      {/* Category Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-hidden py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-full shrink-0" />
        ))}
      </div>

      {/* Gallery Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <GalleryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
