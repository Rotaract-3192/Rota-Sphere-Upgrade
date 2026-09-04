"use client";

/**
 * Event Booking Client Component
 * Works seamlessly on mobile and desktop.
 * - Always shows the clean booking card on the page.
 * - Provides a floating bottom action bar on mobile for instant registration.
 * - Opens CheckoutModal reliably with z-[9999] layer depth.
 */

import { useState, useEffect } from "react";
import { Ticket, ShieldCheck, Share2, Heart, ChevronRight, ChevronDown, ChevronUp, Lock, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";
import { useServerSyncedTime } from "@/lib/utils/useServerSyncedTime";
import { getEventTiersAction } from "@/app/actions/orderActions";

interface EventBookingClientProps {
  event: SaasEvent;
  tiers: SaasTicketTier[];
  userEmail?: string;
  userName?: string;
  initialServerTime?: string;
}

interface TierStatusInfo {
  state: "UPCOMING" | "LIVE" | "CLOSED" | "SOLD_OUT";
  badgeText: string;
  badgeClass: string;
  detailText: string;
  canBook: boolean;
  releaseDate?: Date;
  diffMs?: number;
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return "Available Now";
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffDays > 0) {
    const remHrs = diffHrs % 24;
    return remHrs > 0 ? `Opens in ${diffDays}d ${remHrs}h` : `Opens in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  if (diffHrs > 0) {
    const remMins = diffMins % 60;
    return remMins > 0 ? `Opens in ${diffHrs}h ${remMins}m` : `Opens in ${diffHrs}h`;
  }
  if (diffMins > 0) {
    const remSecs = diffSecs % 60;
    return `Opens in ${diffMins}m ${remSecs}s`;
  }
  return `Opens in ${diffSecs}s`;
}

function getTierScheduleStatus(tier: SaasTicketTier, currentTime: Date = new Date()): TierStatusInfo {
  const cap = Number(tier.total_capacity) || 9999;
  const sold = Number(tier.sold_count) || 0;
  const reserved = Number(tier.reserved_count) || 0;
  const remaining = Math.max(0, cap - (sold + reserved));

  if (remaining <= 0) {
    if (sold < cap) {
      return {
        state: "SOLD_OUT",
        badgeText: "In Checkout",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        detailText: "Locked in checkout by another attendee",
        canBook: false,
      };
    }
    return {
      state: "SOLD_OUT",
      badgeText: "Sold Out",
      badgeClass: "bg-gray-100 text-gray-500 border-gray-200",
      detailText: "All seats allocated",
      canBook: false,
    };
  }

  if (tier.sales_start) {
    const start = new Date(tier.sales_start);
    if (currentTime.getTime() < start.getTime()) {
      const diffMs = start.getTime() - currentTime.getTime();
      return {
        state: "UPCOMING",
        badgeText: `🔒 ${formatCountdown(diffMs)}`,
        badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        detailText: `🔒 Locked: Releases on ${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`,
        canBook: false,
        releaseDate: start,
        diffMs,
      };
    }
  }

  if (tier.sales_end) {
    const end = new Date(tier.sales_end);
    if (currentTime.getTime() > end.getTime()) {
      return {
        state: "CLOSED",
        badgeText: "Window Closed",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        detailText: `Closed on ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
        canBook: false,
      };
    } else {
      const diffMs = end.getTime() - currentTime.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffHrs / 24);
      const remainingTime = diffDays > 0 ? `${diffDays}d left` : `${Math.max(1, diffHrs)}h left`;
      return {
        state: "LIVE",
        badgeText: `🔥 Live (${remainingTime})`,
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        detailText: `${remaining} seats available`,
        canBook: true,
      };
    }
  }

  return {
    state: "LIVE",
    badgeText: "Available",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    detailText: `${remaining} seats left`,
    canBook: true,
  };
}

export function EventBookingClient({ event, tiers, userEmail, userName, initialServerTime }: EventBookingClientProps) {
  // Tamper-proof, server-synchronized monotonic time
  const currentTime = useServerSyncedTime(initialServerTime);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic live tiers reflecting real-time inventory holds
  const [liveTiers, setLiveTiers] = useState<SaasTicketTier[]>(tiers);

  useEffect(() => {
    setLiveTiers(tiers);
  }, [tiers]);

  // Sync real-time ticket availability every 3 seconds and on window focus
  useEffect(() => {
    let isMounted = true;
    const syncInventory = async () => {
      try {
        const res = await getEventTiersAction(event.id);
        if (isMounted && res.success && res.tiers && res.tiers.length > 0) {
          setLiveTiers(res.tiers);
        }
      } catch (_) {}
    };

    const interval = setInterval(syncInventory, 3000);
    window.addEventListener("focus", syncInventory);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", syncInventory);
    };
  }, [event.id]);

  const earlyBirdTiers = liveTiers.filter((t) => /early/i.test(t.name) || t.tier_type === "EARLY_BIRD");
  const generalTiers = liveTiers.filter(
    (t) =>
      (/(general|normal|standard|regular)/i.test(t.name) || t.tier_type === "REGULAR") &&
      !/early/i.test(t.name) &&
      t.tier_type !== "EARLY_BIRD"
  );
  const otherTiers = liveTiers.filter(
    (t) =>
      !/early/i.test(t.name) &&
      t.tier_type !== "EARLY_BIRD" &&
      !/(general|normal|standard|regular)/i.test(t.name) &&
      t.tier_type !== "REGULAR"
  );

  const isEarlyBirdAvailable =
    earlyBirdTiers.length > 0 &&
    earlyBirdTiers.some((t) => getTierScheduleStatus(t, currentTime).canBook);

  const hasAnyBookableTier = liveTiers.some((t) => getTierScheduleStatus(t, currentTime).canBook);

  // Find the earliest upcoming release tier if everything is locked
  const earliestUpcoming = liveTiers
    .map((t) => ({ tier: t, status: getTierScheduleStatus(t, currentTime) }))
    .filter((x) => x.status.state === "UPCOMING" && x.status.releaseDate)
    .sort((a, b) => (a.status.releaseDate!.getTime() - b.status.releaseDate!.getTime()))[0];

  const [showGeneralDropdown, setShowGeneralDropdown] = useState(!isEarlyBirdAvailable);

  const prices = liveTiers.map((t) => Number(t.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const isFree = minPrice === 0;

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator.share({ title: event.title, url: window.location.href }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    setIsSaved((prev) => !prev);
  }

  async function handleOpenCheckout(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await getEventTiersAction(event.id);
      if (res.success && res.tiers && res.tiers.length > 0) {
        setLiveTiers(res.tiers);
      }
    } catch (_) {}
    setModalOpen(true);
  }

  return (
    <>
      {/* ── MAIN BOOKING CARD (Visible on both mobile & desktop) ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 lg:sticky lg:top-24"
      >
        {/* Price Header */}
        <div className="flex items-baseline justify-between border-b border-gray-100 pb-5">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Registration Price</span>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">
              {isFree ? "Free Entry" : `₹${minPrice}`}
              {!isFree && <span className="text-xs font-normal text-gray-500"> / pass onwards</span>}
            </div>
          </div>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              hasAnyBookableTier
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : earliestUpcoming
                ? "bg-amber-100 text-amber-900 border-amber-300 font-bold flex items-center gap-1.5"
                : "bg-gray-100 text-gray-700 border-gray-200 font-bold"
            }`}
          >
            {hasAnyBookableTier ? (
              "● Live Booking"
            ) : earliestUpcoming ? (
              <>
                <Lock size={12} className="text-amber-700 shrink-0" />
                <span>{formatCountdown(earliestUpcoming.status.diffMs || 0)}</span>
              </>
            ) : (
              "🔒 Sales Unavailable"
            )}
          </span>
        </div>

        {/* Tiers Preview */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Available Passes &amp; Release Slabs</span>
          <div className="space-y-2.5">
            {liveTiers.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No tickets announced yet.</p>
            ) : (
              <>
                {/* 1. Early Bird Tiers */}
                {earlyBirdTiers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block">
                        🔥 Early Bird Release Slab
                      </span>
                    </div>
                    {earlyBirdTiers.map((tier) => {
                      const status = getTierScheduleStatus(tier, currentTime);
                      return (
                        <div
                          key={tier.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                            status.canBook
                              ? "bg-amber-50/30 border-amber-200"
                              : "bg-gray-50/80 border-dashed border-amber-200/80 opacity-90"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${status.badgeClass}`}>
                                {status.badgeText}
                              </span>
                              {tier.allowed_audience === "ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                              )}
                              {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                              )}
                              {Number(tier.max_per_order) === 1 && (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">🔒 Limit 1 per order</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{status.detailText}</p>
                          </div>
                          <span className="text-sm font-extrabold text-[#0758fc]">
                            {Number(tier.price) === 0 ? "FREE" : `₹${tier.price}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Dropdown for General Release Passes */}
                {generalTiers.length > 0 && earlyBirdTiers.length > 0 && (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => setShowGeneralDropdown(!showGeneralDropdown)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-gray-100/70 transition-colors"
                    >
                      <span className="text-xs font-bold text-gray-900">
                        General Release Passes {isEarlyBirdAvailable ? "(Unlocks after Early Bird)" : "(Active Now)"}
                      </span>
                      <span className="text-xs font-extrabold text-[#0758fc] flex items-center gap-1">
                        {showGeneralDropdown ? (
                          <>Hide <ChevronUp size={14} /></>
                        ) : (
                          <>View <ChevronDown size={14} /></>
                        )}
                      </span>
                    </button>

                    {showGeneralDropdown && (
                      <div className="p-2 border-t border-gray-200 space-y-2 bg-white">
                        {generalTiers.map((tier) => {
                          const status = getTierScheduleStatus(tier, currentTime);
                          return (
                            <div
                              key={tier.id}
                              className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-gray-900">{tier.name}</p>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${status.badgeClass}`}>
                                    {status.badgeText}
                                  </span>
                                  {tier.allowed_audience === "ROTARACT_ONLY" && (
                                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                                  )}
                                  {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                                  )}
                                  {Number(tier.max_per_order) === 1 && (
                                    <span className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">🔒 Limit 1</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500">{status.detailText}</p>
                              </div>
                              <span className="text-xs font-extrabold text-[#0758fc]">
                                {Number(tier.price) === 0 ? "FREE" : `₹${tier.price}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. If NO Early Bird exists, render General Tiers normally */}
                {generalTiers.length > 0 && earlyBirdTiers.length === 0 && (
                  <div className="space-y-2">
                    {generalTiers.map((tier) => {
                      const status = getTierScheduleStatus(tier, currentTime);
                      return (
                        <div
                          key={tier.id}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${status.badgeClass}`}>
                                {status.badgeText}
                              </span>
                              {tier.allowed_audience === "ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                              )}
                              {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                              )}
                              {Number(tier.max_per_order) === 1 && (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">🔒 Limit 1 per order</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{status.detailText}</p>
                          </div>
                          <span className="text-sm font-extrabold text-[#0758fc]">
                            {Number(tier.price) === 0 ? "FREE" : `₹${tier.price}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. VIP & Other Tiers */}
                {otherTiers.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {earlyBirdTiers.length > 0 && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-block">
                        ✨ Premium &amp; Special Passes
                      </span>
                    )}
                    {otherTiers.map((tier) => {
                      const status = getTierScheduleStatus(tier, currentTime);
                      return (
                        <div
                          key={tier.id}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${status.badgeClass}`}>
                                {status.badgeText}
                              </span>
                              {tier.allowed_audience === "ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                              )}
                              {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                              )}
                              {Number(tier.max_per_order) === 1 && (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">🔒 Limit 1 per order</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{status.detailText}</p>
                          </div>
                          <span className="text-sm font-extrabold text-[#0758fc]">
                            {Number(tier.price) === 0 ? "FREE" : `₹${tier.price}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        {hasAnyBookableTier ? (
          <button
            type="button"
            onClick={handleOpenCheckout}
            className="w-full bg-[#0758fc] hover:bg-[#054fe0] active:bg-[#0052ff] text-white font-extrabold text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
          >
            <Ticket size={20} /> Register &amp; Buy Tickets
          </button>
        ) : (
          <button
            type="button"
            disabled={true}
            className="w-full bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-extrabold text-sm sm:text-base py-4 rounded-2xl flex items-center justify-center gap-2.5 cursor-not-allowed opacity-90 shadow-xs"
          >
            <Lock size={18} className="text-amber-700 dark:text-amber-400 shrink-0" />
            <span>
              {earliestUpcoming
                ? `Sales Open at ${new Date(earliestUpcoming.tier.sales_start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })} (${formatCountdown(earliestUpcoming.status.diffMs || 0)})`
                : "Passes Currently Locked"}
            </span>
          </button>
        )}

        {/* Utilities: Share & Wishlist */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleBookmark}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer touch-manipulation ${
              isSaved ? "bg-rose-50 border-rose-200 text-rose-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Heart size={15} className={isSaved ? "fill-rose-600 text-rose-600" : ""} />
            {isSaved ? "Saved" : "Bookmark"}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
          >
            <Share2 size={15} />
            {copied ? "Link Copied!" : "Share Event"}
          </button>
        </div>

        <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Encrypted checkout · Single-use QR issued immediately</span>
        </div>
      </motion.div>

      {/* ── MOBILE FLOATING BOTTOM BAR (below lg breakpoint) ──────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl px-4 py-3 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Passes From</p>
          <p className="text-lg font-extrabold text-gray-900 leading-tight">
            {isFree ? "Free Entry" : `₹${minPrice}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleBookmark}
          className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer touch-manipulation ${
            isSaved ? "bg-rose-50 border-rose-200 text-rose-600" : "border-gray-200 text-gray-600"
          }`}
          aria-label="Bookmark event"
        >
          <Heart size={18} className={isSaved ? "fill-rose-600 text-rose-600" : ""} />
        </button>

        {hasAnyBookableTier ? (
          <button
            type="button"
            onClick={handleOpenCheckout}
            className="bg-[#0758fc] hover:bg-[#054fe0] active:bg-[#0052ff] text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer touch-manipulation"
          >
            <Ticket size={18} />
            Register &amp; Buy
          </button>
        ) : (
          <button
            type="button"
            disabled={true}
            className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs px-4 py-3.5 rounded-2xl flex items-center gap-1.5 cursor-not-allowed opacity-90 shadow-xs"
          >
            <Lock size={15} className="text-amber-800 shrink-0" />
            <span>
              {earliestUpcoming
                ? `Opens at ${new Date(earliestUpcoming.tier.sales_start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`
                : "Locked"}
            </span>
          </button>
        )}
      </motion.div>

      {/* Checkout Modal (rendered with z-[9999] high priority) */}
      <CheckoutModal
        event={event}
        tiers={liveTiers}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTiersUpdate={(updated) => setLiveTiers(updated)}
        userEmail={userEmail}
        userName={userName}
        initialServerTime={initialServerTime}
      />
    </>
  );
}
