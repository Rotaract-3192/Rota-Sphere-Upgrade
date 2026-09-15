"use client";

import React, { useEffect, useState } from "react";
import { OnboardingProvider } from "./OnboardingProvider";
import { WelcomeModal } from "./WelcomeModal";
import { SpotlightTour } from "./SpotlightTour";
import { HelpButton } from "./HelpButton";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <OnboardingProvider>
      {children}
      {mounted && (
        <>
          <WelcomeModal />
          <SpotlightTour />
          <HelpButton />
        </>
      )}
    </OnboardingProvider>
  );
}
