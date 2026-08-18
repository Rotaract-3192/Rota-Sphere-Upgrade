"use client";

import { useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationBell() {
  const { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe } =
    usePushNotifications();
  const [showTooltip, setShowTooltip] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isSupported) return null;

  async function handleToggle() {
    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) showToast("🔕 Push notifications disabled");
    } else {
      const ok = await subscribe();
      if (ok) showToast("🔔 Push notifications enabled!");
      else if (permission === "denied") showToast("Notifications blocked. Please allow in browser settings.");
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const isBlocked = permission === "denied";

  return (
    <div className="relative">
      {/* Toast feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* Bell button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading || isBlocked}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={isSubscribed ? "Disable notifications" : "Enable notifications"}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
          isSubscribed
            ? "bg-[#0758fc]/10 text-[#0758fc] hover:bg-[#0758fc]/20"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
        }`}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isBlocked ? (
          <BellOff size={16} />
        ) : isSubscribed ? (
          <>
            <BellRing size={16} />
            {/* Active indicator dot */}
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0758fc] ring-2 ring-white dark:ring-gray-900" />
          </>
        ) : (
          <Bell size={16} />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !loading && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-gray-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none">
          {isBlocked
            ? "Notifications blocked in browser"
            : isSubscribed
            ? "Click to disable notifications"
            : "Click to enable notifications"}
          <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
}
