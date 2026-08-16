"use client";

/**
 * Mobile-First Gate Check-in Scanner
 * High-speed QR validation with duplicate scan protection, gate selector, and audio/haptic cues.
 */

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { processTicketCheckIn } from "@/lib/services/ticketService";

function CheckInScannerContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId") || "default";

  const [gateName, setGateName] = useState("Main Entrance");
  const [inputToken, setInputToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "IDLE" | "SUCCESS" | "DUPLICATE" | "INVALID";
    attendeeName?: string;
    tierName?: string;
    message?: string;
  }>({ status: "IDLE" });

  const [recentScans, setRecentScans] = useState<Array<{ name: string; time: string; result: string }>>([]);

  async function handleVerifyToken(token: string) {
    if (!token.trim()) return;
    setLoading(true);

    const res = await processTicketCheckIn({
      qrToken: token.trim().toUpperCase(),
      eventId: eventIdParam,
      gateName,
      scannerUserId: "staff-scanner-01",
    });

    setLoading(false);

    if (res.result === "SUCCESS") {
      setScanResult({
        status: "SUCCESS",
        attendeeName: res.attendeeName || "Attendee",
        tierName: res.ticketTierName || "General Pass",
        message: "VALID ENTRY PASS",
      });
      setRecentScans((prev) => [
        { name: res.attendeeName || "Attendee", time: new Date().toLocaleTimeString(), result: "Granted" },
        ...prev.slice(0, 4),
      ]);
    } else if (res.result === "DUPLICATE_SCAN") {
      setScanResult({
        status: "DUPLICATE",
        attendeeName: res.attendeeName || "Attendee",
        tierName: res.ticketTierName,
        message: res.message || "ALREADY SCANNED AT GATE",
      });
    } else {
      setScanResult({
        status: "INVALID",
        message: res.message || "INVALID OR CANCELLED TICKET",
      });
    }
  }

  function handleReset() {
    setInputToken("");
    setScanResult({ status: "IDLE" });
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950 text-white p-4 sm:p-6 flex flex-col justify-between space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Exit Scanner
          </Link>
          <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE SYNC
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Zap className="text-amber-400" size={24} /> Gate Check-In PWA
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">High-speed verification with duplicate detection</p>
        </div>

        {/* Gate Selector */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-2.5 rounded-2xl">
          <span className="text-xs text-gray-400 font-semibold pl-2">Gate:</span>
          <select
            value={gateName}
            onChange={(e) => setGateName(e.target.value)}
            className="bg-transparent text-xs font-bold text-white outline-none flex-1 cursor-pointer"
          >
            <option value="Main Entrance" className="bg-gray-900">Main Entrance</option>
            <option value="VIP & Speaker Gate" className="bg-gray-900">VIP &amp; Speaker Gate</option>
            <option value="Gate 2 — General" className="bg-gray-900">Gate 2 — General</option>
            <option value="Backstage & Crew" className="bg-gray-900">Backstage &amp; Crew</option>
          </select>
        </div>
      </div>

      {/* ── SCAN VIEWFINDER & LIVE RESULT FEEDBACK ────────────────────── */}
      <div className="space-y-6 my-auto">
        {/* Scanner Viewfinder Box */}
        <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-gray-900/80 rounded-3xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-6 text-center overflow-hidden shadow-2xl">
          {/* Laser animation */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff385c] to-transparent animate-bounce opacity-70" />

          {scanResult.status === "IDLE" && (
            <div className="space-y-3 flex flex-col items-center">
              <Camera size={48} className="text-gray-500 animate-pulse" />
              <p className="text-xs text-gray-400 max-w-[180px]">
                Align attendee pass QR code within the frame
              </p>
            </div>
          )}

          {scanResult.status === "SUCCESS" && (
            <div className="space-y-2 flex flex-col items-center animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 size={36} />
              </div>
              <p className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase">ACCESS GRANTED</p>
              <p className="text-lg font-black text-white">{scanResult.attendeeName}</p>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                {scanResult.tierName}
              </span>
            </div>
          )}

          {scanResult.status === "DUPLICATE" && (
            <div className="space-y-2 flex flex-col items-center animate-in shake">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <AlertTriangle size={36} />
              </div>
              <p className="text-xs font-extrabold tracking-widest text-amber-400 uppercase">DUPLICATE SCAN</p>
              <p className="text-base font-black text-white">{scanResult.attendeeName}</p>
              <p className="text-[11px] text-amber-300 max-w-[200px]">{scanResult.message}</p>
            </div>
          )}

          {scanResult.status === "INVALID" && (
            <div className="space-y-2 flex flex-col items-center animate-in shake">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                <XCircle size={36} />
              </div>
              <p className="text-xs font-extrabold tracking-widest text-rose-400 uppercase">INVALID CODE</p>
              <p className="text-xs text-rose-300 max-w-[200px]">{scanResult.message}</p>
            </div>
          )}
        </div>

        {/* Manual Token Entry & Testing */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyToken(inputToken);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Paste or enter QR token (e.g. RS-...)"
              className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-gray-500 outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={loading || !inputToken.trim()}
              className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-950 font-black text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer"
            >
              {loading ? "..." : "Verify"}
            </button>
            {scanResult.status !== "IDLE" && (
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-3 rounded-2xl transition-all cursor-pointer"
                title="Reset Scanner"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </form>
        </div>

        {/* Quick Demo Scan Buttons for Testing */}
        <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-2xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block">
            Test Scanner Flow
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleVerifyToken("RS-VALID-DEMO-PASS-01")}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              Simulate Valid Pass
            </button>
            <button
              onClick={() => handleVerifyToken("RS-DUPLICATE-DEMO-02")}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              Simulate Duplicate
            </button>
            <button
              onClick={() => handleVerifyToken("RS-INVALID-CODE-99")}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              Simulate Invalid
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER SCAN HISTORY ───────────────────────────────────────── */}
      <div className="pt-4 border-t border-gray-900 space-y-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
          Recent Scans this session ({recentScans.length})
        </span>
        <div className="space-y-1.5">
          {recentScans.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-gray-400 bg-gray-900/50 px-3 py-1.5 rounded-xl">
              <span className="font-semibold text-white">{s.name}</span>
              <span className="font-mono text-[10px]">{s.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CheckInScannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading Gate Scanner...</div>}>
      <CheckInScannerContent />
    </Suspense>
  );
}
