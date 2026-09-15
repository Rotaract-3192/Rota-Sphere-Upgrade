"use client";

/**
 * SpotlightTour — Interactive guided tour with spotlight overlay.
 * Highlights real DOM elements using getBoundingClientRect + CSS box-shadow.
 * Pure CSS transitions, no external animation library.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useOnboarding } from "./OnboardingProvider";

interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10; // px padding around spotlight target

export function SpotlightTour() {
  const { tourActive, tourSteps, tourStep, nextTourStep, prevTourStep, endTour } = useOnboarding();
  const [spotRect, setSpotRect] = useState<SpotRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; maxWidth: number }>({ top: 0, left: 0, maxWidth: 360 });
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  const currentStep = tourSteps[tourStep];

  const measure = useCallback(() => {
    if (!currentStep?.target) {
      setSpotRect(null);
      setTooltipPos({ top: window.innerHeight / 2 - 120, left: window.innerWidth / 2, maxWidth: 360 });
      return;
    }

    const el = document.querySelector(currentStep.target);
    if (!el) {
      setSpotRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const spot: SpotRect = {
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    };
    setSpotRect(spot);

    // Compute tooltip position
    const placement = currentStep.placement || "bottom";
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipW = Math.min(360, vw - 32);
    let top = 0;
    let left = rect.left + rect.width / 2;

    if (placement === "bottom") {
      top = rect.bottom + PADDING + 16;
    } else if (placement === "top") {
      top = rect.top - PADDING - 16 - 200; // approximate tooltip height
    } else if (placement === "right") {
      top = rect.top + rect.height / 2 - 100;
      left = rect.right + PADDING + 16 + tooltipW / 2;
    } else if (placement === "left") {
      top = rect.top + rect.height / 2 - 100;
      left = rect.left - PADDING - 16 - tooltipW / 2;
    } else {
      // center
      top = vh / 2 - 120;
      left = vw / 2;
    }

    // Clamp to viewport
    left = Math.max(tooltipW / 2 + 16, Math.min(vw - tooltipW / 2 - 16, left));
    top = Math.max(16, Math.min(vh - 220, top));

    setTooltipPos({ top, left, maxWidth: tooltipW });
  }, [currentStep]);

  useEffect(() => {
    if (!tourActive) {
      setVisible(false);
      return;
    }
    // Scroll target into view then measure
    const el = currentStep?.target ? document.querySelector(currentStep.target) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wait for scroll to settle
      setTimeout(() => {
        measure();
        setVisible(true);
      }, 400);
    } else {
      measure();
      setVisible(true);
    }
  }, [tourActive, tourStep, measure, currentStep]);

  // Re-measure on resize
  useEffect(() => {
    if (!tourActive) return;
    const onResize = () => { measure(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [tourActive, measure]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  if (!tourActive || !currentStep) return null;

  const isCenter = !currentStep.target || currentStep.placement === "center";
  const progress = ((tourStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Dark overlay — split into 4 rectangles around the spotlight */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99990,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {isCenter || !spotRect ? (
          // Full overlay for center steps
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)" }} />
        ) : (
          <>
            {/* Top */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${spotRect.top}px`, background: "rgba(0,0,0,0.78)" }} />
            {/* Bottom */}
            <div style={{ position: "absolute", top: `${spotRect.top + spotRect.height}px`, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.78)" }} />
            {/* Left */}
            <div style={{ position: "absolute", top: `${spotRect.top}px`, left: 0, width: `${spotRect.left}px`, height: `${spotRect.height}px`, background: "rgba(0,0,0,0.78)" }} />
            {/* Right */}
            <div style={{ position: "absolute", top: `${spotRect.top}px`, left: `${spotRect.left + spotRect.width}px`, right: 0, height: `${spotRect.height}px`, background: "rgba(0,0,0,0.78)" }} />
            {/* Spotlight border glow */}
            <div style={{
              position: "absolute",
              top: `${spotRect.top - 3}px`,
              left: `${spotRect.left - 3}px`,
              width: `${spotRect.width + 6}px`,
              height: `${spotRect.height + 6}px`,
              borderRadius: "14px",
              border: "2.5px solid rgba(7,88,252,0.8)",
              boxShadow: "0 0 0 4px rgba(7,88,252,0.2), 0 0 32px rgba(7,88,252,0.35)",
              animation: "spotlightPulse 2s ease-in-out infinite",
            }} />
          </>
        )}
      </div>

      {/* Click-to-advance backdrop (for non-spotlight steps) */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 99991, cursor: "pointer" }}
        onClick={nextTourStep}
      />

      {/* Tooltip card */}
      <div
        style={{
          position: "fixed",
          zIndex: 99999,
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          width: `${tooltipPos.maxWidth}px`,
          background: "linear-gradient(145deg, rgba(15,20,40,0.97) 0%, rgba(10,14,32,0.97) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px",
          padding: "1.5rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(7,88,252,0.2) inset",
          color: "white",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: visible ? 1 : 0,
          transform: `translateX(-50%) translateY(${visible ? 0 : "8px"})`,
          pointerEvents: "all",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", marginBottom: "1.25rem", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: "99px",
            background: "linear-gradient(90deg, #0758fc, #7c3aed)",
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* Step counter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Step {tourStep + 1} of {tourSteps.length}
          </span>
          <button
            onClick={endTour}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "0.8rem", padding: "0 0.25rem" }}
          >
            Skip tour ✕
          </button>
        </div>

        {/* Icon + Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
          {currentStep.icon && (
            <span style={{ fontSize: "1.75rem", flexShrink: 0, lineHeight: 1 }}>{currentStep.icon}</span>
          )}
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.3 }}>{currentStep.title}</h3>
        </div>

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.65, margin: "0 0 1.25rem" }}>
          {currentStep.description}
        </p>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {tourStep > 0 && (
            <button
              onClick={prevTourStep}
              style={{ flex: "0 0 auto", padding: "0.6rem 1rem", borderRadius: "10px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "0.85rem" }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={nextTourStep}
            style={{
              flex: 1,
              padding: "0.65rem",
              borderRadius: "10px",
              background: tourStep === tourSteps.length - 1
                ? "linear-gradient(135deg, #059669, #0d9488)"
                : "linear-gradient(135deg, #0758fc, #7c3aed)",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
              boxShadow: "0 4px 16px rgba(7,88,252,0.3)",
            }}
          >
            {tourStep === tourSteps.length - 1 ? "🎉 Done!" : "Next →"}
          </button>
        </div>
      </div>

      {/* Pulse animation keyframes injected once */}
      <style>{`
        @keyframes spotlightPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(7,88,252,0.15), 0 0 24px rgba(7,88,252,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(7,88,252,0.25), 0 0 48px rgba(7,88,252,0.5); }
        }
      `}</style>
    </>
  );
}
