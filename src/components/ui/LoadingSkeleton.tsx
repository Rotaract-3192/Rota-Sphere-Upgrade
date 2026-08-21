"use client";

import React from "react";

/**
 * Base Shimmer Skeleton Primitive
 * Uses smooth directional shimmer and theme-adaptive gradient pulses for an ultra-premium feel.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100/80 to-gray-200 dark:from-gray-800 dark:via-gray-700/60 dark:to-gray-800 rounded-xl ${className}`}
    />
  );
}

/**
 * Event Card Skeleton
 * 1:1 Pixel-Perfect match with `src/components/events/EventCard.tsx`
 * (aspect-[4/3] rounded-2xl photo container, top-left badge, top-right heart, bottom price/date pill, title line, and location & CTA row)
 */
export function EventCardSkeleton({ variant = "light" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";

  return (
    <article className="group flex flex-col gap-3 relative animate-fade-in" aria-busy="true">
      {/* Photo Aspect Ratio Container */}
      <div className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden border ${
        isDark ? "bg-gray-900 border-white/10" : "bg-gray-100 dark:bg-gray-900 border-gray-200/80 dark:border-white/10"
      } shadow-xs`}>
        {/* Shimmer Image Placeholder */}
        <Skeleton className="w-full h-full rounded-none" />

        {/* Top-left Verified Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-12 h-2.5 rounded-full" />
        </div>

        {/* Top-right Heart Button */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
        </div>

        {/* Bottom Floating Price & Date Tag */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Skeleton className="w-16 h-6 rounded-lg" />
          <Skeleton className="w-24 h-5 rounded-md" />
        </div>
      </div>

      {/* Title & Metadata below photo */}
      <div className="flex flex-col gap-2 focus:outline-hidden">
        {/* Title line */}
        <Skeleton className="w-4/5 h-5 rounded-md" />

        {/* Location & CTA row */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="w-24 h-3.5 rounded-md" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-14 h-3.5 rounded-md" />
            <Skeleton className="w-3 h-3 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Event Grid Skeleton (for Event Catalogs & Homepage Discovery)
 */
export function EventGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      aria-busy="true"
      aria-label="Loading events"
    >
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Single Event Detail Page Skeleton (for `/events/[slug]`)
 * 1:1 Pixel-Perfect match with `src/app/(public)/events/[slug]/page.tsx`
 */
export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 animate-fade-in" aria-busy="true">
      {/* ── 1. Hero Cover Banner Skeleton ── */}
      <div className="relative w-full h-[380px] sm:h-[480px] bg-gray-900 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-36 h-6 rounded-full" />
          </div>
          <Skeleton className="w-5/6 sm:w-2/3 h-10 sm:h-14 rounded-2xl" />
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="w-36 h-4 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="w-28 h-4 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="w-40 h-4 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Two-Column Layout: Content + Ticketing Card ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About & Description Card */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <Skeleton className="w-44 h-7 rounded-xl" />
              <div className="space-y-2.5 pt-2">
                <Skeleton className="w-full h-4 rounded-md" />
                <Skeleton className="w-full h-4 rounded-md" />
                <Skeleton className="w-11/12 h-4 rounded-md" />
                <Skeleton className="w-4/5 h-4 rounded-md" />
              </div>
            </div>

            {/* Event Schedule Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="w-40 h-7 rounded-xl" />
                <Skeleton className="w-24 h-4 rounded-md" />
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="pt-4 first:pt-0 flex gap-4 items-start">
                    <Skeleton className="w-20 h-9 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="w-3/5 h-5 rounded-md" />
                      <Skeleton className="w-4/5 h-3.5 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Speakers Grid */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-6">
              <Skeleton className="w-44 h-7 rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="w-32 h-5 rounded-md" />
                      <Skeleton className="w-24 h-3.5 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue & Location Guidelines */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <Skeleton className="w-48 h-7 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-64 h-4 rounded-md" />
                <Skeleton className="w-80 h-3.5 rounded-md" />
              </div>
            </div>
          </div>

          {/* Right Sidebar Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
              <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-5">
                <div className="space-y-2">
                  <Skeleton className="w-24 h-3.5 rounded-md" />
                  <Skeleton className="w-32 h-8 rounded-xl" />
                </div>
                <Skeleton className="w-24 h-6 rounded-full" />
              </div>

              <div className="space-y-3">
                <Skeleton className="w-32 h-4 rounded-md" />
                <Skeleton className="w-full h-20 rounded-2xl" />
                <Skeleton className="w-full h-20 rounded-2xl" />
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
 * Club Card Skeleton
 * 1:1 Pixel-Perfect match with `src/app/(public)/clubs/ClubsDirectoryClient.tsx`
 * (Zone pill + Campus/Community badge, Club Name, Partner Rotary line, President line, and email line)
 */
export function ClubCardSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5 animate-fade-in"
      aria-busy="true"
    >
      <div className="space-y-4">
        {/* Zone and Type Badges */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-24 h-5 rounded-full" />
        </div>

        {/* Club Name & District subtitle */}
        <div className="space-y-2">
          <Skeleton className="w-4/5 h-6 rounded-lg" />
          <div className="flex items-center gap-1.5 pt-0.5">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="w-44 h-3.5 rounded-md" />
          </div>
        </div>

        {/* Details Strip */}
        <div className="pt-3 space-y-2 border-t border-gray-100 dark:border-gray-800">
          <Skeleton className="w-3/4 h-3.5 rounded-md" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-36 h-3.5 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-48 h-3.5 rounded-md" />
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <Skeleton className="w-24 h-4 rounded-md" />
        <Skeleton className="w-28 h-9 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Ticket Pass Card Skeleton
 * 1:1 Pixel-Perfect match with `src/app/(public)/tickets/UserTicketsClient.tsx`
 * (Logo, Tier pill, Event Title, Pass ID, Status badge, Date & Venue rows, and Action buttons)
 */
export function TicketPassSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between animate-fade-in"
      aria-busy="true"
    >
      <div className="p-6 sm:p-7 space-y-5">
        {/* Header with Logo, Tier, Title, and Status Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="w-20 h-4 rounded-full" />
              <Skeleton className="w-44 sm:w-56 h-6 rounded-lg" />
              <Skeleton className="w-28 h-3.5 rounded-md" />
            </div>
          </div>
          <Skeleton className="w-28 h-7 rounded-full shrink-0" />
        </div>

        {/* Date and Location Metadata */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="w-40 h-3.5 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="w-48 h-3.5 rounded-md" />
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <Skeleton className="w-32 h-10 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-28 h-10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Gallery Photo Card Skeleton
 * 1:1 Pixel-Perfect match with `src/app/(public)/gallery/page.tsx`
 * (aspect-4/3 rounded-3xl photo card, top-left indicator, top-right action buttons, category/city line, title, and date/likes row)
 */
export function GalleryCardSkeleton() {
  return (
    <div
      className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 shadow-xs flex flex-col animate-fade-in"
      aria-busy="true"
    >
      {/* Photo Aspect Ratio Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Skeleton className="w-full h-full rounded-none" />

        {/* Top-left multi-photo badge */}
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <Skeleton className="w-10 h-3 rounded-full" />
        </div>

        {/* Top-right Like & Share buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-center">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-center">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
          </div>
        </div>
      </div>

      {/* Card Bottom Meta */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-20 h-3 rounded-full" />
            <Skeleton className="w-24 h-3 rounded-full" />
          </div>
          <Skeleton className="w-5/6 h-5 rounded-md" />
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="w-24 h-3.5 rounded-md" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="w-6 h-3.5 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Gallery Grid Skeleton
 */
export function GalleryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <GalleryCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Metric Card Skeleton (for `/dashboard` & `/admin` analytics)
 */
export function MetricCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-4 shadow-xs animate-fade-in" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="w-28 h-4 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="w-32 h-8 rounded-xl" />
        <Skeleton className="w-36 h-3.5 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton (for admin/dashboard tables)
 */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className="h-4 w-full rounded-md" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Checkout Skeleton (for `/checkout`)
 */
export function CheckoutSkeleton() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-12 space-y-6 animate-fade-in" aria-busy="true">
      <Skeleton className="w-56 h-9 rounded-2xl" />

      {/* Order Summary Box */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <Skeleton className="w-36 h-6 rounded-lg" />

        <div className="space-y-3 border-y border-gray-100 dark:border-gray-800 py-4">
          <div className="flex justify-between items-center">
            <Skeleton className="w-40 h-4 rounded-md" />
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="w-32 h-4 rounded-md" />
            <Skeleton className="w-24 h-4 rounded-md" />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="w-32 h-4 rounded-md" />
          <Skeleton className="w-44 h-4 rounded-md" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded-full shrink-0" />
        <Skeleton className="w-80 h-3.5 rounded-md" />
      </div>

      <Skeleton className="w-full h-14 rounded-2xl" />
    </div>
  );
}

/**
 * Gate Scanner Skeleton (for `/check-in`)
 */
export function GateScannerSkeleton() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in" aria-busy="true">
      {/* Header */}
      <div className="bg-[#121721] border border-gray-800/80 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-44 h-7 rounded-xl" />
              <Skeleton className="w-24 h-5 rounded-full" />
            </div>
            <Skeleton className="w-72 h-3.5 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-32 h-10 rounded-xl" />
          <Skeleton className="w-36 h-10 rounded-xl" />
        </div>
      </div>

      {/* Config Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#121721] border border-gray-800/80 p-4 rounded-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="w-24 h-3 rounded-md" />
            <Skeleton className="w-full h-10 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Main Scanner & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#121721] border border-gray-800/80 rounded-3xl p-6 space-y-4">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
        <div className="lg:col-span-5 bg-[#121721] border border-gray-800/80 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="w-36 h-6 rounded-lg" />
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-14 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Event Map Explorer Skeleton (for Interactive Maps)
 */
export function EventMapSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm animate-fade-in" aria-busy="true">
      {/* Header filter strip */}
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="w-56 h-6 rounded-lg" />
          <Skeleton className="w-72 h-3.5 rounded-md" />
        </div>
        <div className="flex items-center gap-2 overflow-x-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-8 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Map Canvas Viewport */}
      <div className="relative w-full h-[450px] sm:h-[550px] bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-lg">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-40 h-4 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Help Center / FAQ Page Skeleton (for `/help`)
 */
export function HelpCenterSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 animate-fade-in" aria-busy="true">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <Skeleton className="w-32 h-6 rounded-full mx-auto" />
        <Skeleton className="w-4/5 h-10 sm:h-12 rounded-2xl mx-auto" />
        <Skeleton className="w-full h-4 rounded-md mx-auto" />
        <Skeleton className="w-full max-w-lg h-12 rounded-2xl mx-auto mt-4" />
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-hidden py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-full shrink-0" />
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="w-3/4 h-5 rounded-md" />
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * About Page Skeleton (for `/about`)
 */
export function AboutPageSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 animate-fade-in" aria-busy="true">
      <section className="bg-gray-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <Skeleton className="w-44 h-5 rounded-full mx-auto" />
          <Skeleton className="w-5/6 sm:w-2/3 h-10 sm:h-14 rounded-2xl mx-auto" />
          <Skeleton className="w-full max-w-2xl h-4 rounded-md mx-auto" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <Skeleton className="w-40 h-6 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="w-full h-3.5 rounded-md" />
                <Skeleton className="w-4/5 h-3.5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/**
 * District 3192 Portal Skeleton (for `/district-3192`)
 */
export function DistrictDirectorySkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 animate-fade-in" aria-busy="true">
      <section className="bg-gray-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <Skeleton className="w-52 h-5 rounded-full mx-auto" />
          <Skeleton className="w-5/6 sm:w-2/3 h-10 sm:h-14 rounded-2xl mx-auto" />
          <Skeleton className="w-full max-w-2xl h-4 rounded-md mx-auto" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs text-center flex flex-col items-center">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <Skeleton className="w-16 h-8 rounded-xl" />
              <Skeleton className="w-32 h-3.5 rounded-md" />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xs">
          <Skeleton className="w-56 h-7 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                <Skeleton className="w-36 h-5 rounded-md" />
                <Skeleton className="w-full h-3.5 rounded-md" />
                <Skeleton className="w-4/5 h-3.5 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

