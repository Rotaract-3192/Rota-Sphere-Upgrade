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

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { calculateOrderFees } from "@/lib/services/feeCalculator";
import { createCheckoutOrderAction, getEventCustomQuestionsAction } from "@/app/actions/orderActions";
import { compressImageFile } from "@/lib/utils/imageCompressor";
import { getDistrictClubsWithZones, getClubZone } from "@/lib/utils/zoneResolver";
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
  userEmail?: string;
  userName?: string;
}

export function CheckoutModal({
  event,
  tiers,
  isOpen,
  onClose,
  userEmail,
  userName,
}: CheckoutModalProps) {
  const [checkoutStep, setCheckoutStep] = useState<"SELECT_PASSES" | "UPI_PAYMENT" | "SUCCESS">("SELECT_PASSES");

  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (tiers.length > 0) {
      initial[tiers[0].id] = 1;
    }
    return initial;
  });

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
  const earlyBirdTiers = tiers.filter((t) => /early/i.test(t.name));
  const generalTiers = tiers.filter((t) => /(general|normal|standard|regular)/i.test(t.name));
  const otherTiers = tiers.filter(
    (t) => !/early/i.test(t.name) && !/(general|normal|standard|regular)/i.test(t.name)
  );

  const isEarlyBirdAvailable =
    earlyBirdTiers.length > 0 &&
    earlyBirdTiers.some((t) => {
      const cap = t.total_capacity ?? 9999;
      const sold = t.sold_count ?? 0;
      return cap - sold > 0;
    });

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

  // Attendees list
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
  >([
    {
      tierId: tiers[0]?.id || "",
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
  ]);

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

  // Calculate totals
  let subtotal = 0;
  let totalTicketCount = 0;
  tiers.forEach((t) => {
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
    const current = selectedCounts[tierId] || 0;
    const next = Math.max(0, Math.min(10, current + delta));
    const newCounts = { ...selectedCounts, [tierId]: next };
    setSelectedCounts(newCounts);

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
    tiers.forEach((t) => {
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
              tierId: tiers[0]?.id || "",
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

  function handleProceedToPayment() {
    if (!userEmail) {
      setErrorMessage("Please sign in to your account before purchasing tickets.");
      return;
    }

    if (totalTicketCount === 0) {
      setErrorMessage("Please select at least 1 ticket");
      return;
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

    if (isFreeOrder) {
      // If free, submit immediately
      handleSubmitOrder("");
    } else {
      // Show Dynamic UPI QR Screen
      setCheckoutStep("UPI_PAYMENT");
    }
  }

  async function handleSubmitOrder(utrNumber: string) {
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

    const res = await createCheckoutOrderAction({
      eventId: event.id,
      attendees: formattedAttendees,
      couponCode: couponApplied ? couponCode.trim() : undefined,
      customerName: attendees[0]?.name,
      customerEmail: attendees[0]?.email,
      customerPhone: attendees[0]?.phone,
      upiTransactionId: utrNumber.trim() || undefined,
      paymentProofUrl: paymentProofUrl || undefined,
    });

    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to submit order");
      return;
    }

    setCompletedOrder({
      orderNumber: res.orderNumber || "RS-CONFIRMED",
      isFree: res.isFree ?? false,
      status: res.status || "PENDING_VERIFICATION",
    });
    setCheckoutStep("SUCCESS");
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
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Dialog Box */}
      <div
        style={{ width: "100%", maxWidth: "640px" }}
        className="relative z-10 w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 max-h-[92vh] text-gray-900 mx-auto"
      >
        {/* Modal Header */}
        {checkoutStep !== "SUCCESS" && (
          <div className="bg-gray-900 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
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

            <button
              onClick={onClose}
              className="relative z-10 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* ── 1. GATED STATE: NOT LOGGED IN ─────────────────────────────── */}
        {!userEmail ? (
          <div className="p-6 sm:p-10 w-full text-center overflow-y-auto flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-[#0758fc] rounded-full flex items-center justify-center mx-auto shadow-inner shrink-0">
              <Lock size={32} />
            </div>

            <div className="w-full text-center space-y-2">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight text-center w-full block">
                Sign In to Book Passes
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 text-center w-full max-w-md mx-auto block leading-relaxed">
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
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center cursor-pointer text-center"
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

            {/* Price Summary Pill */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-extrabold block">Total Payable Amount</span>
                <span className="text-xl font-black text-gray-900">₹{fees.totalPayable.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(fees.totalPayable.toFixed(2), "amount")}
                className="text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                {copiedAmount ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
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
              <p className="text-[11px] text-center text-gray-400">
                On mobile devices, this button directly launches your installed UPI app with the exact amount prefilled.
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="flex-shrink mx-4 text-[10px] uppercase font-extrabold text-gray-400">
                OR SCAN DYNAMIC UPI QR
              </span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            {/* Dynamic UPI QR Code Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-3 rounded-2xl border-2 border-gray-900 shadow-md">
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
              <div className="w-full bg-white p-3.5 rounded-2xl border border-gray-200 text-xs text-center space-y-1 block">
                <span className="text-[10px] text-gray-400 font-bold uppercase w-full block text-center">Organizer UPI ID (VPA)</span>
                <span className="font-mono font-bold text-gray-900 w-full block text-center truncate">{targetUpiId}</span>
                <span className="text-[10px] text-gray-500 w-full block text-center truncate">Payee: {targetPayeeName}</span>
              </div>
            </div>

            {/* Step 2: UTR Reference Form & Payment Screenshot Upload */}
            <div className="space-y-4 p-5 bg-blue-50/60 border border-blue-200/80 rounded-3xl">
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5 w-full">
                  <Clock size={15} className="text-[#0758fc] shrink-0" />
                  Enter 12-Digit UPI Reference / UTR Number *
                </label>
                <p className="text-xs text-gray-600 w-full block leading-relaxed">
                  After completing the payment in GPay/PhonePe/Paytm, paste your 12-digit UTR/Txn Reference number below.
                </p>
              </div>

              <input
                type="text"
                required
                maxLength={32}
                placeholder="e.g. 421893821034 or UPI/421893..."
                value={upiTransactionId}
                onChange={(e) => {
                  setUpiTransactionId(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/10 block"
              />

              {/* Prominent Payment Screenshot Attachment Field */}
              <div className="pt-3 space-y-2 border-t border-blue-200">
                <label className="block text-xs font-extrabold text-gray-900 flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5">
                    <Camera size={15} className="text-[#0758fc] shrink-0" />
                    Attach Payment Screenshot Proof (Recommended)
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-extrabold">
                    GPay / PhonePe / Paytm
                  </span>
                </label>

                {paymentProofUrl ? (
                  <div className="p-3 bg-white rounded-2xl border border-gray-200 flex items-center justify-between gap-3 shadow-xs w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={paymentProofUrl} alt="Receipt Preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">Payment Screenshot Attached</span>
                        <span className="text-[11px] text-emerald-600 font-extrabold block">✓ Ready for Instant Verification</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentProofUrl("")}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full border-2 border-dashed border-blue-300 hover:border-[#0758fc] bg-white rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/40 group text-center space-y-1">
                    <Upload size={22} className="text-[#0758fc] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#0758fc] transition-colors block w-full text-center">
                      Click to Upload Payment Receipt Screenshot
                    </span>
                    <span className="text-[10px] text-gray-500 block w-full text-center">PNG, JPG, or WebP screenshot from GPay / PhonePe / Paytm</span>
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
                          } catch {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setPaymentProofUrl(reader.result);
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

              <SlideToPayButton
                onSuccess={() => handleSubmitOrder(upiTransactionId)}
                label={loading ? "Submitting..." : "Slide to Submit Ticket for Approval"}
                disabled={loading || !upiTransactionId.trim()}
                loading={loading}
              />
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

            {/* Tiers List */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">
                Select Entry Passes
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
                        const remaining = (tier.total_capacity ?? 9999) - (tier.sold_count ?? 0);
                        const isSoldOut = remaining <= 0;
                        return (
                          <div
                            key={tier.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                              count > 0
                                ? "border-[#0758fc] bg-blue-50/20 shadow-xs"
                                : isSoldOut
                                ? "border-gray-200 bg-gray-50 opacity-75"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-gray-900">{tier.name}</h4>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {tier.tier_type || "Pass"}
                                </span>
                                {isSoldOut && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                    Sold Out
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{tier.description || "Full delegate entry"}</p>
                              <p className="text-sm font-black text-[#0758fc]">
                                {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, -1)}
                                disabled={count === 0 || isSoldOut}
                                className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-extrabold text-gray-900 w-4 text-center">{count}</span>
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, 1)}
                                disabled={isSoldOut}
                                className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer"
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
                  <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => setShowGeneralDropdown(!showGeneralDropdown)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">General Release Passes</span>
                        {isEarlyBirdAvailable ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Unlocks after Early Bird
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Now Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-[#0758fc] flex items-center gap-1">
                        {showGeneralDropdown ? (
                          <>Hide General Tickets <ChevronUp size={14} /></>
                        ) : (
                          <>View General Tickets <ChevronDown size={14} /></>
                        )}
                      </span>
                    </button>

                    {showGeneralDropdown && (
                      <div className="p-3 border-t border-gray-200 space-y-2 bg-white">
                        {generalTiers.map((tier) => {
                          const count = selectedCounts[tier.id] || 0;
                          return (
                            <div
                              key={tier.id}
                              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                count > 0 ? "border-[#0758fc] bg-blue-50/20 shadow-xs" : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-gray-900">{tier.name}</h4>
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                    {tier.tier_type || "Pass"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">{tier.description || "Full delegate entry"}</p>
                                <p className="text-sm font-black text-[#0758fc]">
                                  {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCountChange(tier.id, -1)}
                                  disabled={count === 0}
                                  className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-xs font-extrabold text-gray-900 w-4 text-center">{count}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCountChange(tier.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs cursor-pointer"
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
                      return (
                        <div
                          key={tier.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                            count > 0 ? "border-[#0758fc] bg-blue-50/20 shadow-xs" : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-900">{tier.name}</h4>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {tier.tier_type || "Pass"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{tier.description || "Full delegate entry"}</p>
                            <p className="text-sm font-black text-[#0758fc]">
                              {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCountChange(tier.id, -1)}
                              disabled={count === 0}
                              className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-extrabold text-gray-900 w-4 text-center">{count}</span>
                            <button
                              type="button"
                              onClick={() => handleCountChange(tier.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs cursor-pointer"
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
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full inline-block">
                        ⭐ Special &amp; VIP Passes
                      </span>
                    )}
                    <div className="space-y-2">
                      {otherTiers.map((tier) => {
                        const count = selectedCounts[tier.id] || 0;
                        return (
                          <div
                            key={tier.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                              count > 0 ? "border-[#0758fc] bg-blue-50/20 shadow-xs" : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900">{tier.name}</h4>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {tier.tier_type || "Pass"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{tier.description || "Full delegate entry"}</p>
                              <p className="text-sm font-black text-[#0758fc]">
                                {Number(tier.price) === 0 ? "Free Pass" : `₹${Number(tier.price).toFixed(2)}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, -1)}
                                disabled={count === 0}
                                className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs disabled:opacity-30 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-extrabold text-gray-900 w-4 text-center">{count}</span>
                              <button
                                type="button"
                                onClick={() => handleCountChange(tier.id, 1)}
                                className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs cursor-pointer"
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
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">
                    Delegate Details ({attendees.length} Attendee{attendees.length > 1 ? "s" : ""})
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Badges &amp; entry passes will be issued with these details
                  </span>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {attendees.map((att, idx) => {
                    const matchedTier = tiers.find((t) => t.id === att.tierId);
                    return (
                      <div key={idx} className="p-4 sm:p-5 bg-gray-50/90 rounded-3xl border border-gray-200 space-y-4 shadow-xs">
                        {/* Card Header */}
                        <div className="flex items-center justify-between border-b border-gray-200/70 pb-2.5">
                          <span className="text-xs font-black uppercase text-[#0758fc] tracking-wider flex items-center gap-1.5">
                            <User size={14} /> Attendee #{idx + 1}
                          </span>
                          {matchedTier && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#0758fc] border border-blue-200">
                              {matchedTier.name} ({Number(matchedTier.price) === 0 ? "FREE" : `₹${matchedTier.price}`})
                            </span>
                          )}
                        </div>

                        {/* 1. Delegate Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-gray-700">Full Name *</label>
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
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-gray-700">Email Address *</label>
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
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
                            />
                          </div>
                        </div>

                        {/* 2. Phone Number */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-gray-700">Phone Number (Optional)</label>
                          <input
                            type="tel"
                            placeholder="e.g. +91 98765 43210"
                            value={att.phone}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[idx].phone = e.target.value;
                              setAttendees(updated);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#0758fc] focus:ring-1 focus:ring-[#0758fc]/20"
                          />
                        </div>

                        {/* 3. Rotary Affiliation (3 Distinct Parts: Rotaract / Rotary / Non-Rotaract) */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                            <span>Affiliation Category *</span>
                            <span className="text-[10px] text-gray-400 font-normal">Select your affiliation</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["Rotaract", "Rotary", "Non-Rotaract"] as const).map((type) => {
                              const isSelected = (att.memberType || "Rotaract") === type;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
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
                                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all border text-center cursor-pointer active:scale-95 ${
                                    isSelected
                                      ? "bg-[#0758fc] text-white border-[#0758fc] shadow-xs"
                                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100/80"
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

                        {/* 4. Club Name & Zone Resolution */}
                        <div className="space-y-2 p-3 bg-white rounded-2xl border border-gray-200/80">
                          {att.memberType === "Rotary" ? (
                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                <Building size={13} className="text-[#0758fc]" /> Rotary Club Name
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
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#0758fc] focus:bg-white"
                              />
                            </div>
                          ) : att.memberType === "Non-Rotaract" ? (
                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                <Building size={13} className="text-[#0758fc]" /> Organization / College / Company (Optional)
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
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#0758fc] focus:bg-white"
                              />
                            </div>
                          ) : (
                            /* Rotaract Club Selector */
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                  <Building size={13} className="text-[#0758fc]" /> Rotaract Club
                                </label>
                                {att.zone && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#0758fc] border border-blue-200">
                                    Zone: {att.zone}
                                  </span>
                                )}
                              </div>

                              <select
                                value={att.clubName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...attendees];
                                  updated[idx].clubName = val;
                                  if (val === "custom") {
                                    updated[idx].zone = "";
                                  } else if (val) {
                                    updated[idx].zone = getClubZone(val);
                                  } else {
                                    updated[idx].zone = "";
                                  }
                                  setAttendees(updated);
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-[#0758fc] focus:bg-white cursor-pointer"
                              >
                                <option value="">Select Rotaract Club...</option>
                                {DISTRICT_CLUBS.map((c, cIdx) => (
                                  <option key={cIdx} value={c.name}>
                                    {c.name} ({c.zone})
                                  </option>
                                ))}
                                <option value="custom">Other / External Rotaract Club</option>
                              </select>

                              {att.clubName === "custom" && (
                                <input
                                  type="text"
                                  placeholder="Type Rotaract Club Name..."
                                  value={att.customClubName}
                                  onChange={(e) => {
                                    const updated = [...attendees];
                                    updated[idx].customClubName = e.target.value;
                                    setAttendees(updated);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-[#0758fc]"
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* 5. Designation / Role (NORMAL TEXT INPUT COLUMN — NOT A DROPDOWN) */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Briefcase size={13} className="text-[#0758fc]" /> Designation / Role
                            </span>
                            <span className="text-[10px] text-gray-400 font-normal">Free text input</span>
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
                            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/10 placeholder-gray-400"
                          />
                          <p className="text-[10px] text-gray-400">
                            Type any club or district portfolio (e.g. Sergeant-at-Arms, President, DRR, Secretary, Director, Member, Guest)
                          </p>
                        </div>

                        {/* 6. Event Custom Registration Questions */}
                        {customQuestions.length > 0 && (
                          <div className="pt-3 border-t border-gray-200/60 space-y-2.5">
                            <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider block">
                              Additional Event Questions
                            </span>
                            {customQuestions.map((q) => (
                              <div key={q.id} className="space-y-1 text-left">
                                <label className="block text-[11px] font-bold text-gray-700">
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
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#0758fc]"
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
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#0758fc]"
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

            {/* Promo Code Input */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo or Discount Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs uppercase font-mono outline-none focus:border-[#0758fc]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-[11px] font-bold ${couponApplied ? "text-emerald-600" : "text-rose-500"}`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalTicketCount} ticket{totalTicketCount > 1 ? "s" : ""})</span>
                <span className="font-semibold">₹{fees.subtotal.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount ({discountPercent}%)</span>
                  <span>-₹{fees.discount.toFixed(2)}</span>
                </div>
              )}
              {fees.convenienceFee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Platform &amp; Booking Fee</span>
                  <span className="font-medium">+₹{fees.convenienceFee.toFixed(2)}</span>
                </div>
              )}
              {fees.tax > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>GST (18% on booking fee)</span>
                  <span className="font-medium">+₹{fees.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
                <span>Total Payable</span>
                <span className="text-[#0758fc]">₹{fees.totalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={loading || totalTicketCount === 0}
                onClick={handleProceedToPayment}
                className="w-full bg-[#0758fc] hover:bg-[#054fe0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm py-4 px-6 rounded-2xl transition-all shadow-lg shadow-[#0758fc]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : isFreeOrder ? (
                  <>Confirm Free Registration <ArrowRight size={16} /></>
                ) : (
                  <>Proceed to Payment • ₹{fees.totalPayable.toFixed(2)} <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
