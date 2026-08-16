"use client";

/**
 * High-Conversion Multi-Tier Checkout Modal
 * Supports multi-attendee name/email collection, coupons, fee breakdowns, and instant ticket generation.
 */

import { useState } from "react";
import { X, Sparkles, Tag, ShieldCheck, ArrowRight, CheckCircle2, Loader2, User, Mail, Phone } from "lucide-react";
import { calculateOrderFees } from "@/lib/services/feeCalculator";
import { createCheckoutOrderAction, confirmOrderPaymentAction } from "@/app/actions/orderActions";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";
import Link from "next/link";

interface CheckoutModalProps {
  event: SaasEvent;
  tiers: SaasTicketTier[];
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export function CheckoutModal({ event, tiers, isOpen, onClose, userEmail, userName }: CheckoutModalProps) {
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

  // Attendees list
  const [attendees, setAttendees] = useState<Array<{ tierId: string; name: string; email: string; phone: string }>>([
    {
      tierId: tiers[0]?.id || "",
      name: userName || "",
      email: userEmail || "",
      phone: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: string; isFree: boolean } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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

  function handleCountChange(tierId: string, delta: number) {
    const current = selectedCounts[tierId] || 0;
    const next = Math.max(0, Math.min(10, current + delta));
    const newCounts = { ...selectedCounts, [tierId]: next };
    setSelectedCounts(newCounts);

    // Rebuild attendee slots
    const newAttendees: Array<{ tierId: string; name: string; email: string; phone: string }> = [];
    tiers.forEach((t) => {
      const count = newCounts[t.id] || 0;
      for (let i = 0; i < count; i++) {
        newAttendees.push({
          tierId: t.id,
          name: i === 0 ? userName || "" : "",
          email: i === 0 ? userEmail || "" : "",
          phone: "",
        });
      }
    });
    setAttendees(newAttendees.length > 0 ? newAttendees : [{ tierId: tiers[0]?.id || "", name: "", email: "", phone: "" }]);
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

  async function handleCompleteCheckout() {
    if (totalTicketCount === 0) {
      setErrorMessage("Please select at least 1 ticket");
      return;
    }

    // Validate attendees
    for (let i = 0; i < attendees.length; i++) {
      if (!attendees[i].name.trim() || !attendees[i].email.trim()) {
        setErrorMessage(`Please fill out Name and Email for Attendee #${i + 1}`);
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);

    const formattedAttendees = attendees.map((a) => ({
      ticketTierId: a.tierId,
      name: a.name.trim(),
      email: a.email.trim(),
      phone: a.phone.trim() || undefined,
    }));

    const res = await createCheckoutOrderAction({
      eventId: event.id,
      attendees: formattedAttendees,
      couponCode: couponApplied ? couponCode.trim() : undefined,
      customerName: attendees[0]?.name,
      customerEmail: attendees[0]?.email,
      customerPhone: attendees[0]?.phone,
    });

    if (!res.success) {
      setLoading(false);
      setErrorMessage(res.error || "Failed to process order");
      return;
    }

    if (res.isFree) {
      setLoading(false);
      setCompletedOrder({ orderNumber: res.orderNumber || "RS-ORDER", isFree: true });
      return;
    }

    // Paid Order -> Process simulation / gateway confirmation
    setTimeout(async () => {
      if (res.orderId) {
        await confirmOrderPaymentAction(res.orderId, `pay_mock_${Date.now()}`);
      }
      setLoading(false);
      setCompletedOrder({ orderNumber: res.orderNumber || "RS-ORDER", isFree: false });
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8">
        
        {/* Modal Header */}
        <div className="bg-gray-900 text-white p-6 sm:p-8 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} /> Instant Registration
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{event.title}</h2>
            <p className="text-xs text-gray-400">
              {event.city} · {new Date(event.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Confirmation State */}
        {completedOrder ? (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900">Registration Confirmed!</h3>
              <p className="text-sm text-gray-500 mt-2">
                Your entry passes with cryptographic QR codes have been issued and sent to{" "}
                <span className="font-semibold text-gray-900">{attendees[0]?.email}</span>.
              </p>
              <div className="mt-4 inline-block bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-xs font-mono font-bold text-gray-700">
                Order Reference: {completedOrder.orderNumber}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                href="/tickets"
                className="bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                View My Tickets & QR Code <ArrowRight size={16} />
              </Link>
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Checkout Body */
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Step 1: Select Ticket Tiers */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">1. Select Ticket Tier</h3>
              <div className="space-y-2.5">
                {tiers.map((tier) => {
                  const count = selectedCounts[tier.id] || 0;
                  const isFree = Number(tier.price) === 0;
                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        count > 0 ? "border-amber-400 bg-amber-50/20 shadow-xs" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{tier.name}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {tier.tier_type}
                          </span>
                        </div>
                        {tier.description && <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>}
                        <p className="text-sm font-extrabold text-[#ff385c] mt-1">
                          {isFree ? "FREE" : `₹${tier.price}`}
                        </p>
                      </div>

                      {/* Quantity selector */}
                      <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-xl">
                        <button
                          onClick={() => handleCountChange(tier.id, -1)}
                          disabled={count === 0}
                          className="w-6 h-6 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 cursor-pointer text-sm"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm text-gray-900 w-4 text-center">{count}</span>
                        <button
                          onClick={() => handleCountChange(tier.id, 1)}
                          disabled={count >= tier.max_per_order}
                          className="w-6 h-6 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 cursor-pointer text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Attendee Details */}
            {totalTicketCount > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">2. Attendee Passes ({attendees.length})</h3>
                {attendees.map((att, idx) => (
                  <div key={idx} className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Attendee #{idx + 1}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={att.name}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[idx].name = e.target.value;
                              setAttendees(updated);
                            }}
                            placeholder="Rtr. Priya Sharma"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="email"
                            required
                            value={att.email}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[idx].email = e.target.value;
                              setAttendees(updated);
                            }}
                            placeholder="priya@rotaract.org"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Coupon Code */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Have a Promo Code?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Try 'EARLYBIRD' or 'ROTARACT'"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono uppercase text-gray-900 outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-xs mt-1.5 font-semibold ${couponApplied ? "text-emerald-600" : "text-rose-500"}`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Step 4: Summary & Pricing Ledger */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-2.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Tickets Subtotal ({totalTicketCount})</span>
                <span className="font-semibold text-gray-900">₹{fees.subtotal}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-₹{fees.discount}</span>
                </div>
              )}
              {fees.convenienceFee > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Convenience Fee</span>
                  <span>₹{fees.convenienceFee}</span>
                </div>
              )}
              {fees.tax > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>GST (18%)</span>
                  <span>₹{fees.tax}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total Payable</span>
                <span className="text-xl font-extrabold text-[#ff385c]">
                  {fees.totalPayable === 0 ? "FREE" : `₹${fees.totalPayable}`}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Action CTA */}
            <button
              onClick={handleCompleteCheckout}
              disabled={loading || totalTicketCount === 0}
              className="w-full bg-[#ff385c] hover:bg-[#e00b41] disabled:opacity-50 text-white font-bold text-sm py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Securing Your Tickets...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Confirm & Get Passes ({totalTicketCount})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
