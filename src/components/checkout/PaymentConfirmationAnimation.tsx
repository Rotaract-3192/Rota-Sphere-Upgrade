"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, X, Ticket as TicketIcon } from "lucide-react";

export interface PaymentConfirmationAnimationProps {
  orderNumber?: string;
  isFree?: boolean;
  isConfirmed?: boolean;
  upiTransactionId?: string;
  eventName?: string;
  amount?: number | string;
  onClose?: () => void;
  viewTicketsHref?: string;
  fullScreen?: boolean;
  title?: string;
  description?: string;
}

export function PaymentConfirmationAnimation({
  orderNumber,
  isFree = false,
  isConfirmed = false,
  upiTransactionId,
  eventName,
  amount,
  onClose,
  viewTicketsHref = "/tickets",
  fullScreen = false,
  title,
  description,
}: PaymentConfirmationAnimationProps) {
  const [animKey, setAnimKey] = useState(0);

  function handleReplay() {
    setAnimKey((prev) => prev + 1);
  }

  // Determine wording based on order state
  const headingText =
    title ??
    (isFree
      ? "Registration Confirmed!"
      : isConfirmed
      ? "Ticket Confirmed!"
      : "Ticket Submitted for Verification!");

  const bodyText =
    description ??
    (isFree
      ? "Your complimentary entry pass has been issued and is available in your passes dashboard."
      : isConfirmed
      ? "Your payment has been verified and your scannable entry pass is now unlocked! ✨"
      : upiTransactionId
      ? `Your payment reference (${upiTransactionId}) has been recorded and submitted to the event organizer. Your scannable pass will unlock once confirmed! ✨`
      : "Your payment details have been submitted to the event organizer for verification. Your pass will unlock once confirmed! ✨");

  const badgeText = isFree
    ? "Pass Issued & Confirmed"
    : isConfirmed
    ? "Transaction Confirmed"
    : "Submitted • Pending Verification";

  return (
    <div
      key={animKey}
      className={`relative w-full overflow-hidden flex flex-col items-center justify-center text-center select-none ${
        fullScreen
          ? "min-h-[85vh] py-10 px-4 sm:px-8"
          : "p-5 sm:p-7"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 36%, #ffffff 0%, #fffdf2 35%, #f2fde8 70%, #e8fade 100%)",
        "--flower-image": "url('/images/payment-success-art.png')",
      } as React.CSSProperties}
    >
      {/* ── Floating Close Button (when in modal) ── */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
        >
          <X size={18} />
        </button>
      )}

      {/* ── Ambient Glowing Backdrop ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: fullScreen ? "min(70vw, 500px)" : "min(75vw, 340px)",
          aspectRatio: "1/1",
          background: "rgba(36, 205, 83, 0.24)",
          filter: "blur(45px)",
          animation: "paymentGlow 2.8s ease-in-out infinite",
        }}
      />

      {/* ── Expanding Wave Ring ── */}
      <div
        className="absolute rounded-full border-2 border-emerald-500/30 dark:border-emerald-400/40 pointer-events-none"
        style={{
          width: fullScreen ? "min(52vw, 380px)" : "min(58vw, 260px)",
          aspectRatio: "1/1",
          animation: "paymentRing 1.8s cubic-bezier(.2,.8,.2,1) both",
        }}
      />

      {/* ── Floating Confetti Particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span
          className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
          style={
            {
              left: "16%",
              top: "24%",
              backgroundColor: "#ffca28",
              "--dx": "-55px",
              "--dy": "-85px",
              animation: "paymentParticle 2.4s ease-out infinite 0.35s",
            } as React.CSSProperties
          }
        />
        <span
          className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
          style={
            {
              left: "20%",
              top: "48%",
              backgroundColor: "#ff5870",
              "--dx": "-70px",
              "--dy": "70px",
              animation: "paymentParticle 2.4s ease-out infinite 0.65s",
            } as React.CSSProperties
          }
        />
        <span
          className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
          style={
            {
              left: "78%",
              top: "22%",
              backgroundColor: "#22a7ff",
              "--dx": "65px",
              "--dy": "-95px",
              animation: "paymentParticle 2.4s ease-out infinite 0.15s",
            } as React.CSSProperties
          }
        />
        <span
          className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
          style={
            {
              left: "84%",
              top: "46%",
              backgroundColor: "#ffca28",
              "--dx": "80px",
              "--dy": "65px",
              animation: "paymentParticle 2.4s ease-out infinite 0.9s",
            } as React.CSSProperties
          }
        />
        <span
          className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
          style={
            {
              left: "30%",
              top: "14%",
              backgroundColor: "#ff5870",
              "--dx": "-45px",
              "--dy": "-70px",
              animation: "paymentParticle 2.4s ease-out infinite 0.5s",
            } as React.CSSProperties
          }
        />
        <span
          className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
          style={
            {
              left: "70%",
              top: "54%",
              backgroundColor: "#20bf58",
              "--dx": "55px",
              "--dy": "80px",
              animation: "paymentParticle 2.4s ease-out infinite 0.8s",
            } as React.CSSProperties
          }
        />
      </div>

      {/* ── Visual Illustration Stage (Locked 1.5:1 Coordinate System) ── */}
      <div
        className="relative z-10 w-full max-w-[310px] sm:max-w-[370px] aspect-[1.5/1] flex items-center justify-center mb-3 sm:mb-4"
        style={{
          animation: "paymentArtwork 1.25s cubic-bezier(.17,.84,.25,1.18) both",
        }}
      >
        {/* Core Festive Artwork */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/payment-success-art.png"
          alt="Festive payment confirmation illustration"
          className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-[0_16px_28px_rgba(0,70,25,0.16)]"
          draggable={false}
        />

        {/* Breathing / Shimmering Central Flower Layer */}
        <div
          className="absolute pointer-events-none overflow-visible"
          style={{
            width: "46%",
            aspectRatio: "1 / 1",
            left: "50%",
            top: "42.5%",
            transform: "translate(-50%, -50%)",
            zIndex: 15,
          }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-[-4%]"
            style={{
              backgroundImage: "var(--flower-image)",
              backgroundSize: "217% auto",
              backgroundPosition: "50% 39%",
              clipPath:
                "polygon(50% 0%, 61% 12%, 75% 7%, 79% 22%, 96% 27%, 88% 40%, 100% 54%, 86% 62%, 92% 78%, 76% 77%, 68% 95%, 55% 84%, 43% 100%, 35% 84%, 20% 91%, 20% 75%, 3% 70%, 13% 55%, 0% 43%, 15% 34%, 10% 19%, 27% 22%, 34% 6%)",
              filter: "drop-shadow(0 8px 12px rgba(0, 80, 25, .15))",
              transformOrigin: "center",
              animation:
                "flowerBreath 2.8s cubic-bezier(.45,.05,.55,.95) infinite, flowerFloat 3.8s ease-in-out infinite",
            }}
          >
            <div
              className="absolute inset-[16%] rounded-full mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,.5) 0%, rgba(255,255,255,.14) 34%, transparent 68%)",
                animation: "flowerShimmer 2.2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Messaging Content Hierarchy ── */}
      <section
        className="relative z-20 w-full max-w-md mx-auto space-y-2.5"
        style={{ animation: "paymentMessage 0.9s 0.65s cubic-bezier(.2,.8,.2,1) both" }}
      >
        <h2
          className="font-black tracking-tight text-center leading-tight"
          style={{
            color: "#087a35",
            fontSize: fullScreen ? "clamp(24px, 4.2vw, 36px)" : "clamp(20px, 3.6vw, 28px)",
          }}
        >
          {headingText}
        </h2>

        <p className="text-xs sm:text-sm font-medium text-emerald-900/90 dark:text-emerald-200/90 max-w-sm mx-auto leading-relaxed">
          {bodyText}
        </p>

        {/* Status Verification Badge */}
        <div className="flex items-center justify-center pt-0.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-500/25 shadow-xs text-emerald-800 font-bold text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isFree || isConfirmed
                  ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(25,201,87,0.2)]"
                  : "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.2)]"
              }`}
              style={{ animation: "paymentDot 1.5s infinite" }}
            />
            <span>{badgeText}</span>
          </div>
        </div>

        {/* Reference & Event Details Pill */}
        {(orderNumber || eventName || amount) && (
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
            {orderNumber && (
              <span className="bg-white/90 border border-emerald-200/80 px-3 py-1 rounded-xl text-[11px] font-mono font-bold text-gray-800 shadow-xs">
                Ref: {orderNumber}
              </span>
            )}
            {amount !== undefined && (
              <span className="bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 px-3 py-1 rounded-xl text-[11px] font-extrabold shadow-xs">
                ₹{typeof amount === "number" ? amount.toFixed(2) : amount}
              </span>
            )}
            {eventName && (
              <span className="bg-blue-50/90 text-[#0758fc] border border-blue-200/90 px-3 py-1 rounded-xl text-[11px] font-bold max-w-[200px] truncate shadow-xs">
                {eventName}
              </span>
            )}
            {!isFree && !isConfirmed && (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-xs">
                Pending Approval
              </span>
            )}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="pt-3 flex items-center justify-center gap-2.5 w-full max-w-sm mx-auto">
          <Link
            href={viewTicketsHref}
            className="flex-1 bg-[#0b8e3f] hover:bg-[#087a35] text-white font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
          >
            <TicketIcon size={16} /> View My Passes <ArrowRight size={15} />
          </Link>

          <button
            type="button"
            onClick={handleReplay}
            title="Replay Celebration Animation"
            className="p-3.5 bg-white hover:bg-emerald-50/80 text-emerald-800 border border-emerald-200 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
          >
            <RotateCcw size={16} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs py-3.5 px-5 rounded-2xl border border-gray-200 transition-colors cursor-pointer text-center"
            >
              Close
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
