"use client";

/**
 * OnboardingProvider — Global context managing welcome modal + tour state.
 * Persists via localStorage. Handles first-visit (pre-login) + post-login shorter version.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { TourStep } from "./tourSteps";

interface OnboardingContextValue {
  // Welcome modal
  showWelcome: boolean;
  dismissWelcome: () => void;

  // Spotlight tour
  tourSteps: TourStep[];
  tourActive: boolean;
  tourStep: number;
  startTour: (steps: TourStep[]) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;

  // Help button
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;

  // Has the user ever seen the onboarding?
  hasSeenOnboarding: boolean;
}

const defaultContextValue: OnboardingContextValue = {
  showWelcome: false,
  dismissWelcome: () => {},
  tourSteps: [],
  tourActive: false,
  tourStep: 0,
  startTour: () => {},
  nextTourStep: () => {},
  prevTourStep: () => {},
  endTour: () => {},
  showHelp: false,
  setShowHelp: () => {},
  hasSeenOnboarding: true,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  return ctx || defaultContextValue;
}

const STORAGE_KEY_WELCOME = "rs_welcome_seen_v2";
const STORAGE_KEY_ONBOARDING = "rs_onboarding_done_v2";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const seen = localStorage.getItem(STORAGE_KEY_WELCOME);
      const onboardingDone = localStorage.getItem(STORAGE_KEY_ONBOARDING);
      setHasSeenOnboarding(Boolean(onboardingDone));
      if (!seen) {
        // Small delay so page renders first
        setTimeout(() => setShowWelcome(true), 800);
      }
    } catch {}
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      localStorage.setItem(STORAGE_KEY_WELCOME, "1");
    } catch {}
  }, []);

  const startTour = useCallback((steps: TourStep[]) => {
    setTourSteps(steps);
    setTourStep(0);
    setTourActive(true);
    setShowHelp(false);
  }, []);

  const nextTourStep = useCallback(() => {
    setTourStep((s) => {
      if (s >= tourSteps.length - 1) {
        // Tour complete
        setTourActive(false);
        try {
          localStorage.setItem(STORAGE_KEY_ONBOARDING, "1");
        } catch {}
        setHasSeenOnboarding(true);
        return 0;
      }
      return s + 1;
    });
  }, [tourSteps.length]);

  const prevTourStep = useCallback(() => {
    setTourStep((s) => Math.max(0, s - 1));
  }, []);

  const endTour = useCallback(() => {
    setTourActive(false);
    setTourStep(0);
    try {
      localStorage.setItem(STORAGE_KEY_ONBOARDING, "1");
    } catch {}
    setHasSeenOnboarding(true);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        showWelcome,
        dismissWelcome,
        tourSteps,
        tourActive,
        tourStep,
        startTour,
        nextTourStep,
        prevTourStep,
        endTour,
        showHelp,
        setShowHelp,
        hasSeenOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
