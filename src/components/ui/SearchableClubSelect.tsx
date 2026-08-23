"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Building, Globe, Sparkles } from "lucide-react";
import { getDistrictClubsWithZones, getClubZone } from "@/lib/utils/zoneResolver";

const ALL_CLUBS = getDistrictClubsWithZones();

interface SearchableClubSelectProps {
  value: string; // club name or "custom" or ""
  customValue?: string; // external club name if value === "custom"
  zone?: string;
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
    if (!searchQuery.trim()) return ALL_CLUBS;
    const q = searchQuery.toLowerCase().trim();
    return ALL_CLUBS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.zone.toLowerCase().includes(q) ||
        c.name.replace(/rotaract club of /gi, "").toLowerCase().includes(q)
    );
  }, [searchQuery]);

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
          <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
            <Globe size={13} className="text-[#0758fc]" /> External / Other Rotaract Club
          </label>
          <button
            type="button"
            onClick={() => {
              onChange("", "", false);
              setSearchQuery("");
              setIsOpen(true);
            }}
            className="text-[10px] font-extrabold text-[#0758fc] hover:underline cursor-pointer flex items-center gap-1"
          >
            ← Back to District 3192 List
          </button>
        </div>
        <div className="relative">
          <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            required={required}
            placeholder="Type Rotaract Club Name (e.g. Rotaract Club of Bombay)..."
            value={customValue}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
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
        className={`w-full bg-gray-50 border transition-all rounded-xl pl-9 pr-9 py-2.5 text-xs font-semibold flex items-center cursor-text relative ${
          isOpen
            ? "border-[#0758fc] bg-white ring-2 ring-[#0758fc]/15 shadow-xs"
            : value
            ? "border-blue-200 bg-blue-50/20 text-gray-900"
            : "border-gray-200 text-gray-800"
        }`}
      >
        <Search size={14} className={`absolute left-3 transition-colors ${isOpen ? "text-[#0758fc]" : "text-gray-400"}`} />

        <input
          ref={inputRef}
          type="text"
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
          className="w-full bg-transparent outline-none text-xs font-bold text-gray-900 placeholder:text-gray-400"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X size={13} />
          </button>
        ) : (
          <ChevronDown
            size={14}
            className={`absolute right-3 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#0758fc]" : ""
            }`}
          />
        )}
      </div>

      {/* Floating Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl z-[99999] overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header count indicator */}
          <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
            <span>District 3192 Clubs</span>
            <span>{filteredClubs.length} match{filteredClubs.length === 1 ? "" : "es"}</span>
          </div>

          {/* List items */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => {
                const isSelected = value === club.name;
                return (
                  <button
                    key={club.name}
                    type="button"
                    onClick={() => handleSelectClub(club.name, club.zone)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/90 text-[#0758fc] font-black border border-blue-200"
                        : "hover:bg-gray-50 text-gray-800 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Building size={13} className={isSelected ? "text-[#0758fc]" : "text-gray-400"} />
                      <span className="truncate">{club.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? "bg-blue-100 text-[#0758fc] border-blue-300"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {club.zone}
                      </span>
                      {isSelected && <Check size={14} className="text-[#0758fc]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-1">
                <p className="text-xs font-bold text-gray-700">No District 3192 club matches &quot;{searchQuery}&quot;</p>
                <p className="text-[11px] text-gray-400">You can add it as an external club below.</p>
              </div>
            )}

            {/* Custom / External Club Option */}
            <div className="pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSelectCustom}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-purple-700 hover:bg-purple-50 transition-all font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-purple-600" />
                  <span>+ Other / External Rotaract Club</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
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
