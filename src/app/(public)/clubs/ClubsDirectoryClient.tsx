"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Users, MapPin, Award, Calendar, ArrowRight, ShieldCheck, 
  Search, Building, Mail, Sparkles, Filter, CheckCircle2, UserCheck
} from "lucide-react";
import { ClubRecord } from "@/app/actions/clubActions";
import { motion, AnimatePresence } from "framer-motion";

interface ClubsDirectoryClientProps {
  initialClubs: ClubRecord[];
}

const ZONES = ["All", "Taranga", "Varuna", "Samudhra", "Sagara", "Pravaha", "Arnava"] as const;
const TYPES = ["All", "Community Based", "Institution Based"] as const;

export function ClubsDirectoryClient({ initialClubs }: ClubsDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");

  const filteredClubs = useMemo(() => {
    return initialClubs.filter((club) => {
      // Zone filter
      if (selectedZone !== "All" && club.zone.toLowerCase() !== selectedZone.toLowerCase()) {
        return false;
      }
      // Type filter
      if (selectedType !== "All" && !club.club_type?.toLowerCase().includes(selectedType.toLowerCase())) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = club.name.toLowerCase().includes(q);
        const matchesPartner = club.partner_club?.toLowerCase().includes(q);
        const matchesPresident = club.president_name?.toLowerCase().includes(q);
        const matchesZone = club.zone?.toLowerCase().includes(q);
        if (!matchesName && !matchesPartner && !matchesPresident && !matchesZone) {
          return false;
        }
      }
      return true;
    });
  }, [initialClubs, selectedZone, selectedType, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ── Search & Filter Control Strip ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Search Input */}
          <div className="md:col-span-8 relative">
            <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by club name, institution, zone, or partner Rotary club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[#1e9df1] focus:bg-white dark:focus:bg-gray-900 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-all"
            />
          </div>

          {/* Type Filter Select */}
          <div className="md:col-span-4 relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[#1e9df1] focus:bg-white dark:focus:bg-gray-900 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Club Types (Community &amp; College)</option>
              <option value="Community Based">Community Based Clubs</option>
              <option value="Institution Based">Institution / College Clubs</option>
            </select>
          </div>
        </div>

        {/* Zone Pills Filter */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Filter size={12} /> Filter by Zone
            </span>
            <span className="text-xs font-bold text-gray-500">
              Showing {filteredClubs.length} of {initialClubs.length} Clubs
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {ZONES.map((zone) => {
              const active = selectedZone === zone;
              const count = zone === "All" 
                ? initialClubs.length 
                : initialClubs.filter((c) => c.zone.toLowerCase() === zone.toLowerCase()).length;

              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    active
                      ? "bg-[#1e9df1] text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span>{zone === "All" ? "All Zones" : `Zone ${zone}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Clubs Grid ── */}
      {filteredClubs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 space-y-3">
          <Building size={40} className="mx-auto text-gray-300 dark:text-gray-700" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white">No Rotaract clubs found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            We couldn&apos;t find any clubs matching your current search and zone filters. Try adjusting your search query.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedZone("All");
              setSelectedType("All");
            }}
            className="text-xs font-bold text-[#1e9df1] hover:underline pt-2 inline-block cursor-pointer active:scale-95"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {filteredClubs.map((club) => {
            const isInstitution = club.club_type?.toLowerCase().includes("institution");
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                key={club.id || club.name}
                className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group active:scale-[0.99]"
              >
                <div className="space-y-4">
                  {/* Zone and Type Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-[#1e9df1] bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                      Zone {club.zone}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {isInstitution ? "Campus Base" : "Community Base"}
                    </span>
                  </div>

                  {/* Club Name */}
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-snug group-hover:text-[#1e9df1] transition-colors">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span>District 3192 · {club.partner_club ? `Sponsored by Rotary ${club.partner_club}` : "Rotaract District 3192"}</span>
                    </div>
                  </div>

                  {/* Details Strip */}
                  <div className="pt-2 space-y-1.5 text-xs text-gray-600 border-t border-gray-100">
                    {club.partner_club && (
                      <p className="text-[11px] text-gray-500">
                        <span className="font-bold text-gray-700">Partner Rotary:</span> {club.partner_club}
                      </p>
                    )}
                    {club.president_name && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <UserCheck size={12} className="text-gray-400" />
                        <span className="font-bold text-gray-700">President:</span> {club.president_name}
                      </p>
                    )}
                    {club.contact_email && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                        <Mail size={12} className="text-gray-400 shrink-0" />
                        <a href={`mailto:${club.contact_email}`} className="text-[#1e9df1] hover:underline truncate">
                          {club.contact_email}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{club.event_count || 0} Events</span>
                  </span>

                  <Link
                    href={`/events?club=${encodeURIComponent(club.name)}&club_id=${encodeURIComponent(club.id)}`}
                    className="text-xs font-extrabold text-[#1e9df1] hover:text-[#1583cd] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer"
                  >
                    View Events <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Organizer Bottom Callout ── */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 mt-12">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#60a5fa] flex items-center gap-1.5 justify-center md:justify-start">
            <Sparkles size={14} /> Rotaract Club Leaders &amp; Board Members
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Are you on your Club&apos;s Board of Directors?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Apply for organizer permissions to publish official club events, manage ticketing, issue QR passes, and verify entry at the gate.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-7 py-3.5 rounded-2xl shadow-lg transition-all hover:scale-105 shrink-0 text-center"
        >
          Request Host Rights
        </Link>
      </div>
    </div>
  );
}
