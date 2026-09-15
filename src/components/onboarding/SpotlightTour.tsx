"use client";

/**
 * SpotlightTour — High-fidelity guided tour aligned with RotaSphere's native design theme.
 * Features:
 * - Dynamic spotlight cutout tracking real DOM elements
 * - Physical pointer arrow pointing directly to the target element
 * - App-native light & dark mode styling matching RotaSphere tokens
 * - Actionable "How to Navigate" instructions + pro tips
 * - Keyboard navigation (Arrow keys + Escape)
 * - Auto-scroll with smooth alignment
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useOnboarding } from "./OnboardingProvider";
import { Compass, Lightbulb, ChevronRight, ChevronLeft, X } from "lucide-react";

interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type ArrowDirection = "up" | "down" | "left" | "right" | "none";

interface TooltipPlacement {
  top: number;
  left: number;
  width: number;
  arrowDir: ArrowDirection;
  arrowOffset: number; // offset along edge in px
}

const PADDING = 8; // padding around spotlight target
const ARROW_SIZE = 10; // size of the pointer arrow

export function SpotlightTour() {
  const { tourActive, tourSteps, tourStep, nextTourStep, prevTourStep, endTour } = useOnboarding();
  const [spotRect, setSpotRect] = useState<SpotRect | null>(null);
  const [placement, setPlacement] = useState<TooltipPlacement>({
    top: 0,
    left: 0,
    width: 380,
    arrowDir: "none",
    arrowOffset: 20,
  });
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = tourSteps[tourStep];

  // Resolve target element (supporting comma-separated selector fallbacks)
  const findTargetElement = useCallback((targetSelector: string | null): Element | null => {
    if (!targetSelector) return null;
    const selectors = targetSelector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }, []);

  const calculatePosition = useCallback(() => {
    if (!currentStep) return;

    const el = findTargetElement(currentStep.target);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(410, vw - 28);
    const estimatedCardHeight = 280;

    if (!el) {
      // Center fallback
      setSpotRect(null);
      setPlacement({
        top: Math.max(20, vh / 2 - estimatedCardHeight / 2),
        left: vw / 2 - cardWidth / 2,
        width: cardWidth,
        arrowDir: "none",
        arrowOffset: 0,
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const spot: SpotRect = {
      top: Math.max(0, rect.top - PADDING),
      left: Math.max(0, rect.left - PADDING),
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    };
    setSpotRect(spot);

    // Target center coordinates
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;

    let pref = currentStep.placement || "bottom";
    let calculatedTop = 0;
    let calculatedLeft = 0;
    let arrowDir: ArrowDirection = "up";
    let arrowOffset = 0;

    // Check if bottom fits
    const spaceBelow = vh - (rect.bottom + PADDING);
    const spaceAbove = rect.top - PADDING;
    const spaceRight = vw - (rect.right + PADDING);
    const spaceLeft = rect.left - PADDING;

    if (pref === "bottom" && spaceBelow < estimatedCardHeight + 24 && spaceAbove > estimatedCardHeight + 24) {
      pref = "top";
    } else if (pref === "top" && spaceAbove < estimatedCardHeight + 24 && spaceBelow > estimatedCardHeight + 24) {
      pref = "bottom";
    } else if (pref === "right" && spaceRight < cardWidth + 20 && spaceBelow > estimatedCardHeight + 20) {
      pref = "bottom";
    } else if (pref === "left" && spaceLeft < cardWidth + 20 && spaceBelow > estimatedCardHeight + 20) {
      pref = "bottom";
    }

    if (pref === "bottom") {
      calculatedTop = rect.bottom + PADDING + ARROW_SIZE + 4;
      calculatedLeft = targetCenterX - cardWidth / 2;
      arrowDir = "up";
      arrowOffset = cardWidth / 2;
    } else if (pref === "top") {
      calculatedTop = rect.top - PADDING - ARROW_SIZE - estimatedCardHeight - 4;
      calculatedLeft = targetCenterX - cardWidth / 2;
      arrowDir = "down";
      arrowOffset = cardWidth / 2;
    } else if (pref === "right") {
      calculatedTop = targetCenterY - estimatedCardHeight / 2;
      calculatedLeft = rect.right + PADDING + ARROW_SIZE + 4;
      arrowDir = "left";
      arrowOffset = estimatedCardHeight / 2;
    } else if (pref === "left") {
      calculatedTop = targetCenterY - estimatedCardHeight / 2;
      calculatedLeft = rect.left - PADDING - ARROW_SIZE - cardWidth - 4;
      arrowDir = "right";
      arrowOffset = estimatedCardHeight / 2;
    } else {
      // Center
      calculatedTop = vh / 2 - estimatedCardHeight / 2;
      calculatedLeft = vw / 2 - cardWidth / 2;
      arrowDir = "none";
      arrowOffset = 0;
    }

    // Clamp horizontal position to viewport
    const clampedLeft = Math.max(14, Math.min(vw - cardWidth - 14, calculatedLeft));
    // Recompute arrow offset so arrow always points precisely at targetCenterX
    if (arrowDir === "up" || arrowDir === "down") {
      arrowOffset = Math.max(24, Math.min(cardWidth - 24, targetCenterX - clampedLeft));
    }

    // Clamp vertical position
    const clampedTop = Math.max(16, Math.min(vh - estimatedCardHeight - 16, calculatedTop));

    setPlacement({
      top: clampedTop,
      left: clampedLeft,
      width: cardWidth,
      arrowDir,
      arrowOffset,
    });
  }, [currentStep, findTargetElement]);

  // Position and scroll on step change
  useEffect(() => {
    if (!tourActive || !currentStep) {
      setVisible(false);
      return;
    }

    const el = findTargetElement(currentStep.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      const timer = setTimeout(() => {
        calculatePosition();
        setVisible(true);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      calculatePosition();
      setVisible(true);
    }
  }, [tourActive, tourStep, currentStep, calculatePosition, findTargetElement]);

  // Listen for resize and scroll to keep spotlight tight
  useEffect(() => {
    if (!tourActive) return;
    const handleUpdate = () => calculatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [tourActive, calculatePosition]);

  // Keyboard navigation listener
  useEffect(() => {
    if (!tourActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextTourStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevTourStep();
      } else if (e.key === "Escape") {
        e.preventDefault();
        endTour();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tourActive, nextTourStep, prevTourStep, endTour]);

  if (!tourActive || !currentStep) return null;

  const progress = ((tourStep + 1) / tourSteps.length) * 100;
  const isLast = tourStep === tourSteps.length - 1;

  return (
    <>
      {/* ── 1. SPOTLIGHT CUTOUT OVERLAY ───────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          zIndex: 99980,
          opacity: visible ? 1 : 0,
        }}
      >
        {!spotRect ? (
          // Full dark backdrop for center steps
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
        ) : (
          <>
            {/* Top mask */}
            <div
              className="absolute top-0 left-0 right-0 bg-black/65 backdrop-blur-[2px] transition-all duration-300"
              style={{ height: `${spotRect.top}px` }}
            />
            {/* Bottom mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/65 backdrop-blur-[2px] transition-all duration-300"
              style={{ top: `${spotRect.top + spotRect.height}px` }}
            />
            {/* Left mask */}
            <div
              className="absolute left-0 bg-black/65 backdrop-blur-[2px] transition-all duration-300"
              style={{
                top: `${spotRect.top}px`,
                width: `${spotRect.left}px`,
                height: `${spotRect.height}px`,
              }}
            />
            {/* Right mask */}
            <div
              className="absolute right-0 bg-black/65 backdrop-blur-[2px] transition-all duration-300"
              style={{
                top: `${spotRect.top}px`,
                left: `${spotRect.left + spotRect.width}px`,
                height: `${spotRect.height}px`,
              }}
            />
            {/* Active Spotlight Target Frame & Glow */}
            <div
              className="absolute rounded-2xl transition-all duration-300 pointer-events-none"
              style={{
                top: `${spotRect.top - 3}px`,
                left: `${spotRect.left - 3}px`,
                width: `${spotRect.width + 6}px`,
                height: `${spotRect.height + 6}px`,
                border: "2.5px solid #0758fc",
                boxShadow: "0 0 0 4px rgba(7,88,252,0.22), 0 0 28px rgba(7,88,252,0.35)",
                animation: "tourTargetPulse 2s ease-in-out infinite",
              }}
            />
          </>
        )}
      </div>

      {/* ── 2. CLICK-OUTSIDE SHIELD ──────────────────────────────── */}
      <div
        className="fixed inset-0 z-[99985] cursor-pointer"
        onClick={nextTourStep}
        title="Click anywhere or press Right Arrow to advance"
      />

      {/* ── 3. NATIVE THEME TOUR CARD ────────────────────────────── */}
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[99999] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-blue-500/15 dark:shadow-black/70 transition-all duration-300 pointer-events-auto"
        style={{
          top: `${placement.top}px`,
          left: `${placement.left}px`,
          width: `${placement.width}px`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {/* Dynamic Directional Pointer Arrow (caret) */}
        {placement.arrowDir === "up" && (
          <div
            className="absolute -top-[9px] w-0 h-0 pointer-events-none"
            style={{
              left: `${placement.arrowOffset}px`,
              transform: "translateX(-50%)",
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderBottom: "9px solid var(--tour-arrow-color, #ffffff)",
              filter: "drop-shadow(0 -2px 1px rgba(0,0,0,0.08))",
            }}
          />
        )}
        {placement.arrowDir === "down" && (
          <div
            className="absolute -bottom-[9px] w-0 h-0 pointer-events-none"
            style={{
              left: `${placement.arrowOffset}px`,
              transform: "translateX(-50%)",
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderTop: "9px solid var(--tour-arrow-color, #ffffff)",
              filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.08))",
            }}
          />
        )}
        {placement.arrowDir === "left" && (
          <div
            className="absolute -left-[9px] w-0 h-0 pointer-events-none"
            style={{
              top: `${placement.arrowOffset}px`,
              transform: "translateY(-50%)",
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              borderRight: "9px solid var(--tour-arrow-color, #ffffff)",
              filter: "drop-shadow(-2px 0 1px rgba(0,0,0,0.08))",
            }}
          />
        )}
        {placement.arrowDir === "right" && (
          <div
            className="absolute -right-[9px] w-0 h-0 pointer-events-none"
            style={{
              top: `${placement.arrowOffset}px`,
              transform: "translateY(-50%)",
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              borderLeft: "9px solid var(--tour-arrow-color, #ffffff)",
              filter: "drop-shadow(2px 0 1px rgba(0,0,0,0.08))",
            }}
          />
        )}

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-[#0758fc] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Top Header: Badge + Step counter + Close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#0758fc] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {currentStep.badge || "GUIDE"}
            </span>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
              Step {tourStep + 1} of {tourSteps.length}
            </span>
          </div>

          <button
            type="button"
            onClick={endTour}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Skip Tour"
            title="Skip Tour (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Title & Icon */}
        <div className="flex items-center gap-2.5 mb-2">
          {currentStep.icon && (
            <span className="text-2xl shrink-0 leading-none">{currentStep.icon}</span>
          )}
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug">
            {currentStep.title}
          </h3>
        </div>

        {/* Primary Description */}
        <p className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          {currentStep.description}
        </p>

        {/* Actionable "How to Navigate" Callout Box */}
        {currentStep.navigationGuide && (
          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-3 mb-3 flex items-start gap-2.5 text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
            <Compass size={16} className="text-[#0758fc] shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-[#0758fc] block mb-0.5 text-[11px] uppercase tracking-wider">
                How to navigate:
              </span>
              <span>{currentStep.navigationGuide}</span>
            </div>
          </div>
        )}

        {/* Optional Pro Tip Callout Box */}
        {currentStep.tip && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-2.5 mb-4 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[11px]">
              <strong className="font-extrabold">Tip: </strong>
              {currentStep.tip}
            </span>
          </div>
        )}

        {/* Bottom Actions: Back, Next/Done, Skip */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/80 mt-2">
          <button
            type="button"
            onClick={endTour}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer px-1 py-1"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {tourStep > 0 && (
              <button
                type="button"
                onClick={prevTourStep}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            <button
              type="button"
              onClick={nextTourStep}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#0758fc] hover:bg-[#054fe0] px-4 sm:px-5 py-2 rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              <span>{isLast ? "Done" : "Next"}</span>
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Global CSS animation for target spotlight */}
      <style>{`
        @keyframes tourTargetPulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(7, 88, 252, 0.2), 0 0 20px rgba(7, 88, 252, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(7, 88, 252, 0.35), 0 0 32px rgba(7, 88, 252, 0.55);
          }
        }
        :root {
          --tour-arrow-color: #ffffff;
        }
        .dark {
          --tour-arrow-color: #111827;
        }
      `}</style>
    </>
  );
}
