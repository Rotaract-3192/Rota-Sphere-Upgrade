import { Skeleton, MetricCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in" aria-busy="true">
      {/* ── 1. Super Admin Header Skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-48 h-5 rounded-full" />
            <Skeleton className="w-24 h-5 rounded-full" />
          </div>
          <Skeleton className="w-72 sm:w-96 h-9 sm:h-11 rounded-2xl" />
          <Skeleton className="w-80 sm:w-[480px] h-4 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-36 h-11 rounded-xl" />
          <Skeleton className="w-36 h-11 rounded-xl" />
        </div>
      </div>

      {/* ── 2. Super Admin 4 KPI Metrics Skeleton ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* ── 3. Governance Tab Switcher Skeleton ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl overflow-x-hidden border border-gray-200 dark:border-gray-700">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="w-32 h-9 rounded-xl shrink-0" />
        ))}
      </div>

      {/* ── 4. Main Moderation Table Skeleton ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="space-y-1">
            <Skeleton className="w-44 h-6 rounded-lg" />
            <Skeleton className="w-60 h-3.5 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-48 h-10 rounded-xl" />
            <Skeleton className="w-24 h-10 rounded-xl" />
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-1/3 h-5 rounded-md" />
                <Skeleton className="w-1/2 h-3.5 rounded-md" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="w-20 h-7 rounded-full" />
                <Skeleton className="w-24 h-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
