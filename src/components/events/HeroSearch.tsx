"use client";

/**
 * HeroSearch — 3-Segment Pill Search Bar
 * DESIGN-airbnb.md §search-bar: 64px height, white surface, 3 segments, Rausch search orb
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Ticket } from "lucide-react";

const CITIES = ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Anand", "Bengaluru"];

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [ticketType, setTicketType] = useState<"all" | "free" | "paid">("all");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (date) params.set("date", date);
    if (ticketType !== "all") params.set("type", ticketType);

    router.push(`/events?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto px-4 my-6">
      {/* ── Pill container ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 p-2 flex flex-col md:flex-row items-center gap-2">

        {/* ── SEGMENT 1: Where ────────────────────────────────────────── */}
        <div className="flex-1 w-full px-6 py-2 flex flex-col justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer group">
          <label htmlFor="city-input" className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
            Where
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <MapPin size={16} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
            <input
              id="city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search cities in District 3192"
              className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-px h-8 bg-gray-200" />

        {/* ── SEGMENT 2: When ─────────────────────────────────────────── */}
        <div className="flex-1 w-full px-6 py-2 flex flex-col justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer group">
          <label htmlFor="date-input" className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
            When
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar size={16} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-px h-8 bg-gray-200" />

        {/* ── SEGMENT 3: Ticket Type + CTA ────────────────────────────── */}
        <div className="w-full md:w-auto px-6 py-2 flex items-center justify-between gap-4 rounded-full hover:bg-gray-50 transition-colors cursor-pointer group">
          <div className="flex flex-col justify-center flex-1">
            <label htmlFor="type-select" className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
              Ticket type
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <Ticket size={16} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              <select
                id="type-select"
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as "all" | "free" | "paid")}
                className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none cursor-pointer"
              >
                <option value="all">All events</option>
                <option value="free">Free only</option>
                <option value="paid">Paid only</option>
              </select>
            </div>
          </div>

          {/* Rausch search orb CTA */}
          <button
            type="submit"
            aria-label="Search events"
            className="flex-shrink-0 w-12 h-12 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white flex items-center justify-center shadow-md hover:scale-105 transition-all duration-150"
          >
            <Search size={20} strokeWidth={2.5} />
          </button>
        </div>

      </div>

      {/* ── Quick City Tags ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-medium text-gray-500">
        <span>Popular:</span>
        {CITIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCity(c);
              router.push(`/events?city=${c}`);
            }}
            className="px-3 py-1 rounded-full border border-gray-200 bg-white hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            📍 {c}
          </button>
        ))}
      </div>
    </form>
  );
}
