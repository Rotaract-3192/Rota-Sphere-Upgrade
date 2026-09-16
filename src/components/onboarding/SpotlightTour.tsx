"use client";

/**
 * SpotlightTour — Adaptive, dynamic guided tour aligned with RotaSphere's native design theme.
 * Fully optimized for both Mobile and PC viewports:
 * - DYNAMIC SIZING:
 *   * "expanded": Spacious centered hero modal for Welcome step with District 3192 branding.
 *   * "compact": Ultra-sleek, minimal height (~90px on mobile) for all element pointers.
 * - MOBILE ARCHITECTURE (vw < 768):
 *   * Docked tour card at bottom of screen with high z-index (z-[99999]).
 *   * Immune to height overflows, off-screen clipping, and scroll displacement.
 *   * Smoothly scrolls target element just below sticky TopNav (74px offset).
 *   * If target is near bottom nav dock, docks safely above it.
 * - PC DESKTOP ARCHITECTURE (vw >= 768):
 *   * Contextual floating tooltip with pointer arrow pointing to target center.
 *   * Hard viewport clamping strictly between 16px and (vh - cardHeight - 16px).
 * - Keyboard navigation (← / → / Esc) on PC.
 * - Touch-safe controls on mobile (backdrop taps do not skip).
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useOnboarding } from "./OnboardingProvider";
import {
  Compass,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  X,
  Ticket,
  QrCode,
  Users,
} from "lucide-react";

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
  arrowOffset: number;
}

const PADDING = 8; // padding around spotlight cutout
const ARROW_SIZE = 9; // size of the pointer arrow

export function SpotlightTour() {
  const { tourActive, tourSteps, tourStep, nextTourStep, prevTourStep, endTour } = useOnboarding();
  const [spotRect, setSpotRect] = useState<SpotRect | null>(null);
  const [placement, setPlacement] = useState<TooltipPlacement>({
    top: 0,
    left: 0,
    width: 320,
    arrowDir: "none",
    arrowOffset: 20,
  });
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = tourSteps[tourStep];

  // Resolve visible target element (supporting comma-separated selector fallbacks)
  const findTargetElement = useCallback((targetSelector: string | null): Element | null => {
    if (!targetSelector) return null;
    const selectors = targetSelector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const style = window.getComputedStyle(el);
        if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
          const rect = el.getBoundingClientRect();
          // Element must have actual visible dimensions on screen
          if (rect.width > 2 && rect.height > 2) {
            return el;
          }
        }
      }
    }
    return null;
  }, []);

  // Check if an element is fixed or sticky
  const isFixedOrSticky = useCallback((el: Element): boolean => {
    let cur: Element | null = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      const pos = window.getComputedStyle(cur).position;
      if (pos === "fixed" || pos === "sticky") return true;
      cur = cur.parentElement;
    }
    return false;
  }, []);

  const calculatePosition = useCallback(() => {
    if (!currentStep) return;

    const el = findTargetElement(currentStep.target);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;

    const isWelcome = currentStep.size === "expanded" || !el;

    // ── 1. CENTERED HERO MODAL (Welcome step) ──────────────────────
    if (isWelcome) {
      setSpotRect(null);
      const cardWidth = isMobile ? Math.min(420, vw - 24) : 480;
      const measuredHeight = cardRef.current?.getBoundingClientRect().height || 360;
      const cardHeight = Math.min(measuredHeight, vh * 0.9);
      setPlacement({
        top: Math.max(16, (vh - cardHeight) / 2),
        left: Math.max(12, (vw - cardWidth) / 2),
        width: cardWidth,
        arrowDir: "none",
        arrowOffset: 0,
      });
      return;
    }

    // ── 2. CALCULATE SPOTLIGHT CUTOUT ─────────────────────────────
    const rect = el.getBoundingClientRect();
    const spot: SpotRect = {
      top: Math.max(0, rect.top - PADDING),
      left: Math.max(0, rect.left - PADDING),
      width: Math.min(vw, rect.width + PADDING * 2),
      height: rect.height + PADDING * 2,
    };
    setSpotRect(spot);

    // ── 3. MOBILE PLACEMENT: BULLETPROOF BOTTOM DOCKED CARD ────────
    if (isMobile) {
      const cardWidth = Math.min(390, vw - 20);
      const measuredHeight = cardRef.current?.getBoundingClientRect().height || 95;
      const cardHeight = Math.min(measuredHeight, 135);

      // Check if spotlighted element is at the bottom of the screen (e.g. bottom navigation dock)
      const isTargetNearBottom = rect.bottom > vh - 90;

      let topPosition = vh - cardHeight - 12;
      if (isTargetNearBottom) {
        // Place card right above the bottom nav dock
        topPosition = Math.max(12, rect.top - cardHeight - 12);
      }

      setPlacement({
        top: topPosition,
        left: Math.max(10, (vw - cardWidth) / 2),
        width: cardWidth,
        arrowDir: "none",
        arrowOffset: 0,
      });
      return;
    }

    // ── 4. DESKTOP PC PLACEMENT: CONTEXTUAL POINTER ARROW ──────────
    const cardWidth = currentStep.size === "medium" ? 370 : 330;
    const measuredHeight = cardRef.current?.getBoundingClientRect().height || 115;
    const cardHeight = Math.min(measuredHeight, vh * 0.85);

    const targetCenterX = Math.max(0, Math.min(vw, rect.left + rect.width / 2));
    const spaceAbove = rect.top - PADDING;
    const spaceBelow = vh - (rect.bottom + PADDING);

    let arrowDir: ArrowDirection = "up";
    let calculatedTop = 0;

    const isGiant = rect.height > vh * 0.48;

    if (
      isGiant ||
      (spaceBelow < cardHeight + ARROW_SIZE + 10 && spaceAbove < cardHeight + ARROW_SIZE + 10)
    ) {
      calculatedTop = spaceBelow >= spaceAbove ? vh - cardHeight - 16 : 16;
      arrowDir = "none";
    } else if (spaceBelow >= cardHeight + ARROW_SIZE + 10) {
      calculatedTop = rect.bottom + PADDING + ARROW_SIZE + 4;
      arrowDir = "up";
    } else {
      calculatedTop = rect.top - PADDING - ARROW_SIZE - cardHeight - 4;
      arrowDir = "down";
    }

    // Strict clamping within PC viewport
    const minTop = 16;
    const maxTop = Math.max(minTop, vh - cardHeight - 16);
    const clampedTop = Math.max(minTop, Math.min(maxTop, calculatedTop));

    const minLeft = 16;
    const maxLeft = Math.max(minLeft, vw - cardWidth - 16);
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetCenterX - cardWidth / 2));
    const arrowOffset = Math.max(22, Math.min(cardWidth - 22, targetCenterX - clampedLeft));

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
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      // On mobile, card occupies bottom ~120px.
      // Element should be visible above this zone and below TopNav (64px).
      const visibleZoneBottom = isMobile ? vh - 130 : vh - 60;
      const isAlreadyVisible = rect.top >= 70 && rect.bottom <= visibleZoneBottom;

      if (!isFixedOrSticky(el) && !isAlreadyVisible) {
        // Scroll so element's top starts smoothly 74px below screen top (clearing sticky TopNav)
        const elementTop = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementTop - 74),
          behavior: "smooth",
        });
      }
    }

    calculatePosition();
    setVisible(true);
  }, [tourActive, tourStep, currentStep, calculatePosition, findTargetElement, isFixedOrSticky]);

  // Re-calculate position whenever card content renders/resizes
  useEffect(() => {
    if (!tourActive || !cardRef.current) return;
    const ro = new ResizeObserver(() => {
      calculatePosition();
    });
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [tourActive, calculatePosition]);

  // Keep spotlight synced on resize and scroll
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

  // Keyboard navigation on PC
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

  const isLast = tourStep === tourSteps.length - 1;
  const isExpanded = currentStep.size === "expanded";

  return (
    <>
      {/* ── 1. SPOTLIGHT CUTOUT OVERLAY ───────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-200"
        style={{
          zIndex: 99980,
          opacity: visible ? 1 : 0,
        }}
      >
        {!spotRect ? (
          // Dark backdrop for centered steps
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />
        ) : (
          <>
            {/* Top mask */}
            <div
              className="absolute top-0 left-0 right-0 bg-black/70 backdrop-blur-[1px] transition-all duration-150"
              style={{ height: `${spotRect.top}px` }}
            />
            {/* Bottom mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/70 backdrop-blur-[1px] transition-all duration-150"
              style={{ top: `${spotRect.top + spotRect.height}px` }}
            />
            {/* Left mask */}
            <div
              className="absolute left-0 bg-black/70 backdrop-blur-[1px] transition-all duration-150"
              style={{
                top: `${spotRect.top}px`,
                width: `${spotRect.left}px`,
                height: `${spotRect.height}px`,
              }}
            />
            {/* Right mask */}
            <div
              className="absolute right-0 bg-black/70 backdrop-blur-[1px] transition-all duration-150"
              style={{
                top: `${spotRect.top}px`,
                left: `${spotRect.left + spotRect.width}px`,
                height: `${spotRect.height}px`,
              }}
            />
            {/* Spotlight Target Glowing Highlight Frame */}
            <div
              className="absolute rounded-2xl transition-all duration-150 pointer-events-none"
              style={{
                top: `${spotRect.top - 2}px`,
                left: `${spotRect.left - 2}px`,
                width: `${spotRect.width + 4}px`,
                height: `${spotRect.height + 4}px`,
                border: "2px solid #0758fc",
                boxShadow: "0 0 0 3px rgba(7,88,252,0.3), 0 0 20px rgba(7,88,252,0.4)",
              }}
            />
          </>
        )}
      </div>

      {/* ── 2. CLICK-OUTSIDE SHIELD ──────────────────────────────── */}
      <div
        className="fixed inset-0 z-[99985] cursor-default md:cursor-pointer"
        onClick={() => {
          // On PC click advances; on touch devices backdrop tap is safe
          if (typeof window !== "undefined" && window.innerWidth >= 768) {
            nextTourStep();
          }
        }}
        aria-hidden="true"
      />

      {/* ── 3. DYNAMICALLY ADAPTIVE TOUR CARD ────────────────────── */}
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className={`fixed z-[99999] bg-white dark:bg-[#0c1427] text-gray-900 dark:text-gray-100 border border-blue-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-500/15 dark:shadow-black/80 transition-all duration-200 pointer-events-auto ${
          isExpanded ? "p-5 sm:p-7 max-h-[90dvh] overflow-y-auto" : "p-2.5 sm:p-3.5"
        }`}
        style={{
          top: `${placement.top}px`,
          left: `${placement.left}px`,
          width: `${placement.width}px`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
        }}
      >
        {/* Pointer Arrow (Desktop only) */}
        {placement.arrowDir === "up" && (
          <div
            className="absolute -top-[8px] w-0 h-0 pointer-events-none"
            style={{
              left: `${placement.arrowOffset}px`,
              transform: "translateX(-50%)",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "8px solid var(--tour-arrow-color, #ffffff)",
              filter: "drop-shadow(0 -2px 1px rgba(0,0,0,0.08))",
            }}
          />
        )}
        {placement.arrowDir === "down" && (
          <div
            className="absolute -bottom-[8px] w-0 h-0 pointer-events-none"
            style={{
              left: `${placement.arrowOffset}px`,
              transform: "translateX(-50%)",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid var(--tour-arrow-color, #ffffff)",
              filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.08))",
            }}
          />
        )}

        {/* ── VARIANT A: BIG EXPANDED HERO MODAL (Welcome / Overview) ── */}
        {isExpanded ? (
          <div className="space-y-4">
            {/* Top Close Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#0758fc] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {currentStep.badge || "DISTRICT 3192"}
                </span>
                <span className="text-xs font-bold text-gray-400">Step 1 of {tourSteps.length}</span>
              </div>
              <button
                type="button"
                onClick={endTour}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Hero Brand Header */}
            <div className="flex items-center gap-3 pt-1">
              <div className="relative w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-2 flex items-center justify-center shrink-0">
                <Image
                  src="/brand/logo.png"
                  alt="District 3192 Logo"
                  fill
                  className="object-contain p-1.5"
                  priority
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  {currentStep.title}
                </h2>
                <span className="text-xs font-bold text-[#0758fc]">Official District Platform</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentStep.description}
            </p>

            {/* 3 Highlight Feature Pillars */}
            <div className="grid grid-cols-3 gap-2 py-1">
              <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-center">
                <Users size={16} className="mx-auto text-[#0758fc] mb-1" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block leading-tight">
                  85+ Clubs
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-center">
                <QrCode size={16} className="mx-auto text-emerald-500 mb-1" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block leading-tight">
                  Instant QR
                </span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-center">
                <Ticket size={16} className="mx-auto text-purple-500 mb-1" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block leading-tight">
                  Direct UPI
                </span>
              </div>
            </div>

            {/* Navigation guidance callout */}
            {currentStep.navigationGuide && (
              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-2.5 flex items-start gap-2 text-xs text-blue-950 dark:text-blue-200">
                <Compass size={14} className="text-[#0758fc] shrink-0 mt-0.5" />
                <span>{currentStep.navigationGuide}</span>
              </div>
            )}

            {/* Tip */}
            {currentStep.tip && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-300">
                <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <span>{currentStep.tip}</span>
              </div>
            )}

            {/* Big Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={nextTourStep}
                className="w-full py-3 rounded-xl bg-[#0758fc] hover:bg-[#054fe0] active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
              >
                <span>Start Interactive Guide</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* ── VARIANT B: COMPACT ELEMENT CALLOUT (SMALL & SLEEK) ── */
          <div>
            {/* Header: Chip Badge + Step Counter + Close */}
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-[#0758fc] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {currentStep.badge || "GUIDE"}
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                  {tourStep + 1}/{tourSteps.length}
                </span>
              </div>

              <button
                type="button"
                onClick={endTour}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Skip Tour"
                title="Exit (Esc)"
              >
                <X size={14} />
              </button>
            </div>

            {/* Title with Icon */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {currentStep.icon && (
                <span className="text-sm shrink-0 leading-none">{currentStep.icon}</span>
              )}
              <h3 className="text-xs font-black text-gray-900 dark:text-white leading-tight truncate">
                {currentStep.title}
              </h3>
            </div>

            {/* 1-sentence prompt description */}
            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug mb-1.5 line-clamp-2">
              {currentStep.description}
            </p>

            {/* Bottom Controls: Skip, Back, Next */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800/80">
              <button
                type="button"
                onClick={endTour}
                className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer py-0.5 px-1"
              >
                Skip
              </button>

              <div className="flex items-center gap-1.5">
                {tourStep > 0 && (
                  <button
                    type="button"
                    onClick={prevTourStep}
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronLeft size={11} /> Back
                  </button>
                )}

                <button
                  type="button"
                  onClick={nextTourStep}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-[#0758fc] hover:bg-[#054fe0] px-3 py-1 rounded-lg shadow-xs shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <span>{isLast ? "Done" : "Next"}</span>
                  {!isLast && <ChevronRight size={11} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global CSS animation for target spotlight */}
      <style>{`
        :root {
          --tour-arrow-color: #ffffff;
        }
        .dark {
          --tour-arrow-color: #0c1427;
        }
      `}</style>
    </>
  );
}
