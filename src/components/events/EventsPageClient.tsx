"use client";

import { useState } from "react";
import { EventGrid } from "@/components/events/EventGrid";
import { EventMapExplorer } from "@/components/events/EventMapExplorer";
import { LayoutGrid, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EventsPageClientProps {
  events: any[];
  clubName?: string;
}

export function EventsPageClient({ events, clubName }: EventsPageClientProps) {
  const [viewMode, setViewMode] = useState<"GRID" | "MAP">("GRID");

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* View Switcher Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            {clubName
              ? `Events Hosted by ${clubName}`
              : viewMode === "GRID"
              ? "All Event Listings"
              : "Interactive Event Map"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {viewMode === "GRID"
              ? `Showing ${events.length} published event${events.length === 1 ? "" : "s"}`
              : "Locate events and venues on the interactive map"}
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex items-center gap-1 border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              viewMode === "GRID"
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid size={15} /> Grid View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("MAP")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              viewMode === "MAP"
                ? "bg-[#1e9df1] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <MapPin size={15} /> Interactive Map
          </button>
        </div>
      </div>

      {/* Render selected view mode with subtle fade transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === "GRID" ? (
            <EventGrid initialEvents={events} />
          ) : (
            <EventMapExplorer
              events={events}
              title="Interactive Event Map & Venue Discovery"
              subtitle="Explore Rotaract events and venues on the map with real-time location pins."
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

