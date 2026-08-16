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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

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
    earlyBirdTiers.some((t) => (t.capacity - t.sold_count - t.reserved_count) > 0);

  const [showGeneralDropdown, setShowGeneralDropdown] = useState(!isEarlyBirdAvailable);

  const renderTierCard = (tier: TicketTier) => {
    const available = tier.capacity - tier.sold_count - tier.reserved_count;
    const qty = quantities[tier.id] ?? 0;
    const isSoldOut = available <= 0;

    return (
      <div key={tier.id} className="border border-hairline rounded-sm p-md">
        <div className="flex items-start justify-between gap-sm">
          <div className="flex-1 min-w-0">
            <p className="text-title-md font-semibold text-ink">{tier.name}</p>
            <p className="text-body-sm text-muted">{formatPrice(tier.price)}</p>
            {tier.description && (
              <p className="text-body-sm text-muted mt-xxs line-clamp-2">{tier.description}</p>
            )}
            {available < 20 && !isSoldOut && (
              <p className="text-body-sm text-error mt-xxs">Only {available} left</p>
            )}
            {isSoldOut && <p className="text-body-sm text-error mt-xxs">Sold out</p>}
          </div>

          {!isSoldOut && (
            <div className="flex items-center gap-xs flex-shrink-0">
              <button
                onClick={() => setQty(tier.id, qty - 1)}
                disabled={qty === 0}
                className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-ink disabled:opacity-40 hover:border-border-strong transition-colors cursor-pointer"
                aria-label={`Remove one ${tier.name}`}
              >
                −
              </button>
              <span className="w-6 text-center text-body-sm font-semibold text-ink">{qty}</span>
              <button
                onClick={() => setQty(tier.id, qty + 1)}
                disabled={qty >= Math.min(available, tier.maximum_quantity)}
                className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-ink disabled:opacity-40 hover:border-border-strong transition-colors cursor-pointer"
                aria-label={`Add one ${tier.name}`}
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
    const clamped = Math.max(0, Math.min(val, available, tier.maximum_quantity));
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
      className="bg-canvas border border-hairline rounded-card p-lg"
      style={{ boxShadow: "var(--shadow-card)" }}
      aria-label="Reserve tickets"
    >
      {/* Price display */}
      <div className="mb-base">
        <span className="text-display-md font-bold text-ink">{minPrice}</span>
        {parseFloat(tiers[0]?.price ?? "0") > 0 && (
          <span className="text-body-sm text-muted"> / ticket</span>
        )}
      </div>

      {/* Registration close indicator */}
      {event.registration_close_at && isRegistrationOpen && (
        <div className="flex items-center gap-xs text-body-sm text-muted mb-base">
          <Clock size={14} strokeWidth={1.5} />
          Closes {new Date(event.registration_close_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
      )}

      {/* Tier selection */}
      {isRegistrationOpen && publicTiers.length > 0 && (
        <div className="space-y-sm mb-base">
          {/* 1. Early Bird Tiers */}
          {earlyBirdTiers.length > 0 && (
            <div className="space-y-xs">
              <span className="text-[10px] font-bold text-[#1e9df1] uppercase tracking-wider block">
                Early Bird Release
              </span>
              {earlyBirdTiers.map(renderTierCard)}
            </div>
          )}

          {/* 2. Dropdown for General Release Passes */}
          {generalTiers.length > 0 && earlyBirdTiers.length > 0 && (
            <div className="border border-hairline rounded-sm overflow-hidden bg-surface-soft">
              <button
                type="button"
                onClick={() => setShowGeneralDropdown(!showGeneralDropdown)}
                className="w-full px-md py-sm flex items-center justify-between text-left cursor-pointer hover:bg-canvas transition-colors"
              >
                <span className="text-body-sm font-semibold text-ink">
                  General Release {isEarlyBirdAvailable ? "(Unlocks after Early Bird)" : "(Active)"}
                </span>
                <span className="text-caption-sm font-semibold text-[#1e9df1] flex items-center gap-xxs">
                  {showGeneralDropdown ? (
                    <>Hide <ChevronUp size={12} /></>
                  ) : (
                    <>View <ChevronDown size={12} /></>
                  )}
                </span>
              </button>

              {showGeneralDropdown && (
                <div className="p-xs border-t border-hairline space-y-xs bg-canvas">
                  {generalTiers.map(renderTierCard)}
                </div>
              )}
            </div>
          )}

          {/* 3. If NO Early Bird exists, render General Tiers normally */}
          {generalTiers.length > 0 && earlyBirdTiers.length === 0 && (
            <div className="space-y-xs">
              {generalTiers.map(renderTierCard)}
            </div>
          )}

          {/* 4. VIP & Other Tiers */}
          {otherTiers.length > 0 && (
            <div className="space-y-xs pt-xxs">
              {earlyBirdTiers.length > 0 && (
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
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
        <div className="flex items-center justify-between text-body-sm text-muted mb-base border-t border-hairline pt-sm">
          <span>{totalTickets} ticket{totalTickets > 1 ? "s" : ""}</span>
          <span className="text-ink font-semibold">₹{total.toLocaleString("en-IN")}</span>
        </div>
      )}

      {/* CTA */}
      {isRegistrationOpen ? (
        <button
          onClick={handleReserve}
          disabled={totalTickets === 0 || loading}
          className="w-full bg-brand hover:bg-brand-active disabled:bg-brand-disabled text-on-primary font-medium text-btn-md py-sm rounded-sm transition-colors duration-150 focus-visible:outline-2"
        >
          {loading ? "Processing…" : totalTickets === 0 ? "Select tickets" : "Reserve"}
        </button>
      ) : isClosed ? (
        <div className="text-center">
          <p className="text-body-sm text-muted">Registration is closed</p>
          {event.enable_waitlist && (
            <button className="mt-sm w-full border border-ink text-ink font-medium text-btn-md py-sm rounded-sm hover:bg-surface-soft transition-colors">
              Join waitlist
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-xs text-body-sm text-muted">
          <AlertCircle size={14} strokeWidth={1.5} />
          Registration not yet open
        </div>
      )}

      <p className="text-caption-sm text-muted text-center mt-sm">
        You won&apos;t be charged yet
      </p>
    </div>
  );
}
