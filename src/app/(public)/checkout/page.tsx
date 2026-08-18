"use client";

/**
 * Checkout Page
 * Handles order confirmation, inventory reservation, direct UPI settlement, and redirection to tickets.
 * Architecture: Direct Non-Profit UPI Settlement (0% platform fee).
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createOrderAction, SelectedTierInput } from "@/app/actions/orderActions";
import { ShieldCheck, Lock, AlertCircle, QrCode } from "lucide-react";
import { PaymentConfirmationAnimation } from "@/components/checkout/PaymentConfirmationAnimation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = searchParams.get("eventId");
  const tiersParam = searchParams.get("tiers");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

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

    setCompletedOrder(result);
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full">
        <PaymentConfirmationAnimation
          orderNumber={completedOrder?.orderNumber}
          isFree={completedOrder?.isFree}
          amount={completedOrder?.totalAmount}
          viewTicketsHref={completedOrder?.orderId ? `/tickets?orderId=${completedOrder.orderId}` : "/tickets"}
          fullScreen={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6">Confirm &amp; Register</h1>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={20} className="shrink-0 text-rose-600 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          {error.toLowerCase().includes("authentication") && (
            <div className="pt-2">
              <a
                href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/events")}`}
                className="inline-flex items-center gap-1.5 bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                Sign In Now →
              </a>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-xs space-y-4 text-gray-900">
        <h2 className="text-lg font-black text-gray-900">Order Summary</h2>

        <div className="space-y-2 border-y border-gray-200 py-4 text-xs font-semibold">
          {selectedTiers.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-800">
              <span>{item.quantity}× Ticket Tier</span>
              <span className="font-bold text-[#0758fc]">Selected</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm font-bold text-gray-900">
          <span>Payment Channel</span>
          <span className="text-emerald-600 font-mono">Direct UPI (0% Fee)</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span>Direct Non-Profit UPI Settlement to host Rotaract Club bank accounts.</span>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#0758fc] hover:bg-[#054fe0] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
      >
        <Lock size={16} />
        {loading ? "Processing..." : "Complete Pass Registration"}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
