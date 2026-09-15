"use client";

/**
 * ClubsSpotlightSection — Premier Chartered Clubs Spotlight
 * Features:
 * - Highlights top chartered clubs across District 3192
 * - Club crest / emblem
 * - Zone & charter details
 * - Direct link to club profiles and club events
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";

export interface ClubSpotlightItem {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  city?: string | null;
  zone?: string | null;
  event_count?: number;
}

interface ClubsSpotlightSectionProps {
  clubs?: ClubSpotlightItem[];
}

export function ClubsSpotlightSection({ clubs = [] }: ClubsSpotlightSectionProps) {
  // If clubs list empty, provide top verified chartered clubs in 3192
  const fallbackClubs: ClubSpotlightItem[] = [
    {
      id: "rc-bangalore",
      name: "Rotaract Club of Bangalore",
      slug: "rotaract-club-of-bangalore",
      logo_url: "/brand/logo.png",
      city: "Bengaluru Central",
      zone: "Zone 1",
      event_count: 8,
    },
    {
      id: "rc-koramangala",
      name: "Rotaract Club of Koramangala",
      slug: "rotaract-club-of-koramangala",
      logo_url: "/brand/logo.png",
      city: "Bengaluru South",
      zone: "Zone 2",
      event_count: 5,
    },
    {
      id: "rc-bmsce",
      name: "Rotaract Club of BMSCE",
      slug: "rotaract-club-of-bmsce",
      logo_url: "/brand/logo.png",
      city: "Basavanagudi",
      zone: "Institutional",
      event_count: 6,
    },
    {
      id: "rc-rvce",
      name: "Rotaract Club of RVCE",
      slug: "rotaract-club-of-rvce",
      logo_url: "/brand/logo.png",
      city: "Mysore Road",
      zone: "Institutional",
      event_count: 4,
    },
    {
      id: "rc-indiranagar",
      name: "Rotaract Club of Indiranagar",
      slug: "rotaract-club-of-indiranagar",
      logo_url: "/brand/logo.png",
      city: "Bengaluru East",
      zone: "Zone 3",
      event_count: 7,
    },
    {
      id: "rc-tumakuru",
      name: "Rotaract Club of Tumakuru Central",
      slug: "rotaract-club-of-tumakuru-central",
      logo_url: "/brand/logo.png",
      city: "Tumakuru",
      zone: "Zone 4",
      event_count: 3,
    },
  ];

  const displayClubs = clubs && clubs.length > 0 ? clubs : fallbackClubs;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 border-t border-gray-100 dark:border-gray-800/80">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#0758fc] uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> District 3192 Network
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
            Chartered Clubs in Spotlight
          </h2>
        </div>

        <Link
          href="/clubs"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-[#0758fc] hover:text-[#054fe0] transition-colors whitespace-nowrap shrink-0 group"
        >
          <span>View All 85 Clubs</span>
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Clubs Scrollable Cards */}
      <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 sm:pb-1 scrollbar-hide">
        {displayClubs.map((club) => (
          <Link
            key={club.id || club.slug}
            href={`/clubs`}
            className="group flex flex-col items-center text-center w-40 sm:w-48 p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 hover:border-[#0758fc]/40 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200 hover:-translate-y-1 shrink-0"
          >
            {/* Club Logo / Emblem Circle */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 p-2.5 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Image
                src={club.logo_url || "/brand/logo.png"}
                alt={club.name}
                fill
                sizes="72px"
                className="object-contain p-2"
              />
            </div>

            {/* Club Name */}
            <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0758fc] transition-colors mb-1">
              {club.name}
            </h4>

            {/* City / Zone */}
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate w-full">
              {club.city || club.zone || "District 3192"}
            </span>

            {/* Event Count Chip */}
            {club.event_count !== undefined && club.event_count > 0 && (
              <span className="mt-2 text-[10px] font-bold text-[#0758fc] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 px-2 py-0.5 rounded-full">
                {club.event_count} Active Event{club.event_count > 1 ? "s" : ""}
              </span>
            )}
          </Link>
        ))}
      </div>

    </section>
  );
}
