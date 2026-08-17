"use client";

import { useState } from "react";
import { EventGrid } from "@/components/events/EventGrid";
import { EventMapExplorer } from "@/components/events/EventMapExplorer";
import { LayoutGrid, MapPin } from "lucide-react";

interface EventsPageClientProps {
  events: any[];
  clubName?: string;
}

export function EventsPageClient({ events, clubName }: EventsPageClientProps) {
  const [viewMode, setViewMode] = useState<"GRID" | "MAP">("GRID");

  return (
    <div className="space-y-8">
      {/* View Switcher Controls Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {clubName
              ? `Events Hosted by ${clubName}`
              : viewMode === "GRID"
              ? "All Event Listings"
              : "Interactive Event Map"}
          </h2>
          <p className="text-xs text-gray-500">
            {viewMode === "GRID"
              ? `Showing ${events.length} published event${events.length === 1 ? "" : "s"}`
              : "Locate events and venues on the interactive map"}
          </p>
        </div>

        <div className="bg-gray-200/80 p-1 rounded-2xl flex items-center gap-1 border border-gray-300/50">
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === "GRID"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutGrid size={15} /> Grid View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("MAP")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === "MAP"
                ? "bg-[#1e9df1] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <MapPin size={15} /> Interactive Map
          </button>
        </div>
      </div>

      {/* Render selected view mode */}
      {viewMode === "GRID" ? (
        <EventGrid initialEvents={events} />
      ) : (
        <EventMapExplorer
          events={events}
          title="Interactive Event Map & Venue Discovery"
          subtitle="Explore Rotaract events and venues on the map with real-time location pins."
        />
      )}
    </div>
  );
}
