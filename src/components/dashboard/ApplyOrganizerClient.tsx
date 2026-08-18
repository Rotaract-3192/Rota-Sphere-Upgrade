"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  ShieldAlert, Send, CheckCircle2, Clock, XCircle, Loader2, ArrowLeft, 
  Building2, User, FileText, Search, ChevronDown, Check, Sparkles 
} from "lucide-react";
import { submitOrganizerAccessRequestAction } from "@/app/actions/adminActions";
import { getDistrictClubsAction, ClubRecord } from "@/app/actions/clubActions";
import { DISTRICT_3192_CLUBS } from "@/lib/data/districtClubsData";

interface ApplyOrganizerClientProps {
  user: any;
  existingRequest?: any;
}

const COMMON_POSITIONS = [
  "Club President",
  "Club Secretary",
  "Vice President",
  "Event Chair",
  "Treasurer",
  "Director of International Service",
  "Director of Community Service",
  "Director of Club Service",
  "Director of Professional Development",
  "District Official / ZRR",
];

export function ApplyOrganizerClient({ user, existingRequest }: ApplyOrganizerClientProps) {
  const [clubs, setClubs] = useState<ClubRecord[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const [clubSearch, setClubSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState<ClubRecord | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentReq, setCurrentReq] = useState(existingRequest || null);

  useEffect(() => {
    async function loadClubs() {
      try {
        const res = await getDistrictClubsAction();
        if (res.success && res.data && res.data.length > 0) {
          setClubs(res.data);
        } else {
          // Fallback to static district list
          const staticList: ClubRecord[] = DISTRICT_3192_CLUBS.map((c, i) => ({
            id: `club-${i}`,
            name: c.name,
            slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            zone: c.zone,
            club_type: c.clubType,
            partner_club: c.partnerClub,
            contact_email: c.clubEmail,
            president_name: c.presidentName || "",
            president_phone: c.presidentPhone || "",
            president_email: c.presidentEmail || "",
            status: "ACTIVE",
            is_verified: true,
          }));
          setClubs(staticList);
        }
      } catch (err) {
        console.error("Failed to load clubs list:", err);
      } finally {
        setLoadingClubs(false);
      }
    }
    loadClubs();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClubs = useMemo(() => {
    if (!clubSearch.trim()) return clubs;
    const q = clubSearch.toLowerCase();
    return clubs.filter(
      (c) => c.name.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q)
    );
  }, [clubs, clubSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalClubName = selectedClub ? selectedClub.name : clubSearch.trim();
    if (!finalClubName || !position.trim() || !reason.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    const res = await submitOrganizerAccessRequestAction({
      clubName: finalClubName,
      organizationId: selectedClub?.id,
      position: position.trim(),
      reason: reason.trim(),
    });

    setLoading(false);

    if (res.success) {
      setStatusMessage({
        type: "success",
        text: "Your organizer access request has been submitted to District 3192 Super Admin!",
      });
      setCurrentReq({
        club_name: finalClubName,
        position,
        reason,
        status: "PENDING",
        created_at: new Date().toISOString(),
      });
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to submit organizer request",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden text-gray-900">
        
        {/* Banner Header */}
        <div className="bg-gray-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#60a5fa] flex items-center gap-1.5">
                <ShieldAlert size={14} /> RESTRICTED ORGANIZER DASHBOARD
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Host Event Access Required
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                District 3192 Official Club &amp; Event Management Portal
              </p>
            </div>
            <Link
              href="/events"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Events
            </Link>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Active Request Status Banner */}
          {currentReq ? (
            <div className="space-y-6 w-full text-center py-4 flex flex-col items-center justify-center">
              {currentReq.status === "PENDING" && (
                <div className="p-6 sm:p-8 bg-amber-50 border border-amber-200 rounded-3xl space-y-4 text-amber-950 w-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner shrink-0">
                    <Clock size={28} />
                  </div>
                  <div className="w-full text-center space-y-2">
                    <h3 className="text-xl font-extrabold text-amber-900 text-center w-full block">Application Under Admin Review</h3>
                    <p className="text-xs sm:text-sm text-amber-800 w-full max-w-md mx-auto text-center block leading-relaxed">
                      Your request to host events for <span className="font-bold text-amber-950">{currentReq.club_name}</span> as <span className="font-bold text-amber-950">{currentReq.position}</span> has been submitted and is currently being verified by the District 3192 Super Administrator.
                    </p>
                  </div>
                  <div className="inline-flex items-center justify-center bg-white/80 border border-amber-300 px-4 py-2 rounded-2xl text-xs font-mono font-bold text-amber-900 shadow-xs">
                    Submitted: {new Date(currentReq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              )}

              {currentReq.status === "REJECTED" && (
                <div className="p-6 sm:p-8 bg-rose-50 border border-rose-200 rounded-3xl space-y-4 text-rose-950 w-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner shrink-0">
                    <XCircle size={28} />
                  </div>
                  <div className="w-full text-center space-y-2">
                    <h3 className="text-xl font-extrabold text-rose-900 text-center w-full block">Request Not Approved</h3>
                    <p className="text-xs sm:text-sm text-rose-800 w-full max-w-md mx-auto text-center block leading-relaxed">
                      Your previous request for <span className="font-bold text-rose-950">{currentReq.club_name}</span> was not approved. Please contact District leadership or re-apply below with updated credentials.
                    </p>
                  </div>
                </div>
              )}

              {currentReq.status === "APPROVED" && (
                <div className="p-6 sm:p-8 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4 text-emerald-950 w-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner shrink-0">
                    <CheckCircle2 size={28} />
                  </div>
                  <div className="w-full text-center space-y-2">
                    <h3 className="text-xl font-extrabold text-emerald-900 text-center w-full block">Organizer Access Approved!</h3>
                    <p className="text-xs sm:text-sm text-emerald-800 w-full max-w-md mx-auto text-center block leading-relaxed">
                      Your account has been granted organizer privileges for your club. Please refresh the page to open your Organizer Hub.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md cursor-pointer transition-colors text-center"
                  >
                    Open Organizer Dashboard
                  </button>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0758fc] hover:underline"
                >
                  <ArrowLeft size={14} /> Return to Event Registrations &amp; Discovery
                </Link>
              </div>
            </div>
          ) : (
            /* Application Form */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-gray-900">Apply for Rotaract Organizer Rights</h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Select your chartered Rotaract Club from the District 3192 Directory to request event publishing and registration collection rights.
                </p>
              </div>

              {statusMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    statusMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      : "bg-rose-50 text-rose-900 border border-rose-200"
                  }`}
                >
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ── Searchable Club Dropdown ── */}
                <div ref={dropdownRef} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Select District 3192 Club *
                    </label>
                    <span className="text-[10px] font-bold text-gray-400">
                      {clubs.length > 0 ? `${clubs.length} Verified Clubs` : "Loading..."}
                    </span>
                  </div>

                  <div 
                    onClick={() => setIsDropdownOpen(true)}
                    className={`w-full bg-gray-50 border ${
                      isDropdownOpen ? "border-[#0758fc] bg-white ring-2 ring-[#0758fc]/10" : "border-gray-200"
                    } rounded-2xl pl-10 pr-10 py-3 text-xs font-bold text-gray-900 flex items-center cursor-pointer transition-all relative`}
                  >
                    <Building2 size={16} className="absolute left-3.5 text-gray-400" />
                    
                    <input
                      type="text"
                      required
                      placeholder={loadingClubs ? "Loading District 3192 clubs..." : "Search club by name or zone (e.g. Koramangala, Bangalore West)..."}
                      value={selectedClub ? selectedClub.name : clubSearch}
                      onChange={(e) => {
                        setSelectedClub(null);
                        setClubSearch(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full bg-transparent outline-none text-xs font-bold text-gray-900 placeholder:text-gray-400"
                    />

                    <ChevronDown size={16} className={`absolute right-3.5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {/* Dropdown Options */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl max-h-64 overflow-y-auto z-50 p-2 space-y-1">
                      {filteredClubs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                          <p className="font-semibold">No registered club found matching &quot;{clubSearch}&quot;.</p>
                          <p className="text-[11px] text-gray-400 mt-1">You can still submit with this club name for super admin review.</p>
                        </div>
                      ) : (
                        filteredClubs.map((club) => {
                          const isSelected = selectedClub?.id === club.id || selectedClub?.name === club.name;
                          return (
                            <button
                              key={club.id || club.name}
                              type="button"
                              onClick={() => {
                                setSelectedClub(club);
                                setClubSearch(club.name);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                isSelected 
                                  ? "bg-blue-50 text-[#0758fc] font-bold" 
                                  : "hover:bg-gray-50 text-gray-800 font-medium"
                              }`}
                            >
                              <div className="space-y-0.5 pr-2">
                                <p className="font-bold leading-tight">{club.name}</p>
                                <p className="text-[10px] text-gray-500">
                                  Zone {club.zone} · {club.club_type || "Community Based"}
                                </p>
                              </div>
                              {isSelected && <Check size={14} className="text-[#0758fc] shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {selectedClub && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
                      <Sparkles size={13} className="shrink-0" />
                      <span>Verified District 3192 Club (Zone {selectedClub.zone})</span>
                    </div>
                  )}
                </div>

                {/* ── Position Selection / Input ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Your Official Designation / Role *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Club President, Secretary, Event Chair, Director"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Preset Position Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {COMMON_POSITIONS.slice(0, 5).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          position === pos 
                            ? "bg-[#0758fc] text-white border-[#0758fc]" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Reason / Event Details ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Proposed Event Details / Request Reason *
                  </label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <textarea
                      required
                      rows={3}
                      placeholder="Briefly describe the upcoming event you plan to publish on RotaSphere (e.g. Annual District Cultural Fest, Sports Tournament, Community Blood Drive)..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-4">
                  <Link
                    href="/events"
                    className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || (!selectedClub && !clubSearch.trim()) || !position.trim() || !reason.trim()}
                    className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    Submit Request to District Admin
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
