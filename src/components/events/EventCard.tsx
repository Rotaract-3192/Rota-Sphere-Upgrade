"use client";

/**
 * EventCard — High-Converting SaaS Event Card
 * Supports both dark and light canvas with smooth hover animations, verified badges, and price tags.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

interface EventCardProps {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  city: string | null;
  startDate: string;
  price: number | null;
  badge?: string | null;
  organizationName?: string | null;
  variant?: "dark" | "light";
}

export function EventCard({
  slug,
  title,
  thumbnailUrl,
  city,
  startDate,
  price,
  badge,
  organizationName,
  variant = "light",
}: EventCardProps) {
  const [saved, setSaved] = useState(false);

  const formattedDate = new Date(startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const priceDisplay = price === null || price === 0 ? "Free Entry" : `₹${price.toLocaleString("en-IN")}`;
  const isDark = variant === "dark";

  return (
    <article className="group flex flex-col gap-3 relative">
      {/* ── Photo Container ────────────────────────────────────────────── */}
      <Link
        href={`/events/${slug}`}
        className="block relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-200/80 dark:border-white/10 shadow-sm group-hover:shadow-md transition-all duration-300"
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-black bg-gradient-to-br from-gray-900 to-gray-800 text-sm">
            RotaSphere 3192
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-black/20" />

        {/* Badge top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-400/30 shadow-sm">
          <ShieldCheck size={12} className="text-amber-400" />
          <span>{badge || "Verified"}</span>
        </div>

        {/* Heart save top-right */}
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save event"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved((v) => !v);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 hover:bg-white/20 transition-all shadow-sm cursor-pointer z-10"
        >
          <Heart
            size={15}
            className={saved ? "fill-[#0758fc] text-[#0758fc]" : "text-white"}
          />
        </button>

        {/* Bottom floating price tag on image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="text-xs font-mono font-extrabold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white">
            {priceDisplay}
          </span>
          <span className="text-[11px] font-semibold text-gray-300 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <Calendar size={11} className="text-amber-400" /> {formattedDate}
          </span>
        </div>
      </Link>

      {/* ── Content & Title ────────────────────────────────────────────── */}
      <Link href={`/events/${slug}`} className="flex flex-col gap-1.5 focus:outline-hidden group-hover:opacity-95">
        {/* Title — High contrast dark text visible at all times */}
        <h3 className={`font-black text-base leading-snug line-clamp-1 transition-colors ${isDark ? "text-white group-hover:text-amber-400" : "text-gray-900 group-hover:text-[#0758fc]"}`}>
          {title}
        </h3>

        {/* Host Club Name */}
        {organizationName && (
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 line-clamp-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0758fc]" />
            <span className="truncate">{organizationName}</span>
          </p>
        )}

        {/* Location & Details */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-[#0758fc]" />
            <span className="font-medium text-gray-600 dark:text-gray-400">{city || "District 3192"}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0758fc] group-hover:translate-x-0.5 transition-transform">
            Book Pass <ArrowRight size={12} />
          </span>
        </div>
      </Link>
    </article>
  );
}
