"use client";

/**
 * HomeGreetingBar — Personalized Greeting & District Zone Selector
 * Inspired by modern entertainment & ticketing apps.
 * Features:
 * - Dynamic personalized greeting ("Welcome, [First Name]!" or "Welcome Guest!")
 * - Interactive District 3192 Zone & City selector pill
 * - Quick profile button / user avatar
 * - Clean discovery banner ribbon
 */

import React, { useState } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { MapPin, ChevronRight, Compass, Sparkles, User as UserIcon } from "lucide-react";

const DISTRICT_ZONES = [
  { id: "bengaluru-all", label: "All District 3192", desc: "85 Chartered Clubs" },
  { id: "bengaluru-central", label: "Bengaluru Central", desc: "CBD, MG Road, Indiranagar" },
  { id: "bengaluru-south", label: "Bengaluru South", desc: "Jayanagar, Koramangala, BTM" },
  { id: "bengaluru-north", label: "Bengaluru North", desc: "Hebbal, Yelahanka, Malleshwaram" },
  { id: "bengaluru-east", label: "Bengaluru East", desc: "Whitefield, Marathahalli, Bellandur" },
  { id: "bengaluru-rural", label: "Bengaluru Rural", desc: "Doddaballapur, Nelamangala" },
  { id: "tumakuru", label: "Tumakuru Zone", desc: "Tumakuru & surrounding clubs" },
  { id: "kolar", label: "Kolar & Chikkaballapura", desc: "KGF, Chintamani, Kolar Town" },
];

export function HomeGreetingBar() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [selectedZone, setSelectedZone] = useState("All District 3192");
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);

  const firstName = user?.firstName || user?.fullName?.split(" ")[0];
  const greetingText = isSignedIn && firstName ? `Welcome, ${firstName}!` : "Welcome Guest!";

  return (
    <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        
        {/* Top Row: Greeting & Zone Selector & Avatar */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Greeting + Zone Selector */}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight text-gray-950 dark:text-white leading-tight flex items-center gap-1.5 truncate">
              <span>{greetingText}</span>
              <span className="inline-block animate-bounce text-lg">👋</span>
            </h1>

            {/* Zone Selector Pill */}
            <div className="relative inline-block mt-0.5">
              <button
                type="button"
                onClick={() => setZoneDropdownOpen(!zoneDropdownOpen)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0758fc] hover:text-[#054fe0] transition-colors cursor-pointer group"
                aria-expanded={zoneDropdownOpen}
              >
                <MapPin size={13} className="text-[#0758fc] shrink-0" />
                <span className="truncate">{selectedZone}</span>
                <ChevronRight
                  size={14}
                  className={`text-[#0758fc] transition-transform duration-200 ${
                    zoneDropdownOpen ? "rotate-90" : "group-hover:translate-x-0.5"
                  }`}
                />
              </button>

              {/* Zone Dropdown Menu */}
              {zoneDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setZoneDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Select District Zone
                      </span>
                      <span className="text-[10px] font-bold text-[#0758fc]">District 3192</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 space-y-1 scrollbar-hide">
                      {DISTRICT_ZONES.map((zone) => (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => {
                            setSelectedZone(zone.label);
                            setZoneDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition-colors cursor-pointer ${
                            selectedZone === zone.label
                              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] font-bold"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          <span className="font-extrabold">{zone.label}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{zone.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Profile Avatar / Quick Sign-In */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isLoaded && isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-[#0758fc]/30 shadow-xs",
                  },
                }}
              />
            ) : (
              <Link
                href="/sign-in"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-[#0758fc] hover:text-white flex items-center justify-center transition-all border border-gray-200 dark:border-gray-700 shadow-xs"
                title="Sign In"
                aria-label="Sign In"
              >
                <UserIcon size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Banner Ribbon (Inspired by reference app notification strip) */}
        <div className="mt-3 sm:mt-3.5 bg-gradient-to-r from-[#0758fc] via-blue-600 to-indigo-600 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Compass size={16} className="text-blue-200 shrink-0" />
            <p className="text-xs sm:text-[13px] font-semibold truncate">
              Discover official flagship conferences, youth fests, and sports leagues across 85 chartered clubs.
            </p>
          </div>
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-black text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <span>Explore All</span>
            <ChevronRight size={13} />
          </Link>
        </div>

      </div>
    </div>
  );
}
