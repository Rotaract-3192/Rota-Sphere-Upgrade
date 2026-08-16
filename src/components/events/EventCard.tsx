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
  variant = "dark",
}: EventCardProps) {
  const [saved, setSaved] = useState(false);

  const formattedDate = new Date(startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const priceDisplay = price === null || price === 0 ? "Free Entry" : `₹${price.toLocaleString("en-IN")}`;
  const isDark = variant === "dark";

  return (
    <article className="group flex flex-col gap-3 relative">
      {/* ── Photo Container ────────────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-md">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-gradient-to-br from-gray-900 to-gray-800">
            RotaSphere
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
            setSaved((v) => !v);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 hover:bg-white/20 transition-all shadow-sm cursor-pointer"
        >
          <Heart
            size={15}
            className={saved ? "fill-[#1e9df1] text-[#1e9df1]" : "text-white"}
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
      </div>

      {/* ── Content & Title ────────────────────────────────────────────── */}
      <Link href={`/events/${slug}`} className="flex flex-col gap-1.5 focus:outline-hidden group-hover:opacity-90">
        {/* Title */}
        <h3 className={`font-bold text-base line-clamp-1 group-hover:text-amber-400 transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>
          {title}
        </h3>

        {/* Location & Details */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-amber-400/80" />
            {city || "District 3192"}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
            Book Pass <ArrowRight size={12} />
          </span>
        </div>
      </Link>
    </article>
  );
}
