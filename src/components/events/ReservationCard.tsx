"use client";

/**
 * ReservationCard — Sticky right-rail ticket selection
 * DESIGN-airbnb.md §reservation-card:
 *   - White surface, rounded-card (14px), 1px hairline border, shadow-card, 24px padding
 *   - Contains: price display, date-range/tier selector, CTA, fee breakdown
 *
 * Architecture §20: "Reservation must be created BEFORE collecting payment."
 * Architecture §32: Shows all available ticket tiers with capacity indicators.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Clock, AlertCircle, ChevronDown, ChevronUp, Lock } from "lucide-react";
import type { TicketTier, EventStatus } from "@/types/database";

interface ReservationCardProps {
  event: {
    id: string;
    title: string;
    status: EventStatus;
    registrations_disabled: boolean;
    registration_close_at: string | null;
    enable_waitlist: boolean;
  };
  tiers: TicketTier[];
}

function formatPrice(price: string): string {
  const n = parseFloat(price);
  if (n === 0) return "Free";
  return `₹${n.toLocaleString("en-IN")}`;
}

function getMinPrice(tiers: TicketTier[]): string {
  const enabled = tiers.filter((t) => t.enabled && t.visibility === "PUBLIC");
  if (!enabled.length) return "—";
  const prices = enabled.map((t) => parseFloat(t.price));
  const min = Math.min(...prices);
  return min === 0 ? "Free" : `₹${min.toLocaleString("en-IN")}`;
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

function getTierScheduleStatus(tier: TicketTier, currentTime: Date = new Date()) {
  const available = tier.capacity - tier.sold_count - tier.reserved_count;
  if (available <= 0) {
    return { canBook: false, text: "Sold out", isSoldOut: true, isUpcoming: false, diffMs: 0 };
  }

  if (tier.sales_start) {
    const start = new Date(tier.sales_start);
    if (currentTime.getTime() < start.getTime()) {
      const diffMs = start.getTime() - currentTime.getTime();
      return {
        canBook: false,
        text: `🔒 Releases ${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })} (${formatCountdown(diffMs)})`,
        isSoldOut: false,
        isUpcoming: true,
        diffMs,
        releaseDate: start,
      };
    }
  }

  if (tier.sales_end) {
    const end = new Date(tier.sales_end);
    if (currentTime.getTime() > end.getTime()) {
      return { canBook: false, text: "Sales closed", isSoldOut: false, isUpcoming: false, diffMs: 0 };
    }
  }

  return { canBook: true, text: "", isSoldOut: false, isUpcoming: false, diffMs: 0 };
}

function useSafeUser() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useUser();
  } catch {
    return { isSignedIn: true, isLoaded: true, user: null }; // Default to true in preview
  }
}

export function ReservationCard({ event, tiers }: ReservationCardProps) {
  const router = useRouter();
  const { isSignedIn } = useSafeUser();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const publicTiers = tiers.filter((t) => t.enabled && t.visibility === "PUBLIC");
  const isRegistrationOpen = event.status === "REGISTRATION_OPEN" && !event.registrations_disabled;
  const isClosed = event.status === "REGISTRATION_CLOSED" || event.status === "COMPLETED";

  const earlyBirdTiers = publicTiers.filter((t) => /early/i.test(t.name));
  const generalTiers = publicTiers.filter((t) => /(general|normal|standard|regular)/i.test(t.name));
  const otherTiers = publicTiers.filter(
    (t) => !/early/i.test(t.name) && !/(general|normal|standard|regular)/i.test(t.name)
  );

  const isEarlyBirdAvailable =
    earlyBirdTiers.length > 0 &&
    earlyBirdTiers.some((t) => getTierScheduleStatus(t, currentTime).canBook);

  const hasAnyBookableTier = publicTiers.some((t) => getTierScheduleStatus(t, currentTime).canBook);

  const [showGeneralDropdown, setShowGeneralDropdown] = useState(!isEarlyBirdAvailable);

  const renderTierCard = (tier: TicketTier) => {
    const available = tier.capacity - tier.sold_count - tier.reserved_count;
    const qty = quantities[tier.id] ?? 0;
    const status = getTierScheduleStatus(tier, currentTime);
    const maxAllowed = (tier as any).max_per_order ? Number((tier as any).max_per_order) : (tier.maximum_quantity || 10);

    return (
      <div key={tier.id} className={`border rounded-2xl p-4 transition-all space-y-2 ${status.canBook ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50/80 opacity-80"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-bold text-gray-900">{tier.name}</p>
              {maxAllowed === 1 && (
                <span className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md">
                  🔒 Limit 1
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-semibold text-[#0758fc]">{formatPrice(tier.price)}</p>
            {tier.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tier.description}</p>
            )}
            {status.isUpcoming && (
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                <Lock size={12} /> {status.text}
              </p>
            )}
            {status.isSoldOut && <p className="text-xs font-bold text-rose-600 mt-1">Sold out</p>}
            {status.canBook && available < 20 && (
              <p className="text-xs font-bold text-amber-600 mt-1">Only {available} left</p>
            )}
          </div>

          {status.canBook && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setQty(tier.id, qty - 1)}
                disabled={qty === 0}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-800 disabled:opacity-40 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center text-xs font-bold text-gray-900">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(tier.id, qty + 1)}
                disabled={qty >= Math.min(available, maxAllowed)}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-800 disabled:opacity-40 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const total = publicTiers.reduce((sum, tier) => {
    const qty = quantities[tier.id] ?? 0;
    return sum + qty * parseFloat(tier.price);
  }, 0);

  const totalTickets = Object.values(quantities).reduce((s, q) => s + q, 0);
  const minPrice = getMinPrice(tiers);

  function setQty(tierId: string, val: number) {
    const tier = publicTiers.find((t) => t.id === tierId)!;
    const available = tier.capacity - tier.sold_count - tier.reserved_count;
    const maxLimit = (tier as any).max_per_order ? Number((tier as any).max_per_order) : (tier.maximum_quantity || 10);
    const clamped = Math.max(0, Math.min(val, available, maxLimit));
    setQuantities((q) => ({ ...q, [tierId]: clamped }));
  }

  async function handleReserve() {
    if (!totalTickets) return;
    setLoading(true);

    const selectedTiers = publicTiers
      .filter((t) => (quantities[t.id] ?? 0) > 0)
      .map((t) => ({ tierId: t.id, quantity: quantities[t.id] }));

    const params = new URLSearchParams({
      eventId: event.id,
      tiers: JSON.stringify(selectedTiers),
    });

    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6"
      aria-label="Reserve tickets"
    >
      {/* Price display */}
      <div className="space-y-0.5">
        <span className="text-3xl font-black text-gray-900">{minPrice}</span>
        {parseFloat(tiers[0]?.price ?? "0") > 0 && (
          <span className="text-xs text-gray-500 font-medium"> / ticket</span>
        )}
      </div>

      {/* Registration close indicator */}
      {event.registration_close_at && isRegistrationOpen && (
        <div className="flex items-center gap-2 text-xs text-amber-700 font-bold bg-amber-50 p-3 rounded-2xl border border-amber-200">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <span>Closes {new Date(event.registration_close_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        </div>
      )}

      {/* Tier selection */}
      {isRegistrationOpen && publicTiers.length > 0 && (
        <div className="space-y-3">
          {/* 1. Early Bird Tiers */}
          {earlyBirdTiers.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black text-[#0758fc] uppercase tracking-wider block">
                Early Bird Release
              </span>
              {earlyBirdTiers.map(renderTierCard)}
            </div>
          )}

          {/* 2. Dropdown for General Release Passes */}
          {generalTiers.length > 0 && earlyBirdTiers.length > 0 && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
              <button
                type="button"
                onClick={() => setShowGeneralDropdown(!showGeneralDropdown)}
                className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <span className="text-xs font-bold text-gray-900">
                  General Release {isEarlyBirdAvailable ? "(Unlocks after Early Bird)" : "(Active)"}
                </span>
                <span className="text-xs font-bold text-[#0758fc] flex items-center gap-1">
                  {showGeneralDropdown ? (
                    <>Hide <ChevronUp size={14} /></>
                  ) : (
                    <>View <ChevronDown size={14} /></>
                  )}
                </span>
              </button>

              {showGeneralDropdown && (
                <div className="p-3 border-t border-gray-200 space-y-2 bg-white">
                  {generalTiers.map(renderTierCard)}
                </div>
              )}
            </div>
          )}

          {/* 3. If NO Early Bird exists, render General Tiers normally */}
          {generalTiers.length > 0 && earlyBirdTiers.length === 0 && (
            <div className="space-y-2">
              {generalTiers.map(renderTierCard)}
            </div>
          )}

          {/* 4. VIP & Other Tiers */}
          {otherTiers.length > 0 && (
            <div className="space-y-2 pt-1">
              {earlyBirdTiers.length > 0 && (
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">
                  Special &amp; VIP Passes
                </span>
              )}
              {otherTiers.map(renderTierCard)}
            </div>
          )}
        </div>
      )}

      {/* Total */}
      {totalTickets > 0 && total > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 border-t border-gray-200 pt-4">
          <span>{totalTickets} ticket{totalTickets > 1 ? "s" : ""}</span>
          <span className="text-gray-900 font-extrabold text-sm">₹{total.toLocaleString("en-IN")}</span>
        </div>
      )}

      {/* CTA */}
      {isRegistrationOpen ? (
        <button
          onClick={handleReserve}
          disabled={totalTickets === 0 || loading || !hasAnyBookableTier}
          className="w-full bg-[#0758fc] hover:bg-[#054fe0] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
        >
          {loading
            ? "Processing…"
            : !hasAnyBookableTier
            ? "Passes Locked Until Release Time"
            : totalTickets === 0
            ? "Select Tickets Above"
            : "Book Passes Now"}
        </button>
      ) : isClosed ? (
        <div className="text-center py-2">
          <p className="text-xs font-bold text-gray-500">Registration is closed</p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium py-2">
          <AlertCircle size={15} />
          Registration not yet open
        </div>
      )}
    </div>
  );
}
