"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Send, CheckCircle2, Clock, XCircle, Loader2, ArrowLeft, Building2, User, FileText } from "lucide-react";
import { submitOrganizerAccessRequestAction } from "@/app/actions/adminActions";

interface ApplyOrganizerClientProps {
  user: any;
  existingRequest?: any;
}

export function ApplyOrganizerClient({ user, existingRequest }: ApplyOrganizerClientProps) {
  const [clubName, setClubName] = useState("");
  const [position, setPosition] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentReq, setCurrentReq] = useState(existingRequest || null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubName.trim() || !position.trim() || !reason.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    const res = await submitOrganizerAccessRequestAction({
      clubName: clubName.trim(),
      position: position.trim(),
      reason: reason.trim(),
    });

    setLoading(false);

    if (res.success) {
      setStatusMessage({
        type: "success",
        text: "Your organizer access request has been submitted to the District 3192 Super Admin!",
      });
      setCurrentReq({
        club_name: clubName,
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
                District 3192 Event Management Portal
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
                      Your account has been granted organizer privileges. Please refresh the page to open your Organizer Hub.
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
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1e9df1] hover:underline"
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
                  Only authorized Rotaract Club Presidents, Secretaries, and District Event Chairs can publish events and collect registrations on RotaSphere.
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Rotaract / Rotary Club Name *
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rotaract Club of Koramangala / Bangalore West"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all"
                    />
                  </div>
                </div>

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
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Proposed Event Details / Request Reason *
                  </label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <textarea
                      required
                      rows={3}
                      placeholder="Briefly describe the event you plan to host (e.g. District Cultural Fest, Sports Tournament, Blood Drive)..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all"
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
                    disabled={loading || !clubName.trim() || !position.trim() || !reason.trim()}
                    className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    Submit Request to Admin
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
