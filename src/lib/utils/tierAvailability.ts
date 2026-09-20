/**
 * Tier Availability & Sorting Utilities
 * 
 * Ensures that AVAILABLE ticket tiers/slabs ALWAYS appear at the top
 * of ticket selection lists across all client and server views.
 */

export interface TierStatusInfo {
  state: "LIVE" | "UPCOMING" | "SOLD_OUT" | "CLOSED";
  badgeText: string;
  badgeClass: string;
  detailText: string;
  canBook: boolean;
  releaseDate?: Date;
  diffMs?: number;
}

export function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return "Releases now";
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffDays > 0) {
    const remHrs = diffHrs % 24;
    return `Releases in ${diffDays}d ${remHrs}h`;
  }
  if (diffHrs > 0) {
    const remMins = diffMins % 60;
    return `Releases in ${diffHrs}h ${remMins}m`;
  }
  if (diffMins > 0) {
    const remSecs = diffSecs % 60;
    return `Releases in ${diffMins}m ${remSecs}s`;
  }
  return `Releases in ${diffSecs}s`;
}

/**
 * Computes live scheduling and capacity availability status for a ticket tier.
 */
export function getTierScheduleStatus(
  tier: {
    total_capacity?: number | string | null;
    capacity?: number | string | null;
    sold_count?: number | string | null;
    reserved_count?: number | string | null;
    sales_start?: string | Date | null;
    sales_end?: string | Date | null;
    is_bulk_slab?: boolean | null;
    bulk_slab_size?: number | null;
    [key: string]: any;
  },
  currentTime: Date = new Date(),
  userCurrentSelectedCount: number = 0
): TierStatusInfo {
  const cap = Number(tier.total_capacity ?? tier.capacity) || 9999;
  const sold = Number(tier.sold_count) || 0;
  const reserved = Number(tier.reserved_count) || 0;
  const slabSize = tier.is_bulk_slab && tier.bulk_slab_size ? Number(tier.bulk_slab_size) : 1;
  const userSelectedSeats = userCurrentSelectedCount * slabSize;
  const othersReserved = Math.max(0, reserved - userSelectedSeats);
  const remainingForUser = Math.max(0, cap - (sold + othersReserved));
  const remaining = Math.max(0, cap - (sold + reserved));

  // 1. Capacity / Hold check
  if (remainingForUser < slabSize) {
    if (cap - sold >= slabSize) {
      return {
        state: "SOLD_OUT",
        badgeText: "In Checkout",
        badgeClass: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
        detailText: tier.is_bulk_slab ? "All group passes currently locked in checkout" : "Remaining passes currently locked in checkout",
        canBook: false,
      };
    }
    return {
      state: "SOLD_OUT",
      badgeText: "Sold Out",
      badgeClass: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
      detailText: tier.is_bulk_slab ? "All group passes allocated" : "All seats allocated",
      canBook: false,
    };
  }

  // 2. Sales start check (Upcoming / locked)
  if (tier.sales_start) {
    const start = new Date(tier.sales_start);
    if (!isNaN(start.getTime()) && currentTime.getTime() < start.getTime()) {
      const diffMs = start.getTime() - currentTime.getTime();
      return {
        state: "UPCOMING",
        badgeText: `🔒 ${formatCountdown(diffMs)}`,
        badgeClass: "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold",
        detailText: `🔒 Locked: Releases on ${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`,
        canBook: false,
        releaseDate: start,
        diffMs,
      };
    }
  }

  // 3. Sales end check (Closed / expired)
  if (tier.sales_end) {
    const end = new Date(tier.sales_end);
    if (!isNaN(end.getTime()) && currentTime.getTime() > end.getTime()) {
      return {
        state: "CLOSED",
        badgeText: "Closed",
        badgeClass: "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
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
        badgeText: `🔥 Ends in ${remainingTime}`,
        badgeClass: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        detailText: `${remaining} seats left`,
        canBook: true,
      };
    }
  }

  return {
    state: "LIVE",
    badgeText: "Available",
    badgeClass: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    detailText: `${remaining} seats left`,
    canBook: true,
  };
}

/**
 * Sorts ticket tiers so that AVAILABLE slabs ALWAYS appear at the top.
 * 
 * Order:
 * 1. Available/Bookable tiers (canBook === true) FIRST, sorted by price ASC, then name ASC.
 * 2. Unavailable tiers (canBook === false):
 *    - UPCOMING (locked with countdown) first
 *    - SOLD_OUT second
 *    - CLOSED (expired) last
 *    Within each unavailable bucket, sorted by price ASC, then name ASC.
 */
export function sortTiersByAvailability<T extends { price?: number | string; name?: string }>(
  tierList: T[],
  currentTime: Date = new Date()
): T[] {
  return [...tierList].sort((a, b) => {
    // Evaluate baseline availability with count=0 to prevent jumpy layout during user input
    const statusA = getTierScheduleStatus(a, currentTime, 0);
    const statusB = getTierScheduleStatus(b, currentTime, 0);

    // 1. Available slabs always come first
    if (statusA.canBook && !statusB.canBook) return -1;
    if (!statusA.canBook && statusB.canBook) return 1;

    // 2. If both are unavailable, sort by status urgency (Upcoming -> Sold Out -> Closed)
    if (!statusA.canBook && !statusB.canBook) {
      const getPriority = (st: TierStatusInfo) => {
        if (st.state === "UPCOMING") return 1;
        if (st.state === "SOLD_OUT") return 2;
        return 3; // CLOSED
      };
      const pA = getPriority(statusA);
      const pB = getPriority(statusB);
      if (pA !== pB) return pA - pB;
    }

    // 3. Same availability status: sort by price ascending
    const priceA = Number(a.price) || 0;
    const priceB = Number(b.price) || 0;
    if (priceA !== priceB) return priceA - priceB;

    // 4. Alphabetical tie-breaker
    return (a.name || "").localeCompare(b.name || "");
  });
}
