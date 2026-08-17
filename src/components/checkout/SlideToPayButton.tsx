"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronsRight, Check, Loader2, Sparkles } from "lucide-react";

interface SlideToPayButtonProps {
  onSuccess: () => void;
  label?: string;
  amount?: number;
  isFree?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function SlideToPayButton({
  onSuccess,
  label,
  amount,
  isFree = false,
  disabled = false,
  loading = false,
}: SlideToPayButtonProps) {
  const [sliderPosition, setSliderPosition] = useState(0); // 0 to maxDrag
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const maxDragRef = useRef(0);

  // Compute max drag distance
  const updateMaxDrag = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const thumbWidth = 56; // 56px thumb diameter
      maxDragRef.current = Math.max(0, containerWidth - thumbWidth - 8); // 4px padding on each side
    }
  }, []);

  useEffect(() => {
    updateMaxDrag();
    window.addEventListener("resize", updateMaxDrag);
    return () => window.removeEventListener("resize", updateMaxDrag);
  }, [updateMaxDrag]);

  // Reset when disabled or after completion reset
  useEffect(() => {
    if (!loading && !disabled && isCompleted) {
      const timeout = setTimeout(() => {
        setIsCompleted(false);
        setSliderPosition(0);
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [loading, disabled, isCompleted]);

  const handleStart = (clientX: number) => {
    if (disabled || loading || isCompleted) return;
    updateMaxDrag();
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || disabled || loading || isCompleted) return;
      const newPos = Math.max(0, Math.min(clientX - startXRef.current, maxDragRef.current));
      setSliderPosition(newPos);

      // If dragged past 85% of track, trigger success
      if (maxDragRef.current > 0 && newPos >= maxDragRef.current * 0.88) {
        setIsDragging(false);
        setIsCompleted(true);
        setSliderPosition(maxDragRef.current);
        onSuccess();
      }
    },
    [isDragging, disabled, loading, isCompleted, onSuccess]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    // If not completed, snap back to start smoothly
    if (!isCompleted) {
      setSliderPosition(0);
    }
  }, [isDragging, isCompleted]);

  // Global mouse / touch event handlers for smooth drag outside container
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchend", onTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Compute text label
  const displayText =
    label ||
    (isFree
      ? "Slide to Confirm Free Registration"
      : amount !== undefined
      ? `Slide to Proceed • ₹${amount.toFixed(2)}`
      : "Slide to Proceed to Payment");

  const progressPercent = maxDragRef.current > 0 ? (sliderPosition / maxDragRef.current) * 100 : 0;

  return (
    <div className="w-full space-y-2 select-none">
      <div
        ref={containerRef}
        className={`relative h-16 w-full rounded-2xl overflow-hidden p-1 flex items-center transition-all ${
          disabled
            ? "bg-gray-100 opacity-60 cursor-not-allowed border border-gray-200"
            : isCompleted
            ? "bg-emerald-500 border border-emerald-400 shadow-lg shadow-emerald-500/20"
            : "bg-gradient-to-r from-blue-500/10 via-sky-500/15 to-blue-500/10 border-2 border-[#1e9df1]/30 shadow-inner hover:border-[#1e9df1]/60"
        }`}
      >
        {/* Dynamic sliding fill color */}
        <div
          className={`absolute left-0 top-0 bottom-0 transition-all ${
            isCompleted
              ? "w-full bg-emerald-500"
              : "bg-gradient-to-r from-[#1e9df1] to-[#38bdf8] opacity-25"
          }`}
          style={{
            width: isCompleted ? "100%" : `${Math.max(15, progressPercent)}%`,
            transition: isDragging ? "none" : "all 0.25s ease-out",
          }}
        />

        {/* Shimmering Center Action Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-black text-[#1e9df1]">
              <Loader2 size={16} className="animate-spin" />
              <span>Processing Order...</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-2 text-xs font-black text-white animate-in zoom-in-90 duration-200">
              <Check size={18} className="stroke-[3]" />
              <span>Verified &amp; Proceeding!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-gray-800 tracking-tight transition-opacity duration-200">
              <span className="truncate">{displayText}</span>
              <span className="hidden sm:inline-flex text-[#1e9df1] animate-pulse">
                &gt;&gt;&gt;
              </span>
            </div>
          )}
        </div>

        {/* Draggable Slider Thumb */}
        <div
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) handleStart(e.touches[0].clientX);
          }}
          style={{
            transform: `translateX(${sliderPosition}px)`,
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center transition-shadow cursor-grab active:cursor-grabbing ${
            disabled
              ? "bg-gray-300 text-gray-500"
              : isCompleted
              ? "bg-white text-emerald-600 shadow-lg scale-105"
              : "bg-[#1e9df1] hover:bg-[#1583cd] text-white shadow-md hover:shadow-lg active:scale-95"
          }`}
          role="slider"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={displayText}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled && !loading) {
                setIsCompleted(true);
                setSliderPosition(maxDragRef.current);
                onSuccess();
              }
            }
          }}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : isCompleted ? (
            <Check size={22} className="text-emerald-600 stroke-[3]" />
          ) : (
            <ChevronsRight size={22} className="text-white animate-bounce-horizontal" />
          )}
        </div>
      </div>

      {/* Tap / Click fallback helper text */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold px-1">
        <span className="flex items-center gap-1 text-gray-400">
          <Sparkles size={12} className="text-[#1e9df1]" /> Swipe right to confirm
        </span>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => {
            if (!disabled && !loading) {
              setIsCompleted(true);
              onSuccess();
            }
          }}
          className="text-[#1e9df1] hover:underline font-bold cursor-pointer disabled:opacity-40"
        >
          or click here to proceed &rarr;
        </button>
      </div>
    </div>
  );
}
