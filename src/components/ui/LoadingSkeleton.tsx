"use client";

import React from "react";

/**
 * Base Shimmer Skeleton Primitive
 * Uses smooth pulsing and gradient shimmer for premium native-app feel.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700/60 dark:to-gray-800 rounded-xl ${className}`}
    />
  );
}

/**
 * Event Card Skeleton (for event grid & discovery catalog)
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
      <Skeleton className="w-full h-48 sm:h-52 rounded-2xl" />
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="w-4/5 h-6 rounded-lg" />
        <Skeleton className="w-3/5 h-4 rounded-md" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-40 h-4 rounded-md" />
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="w-12 h-3 rounded" />
          <Skeleton className="w-20 h-5 rounded" />
        </div>
        <Skeleton className="w-28 h-10 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Single Event Detail Page Skeleton (for /events/[slug])
 */
export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-24">
      {/* Hero Banner Skeleton */}
      <div className="relative w-full h-72 sm:h-96 md:h-[420px] bg-gray-900 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <Skeleton className="w-28 h-6 rounded-full" />
                <Skeleton className="w-36 h-6 rounded-full" />
              </div>
              <Skeleton className="w-5/6 h-9 sm:h-11 rounded-xl" />
              <div className="flex flex-wrap gap-4 pt-2">
                <Skeleton className="w-44 h-5 rounded-md" />
                <Skeleton className="w-40 h-5 rounded-md" />
              </div>
            </div>

            {/* Event Description Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-4 shadow-sm">
              <Skeleton className="w-32 h-6 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-3/4 h-4 rounded-md" />
            </div>
          </div>

          {/* Sidebar Booking Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
              <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-5">
                <div className="space-y-1.5">
                  <Skeleton className="w-24 h-3 rounded" />
                  <Skeleton className="w-28 h-8 rounded-lg" />
                </div>
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="w-32 h-4 rounded" />
                <Skeleton className="w-full h-16 rounded-2xl" />
                <Skeleton className="w-full h-16 rounded-2xl" />
              </div>
              <Skeleton className="w-full h-14 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Ticket Pass Card Skeleton (for /tickets)
 */
export function TicketPassSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="w-24 h-5 rounded-full" />
          <Skeleton className="w-4/5 h-6 rounded-lg" />
          <Skeleton className="w-3/5 h-4 rounded-md" />
        </div>
        <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
      </div>
      <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="w-16 h-3 rounded" />
          <Skeleton className="w-24 h-4 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-9 rounded-xl" />
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Club Card Skeleton (for /clubs)
 */
export function ClubCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="w-3/4 h-5 rounded-lg" />
          <Skeleton className="w-1/2 h-3.5 rounded" />
        </div>
      </div>
      <Skeleton className="w-full h-12 rounded-xl" />
      <div className="pt-2 flex items-center justify-between">
        <Skeleton className="w-20 h-4 rounded" />
        <Skeleton className="w-24 h-8 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Gallery Card Skeleton (for /gallery)
 */
export function GalleryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm space-y-4 pb-4">
      <Skeleton className="w-full h-64 sm:h-72 rounded-none" />
      <div className="px-5 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="w-28 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="w-4/5 h-6 rounded-lg" />
        <Skeleton className="w-1/2 h-4 rounded" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Metric Card Skeleton (for /dashboard and /admin)
 */
export function MetricCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <Skeleton className="w-32 h-8 rounded-lg" />
      <Skeleton className="w-40 h-3.5 rounded" />
    </div>
  );
}
