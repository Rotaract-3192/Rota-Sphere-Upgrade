"use client";

/**
 * Checkout Page
 * Handles order confirmation, inventory reservation, Razorpay payment modal, and redirection to tickets.
 * Architecture §33-37: Payment integration flow.
 * DESIGN-airbnb.md: Clean white canvas, Rausch CTA, Airbnb spacing.
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { createOrderAction, SelectedTierInput } from "@/app/actions/orderActions";
import { ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = searchParams.get("eventId");
  const tiersParam = searchParams.get("tiers");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("/events");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  let selectedTiers: SelectedTierInput[] = [];
  try {
    if (tiersParam) selectedTiers = JSON.parse(tiersParam);
  } catch {
    // Invalid JSON
  }

  useEffect(() => {
    if (!eventId || selectedTiers.length === 0) {
      router.replace("/events");
    }
  }, [eventId, selectedTiers.length, router]);

  async function handleCheckout() {
    if (!eventId || selectedTiers.length === 0) return;
    setLoading(true);
    setError(null);

    const result = await createOrderAction({
      eventId,
      selectedTiers,
      paymentMethod: "online",
    });

    if (!result.success || !result.orderId) {
      setError(result.error ?? "Failed to create order. Please try again.");
      setLoading(false);
      return;
    }

    if (result.isFree) {
      setSuccess(true);
      setTimeout(() => {
        router.replace(`/tickets?orderId=${result.orderId}`);
      }, 1500);
      return;
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!window.Razorpay) {
      setError("Razorpay SDK failed to load. Please check your internet connection.");
      setLoading(false);
      return;
    }

    const options = {
      key: keyId,
      amount: Math.round((result.totalAmount ?? 0) * 100),
      currency: "INR",
      name: "RotaSphere",
      description: `Order #${result.orderNumber}`,
      order_id: (result as any).gatewayOrderId || (result as any).orderId,
      handler: function () {
        setSuccess(true);
        setTimeout(() => {
          router.replace(`/tickets?orderId=${result.orderId}`);
        }, 1500);
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          setError("Payment process was closed before completion.");
        },
      },
      theme: {
        color: "#ff385c",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-base py-section text-center">
        <div className="max-w-md">
          <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-lg">
            <CheckCircle2 size={36} strokeWidth={2} />
          </div>
          <h1 className="text-display-md font-bold text-ink mb-xs">Registration Confirmed!</h1>
          <p className="text-body-md text-muted mb-lg">
            Your tickets are being issued. Redirecting you to your tickets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-base md:px-xl py-section">
      <h1 className="text-display-lg font-medium text-ink mb-xl">Confirm & Pay</h1>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={20} className="flex-shrink-0 text-rose-600 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          {error.toLowerCase().includes("authentication") && (
            <div className="pt-2">
              <a
                href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/events")}`}
                className="inline-flex items-center gap-1.5 bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                Sign In Now →
              </a>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm space-y-4 text-gray-900">
        <h2 className="text-lg font-black text-gray-900">Order Summary</h2>

        <div className="space-y-2 border-y border-gray-200 py-4 text-xs font-semibold">
          {selectedTiers.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-800">
              <span>{item.quantity}× Ticket Tier</span>
              <span className="font-bold text-[#1e9df1]">Selected</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm font-bold text-gray-900">
          <span>Total</span>
          <span>Calculated at Checkout</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span>Direct UPI Payment to Rotaract District 3192. 100% Direct Non-Profit Settlement.</span>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#1e9df1] hover:bg-[#1583cd] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
      >
        <Lock size={16} />
        {loading ? "Processing..." : "Complete Registration"}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Suspense fallback={<div className="py-section text-center text-muted">Loading checkout...</div>}>
        <CheckoutContent />
      </Suspense>
    </>
  );
}
