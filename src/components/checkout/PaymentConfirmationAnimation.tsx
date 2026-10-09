"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  ArrowRight,
  RotateCcw,
  X,
  Ticket as TicketIcon,
  Copy,
  CheckCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  function handleReplay() {
    setAnimKey((prev) => prev + 1);
  }

  function handleCopyOrderNumber() {
    if (!orderNumber) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

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
      ? "Your payment has been verified and your scannable digital entry pass is now unlocked! ✨"
      : upiTransactionId
      ? `Your payment reference (${upiTransactionId}) has been recorded and submitted to the event organizer. Your pass will unlock once confirmed! ✨`
      : "Your payment details have been submitted to the event organizer for verification. Your pass will unlock once confirmed! ✨");

  const badgeText = isFree
    ? "Pass Issued & Confirmed"
    : isConfirmed
    ? "Payment Confirmed"
    : "Submitted • Pending Verification";

  // Particle positions for clean confetti burst
  const confettiParticles = [
    { x: -75, y: -80, color: "#10b981", size: 8, delay: 0.1 },
    { x: 80, y: -75, color: "#0758fc", size: 9, delay: 0.15 },
    { x: -110, y: -20, color: "#f59e0b", size: 7, delay: 0.2 },
    { x: 115, y: -15, color: "#8b5cf6", size: 8, delay: 0.18 },
    { x: -60, y: 70, color: "#06b6d4", size: 6, delay: 0.25 },
    { x: 70, y: 75, color: "#10b981", size: 7, delay: 0.22 },
    { x: -95, y: -90, color: "#3b82f6", size: 5, delay: 0.12 },
    { x: 95, y: -95, color: "#ec4899", size: 6, delay: 0.16 },
    { x: 0, y: -120, color: "#10b981", size: 9, delay: 0.08 },
    { x: -125, y: 30, color: "#f59e0b", size: 6, delay: 0.28 },
    { x: 125, y: 35, color: "#0758fc", size: 7, delay: 0.24 },
  ];

  return (
    <div
      key={animKey}
      className={`relative w-full overflow-hidden flex flex-col items-center justify-center text-center select-none bg-gradient-to-b from-emerald-50/60 via-white to-gray-50/80 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-950 ${
        fullScreen ? "min-h-[85vh] py-12 px-4 sm:px-8" : "p-6 sm:p-8"
      }`}
    >
      {/* ── Floating Close Button (when in modal) ── */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
        >
          <X size={18} />
        </button>
      )}

      {/* ── Ambient Radial Glow Backdrop ── */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: fullScreen ? "min(70vw, 480px)" : "min(75vw, 320px)",
          aspectRatio: "1/1",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(7, 88, 252, 0.10) 50%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Modern Premium Animated Icon Stage ── */}
      <div className="relative z-10 flex items-center justify-center my-4 sm:my-6 w-44 h-44">
        {/* Expanding Subtle Ripple 1 */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.8, 1.35, 1.45], opacity: [0.6, 0.2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-emerald-400/40 dark:border-emerald-500/30 pointer-events-none"
        />

        {/* Expanding Subtle Ripple 2 */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 1.3], opacity: [0.5, 0.15, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 0.6, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border border-blue-400/30 dark:border-blue-500/20 pointer-events-none"
        />

        {/* Floating Confetti Sparkles Burst */}
        {confettiParticles.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.2, 0.9],
              x: p.x,
              y: p.y,
              opacity: [0, 1, 0.85],
            }}
            transition={{
              duration: 0.9,
              delay: p.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            className="absolute rounded-full shadow-xs pointer-events-none"
          />
        ))}

        {/* Outer Circular Aura */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-[#0758fc] shadow-[0_12px_32px_rgba(16,185,129,0.35)] flex items-center justify-center"
        >
          {/* Inner Glowing Disc */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 flex items-center justify-center shadow-inner relative overflow-hidden">
            {/* Smooth Top Gloss */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.35),transparent_65%)] pointer-events-none" />

            {/* Dynamic Drawn Checkmark SVG */}
            <svg
              className="w-14 h-14 sm:w-16 sm:h-16 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M4 12.5L9.5 18L20 6.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { delay: 0.25, type: "spring", duration: 0.8, bounce: 0 },
                  opacity: { delay: 0.2, duration: 0.2 },
                }}
              />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* ── Content & Hierarchy ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
        className="relative z-20 w-full max-w-md mx-auto space-y-3"
      >
        {/* Status Verification Badge */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs text-xs font-bold text-gray-800 dark:text-gray-200">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isFree || isConfirmed
                  ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]"
                  : "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.25)] animate-pulse"
              }`}
            />
            <span>{badgeText}</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
          {headingText}
        </h2>

        {/* Description - Clear, high-contrast readable typography */}
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
          {bodyText}
        </p>

        {/* Reference & Event Details Card */}
        {(orderNumber || eventName || amount) && (
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            {orderNumber && (
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                title="Click to copy Order ID"
                className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-gray-800 dark:text-gray-200 shadow-xs transition-colors cursor-pointer"
              >
                <span>Ref: {orderNumber}</span>
                {copied ? (
                  <CheckCheck size={13} className="text-emerald-500 shrink-0" />
                ) : (
                  <Copy size={13} className="text-gray-400 shrink-0" />
                )}
              </button>
            )}

            {amount !== undefined && (
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-xs">
                ₹{typeof amount === "number" ? amount.toFixed(2) : amount}
              </span>
            )}

            {eventName && (
              <span className="bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl text-xs font-bold max-w-[180px] truncate shadow-xs">
                {eventName}
              </span>
            )}

            {!isFree && !isConfirmed && (
              <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5 rounded-xl text-xs font-extrabold shadow-xs">
                Pending Approval
              </span>
            )}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="pt-4 flex items-center justify-center gap-2.5 w-full max-w-sm mx-auto">
          <Link
            href={viewTicketsHref}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
          >
            <TicketIcon size={16} /> View My Passes <ArrowRight size={15} />
          </Link>

          <button
            type="button"
            onClick={handleReplay}
            title="Replay Celebration Animation"
            className="p-3.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
          >
            <RotateCcw size={16} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs py-3.5 px-5 rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer text-center"
            >
              Close
            </button>
          )}
        </div>
      </motion.section>
    </div>
  );
}

export default PaymentConfirmationAnimation;
