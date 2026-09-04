"use client";

/**
 * Dynamic UPI QR & 1-Click UPI App Checkout Modal
 * Architecture:
 * 1. Multi-Tier & Multi-Attendee pass selection.
 * 2. Real-time Dynamic UPI QR code generation with exact amount and reference notes.
 * 3. 1-Click "Pay with UPI App" button (opens GPay, PhonePe, Paytm, BHIM on mobile).
 * 4. Attendee UTR / UPI Transaction Reference submission.
 * 5. Instant dispatch to Organizer & Admin Verification Queue.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  X,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  QrCode,
  Copy,
  Check,
  Smartphone,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  Trash2,
  Building,
  User,
  Briefcase,
  Award,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { calculateOrderFees } from "@/lib/services/feeCalculator";
import {
  createCheckoutOrderAction,
  getEventCustomQuestionsAction,
  getEventTiersAction,
  validateTicketTiersAvailabilityAction,
  reserveTicketHoldAction,
  releaseUserHoldAction,
} from "@/app/actions/orderActions";
import { compressImageFile } from "@/lib/utils/imageCompressor";
import { getDistrictClubsWithZones, getClubZone } from "@/lib/utils/zoneResolver";
import { useServerSyncedTime } from "@/lib/utils/useServerSyncedTime";
import { SearchableClubSelect } from "@/components/ui/SearchableClubSelect";
import { SlideToPayButton } from "./SlideToPayButton";
import { PaymentConfirmationAnimation } from "./PaymentConfirmationAnimation";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";
import Link from "next/link";
import Image from "next/image";

const DISTRICT_CLUBS = getDistrictClubsWithZones();

interface CheckoutModalProps {
  event: SaasEvent;
  tiers: SaasTicketTier[];
  isOpen: boolean;
  onClose: () => void;
  onTiersUpdate?: (tiers: SaasTicketTier[]) => void;
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

export function formatSecondsToTimer(totalSecs: number | null | undefined): string {
  if (totalSecs === null || totalSecs === undefined) return "05:00";
  const s = Math.max(0, totalSecs);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getTierScheduleStatus(
  tier: SaasTicketTier,
  currentTime: Date = new Date(),
  userSelectedCount: number = 0
): TierStatusInfo {
  const cap = Number(tier.total_capacity) || 9999;
  const sold = Number(tier.sold_count) || 0;
  const reserved = Number(tier.reserved_count) || 0;

  // Total unheld seats remaining in general (locked passes are immediately deducted from the count)
  const remaining = Math.max(0, cap - (sold + reserved));

  // Seats available for this active user session (accounting for tickets already held in user's current session)
  const othersReserved = Math.max(0, reserved - userSelectedCount);
  const remainingForUser = Math.max(0, cap - (sold + othersReserved));

  if (remainingForUser <= 0) {
    if (sold < cap) {
      return {
        state: "SOLD_OUT",
        badgeText: "In Checkout",
        badgeClass: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
        detailText: "Remaining passes currently locked in checkout",
        canBook: false,
      };
    }
    return {
      state: "SOLD_OUT",
      badgeText: "Sold Out",
      badgeClass: "bg-gray-100 dark:bg-gray-700 text-gray-500",
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
        badgeClass: "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold",
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

export function CheckoutModal({
  event,
  tiers,
  isOpen,
  onClose,
  onTiersUpdate,
  userEmail,
  userName,
  initialServerTime,
}: CheckoutModalProps) {
  // Tamper-proof, server-synchronized monotonic time
  const currentTime = useServerSyncedTime(initialServerTime);
  const [checkoutStep, setCheckoutStep] = useState<"SELECT_PASSES" | "UPI_PAYMENT" | "SUCCESS">("SELECT_PASSES");

  // Dynamic current tiers state synced with PostgreSQL reserved_count
  const [currentTiers, setCurrentTiers] = useState<SaasTicketTier[]>(tiers);

  useEffect(() => {
    setCurrentTiers(tiers);
  }, [tiers]);

  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const firstBookable = tiers.find((t) => getTierScheduleStatus(t).canBook);
    if (firstBookable) {
      initial[firstBookable.id] = 1;
    }
    return initial;
  });

  // Clamp any pre-selected quantities to tier max_per_order limits
  useEffect(() => {
    if (isOpen) {
      setSelectedCounts((prev) => {
        let changed = false;
        const updated = { ...prev };
        currentTiers.forEach((t) => {
          const max = t.max_per_order ? Number(t.max_per_order) : 10;
          if (updated[t.id] && updated[t.id] > max) {
            updated[t.id] = max;
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [isOpen, currentTiers]);

  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const [currentUrl, setCurrentUrl] = useState("/events");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // Tier Staggering & Categorization (Early Bird -> General Release Dropdown -> VIP)
  const earlyBirdTiers = currentTiers.filter((t) => /early/i.test(t.name) || t.tier_type === "EARLY_BIRD");
  const generalTiers = currentTiers.filter(
    (t) =>
      (/(general|normal|standard|regular)/i.test(t.name) || t.tier_type === "REGULAR") &&
      !/early/i.test(t.name) &&
      t.tier_type !== "EARLY_BIRD"
  );
  const otherTiers = currentTiers.filter(
    (t) =>
      !/early/i.test(t.name) &&
      t.tier_type !== "EARLY_BIRD" &&
      !/(general|normal|standard|regular)/i.test(t.name) &&
      t.tier_type !== "REGULAR"
  );

  const isEarlyBirdAvailable =
    earlyBirdTiers.length > 0 &&
    earlyBirdTiers.some((t) => getTierScheduleStatus(t, currentTime).canBook);

  const hasAnyBookableTier = currentTiers.some((t) => getTierScheduleStatus(t, currentTime).canBook);

  const earliestUpcoming = currentTiers
    .map((t) => ({ tier: t, status: getTierScheduleStatus(t, currentTime) }))
    .filter((x) => x.status.state === "UPCOMING" && x.status.releaseDate)
    .sort((a, b) => (a.status.releaseDate!.getTime() - b.status.releaseDate!.getTime()))[0];

  const [showGeneralDropdown, setShowGeneralDropdown] = useState(!isEarlyBirdAvailable);

  // Custom questions state
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && event?.id) {
      getEventCustomQuestionsAction(event.id).then((res) => {
        if (res.success && res.questions) {
          setCustomQuestions(res.questions);
        }
      });
    }
  }, [isOpen, event?.id]);

  // Attendees list - only initialize with a bookable tier
  const [attendees, setAttendees] = useState<
    Array<{
      tierId: string;
      name: string;
      email: string;
      phone: string;
      memberType: "Rotaract" | "Rotary" | "Non-Rotaract";
      clubName: string;
      customClubName: string;
      designation: string;
      zone: string;
      customAnswers?: Record<string, any>;
    }>
  >(() => {
    const firstBookable = tiers.find((t) => getTierScheduleStatus(t).canBook);
    if (firstBookable) {
      return [
        {
          tierId: firstBookable.id,
          name: "",
          email: "",
          phone: "",
          memberType: "Rotaract",
          clubName: "",
          customClubName: "",
          designation: "",
          zone: "",
          customAnswers: {},
        },
      ];
    }
    return [];
  });

  // UPI Payment State
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>("");
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    isFree: boolean;
    status: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 5-Minute Reservation Hold State (Ticket Lock-In)
  const [holdSessionId, setHoldSessionId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number | null>(null);
  const [isHoldExpired, setIsHoldExpired] = useState(false);
  const [isRenewingHold, setIsRenewingHold] = useState(false);

  // Stable client session identifier per modal open instance
  const checkoutSessionIdRef = useRef<string>(`chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const debounceHoldTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkoutSessionIdRef.current = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setHoldSessionId(checkoutSessionIdRef.current);
    } else {
      if (debounceHoldTimerRef.current) {
        clearTimeout(debounceHoldTimerRef.current);
        debounceHoldTimerRef.current = null;
      }
    }
  }, [isOpen]);

  // Live 5-Minute (300-Second) Hold Timer - Runs on BOTH Ticket Booking screen and Payment screen
  useEffect(() => {
    if (!holdExpiresAt || completedOrder) {
      return;
    }

    const updateTimer = () => {
      const diffMs = holdExpiresAt.getTime() - Date.now();
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setHoldSecondsRemaining(secs);
      if (secs <= 0) {
        setIsHoldExpired(true);
      } else {
        setIsHoldExpired(false);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt, completedOrder]);

  // Sync inventory in real-time every 3 seconds while checkout is open
  useEffect(() => {
    if (!isOpen || completedOrder) return;
    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await getEventTiersAction(event.id);
        if (isMounted && res.success && res.tiers && res.tiers.length > 0) {
          setCurrentTiers(res.tiers);
          onTiersUpdate?.(res.tiers);
        }
      } catch (_) {}
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isOpen, event.id, completedOrder, onTiersUpdate]);

  // Hold session ref to safely manage cleanup without React strict-mode false unmounts
  const holdSessionIdRef = useRef<string | null>(null);
  const completedOrderRef = useRef<any>(null);

  useEffect(() => {
    holdSessionIdRef.current = holdSessionId;
  }, [holdSessionId]);

  useEffect(() => {
    completedOrderRef.current = completedOrder;
  }, [completedOrder]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const sid = checkoutSessionIdRef.current || holdSessionIdRef.current;
      if (sid && !completedOrderRef.current) {
        releaseUserHoldAction(sid).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const sid = checkoutSessionIdRef.current || holdSessionIdRef.current;
      if (sid && !completedOrderRef.current) {
        releaseUserHoldAction(sid).catch(() => {});
      }
    };
  }, []);

  function handleCloseModal() {
    if (debounceHoldTimerRef.current) {
      clearTimeout(debounceHoldTimerRef.current);
      debounceHoldTimerRef.current = null;
    }
    const sid = checkoutSessionIdRef.current || holdSessionId;
    if (sid && !completedOrder) {
      setHoldSessionId(null);
      setHoldExpiresAt(null);
      setHoldSecondsRemaining(null);
      setIsHoldExpired(false);
      releaseUserHoldAction(sid)
        .then(() => getEventTiersAction(event.id))
        .then((res) => {
          if (res.success && res.tiers) {
            setCurrentTiers(res.tiers);
            onTiersUpdate?.(res.tiers);
          }
        })
        .catch(() => {});
    }
    onClose();
  }

  // Calculate totals
  let subtotal = 0;
  let totalTicketCount = 0;
  currentTiers.forEach((t) => {
    const count = selectedCounts[t.id] || 0;
    subtotal += Number(t.price) * count;
    totalTicketCount += count;
  });

  const discountAmount = couponApplied ? (subtotal * discountPercent) / 100 : 0;
  const fees = calculateOrderFees({
    subtotal,
    couponDiscountAmount: discountAmount,
  });

  const isFreeOrder = fees.totalPayable === 0;

  // Robust ticket hold synchronization function
  const syncTicketHold = useCallback(
    async (countsToReserve: Record<string, number>) => {
      if (!userEmail || completedOrder || isFreeOrder) return;
      const countSum = Object.values(countsToReserve).reduce((a, b) => a + b, 0);
      const activeSessionId = checkoutSessionIdRef.current;

      if (countSum === 0) {
        if (activeSessionId) {
          await releaseUserHoldAction(activeSessionId);
          const tierRes = await getEventTiersAction(event.id);
          if (tierRes.success && tierRes.tiers) {
            setCurrentTiers(tierRes.tiers);
            onTiersUpdate?.(tierRes.tiers);
          }
        }
        return;
      }

      try {
        const res = await reserveTicketHoldAction({
          eventId: event.id,
          selectedCounts: countsToReserve,
          holdDurationSeconds: 300,
          sessionId: activeSessionId,
          existingSessionId: activeSessionId,
        });

        if (res.success && res.holdSessionId) {
          setHoldSessionId(res.holdSessionId);
          if (res.expiresAt) setHoldExpiresAt(new Date(res.expiresAt));
          if (res.remainingSeconds !== undefined) setHoldSecondsRemaining(res.remainingSeconds);
          setIsHoldExpired(false);
          const tierRes = await getEventTiersAction(event.id);
          if (tierRes.success && tierRes.tiers) {
            setCurrentTiers(tierRes.tiers);
            onTiersUpdate?.(tierRes.tiers);
          }
        } else if (res.error) {
          setErrorMessage(res.error);
        }
      } catch (err: any) {
        console.error("Hold reservation sync error:", err);
      }
    },
    [event.id, userEmail, completedOrder, isFreeOrder, onTiersUpdate]
  );

  async function handleRenewHold() {
    setIsRenewingHold(true);
    setErrorMessage(null);
    try {
      const sid = checkoutSessionIdRef.current || holdSessionId;
      const res = await reserveTicketHoldAction({
        eventId: event.id,
        selectedCounts,
        holdDurationSeconds: 300,
        sessionId: sid || undefined,
        existingSessionId: sid || undefined,
      });

      if (!res.success || !res.holdSessionId) {
        setErrorMessage(
          res.error ||
            "Unable to renew hold: all tickets have been taken by another attendee."
        );
        setIsRenewingHold(false);
        return;
      }

      setHoldSessionId(res.holdSessionId);
      setHoldExpiresAt(new Date(res.expiresAt!));
      setHoldSecondsRemaining(res.remainingSeconds ?? 300);
      setIsHoldExpired(false);
      const tierRes = await getEventTiersAction(event.id);
      if (tierRes.success && tierRes.tiers) {
        setCurrentTiers(tierRes.tiers);
        onTiersUpdate?.(tierRes.tiers);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to renew ticket reservation.");
    } finally {
      setIsRenewingHold(false);
    }
  }

  // Automatically acquire 300-second (5-minute) hold once when ticket booking screen opens
  useEffect(() => {
    if (!isOpen || !userEmail || completedOrder || isFreeOrder) {
      return;
    }
    const initialSum = Object.values(selectedCounts).reduce((a, b) => a + b, 0);
    if (initialSum > 0) {
      syncTicketHold(selectedCounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userEmail, completedOrder, isFreeOrder]);

  // Resolve target Organizer UPI ID & Payee Name
  const targetUpiId = (event as any).upi_id || "rotaractdistrict3192@okaxis";
  const targetPayeeName = (event as any).upi_payee_name || "District 3192 Rotaract";

  // Dynamic UPI URI Format: upi://pay?pa={upi_id}&pn={name}&am={amount}&tn={note}&cu=INR
  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(targetUpiId)}&pn=${encodeURIComponent(
    targetPayeeName
  )}&am=${fees.totalPayable.toFixed(2)}&tn=${encodeURIComponent(`Passes for ${event.title.slice(0, 30)}`)}&cu=INR`;

  // Generate dynamic QR code whenever payment amount is calculated
  useEffect(() => {
    if (isOpen && isFreeOrder) {
      setUpiQrDataUrl("");
      return;
    }

    if (isOpen && upiPaymentUri) {
      QRCode.toDataURL(upiPaymentUri, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setUpiQrDataUrl(url))
        .catch((err) => console.error("Error generating UPI QR:", err));
    }
  }, [fees.totalPayable, upiPaymentUri, isOpen, isFreeOrder]);

  if (!isOpen) return null;

  function handleCountChange(tierId: string, delta: number) {
    const targetTier = currentTiers.find((t) => t.id === tierId);
    if (!targetTier) return;

    const current = selectedCounts[tierId] || 0;
    const status = getTierScheduleStatus(targetTier, currentTime, current);
    if (delta > 0 && !status.canBook) {
      setErrorMessage(`"${targetTier.name}" is locked. ${status.detailText}`);
      return;
    }

    const cap = Number(targetTier.total_capacity) || 9999;
    const sold = Number(targetTier.sold_count) || 0;
    const reserved = Number(targetTier.reserved_count) || 0;
    const othersReserved = Math.max(0, reserved - current);
    const maxAvailableForUser = Math.max(0, cap - (sold + othersReserved));
    const tierMax = targetTier.max_per_order ? Number(targetTier.max_per_order) : 10;
    const maxAllowed = Math.min(tierMax, maxAvailableForUser);

    if (delta > 0 && current >= maxAllowed) {
      if (current >= maxAvailableForUser && maxAvailableForUser < tierMax) {
        setErrorMessage(`No more seats available for "${targetTier.name}". Other passes are booked or locked in checkout.`);
      } else {
        setErrorMessage(
          tierMax === 1
            ? `"${targetTier.name}" is strictly limited to 1 ticket per booking.`
            : `You can only select up to ${tierMax} tickets for "${targetTier.name}".`
        );
      }
      return;
    }
    const next = Math.max(0, Math.min(maxAllowed, current + delta));
    const newCounts = { ...selectedCounts, [tierId]: next };
    setSelectedCounts(newCounts);
    setErrorMessage(null);

    // Debounce server hold reservation by 350ms to guarantee zero race conditions or stacked holds when tapping +/-
    if (!isFreeOrder && userEmail) {
      if (debounceHoldTimerRef.current) {
        clearTimeout(debounceHoldTimerRef.current);
      }
      debounceHoldTimerRef.current = setTimeout(() => {
        syncTicketHold(newCounts);
      }, 350);
    }

    // Rebuild attendee slots while preserving what user typed
    const newAttendees: Array<{
      tierId: string;
      name: string;
      email: string;
      phone: string;
      memberType: "Rotaract" | "Rotary" | "Non-Rotaract";
      clubName: string;
      customClubName: string;
      designation: string;
      zone: string;
      customAnswers?: Record<string, any>;
    }> = [];
    let prevIndex = 0;
    currentTiers.forEach((t) => {
      const count = newCounts[t.id] || 0;
      for (let i = 0; i < count; i++) {
        const existing = attendees[prevIndex];
        newAttendees.push({
          tierId: t.id,
          name: existing?.name || "",
          email: existing?.email || "",
          phone: existing?.phone || "",
          memberType: existing?.memberType || "Rotaract",
          clubName: existing?.clubName || "",
          customClubName: existing?.customClubName || "",
          designation: existing?.designation || "",
          zone: existing?.zone || "",
          customAnswers: existing?.customAnswers || {},
        });
        prevIndex++;
      }
    });
    setAttendees(
      newAttendees.length > 0
        ? newAttendees
        : [
            {
              tierId: currentTiers[0]?.id || "",
              name: "",
              email: "",
              phone: "",
              memberType: "Rotaract",
              clubName: "",
              customClubName: "",
              designation: "",
              zone: "",
              customAnswers: {},
            },
          ]
    );
  }

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    if (code === "EARLYBIRD" || code === "ROTARACT" || code === "DISTRICT3192") {
      setDiscountPercent(15);
      setCouponApplied(true);
      setCouponMessage("15% Promo Discount Applied!");
    } else if (code === "VIPFREE" || code === "COMMUNITY") {
      setDiscountPercent(100);
      setCouponApplied(true);
      setCouponMessage("100% Complimentary Pass Applied!");
    } else {
      setCouponApplied(false);
      setCouponMessage("Invalid or expired promo code");
    }
  }

  async function handleProceedToPayment() {
    if (!userEmail) {
      setErrorMessage("Please sign in to your account before purchasing tickets.");
      return;
    }

    if (totalTicketCount === 0) {
      setErrorMessage("Please select at least 1 active ticket pass.");
      return;
    }

    // Verify each selected tier is currently open & bookable
    for (const [tierId, count] of Object.entries(selectedCounts)) {
      if (count > 0) {
        const tier = tiers.find((t) => t.id === tierId);
        if (!tier) continue;
        const status = getTierScheduleStatus(tier, currentTime);
        if (!status.canBook) {
          setErrorMessage(`"${tier.name}" is locked (${status.detailText}). Please adjust your selection.`);
          return;
        }
        const maxAllowed = tier.max_per_order ? Number(tier.max_per_order) : 10;
        if (count > maxAllowed) {
          setErrorMessage(
            maxAllowed === 1
              ? `"${tier.name}" is strictly limited to 1 ticket only.`
              : `You can only select up to ${maxAllowed} tickets for "${tier.name}".`
          );
          return;
        }
      }
    }

    for (let i = 0; i < attendees.length; i++) {
      if (!attendees[i].name.trim() || !attendees[i].email.trim()) {
        setErrorMessage(`Please fill out Name and Email for Attendee #${i + 1}`);
        return;
      }
      for (const q of customQuestions) {
        if (q.is_required && !attendees[i].customAnswers?.[q.id]?.toString().trim()) {
          setErrorMessage(`Please answer "${q.question_text}" for Attendee #${i + 1}`);
          return;
        }
      }
    }

    setErrorMessage(null);
    setLoading(true);

    // Call Atomic Backend Confirmation Gate before ever showing payment QR or processing
    try {
      const serverCheck = await validateTicketTiersAvailabilityAction({
        eventId: event.id,
        selectedCounts,
      });

      if (!serverCheck.valid) {
        setLoading(false);
        setErrorMessage(
          serverCheck.error ||
            "Ticket sales are locked on the server. True atomic server time has not reached the opening window."
        );
        return;
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to confirm ticket release window with server.");
      return;
    }

    // 5-Minute Lock Reservation:
    let acquiredHoldId: string | undefined = undefined;
    if (!isFreeOrder) {
      try {
        if (debounceHoldTimerRef.current) {
          clearTimeout(debounceHoldTimerRef.current);
          debounceHoldTimerRef.current = null;
        }

        const sid = checkoutSessionIdRef.current || holdSessionId;
        const holdRes = await reserveTicketHoldAction({
          eventId: event.id,
          selectedCounts,
          holdDurationSeconds: 300, // 5-Minute Lock
          sessionId: sid || undefined,
          existingSessionId: sid || undefined,
        });

        if (!holdRes.success || !holdRes.holdSessionId) {
          setLoading(false);
          setErrorMessage(
            holdRes.error ||
              "All remaining passes for this tier are currently locked in checkout by other attendees. Please wait 5 minutes and check again."
          );
          return;
        }

        acquiredHoldId = holdRes.holdSessionId;
        setHoldSessionId(holdRes.holdSessionId);
        setHoldExpiresAt(new Date(holdRes.expiresAt!));
        setHoldSecondsRemaining(holdRes.remainingSeconds ?? 300);
        setIsHoldExpired(false);
        const tierRes = await getEventTiersAction(event.id);
        if (tierRes.success && tierRes.tiers) {
          setCurrentTiers(tierRes.tiers);
          onTiersUpdate?.(tierRes.tiers);
        }
      } catch (err: any) {
        setLoading(false);
        setErrorMessage(err?.message || "Failed to secure ticket reservation hold.");
        return;
      }
    }

    setLoading(false);

    if (isFreeOrder) {
      // If free, submit immediately
      handleSubmitOrder("", acquiredHoldId);
    } else {
      // Show Dynamic UPI QR Screen
      setCheckoutStep("UPI_PAYMENT");
    }
  }

  async function handleSubmitOrder(utrNumber: string, activeHoldId?: string) {
    if (!isFreeOrder && !paymentProofUrl && !utrNumber.trim()) {
      setErrorMessage("Please attach your payment screenshot or enter your UTR number to confirm.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const formattedAttendees = attendees.map((a) => {
      const finalClub =
        a.memberType === "Non-Rotaract"
          ? (a.clubName?.trim() || "Guest / Non-Rotaractor")
          : a.memberType === "Rotary"
          ? a.clubName?.trim() || ""
          : a.clubName === "custom"
          ? a.customClubName?.trim() || ""
          : a.clubName?.trim() || "";
      const resolvedZone = a.zone || (finalClub ? getClubZone(finalClub) : "");
      return {
        ticketTierId: a.tierId,
        name: a.name.trim(),
        email: a.email.trim(),
        phone: a.phone.trim() || undefined,
        memberType: a.memberType,
        clubName: finalClub || undefined,
        designation: a.designation.trim() || undefined,
        zone: resolvedZone || undefined,
        customAnswers: {
          ...(a.customAnswers || {}),
          member_type: a.memberType,
          club_name: finalClub,
          designation: a.designation.trim(),
          zone: resolvedZone,
        },
      };
    });

    const targetHoldSessionId = activeHoldId || holdSessionId || checkoutSessionIdRef.current || undefined;

    const res = await createCheckoutOrderAction({
      eventId: event.id,
      attendees: formattedAttendees,
      couponCode: couponApplied ? couponCode.trim() : undefined,
      customerName: attendees[0]?.name,
      customerEmail: attendees[0]?.email,
      customerPhone: attendees[0]?.phone,
      upiTransactionId: utrNumber.trim() || undefined,
      paymentProofUrl: paymentProofUrl || undefined,
      holdSessionId: targetHoldSessionId,
    });

    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to submit order");
      return;
    }

    setHoldSessionId(null);
    setHoldExpiresAt(null);
    setHoldSecondsRemaining(null);
    setIsHoldExpired(false);

    setCompletedOrder({
      orderNumber: res.orderNumber || "RS-CONFIRMED",
      isFree: res.isFree ?? false,
      status: res.status || "PENDING_VERIFICATION",
    });
    setCheckoutStep("SUCCESS");
    getEventTiersAction(event.id)
      .then((tierRes) => {
        if (tierRes.success && tierRes.tiers) {
          setCurrentTiers(tierRes.tiers);
          onTiersUpdate?.(tierRes.tiers);
        }
      })
      .catch(() => {});
  }

  function handleCopy(text: string, type: "upi" | "amount") {
    navigator.clipboard.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in-50">
      {/* Explicit backdrop element */}
      <div
        onClick={handleCloseModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Dialog Box */}
      <div
        style={{ width: "100%", maxWidth: "640px" }}
        className="relative z-10 w-full bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 max-h-[92vh] text-gray-900 dark:text-white mx-auto"
      >
        {/* Modal Header */}
        {checkoutStep !== "SUCCESS" && (
          <div className="bg-gray-900 dark:bg-gray-950 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0 border-b border-gray-800">
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="relative w-12 h-12 shrink-0">
                <Image
                  src="/brand/logo.png"
                  alt="Rotaract District 3192 Ticketing Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#60a5fa] flex items-center gap-1.5 leading-none">
                  <QrCode size={12} /> DYNAMIC UPI CHECKOUT
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight line-clamp-1">{event.title}</h2>
                <p className="text-[11px] text-gray-400 font-medium">District 3192 Direct UPI Pass Booking</p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              {/* Single Intimidating RED Live Timer (The only timer across checkout) */}
              {userEmail && !isFreeOrder && totalTicketCount > 0 && holdSecondsRemaining !== null && (
                !isHoldExpired ? (
                  <div
                    className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black font-mono tracking-wider transition-all bg-red-950/90 text-red-400 border border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.5)] select-none animate-pulse"
                    title="5-Minute Ticket Lock-in: Complete checkout before timer reaches 0"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <Clock size={14} className="text-red-400 animate-pulse" />
                    <span className="text-red-300 font-extrabold">{formatSecondsToTimer(holdSecondsRemaining)}</span>
                    <span className="hidden sm:inline text-[9px] uppercase font-black tracking-widest text-red-300 bg-red-900/60 px-1.5 py-0.5 rounded border border-red-500/30">
                      LOCK
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isRenewingHold}
                    onClick={handleRenewHold}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black font-mono tracking-tight bg-red-950 text-red-200 border border-red-600 shadow-[0_0_14px_rgba(239,68,68,0.6)] cursor-pointer hover:bg-red-900 transition-all active:scale-95 disabled:opacity-60"
                    title="5-Minute Hold Expired. Click to re-lock your tickets"
                  >
                    {isRenewingHold ? <Loader2 size={12} className="animate-spin text-red-300" /> : <RefreshCw size={12} className="text-red-300" />}
                    <span className="text-red-300">00:00 EXPIRED</span>
                    <span className="text-[9px] uppercase font-extrabold bg-red-600 text-white px-1.5 py-0.5 rounded">
                      RE-LOCK
                    </span>
                  </button>
                )
              )}

              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── 1. GATED STATE: NOT LOGGED IN ─────────────────────────────── */}
        {!userEmail ? (
          <div className="p-6 sm:p-10 w-full text-center overflow-y-auto flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] dark:text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-inner shrink-0">
              <Lock size={32} />
            </div>

            <div className="w-full text-center space-y-2">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight text-center w-full block">
                Sign In to Book Passes
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center w-full max-w-md mx-auto block leading-relaxed">
                To issue your encrypted digital QR entry passes, save your tickets, and manage transfers, you must sign in to your RotaSphere account.
              </p>
            </div>

            <div className="w-full max-w-sm mx-auto flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`}
                className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
              >
                Sign In to Continue <ArrowRight size={15} />
              </Link>
              <Link
                href={`/sign-up?redirect_url=${encodeURIComponent(currentUrl)}`}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center cursor-pointer text-center"
              >
                Create Account
              </Link>
            </div>
          </div>
        ) : checkoutStep === "SUCCESS" ? (
          /* ── 2. SUCCESS CONFIRMATION STATE WITH FESTIVE ANIMATION ─────── */
          <div className="w-full flex-1 overflow-y-auto animate-in zoom-in-95 duration-300">
            <PaymentConfirmationAnimation
              orderNumber={completedOrder?.orderNumber}
              isFree={completedOrder?.isFree}
              upiTransactionId={upiTransactionId}
              eventName={event.title}
              amount={fees.totalPayable}
              onClose={onClose}
              viewTicketsHref="/tickets"
              fullScreen={false}
            />
          </div>
        ) : checkoutStep === "UPI_PAYMENT" ? (
          /* ── 3. DYNAMIC UPI QR & 1-CLICK PAY STEP ───────────────────────── */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Hold Expired Alert (Only shown if hold actually expired) */}
            {!isFreeOrder && isHoldExpired && (
              <div className="p-4 rounded-2xl border bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Reservation Expired</p>
                    <p className="text-[11px] opacity-85">Your hold expired. Re-lock seats to continue.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isRenewingHold}
                  onClick={handleRenewHold}
                  className="text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
                >
                  {isRenewingHold ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  <span>Re-lock Seats</span>
                </button>
              </div>
            )}

            {/* Price Summary Pill */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-extrabold block">Total Payable Amount</span>
                <span className="text-xl font-black text-gray-900 dark:text-white">₹{fees.totalPayable.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(fees.totalPayable.toFixed(2), "amount")}
                className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedAmount ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                {copiedAmount ? "Copied" : "Copy Amount"}
              </button>
            </div>

            {/* Mobile 1-Click UPI Payment Button */}
            <div className="space-y-2">
              <a
                href={upiPaymentUri}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
              >
                <Smartphone size={18} />
                Pay with UPI App (GPay / PhonePe / Paytm)
              </a>
              <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
                On mobile devices, this button directly launches your installed UPI app with the exact amount prefilled.
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
              <span className="flex-shrink mx-4 text-[10px] uppercase font-extrabold text-gray-400 dark:text-gray-500">
                OR SCAN DYNAMIC UPI QR
              </span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
            </div>

            {/* Dynamic UPI QR Code Box */}
            <div className="bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 rounded-3xl p-5 flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-3 rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-md">
                {upiQrDataUrl ? (
                  <img
                    src={upiQrDataUrl}
                    alt="Dynamic UPI QR Code"
                    className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {/* Payee Info */}
              <div className="w-full bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs text-center space-y-1 block">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase w-full block text-center">Organizer UPI ID (VPA)</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white w-full block text-center truncate">{targetUpiId}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 w-full block text-center truncate">Payee: {targetPayeeName}</span>
              </div>
            </div>

            {/* Step 2: Payment Confirmation (Screenshot or UTR Reference) */}
            <div className="space-y-4 p-5 bg-blue-50/60 dark:bg-gray-800/80 border border-blue-200/80 dark:border-gray-700 rounded-3xl">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-[#0758fc] dark:text-blue-400 shrink-0" />
                    Confirm Payment Proof
                  </span>
                  <span className="text-[10px] font-extrabold text-[#0758fc] dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Screenshot or UTR
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Upload your payment screenshot to confirm instantly, or enter your 12-digit UPI UTR number below.
                </p>
              </div>

              {/* Option 1: Payment Screenshot Attachment */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-gray-900 dark:text-white flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5">
                    <Camera size={15} className="text-[#0758fc] dark:text-blue-400 shrink-0" />
                    Attach Payment Screenshot Proof
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                    Instant Verification
                  </span>
                </label>

                {paymentProofUrl ? (
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-between gap-3 shadow-xs w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={paymentProofUrl} alt="Receipt Preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">Payment Screenshot Attached</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold block">✓ Ready to Confirm (UTR is optional)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentProofUrl("")}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors shrink-0 cursor-pointer"
                      title="Remove Screenshot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full border-2 border-dashed border-blue-300 dark:border-gray-700 hover:border-[#0758fc] dark:hover:border-blue-500 bg-white dark:bg-gray-900 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/40 dark:hover:bg-gray-800/60 group text-center space-y-1">
                    <Upload size={22} className="text-[#0758fc] dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white group-hover:text-[#0758fc] dark:group-hover:text-blue-400 transition-colors block w-full text-center">
                      Click to Upload Payment Receipt Screenshot
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block w-full text-center">PNG, JPG, or WebP screenshot from GPay / PhonePe / Paytm</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file);
                            setPaymentProofUrl(compressed);
                            setErrorMessage(null);
                          } catch {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setPaymentProofUrl(reader.result);
                                setErrorMessage(null);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Visual "OR" Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-200/80 dark:border-gray-700" />
                </div>
                <span className="relative bg-blue-50 dark:bg-gray-800 px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400 rounded-full">
                  OR ENTER UTR NUMBER
                </span>
              </div>

              {/* Option 2: 12-Digit UTR Reference Input (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Clock size={14} className="text-[#0758fc] dark:text-blue-400 shrink-0" />
                    12-Digit UPI Reference / UTR Number
                  </label>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {paymentProofUrl ? "Optional (Screenshot attached)" : "Optional if screenshot uploaded"}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={32}
                  placeholder="e.g. 421893821034 (Optional)"
                  value={upiTransactionId}
                  onChange={(e) => {
                    setUpiTransactionId(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/10 block"
                />
              </div>

              {/* Proof Status Badge */}
              <div className="pt-1">
                {paymentProofUrl && upiTransactionId.trim() ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Screenshot & UTR attached — ready for fast verification!</span>
                  </div>
                ) : paymentProofUrl ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Screenshot attached — UTR number is optional. Ready to confirm!</span>
                  </div>
                ) : upiTransactionId.trim() ? (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px] font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-[#0758fc] dark:text-blue-400" />
                    <span>UTR reference entered — ready to submit for verification.</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Attach your payment screenshot OR enter your UTR number to confirm.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation / Submit Slider */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutStep("SELECT_PASSES")}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Pass Selection
              </button>

              {(() => {
                const canSubmit =
                  (isFreeOrder || Boolean(paymentProofUrl || upiTransactionId.trim())) && !isHoldExpired;
                return (
                  <SlideToPayButton
                    onSuccess={() => handleSubmitOrder(upiTransactionId)}
                    label={
                      loading
                        ? "Submitting..."
                        : isHoldExpired
                        ? "Hold Expired — Please Re-lock Seats Above"
                        : !canSubmit
                        ? "Upload Screenshot or Enter UTR to Confirm"
                        : "Slide to Submit Ticket for Approval"
                    }
                    disabled={loading || !canSubmit || isHoldExpired}
                    loading={loading}
                  />
                );
              })()}
            </div>
          </div>
        ) : (
          /* ── 4. STEP 1: PASS SELECTION & ATTENDEE FORM ─────────────────── */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Hold Expired Alert (Only shown if hold actually expired) */}
            {!isFreeOrder && totalTicketCount > 0 && isHoldExpired && (
              <div className="p-4 rounded-2xl border bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Reservation Expired</p>
                    <p className="text-[11px] opacity-85">Click re-lock to hold your tickets again.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isRenewingHold}
                  onClick={handleRenewHold}
                  className="text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
                >
                  {isRenewingHold ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  <span>Re-lock Passes</span>
                </button>
              </div>
            )}

            {/* Locked Notice if all passes are upcoming */}
            {!hasAnyBookableTier && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-xs">
                <Lock size={16} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-950 dark:text-amber-100">Ticket Sales Not Yet Open</p>
                  <p className="mt-0.5 text-[11px] text-amber-850 dark:text-amber-300">
                    {earliestUpcoming
                      ? `Pass sales will automatically unlock on ${new Date(earliestUpcoming.tier.sales_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${new Date(earliestUpcoming.tier.sales_start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })} (${formatCountdown(earliestUpcoming.status.diffMs || 0)}). Please wait for the release timer.`
                      : "Ticket booking is currently locked."}
                  </p>
                </div>
              </div>
            )}

            {/* Tiers List */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">
                Select Entry Passes &amp; Time Slabs
              </span>
              <div className="space-y-3">
                {/* 1. Early Bird Tiers */}
                {earlyBirdTiers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full inline-block">
                      🔥 Early Bird Release
                    </span>
                    <div className="space-y-2">
                      {earlyBirdTiers.map((tier) => {
                        const count = selectedCounts[tier.id] || 0;
                        const status = getTierScheduleStatus(tier, currentTime, count);
                        const cap = Number(tier.total_capacity) || 9999;
                        const sold = Number(tier.sold_count) || 0;
                        const reserved = Number(tier.reserved_count) || 0;
                        const othersReserved = Math.max(0, reserved - count);
                        const maxAvailableForUser = Math.max(0, cap - (sold + othersReserved));
                        const tierMax = tier.max_per_order ? Number(tier.max_per_order) : 10;
                        const maxAllowed = Math.min(tierMax, maxAvailableForUser);
                        return (
                          <div
                            key={tier.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                              count > 0
                                ? "border-[#0758fc] bg-blue-50/20 dark:bg-blue-950/40 shadow-xs"
                                : !status.canBook
                                ? "border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 opacity-75"
                                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80"
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{tier.name}</h4>
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                                  {status.badgeText}
                                </span>
                                {Number(tier.max_per_order) === 1 && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    🔒 Limit 1
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{status.detailText}</p>
                              <p className="text-sm font-black text-[#0758fc] dark:text-blue-400">
                                {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900/80 p-1 rounded-xl shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, -1)}
                                disabled={count === 0}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                -
                              </button>
                              <span className="text-xs font-extrabold text-gray-900 dark:text-white w-4 text-center">{count}</span>
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, 1)}
                                disabled={!status.canBook || count >= maxAllowed}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Dropdown under Early Bird for General Release Passes */}
                {generalTiers.length > 0 && earlyBirdTiers.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/40">
                    <button
                      type="button"
                      onClick={() => setShowGeneralDropdown(!showGeneralDropdown)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-gray-100/70 dark:hover:bg-gray-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">General Release Passes</span>
                        {isEarlyBirdAvailable ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Unlocks after Early Bird
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Now Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-[#0758fc] dark:text-blue-400 flex items-center gap-1">
                        {showGeneralDropdown ? (
                          <>Hide General Tickets <ChevronUp size={14} /></>
                        ) : (
                          <>View General Tickets <ChevronDown size={14} /></>
                        )}
                      </span>
                    </button>

                    {showGeneralDropdown && (
                      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-white dark:bg-gray-900">
                        {generalTiers.map((tier) => {
                          const count = selectedCounts[tier.id] || 0;
                          const status = getTierScheduleStatus(tier, currentTime, count);
                          const cap = Number(tier.total_capacity) || 9999;
                          const sold = Number(tier.sold_count) || 0;
                          const reserved = Number(tier.reserved_count) || 0;
                          const othersReserved = Math.max(0, reserved - count);
                          const maxAvailableForUser = Math.max(0, cap - (sold + othersReserved));
                          const tierMax = tier.max_per_order ? Number(tier.max_per_order) : 10;
                          const maxAllowed = Math.min(tierMax, maxAvailableForUser);
                          return (
                            <div
                              key={tier.id}
                              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                count > 0 ? "border-[#0758fc] bg-blue-50/20 dark:bg-blue-950/40 shadow-xs" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80"
                              }`}
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{tier.name}</h4>
                                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                                    {status.badgeText}
                                  </span>
                                  {Number(tier.max_per_order) === 1 && (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                      🔒 Limit 1
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{status.detailText}</p>
                                <p className="text-sm font-black text-[#0758fc] dark:text-blue-400">
                                  {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900/80 p-1 rounded-xl shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCountChange(tier.id, -1)}
                                  disabled={count === 0}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  -
                                </button>
                                <span className="text-xs font-extrabold text-gray-900 dark:text-white w-4 text-center">{count}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCountChange(tier.id, 1)}
                                  disabled={!status.canBook || count >= maxAllowed}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  +
                                </button>
                              </div>
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
                      const count = selectedCounts[tier.id] || 0;
                      const status = getTierScheduleStatus(tier, currentTime, count);
                      const cap = Number(tier.total_capacity) || 9999;
                      const sold = Number(tier.sold_count) || 0;
                      const reserved = Number(tier.reserved_count) || 0;
                      const othersReserved = Math.max(0, reserved - count);
                      const maxAvailableForUser = Math.max(0, cap - (sold + othersReserved));
                      const tierMax = tier.max_per_order ? Number(tier.max_per_order) : 10;
                      const maxAllowed = Math.min(tierMax, maxAvailableForUser);
                      return (
                        <div
                          key={tier.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                            count > 0 ? "border-[#0758fc] bg-blue-50/20 dark:bg-blue-950/40 shadow-xs" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80"
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{tier.name}</h4>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                                {status.badgeText}
                              </span>
                              {Number(tier.max_per_order) === 1 && (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                  🔒 Limit 1
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{status.detailText}</p>
                            <p className="text-sm font-black text-[#0758fc] dark:text-blue-400">
                              {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900/80 p-1 rounded-xl shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCountChange(tier.id, -1)}
                              disabled={count === 0}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              -
                            </button>
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white w-4 text-center">{count}</span>
                            <button
                              type="button"
                              onClick={() => handleCountChange(tier.id, 1)}
                              disabled={!status.canBook || count >= maxAllowed}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. VIP & Other Tiers */}
                {otherTiers.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {earlyBirdTiers.length > 0 && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-full inline-block">
                        ⭐ Special &amp; VIP Passes
                      </span>
                    )}
                    <div className="space-y-2">
                      {otherTiers.map((tier) => {
                        const count = selectedCounts[tier.id] || 0;
                        const status = getTierScheduleStatus(tier, currentTime, count);
                        const cap = Number(tier.total_capacity) || 9999;
                        const sold = Number(tier.sold_count) || 0;
                        const reserved = Number(tier.reserved_count) || 0;
                        const othersReserved = Math.max(0, reserved - count);
                        const maxAvailableForUser = Math.max(0, cap - (sold + othersReserved));
                        const tierMax = tier.max_per_order ? Number(tier.max_per_order) : 10;
                        const maxAllowed = Math.min(tierMax, maxAvailableForUser);
                        return (
                          <div
                            key={tier.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                              count > 0 ? "border-[#0758fc] bg-blue-50/20 dark:bg-blue-950/40 shadow-xs" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80"
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{tier.name}</h4>
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                                  {status.badgeText}
                                </span>
                                {Number(tier.max_per_order) === 1 && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    🔒 Limit 1
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{status.detailText}</p>
                              <p className="text-sm font-black text-[#0758fc] dark:text-blue-400">
                                {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900/80 p-1 rounded-xl shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, -1)}
                                disabled={count === 0}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                -
                              </button>
                              <span className="text-xs font-extrabold text-gray-900 dark:text-white w-4 text-center">{count}</span>
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, 1)}
                                disabled={!status.canBook || count >= maxAllowed}
                                className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendee Details Form */}
            {attendees.length > 0 && totalTicketCount > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                    Delegate Details ({attendees.length} Attendee{attendees.length > 1 ? "s" : ""})
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    Badges &amp; entry passes will be issued with these details
                  </span>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {attendees.map((att, idx) => {
                    const matchedTier = tiers.find((t) => t.id === att.tierId);
                    return (
                      <div key={idx} className="p-4 sm:p-5 bg-gray-50/90 dark:bg-gray-800/80 rounded-3xl border border-gray-200 dark:border-gray-700/80 space-y-4 shadow-xs">
                        {/* Card Header */}
                        <div className="flex items-center justify-between border-b border-gray-200/70 dark:border-gray-700/70 pb-2.5">
                          <span className="text-xs font-black uppercase text-[#0758fc] dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                            <User size={14} /> Attendee #{idx + 1}
                          </span>
                          {matchedTier && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0758fc] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              {matchedTier.name} ({Number(matchedTier.price) === 0 ? "FREE" : `₹${matchedTier.price}`})
                            </span>
                          )}
                        </div>

                        {/* 1. Delegate Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Full Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="Full Name *"
                              value={att.name}
                              onChange={(e) => {
                                const updated = [...attendees];
                                updated[idx].name = e.target.value;
                                setAttendees(updated);
                              }}
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Email Address *</label>
                            <input
                              type="email"
                              required
                              placeholder="Email Address *"
                              value={att.email}
                              onChange={(e) => {
                                const updated = [...attendees];
                                updated[idx].email = e.target.value;
                                setAttendees(updated);
                              }}
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
                            />
                          </div>
                        </div>

                        {/* 2. Phone Number */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Phone Number (Optional)</label>
                          <input
                            type="tel"
                            placeholder="e.g. +91 98765 43210"
                            value={att.phone}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[idx].phone = e.target.value;
                              setAttendees(updated);
                            }}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
                          />
                        </div>

                        {/* 3. Rotary Affiliation */}
                        {(() => {
                          const selectedTier = tiers.find((t) => t.id === att.tierId);
                          const isNonRotaractAllowed =
                            event.allow_non_rotaract !== false &&
                            selectedTier?.allow_non_rotaract !== false &&
                            selectedTier?.allowed_audience !== "ROTARACT_ONLY";

                          return (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                  Affiliation Category *
                                </label>
                                {!isNonRotaractAllowed && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                                    🛡️ Rotaract &amp; Rotary Exclusive
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {(["Rotaract", "Rotary", "Non-Rotaract"] as const).map((type) => {
                                  const isSelected = (att.memberType || "Rotaract") === type;
                                  const isDisabled = type === "Non-Rotaract" && !isNonRotaractAllowed;

                                  return (
                                    <button
                                      key={type}
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() => {
                                        if (isDisabled) return;
                                        const updated = [...attendees];
                                        updated[idx].memberType = type;
                                        if (type === "Non-Rotaract") {
                                          updated[idx].clubName = "Non-Rotaract Guest";
                                          updated[idx].zone = "General / Guest";
                                        } else if (type === "Rotary") {
                                          updated[idx].clubName = "";
                                          updated[idx].zone = "Rotary International";
                                        } else {
                                          updated[idx].clubName = "";
                                          updated[idx].zone = "";
                                        }
                                        setAttendees(updated);
                                      }}
                                      title={isDisabled ? "This event / ticket is restricted to Rotaract & Rotary members" : undefined}
                                      className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all border text-center active:scale-95 ${
                                        isDisabled
                                          ? "opacity-40 bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                          : isSelected
                                          ? "bg-[#0758fc] text-white border-[#0758fc] shadow-xs cursor-pointer"
                                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100/80 dark:hover:bg-gray-800 cursor-pointer"
                                      }`}
                                    >
                                      {type === "Rotaract"
                                        ? "● Rotaract"
                                        : type === "Rotary"
                                        ? "● Rotary"
                                        : "● Non-Rotarian"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 4. Club Name & Zone Resolution */}
                        <div className="space-y-2 p-3 bg-white dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                          {att.memberType === "Rotary" ? (
                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Building size={13} className="text-[#0758fc] dark:text-blue-400" /> Rotary Club Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Rotary Club of Bangalore Central, RC Yelahanka..."
                                value={att.clubName}
                                onChange={(e) => {
                                  const updated = [...attendees];
                                  updated[idx].clubName = e.target.value;
                                  setAttendees(updated);
                                }}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900"
                              />
                            </div>
                          ) : att.memberType === "Non-Rotaract" ? (
                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Building size={13} className="text-[#0758fc] dark:text-blue-400" /> Organization / College / Company (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. University Name, Corporate, Guest of Rtr. X..."
                                value={att.clubName === "Non-Rotaract Guest" ? "" : att.clubName}
                                onChange={(e) => {
                                  const updated = [...attendees];
                                  updated[idx].clubName = e.target.value || "Non-Rotaract Guest";
                                  setAttendees(updated);
                                }}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                  <Building size={13} className="text-[#0758fc] dark:text-blue-400" /> Rotaract Club
                                </label>
                                {att.zone && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                    Zone: {att.zone}
                                  </span>
                                )}
                              </div>

                              <SearchableClubSelect
                                value={att.clubName}
                                customValue={att.customClubName}
                                zone={att.zone}
                                onChange={(clubName, clubZone, isCustom) => {
                                  const updated = [...attendees];
                                  updated[idx].clubName = clubName;
                                  updated[idx].zone = clubZone;
                                  if (!isCustom && clubName !== "custom") {
                                    updated[idx].customClubName = "";
                                  }
                                  setAttendees(updated);
                                }}
                                onCustomChange={(customVal) => {
                                  const updated = [...attendees];
                                  updated[idx].customClubName = customVal;
                                  setAttendees(updated);
                                }}
                                placeholder="Type to search District 3192 clubs (e.g. Koramangala, Bangalore)..."
                              />
                            </div>
                          )}
                        </div>

                        {/* 5. Designation / Role */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Briefcase size={13} className="text-[#0758fc] dark:text-blue-400" /> Designation / Role
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Free text input</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. President, Sergeant-at-Arms, DRR, Secretary, Member..."
                            value={att.designation}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[idx].designation = e.target.value;
                              setAttendees(updated);
                            }}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/10"
                          />
                        </div>

                        {/* 6. Event Custom Registration Questions */}
                        {customQuestions.length > 0 && (
                          <div className="pt-3 border-t border-gray-200/60 dark:border-gray-700/60 space-y-2.5">
                            <span className="text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-wider block">
                              Additional Event Questions
                            </span>
                            {customQuestions.map((q) => (
                              <div key={q.id} className="space-y-1 text-left">
                                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                  {q.question_text} {q.is_required && <span className="text-rose-500">*</span>}
                                </label>
                                {q.question_type === "dropdown" ? (
                                  <select
                                    value={att.customAnswers?.[q.id] || ""}
                                    onChange={(e) => {
                                      const updated = [...attendees];
                                      updated[idx].customAnswers = { ...(updated[idx].customAnswers || {}), [q.id]: e.target.value };
                                      setAttendees(updated);
                                    }}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                                  >
                                    <option value="">Select an option...</option>
                                    {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => (
                                      <option key={optIdx} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder={q.question_text}
                                    value={att.customAnswers?.[q.id] || ""}
                                    onChange={(e) => {
                                      const updated = [...attendees];
                                      updated[idx].customAnswers = { ...(updated[idx].customAnswers || {}), [q.id]: e.target.value };
                                      setAttendees(updated);
                                    }}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc]"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({totalTicketCount} ticket{totalTicketCount > 1 ? "s" : ""})</span>
                <span className="font-semibold text-gray-900 dark:text-gray-200">₹{fees.subtotal.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Promo Discount ({discountPercent}%)</span>
                  <span>-₹{fees.discount.toFixed(2)}</span>
                </div>
              )}
              {fees.convenienceFee > 0 && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Platform &amp; Booking Fee</span>
                  <span className="font-medium">+₹{fees.convenienceFee.toFixed(2)}</span>
                </div>
              )}
              {fees.tax > 0 && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>GST (18% on booking fee)</span>
                  <span className="font-medium">+₹{fees.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm font-black text-gray-900 dark:text-white">
                <span>Total Payable</span>
                <span className="text-[#0758fc] dark:text-blue-400">₹{fees.totalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={loading || totalTicketCount === 0 || !hasAnyBookableTier || isRenewingHold}
                onClick={() => {
                  if (isHoldExpired) {
                    handleRenewHold();
                  } else {
                    handleProceedToPayment();
                  }
                }}
                className={`w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm py-4 px-6 rounded-2xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                  isHoldExpired
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                    : "bg-[#0758fc] hover:bg-[#054fe0] shadow-[#0758fc]/25"
                }`}
              >
                {loading || isRenewingHold ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : !hasAnyBookableTier ? (
                  <>Passes Locked Until Release Time</>
                ) : isFreeOrder ? (
                  <>Confirm Free Registration <ArrowRight size={16} /></>
                ) : isHoldExpired ? (
                  <><RefreshCw size={16} /> 5m Hold Expired — Re-lock Passes &amp; Continue</>
                ) : (
                  <>
                    Proceed to Payment {!isFreeOrder && holdSecondsRemaining !== null && `(${formatSecondsToTimer(holdSecondsRemaining)})`} • ₹{fees.totalPayable.toFixed(2)} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
