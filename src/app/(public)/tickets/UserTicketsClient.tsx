"use client";

/**
 * User Tickets Client
 * Renders live scannable QR passes with:
 * 1. Crystal-Clear Sharp Offline QR Code (SVG/Canvas)
 * 2. Tap to Expand Large QR Gate Scanner Modal
 * 3. Instant High-Res PNG Ticket Badge Downloader (Canvas 2x DPI)
 * 4. Wide, Responsive Ticket Transfer & Refund Dialogs
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
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
  Printer,
  Sparkles,
  Share2,
  Maximize2,
  ZoomIn,
  AlertCircle,
} from "lucide-react";
import { transferUserTicketAction, requestTicketRefundAction } from "@/app/actions/attendeeActions";

interface UserTicketsClientProps {
  initialTickets: any[];
  userEmail?: string;
}

export function UserTicketsClient({ initialTickets }: UserTicketsClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [qrModalTicket, setQrModalTicket] = useState<any | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [qrDataMap, setQrDataMap] = useState<Record<string, string>>({});

  // Generate ultra-crisp QR code Data URLs on client mount
  useEffect(() => {
    tickets.forEach(async (ticket) => {
      try {
        const qrContent = ticket.qr_token || ticket.ticket_code;
        const dataUrl = await QRCode.toDataURL(qrContent, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrDataMap((prev) => ({ ...prev, [ticket.id]: dataUrl }));
      } catch (err) {
        console.error("QR generation error:", err);
      }
    });
  }, [tickets]);

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

  // ─── HIGH-RES CANVAS TICKET DOWNLOADER ──────────────────────────────────────
  async function handleDownloadTicket(ticket: any) {
    setDownloadingId(ticket.id);
    try {
      const event = ticket.saas_events;
      const tier = ticket.saas_ticket_tiers;
      const qrContent = ticket.qr_token || ticket.ticket_code;

      // Generate sharp 500px QR for the badge
      const qrDataUrl = qrDataMap[ticket.id] || (await QRCode.toDataURL(qrContent, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: "H",
      }));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // High-DPI Dimensions: 1200 x 680
      const width = 1200;
      const height = 680;
      canvas.width = width;
      canvas.height = height;

      // 1. Background Fill
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#ffffff");
      bgGrad.addColorStop(1, "#f8fafc");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 36);
      ctx.fill();

      // Outer Border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 36);
      ctx.stroke();

      // Top Brand Color Header Strip
      ctx.fillStyle = "#0052ff";
      ctx.beginPath();
      ctx.roundRect(0, 0, width, 20, [36, 36, 0, 0]);
      ctx.fill();

      // Official Logo on Ticket Badge
      try {
        const logoImg = new window.Image();
        logoImg.src = "/brand/logo.png";
        await new Promise((res) => {
          logoImg.onload = res;
          logoImg.onerror = res;
        });
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          ctx.drawImage(logoImg, width - 200, 35, 140, 140);
        }
      } catch (err) {
        console.error("Logo drawing error:", err);
      }

      // 2. Header Branding
      ctx.fillStyle = "#0052ff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("DISTRICT 3192 OFFICIAL DELEGATE PASS", 60, 75);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 34px sans-serif";
      const title = event?.title || "Rotaract District Flagship Event";
      ctx.fillText(title.length > 30 ? title.slice(0, 28) + "..." : title, 60, 130);

      // Ticket Code pill
      ctx.fillStyle = "#fef2f2";
      ctx.beginPath();
      ctx.roundRect(60, 155, 260, 42, 12);
      ctx.fill();
      ctx.strokeStyle = "#fecaca";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(60, 155, 260, 42, 12);
      ctx.stroke();

      ctx.fillStyle = "#e11d48";
      ctx.font = "bold 20px monospace";
      ctx.fillText(ticket.ticket_code, 75, 184);

      // Tier Badge
      const tierName = (tier?.name || "GENERAL ADMISSION").toUpperCase();
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.roundRect(335, 155, ctx.measureText(tierName).width + 36, 42, 12);
      ctx.fill();
      ctx.fillStyle = "#92400e";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(tierName, 353, 182);

      // 3. Event Details (Date & Venue)
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("DATE & TIME", 60, 245);
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 20px sans-serif";
      const eventDate = event?.start_date
        ? new Date(event.start_date).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Confirmed Schedule";
      ctx.fillText(eventDate, 60, 275);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("VENUE & LOCATION", 60, 335);
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 20px sans-serif";
      const venue = event?.venue_name ? `${event.venue_name}, ${event.city}` : event?.city || "District 3192";
      ctx.fillText(venue.length > 34 ? venue.slice(0, 32) + "..." : venue, 60, 365);

      // 4. Attendee Details
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.roundRect(60, 420, 680, 140, 20);
      ctx.fill();

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("REGISTERED DELEGATE", 90, 460);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(ticket.attendee_name || "Delegate", 90, 495);

      ctx.fillStyle = "#475569";
      ctx.font = "16px sans-serif";
      ctx.fillText(ticket.attendee_email || "", 90, 528);

      // 5. Vertical Perforation Line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(800, 40);
      ctx.lineTo(800, height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Right Side - Scannable QR Code & Security Stamp
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("GATE SCANNER PASS", 860, 85);

      // Load QR Image
      const qrImg = new window.Image();
      qrImg.src = qrDataUrl;

      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          // White card backdrop for QR
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(850, 110, 290, 290, 24);
          ctx.fill();
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(850, 110, 290, 290, 24);
          ctx.stroke();

          ctx.drawImage(qrImg, 865, 125, 260, 260);
          resolve();
        };
        qrImg.onerror = () => resolve();
      });

      // QR Security Token & Instructions
      ctx.fillStyle = "#64748b";
      ctx.font = "14px monospace";
      ctx.fillText(ticket.qr_token ? `${ticket.qr_token.slice(0, 18)}...` : ticket.ticket_code, 860, 440);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("● ENCRYPTED QR TOKEN", 860, 475);

      // Bottom Security Footer
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Powered by RotaSphere • District 3192 Verified • Single Entry Only", 60, 625);

      // 7. Trigger Direct Download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${ticket.ticket_code}_Pass.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Ticket download error:", err);
      window.print();
    } finally {
      setDownloadingId(null);
    }
  }

  // ─── TRANSFER & REFUND HANDLERS ──────────────────────────────────────────
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
      setRefundMessage("Refund request submitted successfully! Your pass status is updated to Pending Review.");
      setTickets(
        tickets.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: "REFUND_REQUESTED" } : t
        )
      );
      setTimeout(() => {
        setRefundModalOpen(false);
        setRefundMessage(null);
      }, 2000);
    } else {
      setRefundMessage(res.error || "Failed to submit refund request");
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-white space-y-4 shadow-xs">
        <TicketIcon className="mx-auto text-gray-300" size={48} />
        <h3 className="text-xl font-bold text-gray-900">No Tickets Booked Yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Explore upcoming conferences, festivals, and workshops across District 3192 and book your entry passes.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-md cursor-pointer"
        >
          Explore Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ── TICKETS GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {tickets.map((ticket) => {
          const event = ticket.saas_events;
          const tier = ticket.saas_ticket_tiers;
          const isUsed = ticket.status === "USED";
          const isRefundRequested = ticket.status === "REFUND_REQUESTED";
          const isPendingVerification = ticket.status === "PENDING_VERIFICATION";
          const isPaymentRejected = ticket.status === "PAYMENT_REJECTED";
          const isCancelled = ticket.status === "CANCELLED" || ticket.status === "REFUNDED" || isPaymentRejected;
          const isDownloading = downloadingId === ticket.id;
          const qrDataUrl = qrDataMap[ticket.id];

          return (
            <div
              key={ticket.id}
              className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Ticket Card Top */}
              <div className="p-6 sm:p-7 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs bg-white border border-gray-100 shrink-0 mt-0.5">
                      <Image
                        src="/brand/logo.png"
                        alt="Rotaract District 3192 Ticketing Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-[#0052ff] border border-blue-200 inline-block">
                        {tier?.name ?? "General Pass"}
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-gray-900 line-clamp-1 leading-tight">{event?.title ?? "District Event"}</h2>
                      <p className="text-xs font-mono font-bold text-[#0052ff]">{ticket.ticket_code}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      isPendingVerification
                        ? "bg-amber-50 text-amber-800 border-amber-300 font-extrabold"
                        : isPaymentRejected
                        ? "bg-rose-50 text-rose-700 border-rose-200 font-extrabold"
                        : isUsed
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : isRefundRequested
                        ? "bg-purple-50 text-purple-700 border-purple-200 font-extrabold"
                        : isCancelled
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    ● {isPendingVerification ? "PENDING UPI APPROVAL" : isPaymentRejected ? "PAYMENT REJECTED" : isRefundRequested ? "REFUND PENDING" : ticket.status}
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

                {/* Pending UPI Verification Banner */}
                {isPendingVerification && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-extrabold">
                      <AlertCircle size={15} className="text-amber-600" />
                      <span>Payment Verification in Progress</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Your 12-digit UTR reference has been submitted. Once the organizer verifies your payment, your pass will be confirmed and the scannable gate QR will activate.
                    </p>
                  </div>
                )}

                {/* Payment Rejected Banner */}
                {isPaymentRejected && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1 text-xs text-rose-900">
                    <div className="flex items-center gap-1.5 font-extrabold">
                      <X size={15} className="text-rose-600" />
                      <span>Payment Not Verified</span>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      The organizer was unable to verify this transaction reference. Please contact support or book a new pass.
                    </p>
                  </div>
                )}

                {/* Scannable Attendee & Crystal-Clear QR Box */}
                {!isPendingVerification && !isPaymentRejected && (
                  <div className="p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{ticket.attendee_name || "Delegate"}</p>
                      <p className="text-[11px] text-gray-500 truncate">{ticket.attendee_email}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-mono bg-white border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md font-semibold">
                          {ticket.qr_token ? `${ticket.qr_token.slice(0, 14)}...` : ticket.ticket_code}
                        </span>
                      </div>
                    </div>

                    {/* High-Contrast Interactive QR Code Container */}
                    <div
                      onClick={() => setQrModalTicket(ticket)}
                      className="group/qr relative w-24 h-24 bg-white border-2 border-gray-900 rounded-2xl p-1.5 shadow-md flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      title="Click to view large full-screen QR code"
                    >
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR Code ${ticket.ticket_code}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                      )}

                      {/* Hover Zoom Hint */}
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 size={18} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Download Pass Action Button */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadTicket(ticket)}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-md shadow-[#1e9df1]/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Generating Pass...
                      </>
                    ) : (
                      <>
                        <Download size={15} /> Download Pass
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setQrModalTicket(ticket)}
                    className="w-11 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
                    title="Open Large QR Code"
                  >
                    <QrCode size={18} />
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setTransferModalOpen(true);
                  }}
                  disabled={isUsed || isCancelled || isRefundRequested}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                >
                  <Send size={14} /> Transfer Pass
                </button>

                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setRefundModalOpen(true);
                  }}
                  disabled={isUsed || isCancelled || isRefundRequested}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-40 cursor-pointer"
                >
                  <RotateCcw size={14} /> {isRefundRequested ? "Refund Pending" : "Request Refund"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FULLSCREEN LARGE QR CODE GATE SCANNER MODAL ────────────────── */}
      {qrModalTicket && (
        <div
          onClick={() => setQrModalTicket(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "380px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center text-gray-900 animate-in zoom-in-95 mx-auto"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                GATE SCANNER PASS
              </span>
              <button
                onClick={() => setQrModalTicket(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Giant Ultra-Sharp QR Code */}
            <div className="p-4 bg-white border-4 border-gray-900 rounded-3xl shadow-lg flex items-center justify-center mx-auto max-w-[280px]">
              {qrDataMap[qrModalTicket.id] ? (
                <img
                  src={qrDataMap[qrModalTicket.id]}
                  alt="Large QR Code"
                  className="w-full h-auto object-contain"
                />
              ) : (
                <Loader2 size={32} className="animate-spin text-gray-400" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-base font-black text-gray-900">{qrModalTicket.attendee_name || "Delegate"}</p>
              <p className="text-xs font-mono font-bold text-[#ff385c]">{qrModalTicket.ticket_code}</p>
              <p className="text-xs text-gray-500">{qrModalTicket.saas_events?.title}</p>
            </div>

            <p className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              Hold this screen up to the gate volunteer or scanner checkpoint for instant entry validation.
            </p>

            <button
              onClick={() => handleDownloadTicket(qrModalTicket)}
              className="w-full bg-[#ff385c] hover:bg-[#e00b41] text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} /> Download Pass Badge
            </button>
          </div>
        </div>
      )}

      {/* ── TRANSFER MODAL ────────────────────────────────────────────── */}
      {transferModalOpen && selectedTicket && (
        <div
          onClick={() => setTransferModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "480px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff385c]">
                  PASS REASSIGNMENT
                </span>
                <h3 className="text-xl font-black text-gray-900">Transfer Ticket Pass</h3>
                <p className="text-xs text-gray-500 font-mono">Pass: {selectedTicket.ticket_code}</p>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  New Attendee Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={transferName}
                  onChange={(e) => setTransferName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-900 outline-none focus:border-[#ff385c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  New Attendee Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul@rotaract.org"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-900 outline-none focus:border-[#ff385c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={transferPhone}
                  onChange={(e) => setTransferPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-900 outline-none focus:border-[#ff385c]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="flex-1 bg-[#ff385c] hover:bg-[#e00b41] text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {transferLoading ? <Loader2 size={14} className="animate-spin" /> : "Transfer Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL ──────────────────────────────────────────────── */}
      {refundModalOpen && selectedTicket && (
        <div
          onClick={() => setRefundModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "480px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
                  REFUND REQUEST
                </span>
                <h3 className="text-xl font-black text-gray-900">Request Ticket Refund</h3>
                <p className="text-xs text-gray-500 font-mono">Pass: {selectedTicket.ticket_code}</p>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {refundMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  refundMessage.includes("success")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{refundMessage}</span>
              </div>
            )}

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Reason for Refund / Cancellation *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please state why you are requesting a refund (e.g. scheduling conflict, emergency)..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-900 outline-none focus:border-[#ff385c]"
                />
              </div>

              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Refund requests are reviewed in accordance with the host club&apos;s refund policy and processed back to your original payment method.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {refundLoading ? <Loader2 size={14} className="animate-spin" /> : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
