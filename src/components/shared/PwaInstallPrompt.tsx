"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Smartphone, Sparkles, Share, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone/installed PWA mode
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    if (isRunningStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capture standard PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user dismissed recently
      const dismissedUntil = localStorage.getItem("rotasphere_pwa_dismissed_until");
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        // Show after 2.5s gentle delay
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not dismissed, show banner after delay
    if (isIosDevice) {
      const dismissedUntil = localStorage.getItem("rotasphere_pwa_dismissed_until");
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    // Custom event to trigger install anytime from buttons (like footer)
    const handleOpenInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === "accepted") {
            setShowBanner(false);
          }
          setDeferredPrompt(null);
        });
      } else if (isIosDevice) {
        setShowIosGuide(true);
      } else {
        // Fallback for browsers when prompt already handled or manual install
        setShowBanner(true);
      }
    };

    window.addEventListener("open-pwa-install", handleOpenInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-install", handleOpenInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
      setShowBanner(false);
    } else {
      // Default: alert standard instructions
      alert("To install RotaSphere, tap your browser's menu (⋮) and select 'Install app' or 'Add to Home screen'.");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 7 days
    localStorage.setItem(
      "rotasphere_pwa_dismissed_until",
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  if (isStandalone) return null;

  return (
    <>
      {/* ── 1. BOTTOM FLOATING INSTALL NOTIFICATION ────────────────── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 pointer-events-auto"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-[#0758fc]/15 dark:shadow-black/50 text-gray-900 dark:text-white">
              <div className="flex items-start gap-3.5">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-[#0758fc] shrink-0 p-1 border border-white/20 shadow-md">
                  <Image
                    src="/brand/logo.png"
                    alt="RotaSphere App Icon"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#0758fc] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      <Sparkles size={10} /> Fast App Access
                    </span>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      title="Dismiss"
                      aria-label="Dismiss notification"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <h4 className="text-sm font-black text-gray-900 dark:text-white mt-1">
                    Install RotaSphere as an App
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Add to your home screen for instant 1-tap pass access and fastest booking.
                  </p>

                  <div className="flex items-center gap-2 pt-3">
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white text-xs font-black py-2 px-4 rounded-xl transition-all shadow-md shadow-[#0758fc]/30 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <Download size={14} />
                      <span>Install Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. IOS SAFARI STEP-BY-STEP INSTALL GUIDE MODAL ───────────── */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-gray-900 dark:text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={20} className="text-[#0758fc]" />
                  <h3 className="text-base font-black">Install on iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIosGuide(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#0758fc] flex items-center justify-center shrink-0 font-black">
                    1
                  </div>
                  <p>
                    Tap the <strong>Share</strong> button <Share size={14} className="inline mx-1 text-[#0758fc]" /> in Safari's bottom toolbar.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#0758fc] flex items-center justify-center shrink-0 font-black">
                    2
                  </div>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} className="inline mx-1 text-emerald-500" />.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#0758fc] flex items-center justify-center shrink-0 font-black">
                    3
                  </div>
                  <p>
                    Tap <strong>Add</strong> in the top-right corner to finish!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-black text-xs py-3 rounded-2xl transition-all shadow-md shadow-[#0758fc]/30 cursor-pointer"
              >
                Got It!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Utility helper to trigger PWA install flow from anywhere (e.g. Footer button)
 */
export function triggerPwaInstall() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-pwa-install"));
  }
}
