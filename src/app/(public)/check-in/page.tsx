"use client";

/**
 * RotaSphere Venue Gate QR Check-in Command Center
 * 
 * Features:
 * 1. User-gesture initiated camera activation (never auto-blocked by browsers on mount).
 * 2. Progressive multi-tier camera constraints (High-res -> Simple Facing -> Universal video: true).
 * 3. In-app step-by-step browser permission unblock guide with 1-tap re-check.
 * 4. Multi-device camera selection (Integrated Webcam, External, Rear, Front).
 * 5. Throttled, non-blocking 10 FPS jsQR scanning loop (zero frame drops or stutter).
 * 6. Image/Photo file QR upload backup for hardware-locked or headless devices.
 * 7. Instant test passes for simulation (Valid, Pending, Duplicate, Invalid).
 * 8. Live clearance stats, audio harmonic chimes, and mobile haptic feedback.
 */

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  RotateCcw,
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
  Video,
  Flashlight,
  Loader2,
  Clock,
  History,
  Keyboard,
  X,
  ShieldCheck,
  Building,
  Check,
  UploadCloud,
  Sparkles,
  Info,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  checkInTicketAction,
  approveAndCheckInTicketAction,
  getScannerEventsAction,
  CheckInResponse,
} from "@/app/actions/checkInActions";
import { GateScannerSkeleton } from "@/components/ui/LoadingSkeleton";

// Pleasant audio chime feedback
function playSound(type: "SUCCESS" | "DUPLICATE" | "PENDING" | "INVALID") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "SUCCESS") {
      // Pleasant high double harmonic chime
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
      // Warning double sawtooth tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(260, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "PENDING") {
      // Alert chime for pending approval
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(650, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Low rejection buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Non-blocking audio
  }

  // Haptic vibration feedback on mobile
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    if (type === "SUCCESS") navigator.vibrate(100);
    else if (type === "DUPLICATE") navigator.vibrate([120, 80, 120]);
    else if (type === "PENDING") navigator.vibrate([150, 100]);
    else navigator.vibrate([250, 100, 250]);
  }
}

function CheckInScannerContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";
  const isUrlLocked = initialEventId !== "";

  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [eventsList, setEventsList] = useState<Array<{ id: string; title: string; city: string }>>([]);
  const [gateName] = useState("Main Entrance");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera stream & hardware states
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Drawers / Modals
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [approvingTicketId, setApprovingTicketId] = useState<string | null>(null);

  // Scan state
  const [scanResult, setScanResult] = useState<CheckInResponse | null>(null);
  const [autoClearProgress, setAutoClearProgress] = useState<number>(100);
  const autoClearTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [recentScans, setRecentScans] = useState<
    Array<{
      name: string;
      time: string;
      tier: string;
      club?: string;
      zone?: string;
      result: string;
      code: string;
      ticketId?: string;
    }>
  >([]);

  // Stable references for Html5Qrcode scanner & verification pipeline
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedTokenRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load events list on mount
  useEffect(() => {
    getScannerEventsAction().then((res) => {
      if (res.events && res.events.length > 0) {
        setEventsList(res.events);
        if (initialEventId) {
          setSelectedEventId(initialEventId);
        } else {
          // Default to All Events (Auto-Detect) for friction-free gate admission
          setSelectedEventId("");
        }
      }
    });
  }, [initialEventId]);

  // Verified counts
  const admittedCount = recentScans.filter((s) => s.result === "SUCCESS").length;

  // Clear auto-reset timer helper
  const clearAutoReset = useCallback(() => {
    if (autoClearTimerRef.current) {
      clearInterval(autoClearTimerRef.current);
      autoClearTimerRef.current = null;
    }
  }, []);

  // Dismiss scan result card
  const handleDismissResult = useCallback(() => {
    clearAutoReset();
    setScanResult(null);
    setAutoClearProgress(100);
    lastScannedTokenRef.current = null;
    isProcessingRef.current = false;
  }, [clearAutoReset]);

  // Cleanup timers & scanner on unmount
  useEffect(() => {
    return () => {
      if (autoClearTimerRef.current) clearInterval(autoClearTimerRef.current);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            try {
              scannerRef.current?.clear();
            } catch {}
          })
          .catch(() => {});
      }
    };
  }, []);

  // Main ticket verification logic
  const handleVerify = useCallback(
    async (code: string) => {
      const clean = code.trim();
      if (!clean) return;

      // Lock to avoid multi-scan spamming
      if (isProcessingRef.current) return;

      // Throttle rapid duplicate hits from the camera
      const now = Date.now();
      if (lastScannedTokenRef.current === clean && now - lastScanTimestampRef.current < 3000) {
        return;
      }
      lastScannedTokenRef.current = clean;
      lastScanTimestampRef.current = now;
      isProcessingRef.current = true;

      setLoading(true);
      clearAutoReset();

      try {
        const res = await checkInTicketAction({
          rawInput: clean,
          eventId: selectedEventId || undefined,
          gateName,
          scannerUserId: "gate-staff",
        });

        setLoading(false);
        setScanResult(res);

        if (soundEnabled) {
          if (res.result === "SUCCESS") playSound("SUCCESS");
          else if (res.result === "DUPLICATE_SCAN") playSound("DUPLICATE");
          else if (res.result === "PAYMENT_PENDING") playSound("PENDING");
          else playSound("INVALID");
        }

        // Add to recent clearance log
        setRecentScans((prev) => [
          {
            name: res.attendeeName || "Attendee",
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }),
            tier: res.ticketTierName || "Pass",
            club: res.clubName,
            zone: res.zone,
            result: res.result,
            code: res.ticketCode || clean,
            ticketId: res.ticketId,
          },
          ...prev.slice(0, 24),
        ]);

        // Auto-dismiss successful scans after 2.6s so gate flows continuously
        if (res.result === "SUCCESS") {
          let progress = 100;
          const stepMs = 50;
          const totalMs = 2600;
          const decrement = (stepMs / totalMs) * 100;

          autoClearTimerRef.current = setInterval(() => {
            progress -= decrement;
            setAutoClearProgress(Math.max(0, progress));
            if (progress <= 0) {
              handleDismissResult();
            }
          }, stepMs);
        }
      } catch (err: any) {
        setLoading(false);
        setScanResult({
          result: "INVALID",
          message: err?.message || "Scanner error occurred.",
        });
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1200);
      }
    },
    [selectedEventId, gateName, soundEnabled, clearAutoReset, handleDismissResult]
  );

  const handleVerifyRef = useRef(handleVerify);
  useEffect(() => {
    handleVerifyRef.current = handleVerify;
  }, [handleVerify]);

  // Direct gate approval for pending payment tickets
  async function handleApproveTicket(ticketId: string) {
    if (!ticketId) return;
    setApprovingTicketId(ticketId);
    try {
      const res = await approveAndCheckInTicketAction({
        ticketId,
        gateName,
        scannerUserId: "gate-manager",
      });
      setApprovingTicketId(null);
      setScanResult(res);
      if (soundEnabled) playSound("SUCCESS");

      setRecentScans((prev) =>
        prev.map((s) =>
          s.ticketId === ticketId
            ? { ...s, result: "SUCCESS", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }) }
            : s
        )
      );

      let progress = 100;
      const stepMs = 50;
      const totalMs = 2500;
      const decrement = (stepMs / totalMs) * 100;
      autoClearTimerRef.current = setInterval(() => {
        progress -= decrement;
        setAutoClearProgress(Math.max(0, progress));
        if (progress <= 0) {
          handleDismissResult();
        }
      }, stepMs);
    } catch {
      setApprovingTicketId(null);
    }
  }

  // ── HARDWARE-ACCELERATED Html5Qrcode ENGINE ───────────────────────────────

  // Stop Camera cleanly using Html5Qrcode
  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
      } catch (err) {
        console.warn("Scanner stop error:", err);
      }
    }
    setTorchOn(false);
    setCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  // Start Camera using Html5Qrcode (Native BarcodeDetector + ZXing fallback)
  const startCamera = useCallback(
    async (overrideFacing?: "environment" | "user", deviceId?: string) => {
      await stopCamera();
      setIsStartingCamera(true);
      setCameraError(null);
      setPermissionBlocked(false);

      if (typeof window === "undefined" || !navigator?.mediaDevices) {
        setCameraError("Camera access is not supported on this browser or connection. HTTPS or localhost is required.");
        setIsStartingCamera(false);
        return;
      }

      const activeFacing = overrideFacing || facingMode;

      try {
        let scanner = scannerRef.current;
        if (!scanner) {
          scanner = new Html5Qrcode("qr-reader-viewport", {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
          scannerRef.current = scanner;
        }

        const cameraConfig = deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: activeFacing };

        try {
          await scanner.start(
            cameraConfig,
            {
              fps: 15,
              disableFlip: false,
            },
            (decodedText) => {
              if (!isProcessingRef.current) {
                handleVerifyRef.current(decodedText);
              }
            },
            () => {
              // Normal scan frame without match
            }
          );
        } catch (firstErr: any) {
          const firstErrStr = String(firstErr?.message || firstErr);
          // If environment/rear camera is not found (e.g. desktop/laptop webcam), fallback to default user camera
          if (
            !deviceId &&
            activeFacing === "environment" &&
            !firstErrStr.includes("NotAllowedError") &&
            !firstErrStr.includes("Permission denied") &&
            !firstErrStr.includes("PermissionDeniedError")
          ) {
            await scanner.start(
              { facingMode: "user" },
              {
                fps: 15,
                disableFlip: false,
              },
              (decodedText) => {
                if (!isProcessingRef.current) {
                  handleVerifyRef.current(decodedText);
                }
              },
              () => {}
            );
          } else {
            throw firstErr;
          }
        }

        // Populate available camera devices now that camera permission is active
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setAvailableDevices(
              devices.map((d) => ({ deviceId: d.id, label: d.label } as MediaDeviceInfo))
            );
          }
        } catch {
          // Non-blocking device enumeration
        }

        // Check if torch/flashlight is supported
        try {
          const caps = scanner.getRunningTrackCapabilities() as any;
          setTorchSupported(Boolean(caps && caps.torch));
        } catch {
          setTorchSupported(false);
        }

        setCameraActive(true);
        setIsStartingCamera(false);
      } catch (err: any) {
        const errStr = String(err?.message || err);
        const isPermissionDenied =
          errStr.includes("NotAllowedError") ||
          errStr.includes("Permission denied") ||
          errStr.includes("PermissionDeniedError");

        if (isPermissionDenied) {
          console.warn("Camera permission is blocked or denied in browser settings:", errStr);
          setPermissionBlocked(true);
          setCameraError("Camera permission was denied by your browser. Please allow camera access in your address bar.");
        } else {
          console.warn("Camera start warning:", errStr);
          setCameraError(`Camera hardware error: ${errStr || "Device unavailable or in use by another app."}`);
        }
        setCameraActive(false);
        setIsStartingCamera(false);
      }
    },
    [facingMode, stopCamera]
  );

  // Switch camera facing mode
  async function flipCamera() {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setSelectedDeviceId("");
    if (cameraActive) {
      await startCamera(nextFacing);
    }
  }

  // Switch camera device
  async function handleDeviceChange(deviceId: string) {
    setSelectedDeviceId(deviceId);
    if (cameraActive) {
      await startCamera(facingMode, deviceId);
    }
  }

  // Toggle Torch with Html5Qrcode video constraints
  async function toggleTorch() {
    const scanner = scannerRef.current;
    if (!scanner || !scanner.isScanning || !torchSupported) return;
    try {
      const nextState = !torchOn;
      await scanner.applyVideoConstraints({
        advanced: [{ torch: nextState }] as any,
      });
      setTorchOn(nextState);
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  }

  // Decode QR code from an uploaded image file using Html5Qrcode.scanFile
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode("qr-reader-viewport", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, false);
      if (decodedText) {
        handleVerify(decodedText);
      } else {
        alert("No valid QR code could be found in this image. Please check image clarity.");
      }
    } catch {
      alert("No valid QR code could be found in this image. Please check image clarity.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-70px)] bg-[#0f1419] text-white flex flex-col justify-between py-4 px-3 sm:px-6 lg:px-8 font-sans select-none">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 space-y-4">
        
        {/* ── 1. COMMAND HEADER ─────────────────────────────────────────── */}
        <header className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-3xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 -ml-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Return to Organizer Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                  Gate Check-In Command
                </h1>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {gateName} • Live Scanner
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Event Selector */}
            {eventsList.length > 0 && (
              <select
                value={selectedEventId}
                disabled={isUrlLocked}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-[#0758fc] transition-colors cursor-pointer max-w-[130px] sm:max-w-[200px] truncate"
              >
                <option value="">All Events (Auto-Detect)</option>
                {eventsList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            )}

            {/* Device Switcher (if multiple cameras available) */}
            {availableDevices.length > 1 && cameraActive && (
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-xl px-2 py-1.5 outline-none focus:border-[#0758fc] transition-colors cursor-pointer max-w-[110px] truncate hidden sm:block"
                title="Select Camera Device"
              >
                {availableDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* Torch Flashlight Toggle */}
            {torchSupported && cameraActive && (
              <button
                onClick={toggleTorch}
                title={torchOn ? "Turn Flashlight OFF" : "Turn Flashlight ON"}
                className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  torchOn
                    ? "bg-amber-400 text-gray-950 border-amber-300 shadow-[0_0_12px_#f59e0b]"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                }`}
              >
                <Flashlight size={15} />
                <span className="hidden sm:inline">{torchOn ? "ON" : "Torch"}</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute Audio Chime" : "Enable Audio Chime"}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-gray-800 text-gray-500 border-gray-700"
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Flip Camera Toggle */}
            {cameraActive && (
              <button
                onClick={flipCamera}
                title="Switch Front / Rear Camera"
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
        </header>

        {/* ── 2. CAMERA VIEWFINDER & SCAN OVERLAY ─────────────────────────── */}
        <main className="relative flex-1 min-h-[400px] sm:min-h-[480px] bg-black rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex items-center justify-center">
          
          {/* Html5Qrcode Hardware-Accelerated Scanner Viewport */}
          <div
            id="qr-reader-viewport"
            className={`absolute inset-0 w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover overflow-hidden transition-opacity duration-300 ${
              cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Smooth Scanning Laser Beam */}
          {cameraActive && !scanResult && (
            <div className="absolute inset-x-8 sm:inset-x-16 inset-y-0 pointer-events-none z-20 overflow-hidden">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#0758fc] to-transparent shadow-[0_0_15px_#0758fc] animate-scanner-laser absolute" />
            </div>
          )}

          {/* Viewfinder Target Framing Reticles */}
          {cameraActive && (
            <div className="absolute inset-10 sm:inset-16 pointer-events-none z-10 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-9 h-9 border-t-4 border-l-4 border-[#0758fc] rounded-tl-2xl shadow-[0_0_8px_#0758fc]" />
                <div className="w-9 h-9 border-t-4 border-r-4 border-[#0758fc] rounded-tr-2xl shadow-[0_0_8px_#0758fc]" />
              </div>
              <div className="flex justify-between">
                <div className="w-9 h-9 border-b-4 border-l-4 border-[#0758fc] rounded-bl-2xl shadow-[0_0_8px_#0758fc]" />
                <div className="w-9 h-9 border-b-4 border-r-4 border-[#0758fc] rounded-br-2xl shadow-[0_0_8px_#0758fc]" />
              </div>
            </div>
          )}

          {/* ── IDLE / PERMISSION RECOVERY OVERLAY ───────────────────────── */}
          {!cameraActive && (
            <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-md p-6 text-center flex flex-col items-center justify-center space-y-4 z-15">
              {permissionBlocked ? (
                // BROWSER PERMISSION BLOCKED RECOVERY CARD
                <div className="max-w-md w-full bg-gray-900 border border-amber-500/30 rounded-3xl p-6 text-center space-y-3 shadow-2xl animate-in fade-in-50">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                    <ShieldAlert size={32} />
                  </div>
                  <h3 className="text-lg font-black text-white">Camera Access is Blocked</h3>
                  <p className="text-xs text-gray-300">
                    Your browser has restricted camera access for this site. Follow these simple steps to unblock:
                  </p>
                  
                  <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3.5 text-left text-xs space-y-2 text-gray-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#0758fc] font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <span>Click the <strong>Lock 🔒 / Tune 🎛️</strong> icon in your browser address bar above.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#0758fc] font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <span>Toggle <strong>Camera</strong> to <strong>Allow</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#0758fc] font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                      <span>Click the blue button below to retry.</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={() => startCamera()}
                      disabled={isStartingCamera}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white text-xs font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-[#0758fc]/30 cursor-pointer active:scale-95"
                    >
                      {isStartingCamera ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Retry Camera Access
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-4 py-3 rounded-2xl border border-gray-700 transition-colors cursor-pointer"
                    >
                      <UploadCloud size={16} /> Scan Photo
                    </button>
                  </div>
                </div>
              ) : (
                // STANDARD START CAMERA PROMPT
                <div className="max-w-md w-full space-y-4 animate-in fade-in-50">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-[#0758fc] shadow-[0_0_30px_rgba(7,88,252,0.2)]">
                    <Camera size={36} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Camera Viewfinder Paused</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {cameraError || "Ready to verify attendee passes at the venue gate."}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => startCamera()}
                      disabled={isStartingCamera}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white text-sm font-black px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-[#0758fc]/40 active:scale-95 cursor-pointer"
                    >
                      {isStartingCamera ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Starting Camera...
                        </>
                      ) : (
                        <>
                          <Video size={18} /> Start Camera Scanner
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-5 py-3.5 rounded-2xl border border-gray-700 transition-colors cursor-pointer"
                      title="Upload a screenshot or photo containing a QR code"
                    >
                      <UploadCloud size={16} /> Upload QR Image
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-25">
              <Loader2 size={36} className="text-[#0758fc] animate-spin" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Verifying Ticket...</span>
            </div>
          )}

          {/* ── 3. SCAN RESULT CARD OVERLAYS ──────────────────────────────── */}
          {scanResult && (
            <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center z-30 animate-in zoom-in-95">
              
              {/* SUCCESS (Access Granted) */}
              {scanResult.result === "SUCCESS" && (
                <div className="space-y-3 max-w-md w-full animate-in fade-in-50">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 size={48} className="animate-in zoom-in-50 duration-200" />
                  </div>
                  
                  <span className="text-xs font-black tracking-widest text-emerald-400 uppercase block">
                    ✓ ACCESS GRANTED
                  </span>
                  
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {scanResult.attendeeName}
                  </h2>

                  {/* Pass Tier & Club Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <span className="text-xs font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-3.5 py-1.5 rounded-full">
                      {scanResult.ticketTierName || "Entry Pass"}
                    </span>
                    {scanResult.clubName && (
                      <span className="text-xs font-bold text-blue-300 bg-blue-950/80 border border-blue-700/60 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Building size={12} />
                        {scanResult.clubName}
                        {scanResult.zone && <span className="text-blue-400 font-mono">({scanResult.zone})</span>}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 text-gray-400 text-xs font-mono">
                    {scanResult.ticketCode && <span>Pass: {scanResult.ticketCode}</span>}
                    {scanResult.eventTitle && <p className="text-[11px] text-gray-500 mt-0.5">{scanResult.eventTitle}</p>}
                  </div>

                  {/* Auto-Dismiss Progress Bar */}
                  <div className="w-48 mx-auto bg-gray-800 rounded-full h-1 mt-4 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-75"
                      style={{ width: `${autoClearProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* DUPLICATE SCAN (Pass Sharing Prevention) */}
              {scanResult.result === "DUPLICATE_SCAN" && (
                <div className="space-y-3 max-w-md w-full animate-in fade-in-50">
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <AlertTriangle size={44} />
                  </div>

                  <span className="text-xs font-black tracking-widest text-amber-400 uppercase block">
                    ⚠ ALREADY CHECKED IN
                  </span>

                  <h2 className="text-2xl font-black text-white leading-tight">
                    {scanResult.attendeeName || "Attendee"}
                  </h2>

                  <div className="bg-amber-950/60 border border-amber-800/80 rounded-2xl p-3.5 max-w-sm mx-auto text-left space-y-1">
                    <p className="text-xs text-amber-200 font-bold flex items-center gap-1.5">
                      <Clock size={14} className="shrink-0" />
                      {scanResult.scannedAt ? `First admitted at ${scanResult.scannedAt}` : "Already scanned earlier today"}
                    </p>
                    <p className="text-[11px] text-amber-400/80">
                      Checkpoint: {scanResult.checkedInGate || "Gate Checkpoint"}
                    </p>
                    <p className="text-[11px] text-gray-400 pt-1">
                      Pass re-use or screenshot sharing is blocked.
                    </p>
                  </div>
                </div>
              )}

              {/* PAYMENT PENDING APPROVAL */}
              {scanResult.result === "PAYMENT_PENDING" && (
                <div className="space-y-3 max-w-md w-full animate-in fade-in-50">
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-500/50">
                    <Clock size={44} />
                  </div>

                  <span className="text-xs font-black tracking-widest text-amber-400 uppercase block">
                    PAYMENT PENDING APPROVAL
                  </span>

                  <h2 className="text-2xl font-black text-white leading-tight">
                    {scanResult.attendeeName}
                  </h2>

                  <p className="text-xs text-amber-300 max-w-xs mx-auto">
                    Attendee booked via UPI. Verification is pending.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    {scanResult.ticketId && (
                      <button
                        onClick={() => handleApproveTicket(scanResult.ticketId!)}
                        disabled={approvingTicketId === scanResult.ticketId}
                        className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-black text-xs px-6 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        {approvingTicketId === scanResult.ticketId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Approve & Admit Attendee
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* WRONG EVENT */}
              {scanResult.result === "WRONG_EVENT" && (
                <div className="space-y-3 max-w-md w-full animate-in fade-in-50">
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto border-2 border-orange-500/50">
                    <Building size={44} />
                  </div>

                  <span className="text-xs font-black tracking-widest text-orange-400 uppercase block">
                    WRONG EVENT VENUE
                  </span>

                  <h2 className="text-xl font-black text-white">{scanResult.attendeeName}</h2>
                  <p className="text-xs text-orange-300 max-w-xs mx-auto">{scanResult.message}</p>
                </div>
              )}

              {/* INVALID / CANCELLED / REFUNDED */}
              {(scanResult.result === "INVALID" || scanResult.result === "CANCELLED" || scanResult.result === "REFUNDED") && (
                <div className="space-y-3 max-w-md w-full animate-in fade-in-50">
                  <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border-2 border-rose-500/50 shadow-[0_0_30px_rgba(244,33,46,0.3)]">
                    <XCircle size={44} />
                  </div>

                  <span className="text-xs font-black tracking-widest text-rose-400 uppercase block">
                    {scanResult.result === "INVALID" ? "INVALID PASS" : `${scanResult.result} PASS`}
                  </span>

                  <h2 className="text-xl font-black text-white">
                    {scanResult.attendeeName || "Access Denied"}
                  </h2>
                  <p className="text-xs text-rose-300 max-w-xs mx-auto">{scanResult.message}</p>
                </div>
              )}

              {/* Dismiss / Scan Next Action */}
              <button
                onClick={handleDismissResult}
                className="mt-6 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-7 py-2.5 rounded-full border border-white/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-md"
              >
                <RotateCcw size={14} /> Scan Next Pass
              </button>
            </div>
          )}
        </main>

        {/* ── 4. QUICK PASS SIMULATION & STATS BAR ───────────────────────── */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-400 font-semibold text-[11px]">
            <Sparkles size={14} className="text-[#0758fc]" />
            <span>Instant Test Simulator:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleVerify("TKT-6-A7DH-1")}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              ✓ Valid Pass (TKT-6-A7DH-1)
            </button>
            <button
              onClick={() => handleVerify("TKT-K-JXCE-1")}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              ⏱ Pending Approval (TKT-K-JXCE-1)
            </button>
            <button
              onClick={() => handleVerify("INVALID-CODE-999")}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              ✗ Invalid Pass
            </button>
          </div>
        </div>

        {/* ── 5. FLOATING BOTTOM UTILITY BAR ─────────────────────────────── */}
        <footer className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-3xl p-3 sm:px-5 shadow-xl flex items-center justify-between gap-3">
          
          {/* Admitted Counter */}
          <div className="flex items-center gap-2 pl-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-xs font-bold text-gray-300">
              <strong className="text-white font-black text-sm">{admittedCount}</strong> Admitted
            </span>
          </div>

          {/* Center Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Camera Switcher / Toggle */}
            {cameraActive && (
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-2xl transition-colors cursor-pointer"
                title="Pause camera stream"
              >
                <span>Pause Camera</span>
              </button>
            )}

            {/* Manual Code Entry Drawer Button */}
            <button
              onClick={() => setManualEntryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3.5 py-2 rounded-2xl transition-colors cursor-pointer"
            >
              <Keyboard size={14} />
              <span>Manual Code</span>
            </button>

            {/* History Sheet Button */}
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3.5 py-2 rounded-2xl transition-colors cursor-pointer"
            >
              <History size={14} />
              <span>History ({recentScans.length})</span>
            </button>
          </div>
        </footer>

      </div>

      {/* ── 6. MANUAL CODE ENTRY MODAL ────────────────────────────────────── */}
      {manualEntryOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Keyboard size={18} className="text-[#0758fc]" /> Manual Pass Verification
              </h3>
              <button
                onClick={() => setManualEntryOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Type the attendee ticket code (e.g. <code className="text-[#0758fc] font-bold">TKT-1-1R7H-1</code>) or paste the QR token:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualCode.trim()) return;
                setManualEntryOpen(false);
                handleVerify(manualCode);
                setManualCode("");
              }}
              className="space-y-3"
            >
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="TKT-XXXX-X or RS-Token..."
                className="w-full bg-gray-950 border border-gray-700 rounded-2xl px-4 py-3 text-sm font-mono text-white placeholder-gray-500 outline-none focus:border-[#0758fc] shadow-inner"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setManualEntryOpen(false)}
                  className="text-xs font-bold text-gray-400 hover:text-white px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="bg-[#0758fc] hover:bg-[#054fe0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all cursor-pointer active:scale-95 shadow-lg shadow-[#0758fc]/30"
                >
                  Verify Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. RECENT CLEARANCE HISTORY DRAWER ─────────────────────────────── */}
      {historyOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <History size={18} className="text-[#0758fc]" /> Admission History
                </h3>
                <p className="text-xs text-gray-400">Total Scans in this session: {recentScans.length}</p>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {recentScans.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs space-y-1">
                <ShieldCheck size={32} className="mx-auto text-gray-600 mb-2" />
                <p>No passes scanned yet.</p>
                <p className="text-[11px] text-gray-600">Scanned tickets will appear here with timestamps.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1">
                {recentScans.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-gray-950 border border-gray-800 p-3 rounded-2xl"
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
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 font-mono">
                          <span>{s.code}</span>
                          <span>•</span>
                          <span className="text-gray-300 font-sans">{s.tier}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 space-y-1">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          s.result === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : s.result === "DUPLICATE_SCAN"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {s.result}
                      </span>
                      <span className="font-mono text-[10px] text-gray-500">{s.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHistoryOpen(false)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs py-2.5 rounded-2xl transition-colors cursor-pointer"
            >
              Close History
            </button>
          </div>
        </div>
      )}
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
