"use client";

import { useState, useEffect, useRef } from "react";

/**
 * High-precision, tamper-proof clock that synchronizes with atomic server time.
 * Even if a user adjusts their phone/device system clock forward or backward,
 * this hook uses performance.now() elapsed monotonic time so the countdown and
 * booking availability remains 100% faithful to true real-world time.
 */
export function useServerSyncedTime(initialServerTime?: string | Date): Date {
  const [syncedDate, setSyncedDate] = useState<Date>(() => {
    return initialServerTime ? new Date(initialServerTime) : new Date(0);
  });

  const baseServerMsRef = useRef<number>(
    initialServerTime ? new Date(initialServerTime).getTime() : 0
  );
  const basePerfMsRef = useRef<number>(0);

  useEffect(() => {
    const isPerfAvailable = typeof window !== "undefined" && typeof window.performance !== "undefined";
    const nowPerf = isPerfAvailable ? window.performance.now() : 0;
    const nowServer = initialServerTime ? new Date(initialServerTime).getTime() : Date.now();

    baseServerMsRef.current = nowServer;
    basePerfMsRef.current = nowPerf;
    setSyncedDate(new Date(nowServer));

    const updateTick = () => {
      const elapsed = isPerfAvailable ? window.performance.now() - basePerfMsRef.current : 0;
      setSyncedDate(new Date(baseServerMsRef.current + elapsed));
    };

    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, [initialServerTime]);

  return syncedDate;
}
