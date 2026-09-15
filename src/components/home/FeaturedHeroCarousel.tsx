"use client";

/**
 * FeaturedHeroCarousel — Widescreen Flagship Event Banner Carousel
 * Inspired by the prominent hero banner in entertainment ticketing apps.
 * Features:
 * - Widescreen rounded card banner with high-impact cover artwork
 * - Dynamic pagination indicator dots
 * - Auto-advancing slides with pause on hover
 * - Touch swipe & arrow navigation
 * - Price chip, date/venue badges, and fast booking CTA
 */

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Ticket, ChevronLeft, ChevronRight, Sparkles, ArrowRight, Users } from "lucide-react";

export interface FeaturedEventItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  cover_image_url?: string | null;
  thumbnail_url?: string | null;
  venue_name?: string | null;
  city?: string | null;
  start_date: string;
  organization_name?: string | null;
  category_name?: string | null;
  min_price: number;
  has_bulk_slab?: boolean;
}

interface FeaturedHeroCarouselProps {
  events: FeaturedEventItem[];
}

export function FeaturedHeroCarousel({ events }: FeaturedHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // If no events returned from query, show a fallback district banner
  const slides = events && events.length > 0 ? events : [];

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  if (slides.length === 0) {
    return null;
  }

  const current = slides[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const imageUrl = current.cover_image_url || current.thumbnail_url || "/brand/hero-banner.jpg";

  return (
    <section
      data-tour="hero-event-card"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="relative w-full rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-gray-200/90 dark:border-gray-800 bg-[#060b17] text-white aspect-[16/9] sm:aspect-[21/9] lg:aspect-[2.4/1] max-h-[460px] group transition-all"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={imageUrl}
            alt={current.title}
            fill
            sizes="(max-width: 768px) 100vw, 1280px"
            className="object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
            priority
          />
          {/* Dual Multi-layer Gradients for Maximum Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30 sm:to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        </div>

        {/* Content Container */}
        <div className="relative z-20 h-full max-w-2xl flex flex-col justify-end sm:justify-center p-5 sm:p-8 lg:p-12 space-y-3 sm:space-y-4">
          
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#0758fc] text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-1 rounded-full shadow-md">
              <Sparkles size={12} className="text-amber-300" />
              Featured Flagship
            </span>

            {current.organization_name && (
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-200 bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 truncate max-w-[200px]">
                {current.organization_name}
              </span>
            )}

            {current.has_bulk_slab && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-purple-300 bg-purple-950/80 border border-purple-700/80 px-2.5 py-0.5 rounded-full">
                <Users size={11} /> Group Bulk Deals
              </span>
            )}
          </div>

          {/* Event Title */}
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight line-clamp-2 tracking-tight group-hover:text-blue-300 transition-colors">
            {current.title}
          </h2>

          {/* Event Meta Details: Date, Venue, Price */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-gray-200">
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <Calendar size={13} className="text-amber-400 shrink-0" />
              <span>
                {new Date(current.start_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 truncate max-w-[240px]">
              <MapPin size={13} className="text-blue-400 shrink-0" />
              <span className="truncate">{current.venue_name || current.city || "Bengaluru"}</span>
            </div>

            <span className="font-mono font-black text-xs sm:text-sm bg-emerald-500/90 text-white px-2.5 py-1 rounded-lg shadow-xs">
              {Number(current.min_price) === 0 ? "Free Entry" : `From ₹${Number(current.min_price).toLocaleString("en-IN")}`}
            </span>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <Link
              href={`/events/${current.slug}`}
              className="inline-flex items-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Book Delegate Pass</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Desktop Arrow Controls */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Previous event"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Next event"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Pagination Indicator Dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer p-0 ${
                idx === currentIndex
                  ? "w-8 h-2 bg-[#0758fc]"
                  : "w-2 h-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
