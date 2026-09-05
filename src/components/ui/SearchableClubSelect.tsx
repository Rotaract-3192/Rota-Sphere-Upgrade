"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Building, Globe, Sparkles } from "lucide-react";
import { getDistrictClubsWithZones, getClubZone, matchesClubQuery, syncLiveClubsIntoZoneMap } from "@/lib/utils/zoneResolver";
import { getDistrictClubsAction } from "@/app/actions/clubActions";

interface SearchableClubSelectProps {
  value: string; // club name or "custom" or ""
  customValue?: string; // external club name if value === "custom"
  zone?: string;
  clubs?: Array<{ name: string; zone: string; partnerClub?: string }>;
  onChange: (clubName: string, zone: string, isCustom: boolean) => void;
  onCustomChange?: (customClubName: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function SearchableClubSelect({
  value,
  customValue = "",
  zone = "",
  clubs: propClubs,
  onChange,
  onCustomChange,
  placeholder = "Search or select Rotaract Club...",
  className = "",
  required = false,
}: SearchableClubSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live clubs state dynamically fetched from PostgreSQL organizations table
  const [clubsList, setClubsList] = useState<Array<{ name: string; zone: string; partnerClub?: string }>>(() => {
    if (propClubs && propClubs.length > 0) return propClubs;
    return getDistrictClubsWithZones();
  });

  const fetchLiveClubs = () => {
    getDistrictClubsAction()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const liveList = res.data.map((c) => ({
            name: c.name,
            zone: c.zone || "District 3192",
            partnerClub: c.partner_club || "",
          }));
          syncLiveClubsIntoZoneMap(liveList);
          setClubsList(liveList);
        }
      })
      .catch((e) => {
        console.error("Failed to sync live clubs:", e);
      });
  };

  // Fetch on mount
  useEffect(() => {
    if (!propClubs) {
      fetchLiveClubs();
    }
  }, [propClubs]);

  // Re-fetch when opening dropdown to guarantee latest changes from admin panel
  useEffect(() => {
    if (isOpen && !propClubs) {
      fetchLiveClubs();
    }
  }, [isOpen, propClubs]);

  const isCustomMode = value === "custom";

  // Sync search query when value changes
  useEffect(() => {
    if (value && value !== "custom") {
      setSearchQuery(value);
    } else if (!value) {
      setSearchQuery("");
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If user left input with partial unselected text, restore selected value
        if (value && value !== "custom") {
          setSearchQuery(value);
        } else if (!value) {
          setSearchQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Filter clubs based on search query
  const filteredClubs = useMemo(() => {
    const list = propClubs && propClubs.length > 0 ? propClubs : clubsList;
    if (!searchQuery.trim()) return list;
    return list.filter((c) => matchesClubQuery(searchQuery, c));
  }, [searchQuery, clubsList, propClubs]);

  function handleSelectClub(clubName: string, clubZone: string) {
    setSearchQuery(clubName);
    onChange(clubName, clubZone, false);
    setIsOpen(false);
  }

  function handleSelectCustom() {
    onChange("custom", "", true);
    setIsOpen(false);
  }

  function handleClear() {
    setSearchQuery("");
    onChange("", "", false);
    if (onCustomChange) onCustomChange("");
    if (inputRef.current) inputRef.current.focus();
    setIsOpen(true);
  }

  // If in custom mode, show external club text input with a button to switch back to search
  if (isCustomMode) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Globe size={13} className="text-[#0758fc] dark:text-blue-400" /> External / Other Rotaract Club
          </label>
          <button
            type="button"
            onClick={() => {
              onChange("", "", false);
              setSearchQuery("");
              setIsOpen(true);
            }}
            className="text-[10px] font-extrabold text-[#0758fc] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            ← Back to District 3192 List
          </button>
        </div>
        <div className="relative">
          <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            required={required}
            placeholder="Type Rotaract Club Name (e.g. Rotaract Club of Bombay)..."
            value={customValue}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`w-full bg-gray-50 dark:bg-gray-800/80 border transition-all rounded-xl pl-9 pr-9 py-2.5 text-xs font-semibold flex items-center cursor-text relative ${
          isOpen
            ? "border-[#0758fc] bg-white dark:bg-gray-900 ring-2 ring-[#0758fc]/15 shadow-xs"
            : value
            ? "border-blue-200 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-950/30 text-gray-900 dark:text-white"
            : "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
        }`}
      >
        <Search size={14} className={`absolute left-3 transition-colors ${isOpen ? "text-[#0758fc] dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />

        <input
          ref={inputRef}
          type="text"
          required={required}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (value && value !== e.target.value) {
              // Reset resolved zone until user selects
              onChange("", "", false);
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-transparent outline-none text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X size={13} />
          </button>
        ) : (
          <ChevronDown
            size={14}
            className={`absolute right-3 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#0758fc] dark:text-blue-400" : ""
            }`}
          />
        )}
      </div>

      {/* Floating Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-[99999] overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header count indicator */}
          <div className="px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <span>District 3192 Clubs</span>
            <span>{filteredClubs.length} match{filteredClubs.length === 1 ? "" : "es"}</span>
          </div>

          {/* List items */}
          <div className="max-h-64 sm:max-h-80 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => {
                const isSelected = value === club.name;
                // Separate "Rotaract Club of " prefix for maximum mobile clarity & zero truncation
                const prefixMatch = club.name.match(/^(Rotaract Club of\s+)(.*)$/i);
                const prefix = prefixMatch ? prefixMatch[1] : "";
                const coreName = prefixMatch ? prefixMatch[2] : club.name;

                return (
                  <button
                    key={club.name}
                    type="button"
                    onClick={() => handleSelectClub(club.name, club.zone)}
                    className={`w-full text-left p-2.5 sm:px-3 sm:py-2.5 rounded-xl text-xs flex items-start justify-between gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/60 text-[#0758fc] dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <Building
                        size={14}
                        className={`mt-0.5 shrink-0 ${isSelected ? "text-[#0758fc] dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
                      />
                      <div className="min-w-0 flex-1 text-left">
                        {prefix && (
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block leading-tight">
                            {prefix}
                          </span>
                        )}
                        <span className={`text-xs sm:text-[13px] font-bold leading-snug break-words whitespace-normal block ${
                          isSelected ? "text-[#0758fc] dark:text-blue-400 font-extrabold" : "text-gray-900 dark:text-white font-extrabold"
                        }`}>
                          {coreName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-950 text-[#0758fc] dark:text-blue-400 border-blue-300 dark:border-blue-700"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {club.zone}
                      </span>
                      {isSelected && <Check size={14} className="text-[#0758fc] dark:text-blue-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-1">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No District 3192 club matches &quot;{searchQuery}&quot;</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">You can add it as an external club below.</p>
              </div>
            )}

            {/* Custom / External Club Option */}
            <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleSelectCustom}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-purple-600 dark:text-purple-400" />
                  <span>+ Other / External Rotaract Club</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Type Custom
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
