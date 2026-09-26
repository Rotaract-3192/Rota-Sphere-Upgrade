"use client";

/**
 * Event Booking Client Component
 * Clean, minimal, high-conversion ticket booking interface.
 * Unified checkout: all passes (regular, early bird, group/bulk) open the standard CheckoutModal.
 */

import { useState, useEffect } from "react";
import { Ticket, ShieldCheck, Share2, Heart, Lock, Users, Clock, CalendarCheck, PauseCircle } from "lucide-react";
import { motion } from "framer-motion";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";
import { useServerSyncedTime } from "@/lib/utils/useServerSyncedTime";
import { getEventTiersAction } from "@/app/actions/orderActions";
import {
  getTierScheduleStatus,
  sortTiersByAvailability,
  formatCountdown,
  type TierStatusInfo,
} from "@/lib/utils/tierAvailability";
import { isEventConcluded } from "@/lib/utils/dateTimeUtils";

interface EventBookingClientProps {
  event: SaasEvent;
  tiers: SaasTicketTier[];
  userEmail?: string;
  userName?: string;
  initialServerTime?: string;
}

export function EventBookingClient({ event, tiers, userEmail, userName, initialServerTime }: EventBookingClientProps) {
  // Tamper-proof, server-synchronized monotonic time
  const currentTime = useServerSyncedTime(initialServerTime);
  const isEnded = isEventConcluded(event, currentTime);
  const isPaused = event.status === "PAUSED";
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTierIdForCheckout, setSelectedTierIdForCheckout] = useState<string | undefined>(undefined);
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

  // Sort tiers by availability: bookable tiers first (price ASC), then sold out/closed
  const sortedLiveTiers = sortTiersByAvailability(liveTiers, currentTime);
  const availableTiers = (isEnded || isPaused) ? [] : sortedLiveTiers.filter((t) => getTierScheduleStatus(t, currentTime).canBook);
  const unavailableTiers = (isEnded || isPaused) ? sortedLiveTiers : sortedLiveTiers.filter((t) => !getTierScheduleStatus(t, currentTime).canBook);
  const hasAnyBookableTier = !isEnded && !isPaused && availableTiers.length > 0;

  // Earliest upcoming tier if everything is locked
  const earliestUpcoming = sortedLiveTiers
    .map((t) => ({ tier: t, status: getTierScheduleStatus(t, currentTime) }))
    .filter((x) => x.status.state === "UPCOMING" && x.status.releaseDate)
    .sort((a, b) => (a.status.releaseDate!.getTime() - b.status.releaseDate!.getTime()))[0];

  // Accurate price computation: inspect bookable tiers (or all live tiers)
  const activeTiersForPrice = availableTiers.length > 0 ? availableTiers : sortedLiveTiers;
  const prices = activeTiersForPrice
    .map((t) => Number(t.price))
    .filter((p) => !isNaN(p));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const isFree = minPrice === 0 && prices.length > 0 && activeTiersForPrice.some((t) => Number(t.price) === 0);

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

  async function handleOpenCheckout(tierId?: string) {
    if (isEnded || isPaused) return;
    if (tierId) {
      setSelectedTierIdForCheckout(tierId);
    } else {
      const firstBookable = availableTiers[0] || sortedLiveTiers.find((t) => getTierScheduleStatus(t, currentTime).canBook);
      setSelectedTierIdForCheckout(firstBookable?.id);
    }
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
      {/* ── MAIN BOOKING CARD (Visible on mobile & desktop) ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 lg:sticky lg:top-24"
      >
        {/* Price Header */}
        <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-5">
          <div>
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
              {isEnded ? "Event Status" : "Registration"}
            </span>
            <div className="text-3xl font-black text-gray-900 dark:text-white mt-0.5 tracking-tight">
              {isEnded ? "Event Over" : isFree ? "Free Entry" : `₹${minPrice}`}
              {!isEnded && !isFree && minPrice > 0 && <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 ml-1">onwards</span>}
            </div>
          </div>
          <span
            className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-xs ${
              isEnded
                ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 flex items-center gap-1.5"
                : isPaused
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-1.5"
                : hasAnyBookableTier
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : earliestUpcoming
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-1.5"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}
          >
            {isEnded ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span>Event Concluded</span>
              </>
            ) : isPaused ? (
              <>
                <PauseCircle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Ticketing Paused</span>
              </>
            ) : hasAnyBookableTier ? (
              "● Booking's Live"
            ) : earliestUpcoming ? (
              <>
                <Lock size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{formatCountdown(earliestUpcoming.status.diffMs || 0)}</span>
              </>
            ) : (
              "Sold Out"
            )}
          </span>
        </div>

        {/* Concluded Notice Banner */}
        {isEnded && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5 shadow-xs">
            <Clock size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>This event has already ended. Pass sales and registrations are now closed.</span>
          </div>
        )}

        {/* Paused Notice Banner */}
        {!isEnded && isPaused && (
          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
              <PauseCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Ticketing Temporarily Paused</span>
            </div>
            <p className="leading-relaxed text-amber-800 dark:text-amber-300">
              Pass sales and bookings have been temporarily paused by the organizer. Previously issued passes and QR entry codes remain 100% active and valid.
            </p>
          </div>
        )}

        {/* Tiers List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {isEnded ? "Event Passes (Archived)" : "Available Passes"}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {isEnded ? "Registration Closed" : "Tap any pass to book"}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
            {liveTiers.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-3 text-center">No passes announced yet.</p>
            ) : (
              <>
                {/* 1. Available Passes - ALWAYS ON TOP */}
                {availableTiers.map((tier) => {
                  const status = getTierScheduleStatus(tier, currentTime);
                  const isBulk = tier.is_bulk_slab === true || tier.tier_type === "BULK";
                  const slabSize = tier.bulk_slab_size || 1;
                  const pricePerPerson = Number(tier.price) || 0;
                  const totalPrice = isBulk ? pricePerPerson * slabSize : pricePerPerson;
                  const cap = Number(tier.total_capacity) || 0;
                  const sold = Number(tier.sold_count) || 0;
                  const reserved = Number(tier.reserved_count) || 0;
                  const remainingSeats = Math.max(0, cap - (sold + reserved));
                  const groupsAvailable = cap > 0 ? Math.floor(remainingSeats / slabSize) : null;
                  const isEarly = /early/i.test(tier.name) || tier.tier_type === "EARLY_BIRD";

                  return (
                    <div
                      key={tier.id}
                      onClick={() => status.canBook && handleOpenCheckout(tier.id)}
                      className={`group p-4 rounded-2xl border transition-all text-left ${
                        isBulk
                          ? "bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-blue-50/20 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/10 border-blue-200/80 dark:border-blue-800/80 hover:border-[#0758fc] hover:shadow-md cursor-pointer active:scale-[0.99]"
                          : isEarly
                          ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 hover:shadow-md cursor-pointer active:scale-[0.99]"
                          : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80 hover:border-[#0758fc] hover:shadow-md cursor-pointer active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-gray-900 dark:text-white group-hover:text-[#0758fc] transition-colors">
                              {tier.name}
                            </span>
                            {isBulk && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                👥 {slabSize} Passes
                              </span>
                            )}
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                              {status.badgeText}
                            </span>
                            {!isBulk && tier.allowed_audience === "ROTARACT_ONLY" && (
                              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                Rotaract Only
                              </span>
                            )}
                            {!isBulk && Number(tier.max_per_order) === 1 ? (
                              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                                🔒 Limit 1
                              </span>
                            ) : !isBulk && tier.max_per_order && Number(tier.max_per_order) < 50 ? (
                              <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                                Limit {tier.max_per_order}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {status.detailText}
                            {isBulk && status.state === "LIVE" && groupsAvailable !== null && (
                              <span className="ml-1 font-semibold text-indigo-600 dark:text-indigo-400">
                                · {groupsAvailable === 0 ? "Sold out" : `${groupsAvailable} group${groupsAvailable !== 1 ? "s" : ""} left`}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-black ${isBulk ? "text-gray-900 dark:text-white" : "text-[#0758fc] dark:text-blue-400"}`}>
                            {totalPrice === 0 ? "FREE" : `₹${totalPrice.toLocaleString("en-IN")}`}
                          </p>
                          {isBulk && pricePerPerson > 0 && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                              ₹{pricePerPerson.toLocaleString("en-IN")}/person
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 2. If absolutely no tier is currently bookable, render all sorted tiers */}
                {!hasAnyBookableTier &&
                  sortedLiveTiers.map((tier) => {
                    const status = getTierScheduleStatus(tier, currentTime);
                    const isBulk = tier.is_bulk_slab === true || tier.tier_type === "BULK";
                    const slabSize = tier.bulk_slab_size || 1;
                    const pricePerPerson = Number(tier.price) || 0;
                    const totalPrice = isBulk ? pricePerPerson * slabSize : pricePerPerson;

                    return (
                      <div
                        key={tier.id}
                        className="group p-4 rounded-2xl border transition-all text-left bg-gray-50/80 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-gray-900 dark:text-white">
                                {tier.name}
                              </span>
                              {isBulk && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  👥 {slabSize} Passes
                                </span>
                              )}
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                                {status.badgeText}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{status.detailText}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-black text-gray-400 dark:text-gray-500">
                              {totalPrice === 0 ? "FREE" : `₹${totalPrice.toLocaleString("en-IN")}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* 3. Sold Out & Closed Passes - ALWAYS AT THE VERY BOTTOM */}
                {hasAnyBookableTier && unavailableTiers.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                      🔒 Sold Out &amp; Closed Passes
                    </span>
                    {unavailableTiers.map((tier) => {
                      const status = getTierScheduleStatus(tier, currentTime);
                      const isBulk = tier.is_bulk_slab === true || tier.tier_type === "BULK";
                      const slabSize = tier.bulk_slab_size || 1;
                      const pricePerPerson = Number(tier.price) || 0;
                      const totalPrice = isBulk ? pricePerPerson * slabSize : pricePerPerson;

                      return (
                        <div
                          key={tier.id}
                          className="group p-4 rounded-2xl border transition-all text-left bg-gray-50/80 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-gray-900 dark:text-white">
                                  {tier.name}
                                </span>
                                {isBulk && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    👥 {slabSize} Passes
                                  </span>
                                )}
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                                  {status.badgeText}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{status.detailText}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-base font-black text-gray-400 dark:text-gray-500">
                                {totalPrice === 0 ? "FREE" : `₹${totalPrice.toLocaleString("en-IN")}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        {isEnded ? (
          <button
            type="button"
            disabled={true}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-xs"
          >
            <CalendarCheck size={18} className="text-gray-400" />
            <span>Event is Over (Registration Closed)</span>
          </button>
        ) : isPaused ? (
          <button
            type="button"
            disabled={true}
            className="w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed opacity-95 shadow-xs"
          >
            <PauseCircle size={18} className="text-amber-600 dark:text-amber-400" />
            <span>Ticketing Temporarily Paused</span>
          </button>
        ) : hasAnyBookableTier ? (
          <button
            type="button"
            onClick={() => handleOpenCheckout()}
            className="w-full bg-[#0758fc] hover:bg-[#054fe0] active:bg-[#0052ff] text-white font-black text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-[0.99]"
          >
            <Ticket size={20} /> Register &amp; Buy Tickets
          </button>
        ) : (
          <button
            type="button"
            disabled={true}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-xs"
          >
            <Lock size={16} />
            <span>
              {earliestUpcoming
                ? `Sales Open Soon (${formatCountdown(earliestUpcoming.status.diffMs || 0)})`
                : "Passes Currently Unavailable"}
            </span>
          </button>
        )}

        {/* Utilities: Share & Bookmark */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleBookmark}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer touch-manipulation ${
              isSaved
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Heart size={15} className={isSaved ? "fill-rose-600 text-rose-600" : ""} />
            {isSaved ? "Saved" : "Bookmark"}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
          >
            <Share2 size={15} />
            {copied ? "Link Copied!" : "Share Event"}
          </button>
        </div>

        <div className="text-[11px] text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Encrypted checkout · Verified Rotaract pass issued instantly</span>
        </div>
      </motion.div>

      {/* ── MOBILE FLOATING BOTTOM BAR (below lg breakpoint) ──────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-2xl px-4 py-3 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {isEnded ? "Status" : "Passes From"}
          </p>
          <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">
            {isEnded ? "Event Over" : isFree ? "Free Entry" : `₹${minPrice}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleBookmark}
          className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer touch-manipulation ${
            isSaved
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          }`}
          aria-label="Bookmark event"
        >
          <Heart size={18} className={isSaved ? "fill-rose-600 text-rose-600" : ""} />
        </button>

        {isEnded ? (
          <button
            type="button"
            disabled={true}
            className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 font-bold text-xs px-5 py-3.5 rounded-2xl flex items-center gap-1.5 cursor-not-allowed"
          >
            <Clock size={15} />
            <span>Event Over</span>
          </button>
        ) : isPaused ? (
          <button
            type="button"
            disabled={true}
            className="bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-xs px-5 py-3.5 rounded-2xl flex items-center gap-1.5 cursor-not-allowed shadow-xs"
          >
            <PauseCircle size={15} className="text-amber-600" />
            <span>Ticketing Paused</span>
          </button>
        ) : hasAnyBookableTier ? (
          <button
            type="button"
            onClick={() => handleOpenCheckout()}
            className="bg-[#0758fc] hover:bg-[#054fe0] active:bg-[#0052ff] text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer touch-manipulation"
          >
            <Ticket size={18} />
            Register &amp; Buy
          </button>
        ) : (
          <button
            type="button"
            disabled={true}
            className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 font-bold text-xs px-4 py-3.5 rounded-2xl flex items-center gap-1.5 cursor-not-allowed"
          >
            <Lock size={15} />
            <span>Unavailable</span>
          </button>
        )}
      </motion.div>

      {/* Unified Checkout Modal (Regular + Group Passes) */}
      <CheckoutModal
        event={event}
        tiers={liveTiers}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTiersUpdate={(updated) => setLiveTiers(updated)}
        userEmail={userEmail}
        userName={userName}
        initialServerTime={initialServerTime}
        initialSelectedTierId={selectedTierIdForCheckout}
      />
    </>
  );
}
