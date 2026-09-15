"use client";

/**
 * MarqueePromoStrip — High-Impact Promotional Marquee Strip
 * Inspired by the secondary concert/marquee banner in entertainment ticketing apps.
 * Features:
 * - Energetic gradient artwork
 * - Club delegation / group pass perks highlight
 * - One-tap action button
 */

import React from "react";
import Link from "next/link";
import { Users, Ticket, ArrowRight, Zap } from "lucide-react";

export function MarqueePromoStrip() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-rose-600 to-purple-700 text-white p-5 sm:p-7 shadow-xl shadow-rose-950/20">
        
        {/* Ambient background decoration */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-10 w-64 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          
          {/* Left: Text & Badges */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-white/20">
                <Zap size={11} className="text-amber-300" /> Exclusive Club Perk
              </span>
              <span className="text-[11px] font-extrabold text-white/90">
                0% Platform Fee · Direct Club UPI
              </span>
            </div>

            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-snug">
              Attending as a Club Delegation? Get Bulk Slab Deals!
            </h3>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Book passes together for 5, 10, or 25+ club members and unlock tier discounts instantly.
            </p>
          </div>

          {/* Right: CTA Button */}
          <div className="shrink-0 pt-1 sm:pt-0">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-white text-gray-950 hover:bg-gray-100 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 whitespace-nowrap"
            >
              <Users size={16} className="text-rose-600" />
              <span>Explore Group Passes</span>
              <ArrowRight size={14} className="text-gray-600" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
