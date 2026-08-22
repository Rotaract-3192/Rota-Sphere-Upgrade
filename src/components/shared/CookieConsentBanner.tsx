"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("rotasphere_cookie_consent");
      if (!consent) {
        const timer = setTimeout(() => setShow(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAccept = (type: "all" | "essential") => {
    try {
      localStorage.setItem("rotasphere_cookie_consent", type);
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 sm:left-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-2xl text-white space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-[#60a5fa] flex items-center justify-center shrink-0">
              <Cookie size={16} />
            </div>
            <h4 className="text-xs font-black tracking-tight text-white">
              We value your privacy
            </h4>
          </div>
          <button
            type="button"
            onClick={() => handleAccept("essential")}
            aria-label="Dismiss cookie notice"
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-[11px] text-gray-300 leading-relaxed">
          RotaSphere uses cookies to remember your active pass, optimize checkout sessions, and secure gate scanning. Read our{" "}
          <Link href="/cookies" className="text-[#60a5fa] hover:underline font-bold">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#60a5fa] hover:underline font-bold">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAccept("all")}
            className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer text-center"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={() => handleAccept("essential")}
            className="flex-1 bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer text-center"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
