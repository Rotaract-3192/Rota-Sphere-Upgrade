"use client";

import React, { useState, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Check, Loader2, Sparkles } from "lucide-react";
import "./motion-hold-to-confirm-utils/index.css";

export interface HoldToConfirmProps {
  onSuccess?: () => void;
  onConfirm?: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  duration?: number;
  className?: string;
  amount?: number;
  isFree?: boolean;
}

export function HoldToConfirm({
  onSuccess,
  onConfirm,
  label = "Hold to confirm",
  disabled = false,
  loading = false,
  duration = 1.6,
  className = "",
  amount,
  isFree = false,
}: HoldToConfirmProps = {}) {
  const [isCompleted, setIsCompleted] = useState(false);
  const isCompletedRef = useRef(false);
  const activeAnimationRef = useRef<{ stop: () => void } | null>(null);

  const progress = useMotionValue(0);
  const ringStrokeWidth = useTransform(progress, [0, 1], [1, 3.5]);
  const ringColor = useTransform(progress, [0, 1], ["#0758fc", "#10b981"]);
  const buttonScale = useTransform(progress, [0, 1], [1, 0.96]);
  const buttonProgressX = useTransform(progress, [0, 1], ["-100%", "0%"]);

  const triggerConfirmation = () => {
    if (isCompletedRef.current || disabled || loading) return;
    isCompletedRef.current = true;
    setIsCompleted(true);

    if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch (_) {}
    }

    if (onConfirm) onConfirm();
    if (onSuccess) onSuccess();

    // Auto-reset after confirmation
    setTimeout(() => {
      isCompletedRef.current = false;
      setIsCompleted(false);
      progress.set(0);
    }, 2200);
  };

  const handlePointerDown = () => {
    if (disabled || loading || isCompletedRef.current) return;
    progress.set(0);

    if (activeAnimationRef.current) {
      activeAnimationRef.current.stop();
    }

    activeAnimationRef.current = animate(progress, 1, {
      duration,
      ease: "easeOut",
      onComplete: () => {
        triggerConfirmation();
      },
    });
  };

  const handlePointerRelease = () => {
    if (isCompletedRef.current) return;
    if (activeAnimationRef.current) {
      activeAnimationRef.current.stop();
    }
    activeAnimationRef.current = animate(progress, 0, { duration: 0.3, ease: "easeOut" });
  };

  const computedLabel =
    label ||
    (isFree
      ? "Hold to Confirm Free Entry"
      : amount !== undefined
      ? `Hold to Confirm • ₹${amount.toFixed(2)}`
      : "Hold to confirm");

  return (
    <div className={`hold-confirm-stage ${className}`}>
      <div className="hold-confirm-wrap">
        <motion.button
          type="button"
          disabled={disabled || loading}
          className="hold-confirm-btn"
          style={{ scale: buttonScale }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerRelease}
          onPointerLeave={handlePointerRelease}
          onPointerCancel={handlePointerRelease}
        >
          <motion.div className="hold-confirm-fill" style={{ x: buttonProgressX }} />
          <span
            className="relative z-10 flex items-center justify-center gap-2 pointer-events-none select-none text-white drop-shadow-sm font-black text-xs sm:text-sm"
            style={{ pointerEvents: "none" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Processing Ticket...</span>
              </>
            ) : isCompleted ? (
              <>
                <Check size={16} className="text-white" strokeWidth={3} />
                <span>Confirmed!</span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="text-blue-300 shrink-0" />
                <span>{computedLabel}</span>
              </>
            )}
          </span>
        </motion.button>

        {/* Compact Proportional Glow Border that traces the capsule contour */}
        <motion.svg
          className="hold-confirm-ring"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <motion.rect
            x="1.5"
            y="1.5"
            width="97"
            height="97"
            rx="48"
            fill="none"
            stroke={ringColor}
            strokeWidth={ringStrokeWidth}
            strokeLinecap="round"
            style={{
              opacity: progress,
              pathLength: progress,
            }}
          />
        </motion.svg>
      </div>
    </div>
  );
}

export default HoldToConfirm;
