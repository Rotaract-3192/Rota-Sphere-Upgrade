"use client";

/**
 * EventCard — High-Converting SaaS Event Card
 * Rich, elevated card design with poster badges, event summary excerpt,
 * host club info, venue details, time chip, bulk slab badge, and primary CTA.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Globe,
  PauseCircle,
} from "lucide-react";
import { isEventConcluded } from "@/lib/utils/dateTimeUtils";

export interface EventCardProps {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  thumbnailUrl: string | null;
  venueName?: string | null;
  city?: string | null;
  startDate: string;
  endDate?: string | null;
  status?: string | null;
  eventType?: string | null;
  categoryName?: string | null;
  price: number | null;
  organizationName?: string | null;
  hasGroupPasses?: boolean;
  allowNonRotaract?: boolean;
  variant?: "dark" | "light";
}

export function EventCard({
  slug,
  title,
  summary,
  thumbnailUrl,
  venueName,
  city,
  startDate,
  endDate,
  status,
  eventType = "OFFLINE",
  categoryName,
  price,
  organizationName,
  hasGroupPasses = false,
  allowNonRotaract = true,
}: EventCardProps) {
  const [saved, setSaved] = useState(false);

  // Check if event has concluded / ended
  const isEnded = isEventConcluded({
    startDate,
    endDate,
    status,
  });
  const isPaused = status === "PAUSED";

  // Formatted date (e.g., "27 Sep 2026")
  const dateObj = new Date(startDate);
  const isValidDate = !isNaN(dateObj.getTime());

  const formattedDate = isValidDate
    ? dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "Date TBA";

  // Formatted start time (e.g., "11:00 AM")
  const formattedTime = isValidDate
    ? dateObj.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
    : null;

  // Pricing display
  const isFree = price === null || price === 0;
  const priceDisplay = isFree ? "Free Entry" : `₹${price.toLocaleString("en-IN")}`;

  // Clean location string
  const cleanVenue = venueName?.trim();
  const cleanCity = city?.trim();
  const isVirtual = eventType === "ONLINE" || eventType === "VIRTUAL";

  let locationText = "District 3192";
  if (isVirtual) {
    locationText = "Virtual / Online Event";
  } else if (cleanVenue && cleanVenue.toLowerCase() !== "test") {
    if (cleanCity && cleanCity.toLowerCase() !== "test" && !cleanVenue.toLowerCase().includes(cleanCity.toLowerCase())) {
      locationText = `${cleanVenue}, ${cleanCity}`;
    } else {
      locationText = cleanVenue;
    }
  } else if (cleanCity && cleanCity.toLowerCase() !== "test") {
    locationText = cleanCity;
  }

  // Fallback summary if empty or "test"
  const cleanSummary = summary?.trim();
  const displaySummary =
    cleanSummary && cleanSummary.toLowerCase() !== "test"
      ? cleanSummary
      : "Join fellow Rotaractors and delegates for this featured district experience.";

  return (
    <article
      data-tour="event-card"
      className="group relative flex flex-col justify-between h-full rounded-3xl bg-white dark:bg-[#0c1322] border border-gray-200/90 dark:border-gray-800/90 hover:border-[#0758fc]/50 dark:hover:border-[#0758fc]/60 shadow-sm hover:shadow-xl hover:shadow-[#0758fc]/10 transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden"
    >
      
      {/* ── Top Poster & Badges ──────────────────────────────────────── */}
      <div className="relative">
        <Link
          href={`/events/${slug}`}
          className="block relative w-full aspect-[16/10] overflow-hidden bg-gray-950 focus:outline-hidden"
        >
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
                isEnded ? "grayscale-[25%] opacity-90" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-black bg-gradient-to-br from-gray-900 via-[#0758fc]/20 to-gray-950 text-sm p-4 text-center">
              <span className="text-white text-base font-extrabold tracking-tight">RotaSphere 3192</span>
              <span className="text-xs text-gray-400 mt-1 font-medium">Official District Event</span>
            </div>
          )}

          {/* Scrim Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-black/40 pointer-events-none" />

          {/* Top-Left: Category & Event Format Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            {isEnded ? (
              <span className="flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-zinc-300 border border-zinc-700/60 shadow-xs">
                <Clock size={11} className="text-zinc-400" />
                Concluded
              </span>
            ) : isPaused ? (
              <span className="flex items-center gap-1 bg-amber-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-amber-300 border border-amber-500/60 shadow-xs">
                <PauseCircle size={11} className="text-amber-400" />
                Ticketing Paused
              </span>
            ) : categoryName ? (
              <span className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white border border-white/20 shadow-xs">
                <Sparkles size={11} className="text-blue-400" />
                {categoryName}
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white border border-white/20 shadow-xs">
                <Sparkles size={11} className="text-blue-400" />
                Rotaract Event
              </span>
            )}

            <span className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-200 border border-white/15 shadow-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isEnded ? "bg-zinc-400" : isPaused ? "bg-amber-400 animate-pulse" : isVirtual ? "bg-cyan-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              {isEnded ? "Ended" : isPaused ? "Paused" : isVirtual ? "Virtual" : "In-Person"}
            </span>
          </div>

          {/* Top-Right: Wishlist Heart Button */}
          <button
            type="button"
            aria-label={saved ? "Remove from saved" : "Save event"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved((v) => !v);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:scale-110 hover:bg-black/70 active:scale-95 transition-all shadow-sm cursor-pointer z-10"
          >
            <Heart
              size={15}
              className={saved ? "fill-[#0758fc] text-[#0758fc]" : "text-white"}
            />
          </button>

          {/* Bottom Floating Overlay: Price Tag & Date Chip */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10 pointer-events-none">
            <div className="flex items-center gap-1.5">
              {isEnded ? (
                <span className="text-xs font-bold backdrop-blur-md px-2.5 py-1 rounded-lg border shadow-sm bg-black/75 text-zinc-300 border-white/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Event Over
                </span>
              ) : isPaused ? (
                <span className="text-xs font-bold backdrop-blur-md px-2.5 py-1 rounded-lg border shadow-sm bg-amber-950/90 text-amber-300 border-amber-500/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Paused
                </span>
              ) : (
                <span
                  className={`text-xs font-mono font-extrabold backdrop-blur-md px-2.5 py-1 rounded-lg border shadow-sm ${
                    isFree
                      ? "bg-emerald-500/90 text-white border-emerald-400/40"
                      : "bg-[#0758fc]/90 text-white border-blue-400/40"
                  }`}
                >
                  {isFree ? "Free Entry" : `From ${priceDisplay}`}
                </span>
              )}

              {!isEnded && !isPaused && hasGroupPasses && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/90 backdrop-blur-md text-white px-2 py-1 rounded-lg border border-purple-400/40 shadow-xs">
                  <Users size={11} /> Group Deals
                </span>
              )}
            </div>

            <span className="text-[11px] font-bold text-gray-200 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
              <Calendar size={12} className={isEnded ? "text-gray-400 shrink-0" : "text-amber-400 shrink-0"} />
              {formattedDate}
            </span>
          </div>
        </Link>
      </div>

      {/* ── Card Body & Details ──────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2.5">
        {/* Organizer Row */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0758fc] shrink-0" />
          <span className="truncate">{organizationName || "Rotaract District 3192"}</span>
        </div>

        {/* Title */}
        <Link href={`/events/${slug}`} className="group-hover:text-[#0758fc] dark:group-hover:text-[#60a5fa] transition-colors focus:outline-hidden">
          <h3 className="font-black text-base sm:text-lg leading-snug text-gray-900 dark:text-white line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Event Summary / Description Excerpt */}
        <p className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed font-normal">
          {displaySummary}
        </p>

        {/* Metadata Chips: Venue & Timing */}
        <div className="space-y-1.5 pt-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[#0758fc] shrink-0" />
            <span className="truncate font-medium">{locationText}</span>
          </div>

          {formattedTime && (
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Clock size={13} className="text-amber-500 shrink-0" />
              <span>{formattedTime} onwards • IST</span>
            </div>
          )}
        </div>

        {/* Feature Tags: Bulk Slabs / Open to All / Concluded */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {isEnded && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              <Clock size={11} /> Event Concluded
            </span>
          )}

          {!isEnded && hasGroupPasses && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Users size={11} /> Group / Club Pass
            </span>
          )}

          {allowNonRotaract ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Globe size={11} /> Open to All
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Rotaract Members Only
            </span>
          )}
        </div>

        {/* ── Card Footer & CTA ────────────────────────────────────────── */}
        <div data-tour="event-card-action" className="mt-auto pt-3.5 border-t border-gray-100 dark:border-gray-800/90 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
              {isEnded ? "Event Status" : isPaused ? "Ticketing" : isFree ? "Admission" : "Pass Starts At"}
            </span>
            <span className={`text-sm sm:text-base font-black leading-none ${isEnded || isPaused ? "text-gray-500 dark:text-gray-400 font-sans text-xs sm:text-sm" : "text-gray-900 dark:text-white font-mono"}`}>
              {isEnded ? "Concluded" : isPaused ? "Paused" : priceDisplay}
            </span>
          </div>

          <Link
            href={`/events/${slug}`}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer group/btn ${
              isEnded || isPaused
                ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-xs"
                : "bg-[#0758fc] hover:bg-[#054fe0] active:scale-95 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
            }`}
          >
            <span>{isEnded ? "Event Over" : isPaused ? "View Details" : "Book Pass"}</span>
            <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform opacity-70" />
          </Link>
        </div>
      </div>
    </article>
  );
}
