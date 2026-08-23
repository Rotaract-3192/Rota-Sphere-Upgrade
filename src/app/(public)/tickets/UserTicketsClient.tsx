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
  Lock,
  Camera,
  Upload,
  Trash2,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { transferUserTicketAction, requestTicketRefundAction, resubmitUpiTransactionAction } from "@/app/actions/attendeeActions";
import { compressImageFile } from "@/lib/utils/imageCompressor";

interface UserTicketsClientProps {
  initialTickets: any[];
  userEmail?: string;
}

export function UserTicketsClient({ initialTickets }: UserTicketsClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTab, setActiveTab] = useState<"upcoming" | "previous">("upcoming");
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

  // UTR Re-submission State
  const [utrModalOpen, setUtrModalOpen] = useState(false);
  const [utrTicket, setUtrTicket] = useState<any | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [utrProofUrl, setUtrProofUrl] = useState("");
  const [utrLoading, setUtrLoading] = useState(false);
  const [utrMessage, setUtrMessage] = useState<string | null>(null);

  async function handleUtrSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!utrTicket || !utrInput.trim()) return;

    setUtrLoading(true);
    setUtrMessage(null);

    const res = await resubmitUpiTransactionAction(utrTicket.id, utrInput.trim(), utrProofUrl || undefined);
    setUtrLoading(false);

    if (res.success) {
      setUtrMessage("UTR reference updated successfully! Verification in progress.");
      setTimeout(() => {
        setUtrModalOpen(false);
        setUtrMessage(null);
        setUtrInput("");
        window.location.reload();
      }, 1500);
    } else {
      setUtrMessage(res.error || "Failed to update UTR reference");
    }
  }

  // ─── HIGH-RES CANVAS TICKET DOWNLOADER ──────────────────────────────────────
  async function handleDownloadTicket(ticket: any) {
    setDownloadingId(ticket.id);
    try {
      const event = ticket.events || ticket.saas_events;
      const tier = ticket.ticket_tiers || ticket.saas_ticket_tiers;
      const qrContent = ticket.qr_token || ticket.ticket_code;
      const clubName = event?.organizations?.name || "Rotaract District 3192";
      const eventTitle = event?.title || "District Event Pass";
      const attendeeName = ticket.attendee_name || "Delegate";
      const attendeeEmail = ticket.attendee_email || "";
      const tierName = tier?.name || "Delegate Pass";
      const ticketCode = ticket.ticket_code || "RS-PASS";
      const venueStr = event?.venue_name ? `${event.venue_name}, ${event.city || ""}` : (event?.city || "Bengaluru, Karnataka");
      const dateStr = event?.start_time
        ? new Date(event.start_time).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        : "RY 2026–27";

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

      // 1. Background Fill & Rounded Card
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

      // Top Brand Color Header Strip (Azure Electric)
      ctx.fillStyle = "#0758fc";
      ctx.beginPath();
      ctx.roundRect(0, 0, width, 18, [36, 36, 0, 0]);
      ctx.fill();

      // Load Logo Image
      const logoImg: HTMLImageElement | null = await new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
          const fb = new window.Image();
          fb.crossOrigin = "anonymous";
          fb.onload = () => resolve(fb);
          fb.onerror = () => resolve(null);
          fb.src = "/logo.png";
        };
        img.src = "/brand/logo.png";
      });

      // 2. Left Side: Logo & Club / District Header
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.drawImage(logoImg, 60, 45, 60, 60);
      }

      const pillX = logoImg ? 132 : 60;
      ctx.fillStyle = "#eff6ff";
      ctx.beginPath();
      ctx.roundRect(pillX, 55, 380, 38, 19);
      ctx.fill();
      ctx.strokeStyle = "#bfdbfe";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pillX, 55, 380, 38, 19);
      ctx.stroke();

      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`★ ${clubName.slice(0, 36).toUpperCase()}`, pillX + 16, 79);

      // 3. Event Title (Auto-wrapped bold typography)
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 32px sans-serif";
      const maxTitleWidth = 680;
      const words = eventTitle.split(" ");
      let currentLine = "";
      let lineY = 145;
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTitleWidth && currentLine) {
          ctx.fillText(currentLine, 60, lineY);
          currentLine = word;
          lineY += 40;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        ctx.fillText(currentLine, 60, lineY);
        lineY += 40;
      }

      // 4. Date and Venue Metadata
      ctx.fillStyle = "#475569";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`📅 ${dateStr}   •   📍 ${venueStr}`, 60, Math.max(200, lineY + 5));

      // 5. Delegate Information Box (Card inside ticket)
      const cardBoxY = Math.max(235, lineY + 35);
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.roundRect(60, cardBoxY, 700, 200, 24);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(60, cardBoxY, 700, 200, 24);
      ctx.stroke();

      // Delegate Name Label & Designation
      const desig = ticket.designation || ticket.custom_answers?.designation || "";
      const attClub = ticket.club_name || ticket.custom_answers?.club_name || "";

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(desig ? `ATTENDEE / ${desig.toUpperCase()}` : "ATTENDEE / DELEGATE", 90, cardBoxY + 38);

      // Large Attendee Name
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 28px sans-serif";
      ctx.fillText(attendeeName, 90, cardBoxY + 75);

      // Attendee Email & Club
      ctx.fillStyle = "#475569";
      ctx.font = "15px sans-serif";
      ctx.fillText(attClub ? `${attendeeEmail}   •   ${attClub}` : attendeeEmail, 90, cardBoxY + 105);

      // Tier Pill (e.g. Early Bird / Delegate Pass)
      ctx.fillStyle = "#0758fc";
      ctx.beginPath();
      ctx.roundRect(90, cardBoxY + 130, 200, 36, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`🎟 ${tierName.toUpperCase()}`, 110, cardBoxY + 153);

      // Verified Status Badge
      ctx.fillStyle = "#059669";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("● CONFIRMED & ADMIT READY", 310, cardBoxY + 153);

      // Pass ID text
      ctx.fillStyle = "#64748b";
      ctx.font = "13px monospace";
      ctx.fillText(`PASS REF: ${ticketCode}`, 90, cardBoxY + 185);

      // 6. Vertical Perforation Line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(800, 40);
      ctx.lineTo(800, height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // 7. Right Side Stub - Logo & Header
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.drawImage(logoImg, 965, 32, 60, 60);
      }

      ctx.fillStyle = "#0f172a";
      ctx.font = "900 17px sans-serif";
      ctx.fillText("ROTASPHERE", 895, 110);

      ctx.fillStyle = "#0758fc";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("DISTRICT 3192 ENTRY", 895, 126);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("SCAN AT VENUE GATE", 885, 146);

      // Load and Draw QR Image on the Right Stub
      const qrImg = new window.Image();
      qrImg.src = qrDataUrl;

      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          // White card backdrop for QR
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(850, 175, 290, 290, 24);
          ctx.fill();
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(850, 175, 290, 290, 24);
          ctx.stroke();

          ctx.drawImage(qrImg, 865, 190, 260, 260);
          resolve();
        };
        qrImg.onerror = () => resolve();
      });

      // QR Security Token & Instructions below QR
      ctx.fillStyle = "#64748b";
      ctx.font = "13px monospace";
      ctx.fillText(ticket.qr_token ? `${ticket.qr_token.slice(0, 20)}...` : ticketCode, 860, 500);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("● SINGLE ENTRY GATE PASS", 860, 530);

      // Bottom Security Footer
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Powered by RotaSphere • Rotaract District 3192 Official Ticketing • Single Entry Only", 60, 630);

      // 8. Trigger Direct Download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${ticketCode}_Pass.png`;
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
      <div className="w-full text-center py-16 sm:py-20 border-2 border-dashed border-gray-200 rounded-3xl p-6 sm:p-10 bg-white shadow-xs space-y-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0758fc] flex items-center justify-center mx-auto shadow-inner shrink-0">
          <TicketIcon size={32} />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            No Tickets Booked Yet
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
            Explore upcoming conferences, festivals, and workshops across District 3192 and book your entry passes.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md cursor-pointer active:scale-95 text-center"
          >
            Explore Events
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();

  const upcomingTickets = tickets.filter((t) => {
    const eventDate = t.saas_events?.start_date ? new Date(t.saas_events.start_date) : null;
    return !eventDate || eventDate >= now;
  });

  const previousTickets = tickets.filter((t) => {
    const eventDate = t.saas_events?.start_date ? new Date(t.saas_events.start_date) : null;
    return eventDate && eventDate < now;
  });

  const displayedTickets = activeTab === "upcoming" ? upcomingTickets : previousTickets;

  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >

      {/* ── TAB SWITCHER ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${activeTab === "upcoming"
              ? "bg-white dark:bg-gray-900 text-[#0758fc] shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
        >
          Upcoming Passes
          {upcomingTickets.length > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "upcoming" ? "bg-[#0758fc] text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}>
              {upcomingTickets.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("previous")}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${activeTab === "previous"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
        >
          Previous Passes
          {previousTickets.length > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "previous" ? "bg-gray-900 dark:bg-gray-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}>
              {previousTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* ── EMPTY STATE FOR ACTIVE TAB ────────────────────────────────── */}
      {displayedTickets.length === 0 && (
        <div className="w-full text-center py-12 sm:py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-900 space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
            <TicketIcon size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {activeTab === "upcoming" ? "No upcoming passes" : "No previous event passes"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === "upcoming"
                ? "Book an event pass to see your digital QR code here."
                : "Attended events will appear here after they\'ve concluded."}
            </p>
          </div>
        </div>
      )}

      {/* ── TICKETS GRID ──────────────────────────────────────────────── */}
      {displayedTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          {displayedTickets.map((ticket) => {
            const event = ticket.saas_events;
            const tier = ticket.saas_ticket_tiers;
            const isApproved = ticket.status === "ISSUED" || ticket.status === "CONFIRMED";
            const isUsed = ticket.status === "USED";
            const isRefundRequested = ticket.status === "REFUND_REQUESTED";
            const isPendingVerification = ticket.status === "PENDING_VERIFICATION" || ticket.status === "PENDING" || !isApproved;
            const isPaymentRejected = ticket.status === "PAYMENT_REJECTED";
            const isCancelled = ticket.status === "CANCELLED" || ticket.status === "REFUNDED" || isPaymentRejected;
            const isDownloading = downloadingId === ticket.id;
            const qrDataUrl = qrDataMap[ticket.id];

            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
              >
                {/* Ticket Card Top */}
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="relative w-11 h-11 shrink-0 mt-0.5">
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
                      className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${!isApproved && !isPaymentRejected
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
                      ● {!isApproved && !isPaymentRejected ? "PENDING UPI APPROVAL" : isPaymentRejected ? "PAYMENT REJECTED" : isRefundRequested ? "REFUND PENDING" : ticket.status}
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
                  {!isApproved && !isPaymentRejected && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
                      <div className="flex items-center justify-between font-extrabold">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle size={15} className="text-amber-600" />
                          <span>Payment Verification in Progress</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUtrTicket(ticket);
                            setUtrInput("");
                            setUtrModalOpen(true);
                          }}
                          className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Update UTR
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Your 12-digit UTR reference has been submitted. Once verified by the host organizer, your pass will be confirmed.
                      </p>
                    </div>
                  )}

                  {/* Payment Rejected Banner */}
                  {isPaymentRejected && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-900">
                      <div className="flex items-center justify-between font-extrabold">
                        <div className="flex items-center gap-1.5">
                          <X size={15} className="text-rose-600" />
                          <span>Payment Not Verified</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUtrTicket(ticket);
                            setUtrInput("");
                            setUtrModalOpen(true);
                          }}
                          className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Re-enter UTR
                        </button>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed">
                        The organizer was unable to verify your previous transaction. Click above to re-enter your correct 12-digit UTR ID.
                      </p>
                    </div>
                  )}

                  {/* Scannable Attendee & Crystal-Clear QR Box (ONLY FOR APPROVED TICKETS) */}
                  {isApproved && (
                    <div className="p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-gray-900 truncate">{ticket.attendee_name || "Delegate"}</p>
                          {(ticket.designation || ticket.custom_answers?.designation) && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              {ticket.designation || ticket.custom_answers?.designation}
                            </span>
                          )}
                        </div>
                        {(ticket.club_name || ticket.custom_answers?.club_name) && (
                          <p className="text-[11px] font-semibold text-gray-700 truncate">
                            🏛 {ticket.club_name || ticket.custom_answers?.club_name}
                          </p>
                        )}
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

                  {/* Download Pass & Gate Scanner Buttons (STRICTLY ONLY FOR APPROVED TICKETS) */}
                  {isApproved ? (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadTicket(ticket)}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-md shadow-[#0758fc]/20 cursor-pointer active:scale-95 disabled:opacity-50"
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
                  ) : (
                    <div className="pt-1">
                      <div className="w-full bg-gray-100 text-gray-400 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200">
                        <Lock size={14} className="text-gray-400" /> Gate QR &amp; Pass Locked Until Payment Verified
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setTransferModalOpen(true);
                    }}
                    disabled={isPendingVerification || isPaymentRejected || isUsed || isCancelled || isRefundRequested}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                  >
                    <Send size={14} /> Transfer Pass
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setRefundModalOpen(true);
                    }}
                    disabled={isPendingVerification || isPaymentRejected || isUsed || isCancelled || isRefundRequested}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-40 cursor-pointer"
                  >
                    <RotateCcw size={14} /> {isRefundRequested ? "Refund Pending" : "Request Refund"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              <p className="text-xs font-mono font-bold text-[#0758fc]">{qrModalTicket.ticket_code}</p>
              <p className="text-xs text-gray-500">{qrModalTicket.saas_events?.title}</p>
            </div>

            <p className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              Hold this screen up to the gate volunteer or scanner checkpoint for instant entry validation.
            </p>

            <button
              onClick={() => handleDownloadTicket(qrModalTicket)}
              className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc]">
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
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${transferMessage.includes("success")
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-900 outline-none focus:border-[#0758fc]"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-900 outline-none focus:border-[#0758fc]"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-900 outline-none focus:border-[#0758fc]"
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
                  className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${refundMessage.includes("success")
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-900 outline-none focus:border-[#0758fc]"
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

      {/* ── UPDATE UTR MODAL ──────────────────────────────────────────── */}
      {utrModalOpen && utrTicket && (
        <div
          onClick={() => setUtrModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "480px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc]">
                  PAYMENT VERIFICATION
                </span>
                <h3 className="text-xl font-black text-gray-900">Update UPI UTR Reference</h3>
                <p className="text-xs text-gray-500 font-mono">Pass: {utrTicket.ticket_code}</p>
              </div>
              <button
                onClick={() => setUtrModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {utrMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${utrMessage.includes("success")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
              >
                <CheckCircle2 size={16} />
                <span>{utrMessage}</span>
              </div>
            )}

            <form onSubmit={handleUtrSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  12-Digit UPI Transaction / UTR Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength={32}
                  placeholder="e.g. 421893821034"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-gray-900 outline-none focus:border-[#0758fc]"
                />
              </div>

              {/* Payment Screenshot Proof Upload */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera size={14} className="text-[#0758fc]" />
                    Upload Payment Receipt Screenshot (Optional)
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">GPay / PhonePe / Paytm</span>
                </label>

                {utrProofUrl ? (
                  <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={utrProofUrl} alt="Receipt Preview" className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">Payment Screenshot Attached</span>
                        <span className="text-[10px] text-emerald-600 font-bold block">✓ Ready for Instant Verification</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUtrProofUrl("")}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full border-2 border-dashed border-gray-200 hover:border-[#0758fc] bg-gray-50/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/20 group text-center space-y-1">
                    <Upload size={18} className="text-gray-400 group-hover:text-[#0758fc] transition-colors" />
                    <span className="text-xs font-bold text-gray-700 group-hover:text-[#0758fc] transition-colors">
                      Click to upload payment screenshot
                    </span>
                    <span className="text-[10px] text-gray-400">PNG, JPG or WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file);
                            setUtrProofUrl(compressed);
                          } catch {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setUtrProofUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
                <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Submitting your updated 12-digit UTR ID and screenshot will send your transaction back to the host organizer for immediate verification.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUtrModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={utrLoading || !utrInput.trim()}
                  className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {utrLoading ? <Loader2 size={14} className="animate-spin" /> : "Submit UTR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
