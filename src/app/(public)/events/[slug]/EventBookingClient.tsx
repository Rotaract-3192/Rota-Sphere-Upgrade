"use client";

/**
 * Event Booking Client Component
 * Works seamlessly on mobile and desktop.
 * - Always shows the clean booking card on the page.
 * - Provides a floating bottom action bar on mobile for instant registration.
 * - Opens CheckoutModal reliably with z-[9999] layer depth.
 */

import { useState } from "react";
import { Ticket, ShieldCheck, Share2, Heart, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";

interface EventBookingClientProps {
  event: SaasEvent;
  tiers: SaasTicketTier[];
  userEmail?: string;
  userName?: string;
}

export function EventBookingClient({ event, tiers, userEmail, userName }: EventBookingClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const earlyBirdTiers = tiers.filter((t) => /early/i.test(t.name));
  const generalTiers = tiers.filter((t) => /(general|normal|standard|regular)/i.test(t.name));
  const otherTiers = tiers.filter(
    (t) => !/early/i.test(t.name) && !/(general|normal|standard|regular)/i.test(t.name)
  );

  const isEarlyBirdAvailable =
    earlyBirdTiers.length > 0 &&
    earlyBirdTiers.some((t) => (t.total_capacity - t.sold_count) > 0);

  const [showGeneralDropdown, setShowGeneralDropdown] = useState(!isEarlyBirdAvailable);

  const prices = tiers.map((t) => Number(t.price));
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

  function handleOpenCheckout(e: React.MouseEvent) {
    e.stopPropagation();
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
          <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
            ● Live Booking
          </span>
        </div>

        {/* Tiers Preview */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Available Passes</span>
          <div className="space-y-2">
            {tiers.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No tickets announced yet.</p>
            ) : (
              <>
                {/* 1. Early Bird Tiers */}
                {earlyBirdTiers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block">
                      🔥 Early Bird Release
                    </span>
                    {earlyBirdTiers.map((tier) => {
                      const remaining = tier.total_capacity - tier.sold_count;
                      const isSoldOut = remaining <= 0;
                      return (
                        <div
                          key={tier.id}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                              {tier.allowed_audience === "ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                              )}
                              {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{isSoldOut ? "Sold Out" : `${remaining} seats left`}</p>
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
                        General Release {isEarlyBirdAvailable ? "(Unlocks after Early Bird)" : "(Active)"}
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
                          const remaining = tier.total_capacity - tier.sold_count;
                          return (
                            <div
                              key={tier.id}
                              className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-gray-900">{tier.name}</p>
                                  {tier.allowed_audience === "ROTARACT_ONLY" && (
                                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                                  )}
                                  {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500">{remaining} seats left</p>
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
                      const remaining = tier.total_capacity - tier.sold_count;
                      return (
                        <div
                          key={tier.id}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                              {tier.allowed_audience === "ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                              )}
                              {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{remaining} seats left</p>
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
                        ⭐ Special &amp; VIP Passes
                      </span>
                    )}
                    {otherTiers.map((tier) => {
                      const remaining = tier.total_capacity - tier.sold_count;
                      return (
                        <div
                          key={tier.id}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                              {tier.allowed_audience === "ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">Rotaract Only</span>
                              )}
                              {tier.allowed_audience === "NON_ROTARACT_ONLY" && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">Guest Pass</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{remaining} seats left</p>
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
        <button
          type="button"
          onClick={handleOpenCheckout}
          className="w-full bg-[#0758fc] hover:bg-[#054fe0] active:bg-[#0052ff] text-white font-extrabold text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
        >
          <Ticket size={20} /> Register &amp; Buy Tickets
        </button>

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

        <button
          type="button"
          onClick={handleOpenCheckout}
          className="bg-[#0758fc] hover:bg-[#054fe0] active:bg-[#0052ff] text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer touch-manipulation"
        >
          <Ticket size={18} />
          Register &amp; Buy
        </button>
      </motion.div>

      {/* Checkout Modal (rendered with z-[9999] high priority) */}
      <CheckoutModal
        event={event}
        tiers={tiers}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userEmail={userEmail}
        userName={userName}
      />
    </>
  );
}
