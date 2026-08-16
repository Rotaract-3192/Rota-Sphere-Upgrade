"use client";

/**
 * Event Booking Client Card
 * Shows available ticket tiers, countdown, and opens Checkout Modal.
 */

import { useState } from "react";
import { Ticket, Sparkles, ShieldCheck, Share2, Bookmark, Calendar, ArrowRight, Heart } from "lucide-react";
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

  // Find lowest price
  const prices = tiers.map((t) => Number(t.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const isFree = minPrice === 0;

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <div className="sticky top-24 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
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
              tiers.map((tier) => {
                const remaining = tier.total_capacity - tier.sold_count;
                return (
                  <div
                    key={tier.id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                      <p className="text-[11px] text-gray-500">{remaining} seats left</p>
                    </div>
                    <span className="text-sm font-extrabold text-[#ff385c]">
                      {Number(tier.price) === 0 ? "FREE" : `₹${tier.price}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full bg-[#ff385c] hover:bg-[#e00b41] text-white font-extrabold text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
        >
          <Ticket size={20} /> Register & Buy Tickets
        </button>

        {/* Utilities: Share & Wishlist */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isSaved ? "bg-rose-50 border-rose-200 text-rose-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Heart size={15} className={isSaved ? "fill-rose-600 text-rose-600" : ""} />
            {isSaved ? "Saved" : "Bookmark"}
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 size={15} />
            {copied ? "Link Copied!" : "Share Event"}
          </button>
        </div>

        <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Encrypted checkout · Single-use QR issued immediately</span>
        </div>
      </div>

      {/* Checkout Modal */}
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
