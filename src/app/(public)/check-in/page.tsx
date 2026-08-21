"use client";

/**
 * Mobile-First & Desktop Command Center Gate Check-in Scanner PWA
 * Real-time camera QR reader (jsQR), audio chime feedback, haptics, duplicate scan protection,
 * gate statistics, and fallback manual entry.
 */

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
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
  VolumeX,
  RefreshCw,
  Video,
  VideoOff,
  UserCheck,
  Building,
  Check,
  Loader2,
  Activity,
  Download,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import jsQR from "jsqr";
import { checkInTicketAction, getScannerEventsAction, CheckInResponse } from "@/app/actions/checkInActions";
import { GateScannerSkeleton } from "@/components/ui/LoadingSkeleton";

function playSound(type: "SUCCESS" | "DUPLICATE" | "INVALID") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "SUCCESS") {
      // Pleasant high double chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.3);
    } else if (type === "DUPLICATE") {
      // Warning double tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(250, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Error low buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Non-blocking audio
  }

  // Haptic feedback
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    if (type === "SUCCESS") navigator.vibrate(100);
    else if (type === "DUPLICATE") navigator.vibrate([150, 100, 150]);
    else navigator.vibrate([300, 100, 300]);
  }
}

function CheckInScannerContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";

  // If eventId is in URL, lock to that event — operator cannot switch
  const isUrlLocked = initialEventId !== "";
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const isEventLocked = selectedEventId !== "" && selectedEventId !== "all";
  const [eventsList, setEventsList] = useState<Array<{ id: string; title: string; city: string }>>([]);
  const [gateName, setGateName] = useState("Main Entrance");
  const [inputToken, setInputToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScannedTokenRef = useRef<string | null>(null);
  const lastScanTimestampRef = useRef<number>(0);

  const [scanResult, setScanResult] = useState<CheckInResponse | null>(null);
  const [recentScans, setRecentScans] = useState<
    Array<{ name: string; time: string; tier: string; result: string; code: string }>
  >([]);

  // Load events
  useEffect(() => {
    getScannerEventsAction().then((res) => {
      if (res.events) setEventsList(res.events);
    });
  }, []);

  // Stats calculation
  const stats = {
    total: recentScans.length,
    success: recentScans.filter((s) => s.result === "SUCCESS").length,
    duplicate: recentScans.filter((s) => s.result === "DUPLICATE_SCAN").length,
    invalid: recentScans.filter((s) => s.result !== "SUCCESS" && s.result !== "DUPLICATE_SCAN").length,
  };

  // Check ticket handler
  const handleVerify = useCallback(
    async (code: string) => {
      const clean = code.trim();
      if (!clean) return;

      // Throttle rapid duplicate camera hits
      const now = Date.now();
      if (lastScannedTokenRef.current === clean && now - lastScanTimestampRef.current < 2500) {
        return;
      }
      lastScannedTokenRef.current = clean;
      lastScanTimestampRef.current = now;

      setLoading(true);

      const res = await checkInTicketAction({
        rawInput: clean,
        eventId: selectedEventId,
        gateName,
        scannerUserId: "staff-scanner-01",
      });

      setLoading(false);
      setScanResult(res);

      if (soundEnabled) {
        playSound(res.result === "SUCCESS" ? "SUCCESS" : res.result === "DUPLICATE_SCAN" ? "DUPLICATE" : "INVALID");
      }

      // Add to session log
      setRecentScans((prev) => [
        {
          name: res.attendeeName || "Attendee",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          tier: res.ticketTierName || "Pass",
          result: res.result,
          code: res.ticketCode || clean,
        },
        ...prev.slice(0, 19),
      ]);
    },
    [selectedEventId, gateName, soundEnabled]
  );

  // ── CAMERA SCANNING LOOP (jsQR) ──────────────────────────────────────────
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (cameraActive) {
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      handleVerify(code.data);
    }

    if (cameraActive) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [cameraActive, handleVerify]);

  // Start Camera
  async function startCamera() {
    try {
      setCameraError(null);
      setCameraActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      setCameraActive(false);
      setCameraError("Camera permission was denied or device is unavailable. Use manual token entry below.");
    }
  }

  // Stop Camera
  function stopCamera() {
    setCameraActive(false);
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }

  // Toggle Camera
  function toggleCamera() {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }

  // Flip Camera
  function flipCamera() {
    stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setTimeout(() => {
      startCamera();
    }, 200);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function handleReset() {
    setInputToken("");
    setScanResult(null);
    lastScannedTokenRef.current = null;
  }

  return (
    <div className="w-full min-h-[calc(100vh-70px)] bg-[#0b0e14] text-white flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-10 font-sans">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* ── 1. TOP HEADER & NAVIGATION BAR ─────────────────────────────── */}
        <header className="bg-[#121721] border border-gray-800/80 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 shrink-0">
              <Image
                src="/brand/logo.png"
                alt="Rotaract District 3192 Ticketing Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Gate Scanner Ops
                </h1>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE TERMINAL
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Rotaract District 3192 High-Speed Entry Validation Engine</p>
            </div>
          </div>

          {/* Right Action Utilities */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Toggle Audio Beep"
              className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-gray-800 text-gray-400 border-gray-700"
              }`}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hidden sm:inline">{soundEnabled ? "Audio Chime ON" : "Muted"}</span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition-colors bg-gray-800/80 hover:bg-gray-700 px-4 py-2 rounded-xl border border-gray-700"
            >
              <ArrowLeft size={14} /> Exit to Dashboard
            </Link>
          </div>
        </header>

        {/* ── 2. VENUE & CHECKPOINT CONFIGURATION ────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#121721] border border-gray-800/80 p-4 rounded-3xl">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-[#0758fc] uppercase tracking-wider block">
              Event Venue
            </label>
            {isUrlLocked ? (
              /* LOCKED — opened via ?eventId= from dashboard. Operator cannot switch. */
              <div className="w-full bg-[#1b2230] text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl border border-[#0758fc]/50 flex items-center justify-between gap-2">
                <span className="truncate">
                  {eventsList.find((e) => e.id === selectedEventId)?.title || "Loading event..."}
                </span>
                <span className="shrink-0 px-1.5 py-0.5 bg-[#0758fc]/20 text-[#0758fc] text-[9px] font-extrabold uppercase tracking-wider rounded-full border border-[#0758fc]/30">
                  LOCKED
                </span>
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setScanResult(null);
                }}
                className={`w-full bg-[#1b2230] text-xs font-semibold px-3.5 py-2.5 rounded-xl border outline-none cursor-pointer ${
                  !isEventLocked
                    ? "border-amber-500/60 text-amber-400"
                    : "border-gray-700/80 text-white focus:border-[#0758fc]"
                }`}
              >
                <option value="">⚠ Select Event to Unlock Scanner</option>
                {eventsList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.city})
                  </option>
                ))}
              </select>
            )}
            {!isEventLocked && !isUrlLocked && (
              <p className="text-[10px] text-amber-400 font-bold mt-1">Scanner locked — choose an event first</p>
            )}
          </div>


          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-[#0758fc] uppercase tracking-wider block">
              Gate Checkpoint
            </label>
            <div className="w-full bg-[#1b2230] text-xs font-semibold text-white px-3.5 py-2.5 rounded-xl border border-gray-700/80">
              Main Entrance
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Scanner Operator
            </label>
            <div className="bg-[#1b2230] text-xs font-mono font-bold text-gray-300 px-3.5 py-2.5 rounded-xl border border-gray-700/80 truncate">
              staff-scanner-01 (Gate Lead)
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
              Clearance Velocity
            </label>
            <div className="bg-[#1b2230] text-xs font-semibold text-emerald-400 px-3.5 py-2.5 rounded-xl border border-gray-700/80 flex items-center justify-between">
              <span>{stats.success} Verified Pass{stats.success === 1 ? "" : "es"}</span>
              <Activity size={14} className="animate-pulse text-emerald-400" />
            </div>
          </div>
        </section>

        {/* ── 3. MAIN COMMAND CENTER (2 COLUMNS ON DESKTOP) ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: CAMERA VIEWFINDER & MANUAL ENTRY (lg: 7 cols) */}
          <div className="lg:col-span-7 space-y-4 bg-[#121721] border border-gray-800/80 p-5 sm:p-7 rounded-3xl shadow-xl">
            
            {/* Viewfinder Container */}
            <div className="relative aspect-video sm:aspect-[4/3] w-full max-w-[540px] mx-auto bg-black rounded-3xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
              
              {/* Live Video Camera Stream */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Laser scanning beam line */}
              {cameraActive && (
                <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#0758fc] to-transparent animate-bounce opacity-90 z-20 shadow-[0_0_12px_#0758fc]" />
              )}

              {/* Corner target reticles */}
              <div className="absolute inset-10 pointer-events-none z-10">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#0758fc] rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#0758fc] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#0758fc] rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#0758fc] rounded-br-xl" />
              </div>

              {/* Result Overlay Card */}
              {scanResult ? (
                <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center z-30 animate-in zoom-in-95">
                  {scanResult.result === "SUCCESS" && (
                    <div className="space-y-2">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
                        <CheckCircle2 size={36} />
                      </div>
                      <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase block">
                        ACCESS GRANTED
                      </span>
                      <h3 className="text-2xl font-black text-white">{scanResult.attendeeName}</h3>
                      <span className="inline-block text-xs font-bold text-emerald-300 bg-emerald-950 px-4 py-1.5 rounded-full border border-emerald-800">
                        {scanResult.ticketTierName}
                      </span>
                      <p className="text-xs text-gray-400 pt-1">{scanResult.eventTitle}</p>
                    </div>
                  )}

                  {scanResult.result === "DUPLICATE_SCAN" && (
                    <div className="space-y-2">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-500/40">
                        <AlertTriangle size={36} />
                      </div>
                      <span className="text-[11px] font-black tracking-widest text-amber-400 uppercase block">
                        DUPLICATE SCAN PREVENTED
                      </span>
                      <h3 className="text-xl font-black text-white">{scanResult.attendeeName}</h3>
                      <p className="text-xs text-amber-300 font-semibold max-w-[280px] mx-auto">{scanResult.message}</p>
                    </div>
                  )}

                  {scanResult.result === "WRONG_EVENT" && (
                    <div className="space-y-2">
                      <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto border-2 border-orange-500/40">
                        <Building size={36} />
                      </div>
                      <span className="text-[11px] font-black tracking-widest text-orange-400 uppercase block">
                        WRONG EVENT VENUE
                      </span>
                      <h3 className="text-lg font-black text-white">{scanResult.attendeeName}</h3>
                      <p className="text-xs text-orange-300 max-w-[280px] mx-auto">{scanResult.message}</p>
                    </div>
                  )}

                  {(scanResult.result === "INVALID" || scanResult.result === "CANCELLED" || scanResult.result === "REFUNDED") && (
                    <div className="space-y-2">
                      <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border-2 border-rose-500/40">
                        <XCircle size={36} />
                      </div>
                      <span className="text-[11px] font-black tracking-widest text-rose-400 uppercase block">
                        {scanResult.result} PASS
                      </span>
                      <p className="text-xs text-rose-300 font-semibold max-w-[280px] mx-auto">{scanResult.message}</p>
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    className="mt-5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-6 py-2.5 rounded-full border border-white/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <RotateCcw size={14} /> Scan Next Ticket
                  </button>
                </div>
              ) : !isEventLocked ? (
                <div className="p-8 text-center space-y-3 z-10">
                  <div className="w-16 h-16 rounded-full bg-amber-900/40 border-2 border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                    <ShieldAlert size={32} />
                  </div>
                  <h4 className="text-base font-black text-amber-400">Scanner Locked</h4>
                  <p className="text-xs text-amber-300/80 max-w-xs mx-auto">
                    Select a specific event in the dropdown above to unlock the scanner.
                  </p>
                </div>
              ) : !cameraActive ? (
                <div className="p-8 text-center space-y-3 z-10">
                  <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
                    <Camera size={32} />
                  </div>
                  <h4 className="text-base font-bold text-gray-200">Camera Viewfinder Idle</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Click Start Camera Scanner to begin live video recognition, or paste a ticket token below.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Camera Control Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={toggleCamera}
                disabled={!isEventLocked}
                title={!isEventLocked ? "Select an event first" : cameraActive ? "Stop camera" : "Start camera scanner"}
                className={`inline-flex items-center justify-center gap-2 font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl transition-all shadow-lg cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  cameraActive
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                    : "bg-[#0758fc] hover:bg-[#054fe0] text-white shadow-[#0758fc]/30 hover:scale-105 disabled:hover:scale-100"
                }`}
              >
                {cameraActive ? (
                  <>
                    <VideoOff size={18} /> Stop Camera
                  </>
                ) : (
                  <>
                    <Video size={18} /> Start Camera Scanner
                  </>
                )}
              </button>

              {cameraActive && (
                <button
                  onClick={flipCamera}
                  title="Switch Front / Rear Camera"
                  className="p-3.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-2xl transition-colors cursor-pointer"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>

            {cameraError && (
              <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-2xl text-center">
                {cameraError}
              </p>
            )}

            {/* Manual Token Entry & Keyboard Barcode Wedge */}
            <div className="pt-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">
                Manual Token Entry / Barcode Scanner Wedge
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify(inputToken);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Type ticket code or paste token (e.g. TKT-M-213H-1)..."
                  className="flex-1 bg-[#1b2230] border border-gray-700/80 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-gray-500 outline-none focus:border-[#0758fc] shadow-inner"
                />
                <button
                  type="submit"
                  disabled={loading || !inputToken.trim() || !isEventLocked}
                  title={!isEventLocked ? "Select an event first" : "Verify ticket"}
                  className="bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-black text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md flex-shrink-0 active:scale-95"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : "Verify"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: GATE STATS & REAL-TIME AUDIT LOG (lg: 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#121721] border border-gray-800/80 p-4 rounded-3xl text-center space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Total Scans</span>
                <span className="text-2xl font-black text-white">{stats.total}</span>
              </div>
              <div className="bg-[#121721] border border-emerald-900/40 p-4 rounded-3xl text-center space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Admitted</span>
                <span className="text-2xl font-black text-emerald-400">{stats.success}</span>
              </div>
              <div className="bg-[#121721] border border-amber-900/40 p-4 rounded-3xl text-center space-y-1">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Duplicate</span>
                <span className="text-2xl font-black text-amber-400">{stats.duplicate}</span>
              </div>
            </div>

            {/* Quick Test Simulator Tags */}
            <div className="bg-[#121721] border border-gray-800/80 p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc]">
                  Live Test Passes
                </span>
                <span className="text-[10px] text-gray-400">Click to simulate instant scan</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleVerify("TKT-M-213H-1")}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                >
                  ✓ TKT-M-213H-1 (Valid)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify("TKT-CONF-7788")}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                >
                  ⚠ TKT-CONF-7788 (Duplicate)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify("INVALID-CODE-999")}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                >
                  ✕ Invalid Code
                </button>
              </div>
            </div>

            {/* Live Scan Session Log */}
            <div className="bg-[#121721] border border-gray-800/80 p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-[#0758fc]" /> Live Clearance Log
                </span>
                {recentScans.length > 0 && (
                  <button
                    onClick={() => setRecentScans([])}
                    className="text-[10px] font-bold text-gray-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>

              {recentScans.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl p-4">
                  <ShieldCheck size={28} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Ready for incoming attendees.</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Scanned passes will appear here in real time.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {recentScans.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-[#1b2230] border border-gray-700/60 p-3 rounded-2xl hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            s.result === "SUCCESS"
                              ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                              : s.result === "DUPLICATE_SCAN"
                              ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                              : "bg-rose-400 shadow-[0_0_8px_#f87171]"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{s.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-mono">{s.code}</span>
                            <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.2 rounded font-semibold">
                              {s.tier}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 space-y-1">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            s.result === "SUCCESS"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : s.result === "DUPLICATE_SCAN"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {s.result}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">{s.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default function CheckInScannerPage() {
  return (
    <Suspense fallback={<GateScannerSkeleton />}>
      <CheckInScannerContent />
    </Suspense>
  );
}
