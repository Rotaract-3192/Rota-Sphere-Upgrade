"use client";

/**
 * User Tickets Client
 * Renders live scannable QR passes with instant Ticket Transfer and Refund request dialogs.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  QrCode,
  Calendar,
  MapPin,
  Send,
  RotateCcw,
  CheckCircle2,
  X,
  Loader2,
  Ticket as TicketIcon,
  ShieldCheck,
  Download,
  Share2,
} from "lucide-react";
import { transferUserTicketAction, requestTicketRefundAction } from "@/app/actions/attendeeActions";

interface UserTicketsClientProps {
  initialTickets: any[];
  userEmail?: string;
}

export function UserTicketsClient({ initialTickets }: UserTicketsClientProps) {
  const [tickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // Transfer Form State
  const [transferName, setTransferName] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [transferPhone, setTransferPhone] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  // Refund Form State
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);

  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !transferName.trim() || !transferEmail.trim()) return;

    setTransferLoading(true);
    setTransferMessage(null);

    const res = await transferUserTicketAction(
      selectedTicket.id,
      transferName.trim(),
      transferEmail.trim(),
      transferPhone.trim() || undefined
    );

    setTransferLoading(false);
    if (res.success) {
      setTransferMessage("Ticket successfully transferred! Old pass invalidated.");
      setTimeout(() => {
        setTransferModalOpen(false);
        setTransferMessage(null);
        window.location.reload();
      }, 1500);
    } else {
      setTransferMessage(res.error || "Failed to transfer ticket");
    }
  }

  async function handleRefundSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !refundReason.trim()) return;

    setRefundLoading(true);
    setRefundMessage(null);

    const res = await requestTicketRefundAction(selectedTicket.id, refundReason.trim());
    setRefundLoading(false);

    if (res.success) {
      setRefundMessage("Refund request submitted for organizer review!");
      setTimeout(() => {
        setRefundModalOpen(false);
        setRefundMessage(null);
      }, 1500);
    } else {
      setRefundMessage(res.error || "Failed to submit refund request");
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50/50 space-y-4">
        <TicketIcon className="mx-auto text-gray-300" size={48} />
        <h3 className="text-xl font-bold text-gray-900">No Tickets Booked Yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Explore upcoming conferences, festivals, and workshops across District 3192 and book your entry passes.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-md"
        >
          Explore Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── TICKETS GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.map((ticket) => {
          const event = ticket.saas_events;
          const tier = ticket.saas_ticket_tiers;
          const isUsed = ticket.status === "USED";
          const isCancelled = ticket.status === "CANCELLED" || ticket.status === "REFUNDED";
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticket.qr_token)}`;

          return (
            <div
              key={ticket.id}
              className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Ticket Card Top */}
              <div className="p-6 sm:p-7 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {tier?.name ?? "General Pass"}
                    </span>
                    <h2 className="text-lg font-extrabold text-gray-900 line-clamp-1">{event?.title ?? "District Event"}</h2>
                    <p className="text-xs font-mono font-bold text-[#ff385c]">{ticket.ticket_code}</p>
                  </div>

                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      isUsed
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : isCancelled
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    ● {ticket.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span>
                      {event?.start_date
                        ? new Date(event.start_date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Scheduled Date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{event?.venue_name ? `${event.venue_name}, ${event.city}` : event?.city ?? "India"}</span>
                  </div>
                </div>

                {/* QR Code Box */}
                <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-900">{ticket.attendee_name}</p>
                    <p className="text-[11px] text-gray-500">{ticket.attendee_email}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md">
                        {ticket.qr_token.slice(0, 16)}...
                      </span>
                    </div>
                  </div>

                  {/* Scannable Live QR Image */}
                  <div className="w-20 h-20 bg-white border border-gray-300 rounded-xl p-1 shadow-xs flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    <img
                      src={qrImageUrl}
                      alt={`QR Code ${ticket.ticket_code}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setTransferModalOpen(true);
                  }}
                  disabled={isUsed || isCancelled}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                >
                  <Send size={14} /> Transfer Pass
                </button>

                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setRefundModalOpen(true);
                  }}
                  disabled={isUsed || isCancelled}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-40 cursor-pointer"
                >
                  <RotateCcw size={14} /> Request Refund
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TRANSFER MODAL ────────────────────────────────────────────── */}
      {transferModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">Transfer Ticket Pass</h3>
                <p className="text-xs text-gray-500">Pass: {selectedTicket.ticket_code}</p>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {transferMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  transferMessage.includes("success")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {transferMessage.includes("success") ? <CheckCircle2 size={16} /> : <X size={16} />}
                <span>{transferMessage}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={transferName}
                  onChange={(e) => setTransferName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Email *</label>
                <input
                  type="email"
                  required
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Phone (Optional)</label>
                <input
                  type="tel"
                  value={transferPhone}
                  onChange={(e) => setTransferPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  Once transferred, your current QR token will be permanently revoked and a new pass issued to the recipient.
                </span>
              </div>

              <button
                type="submit"
                disabled={transferLoading}
                className="w-full bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-xs py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {transferLoading ? <Loader2 size={16} className="animate-spin" /> : "Confirm Pass Transfer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL ──────────────────────────────────────────────── */}
      {refundModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">Request Ticket Refund</h3>
                <p className="text-xs text-gray-500">Pass: {selectedTicket.ticket_code}</p>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {refundMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  refundMessage.includes("submitted")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {refundMessage.includes("submitted") ? <CheckCircle2 size={16} /> : <X size={16} />}
                <span>{refundMessage}</span>
              </div>
            )}

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Refund *</label>
                <textarea
                  rows={3}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why you are requesting a refund (e.g. Schedule conflict, unable to travel)..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] text-gray-600">
                Refund requests are reviewed in accordance with the organizer&apos;s refund policy and processed within 3-5 business days.
              </div>

              <button
                type="submit"
                disabled={refundLoading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {refundLoading ? <Loader2 size={16} className="animate-spin" /> : "Submit Refund Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
