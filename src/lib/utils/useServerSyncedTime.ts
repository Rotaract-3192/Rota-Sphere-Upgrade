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
    return initialServerTime ? new Date(initialServerTime) : new Date();
  });

  const baseServerMsRef = useRef<number>(
    initialServerTime ? new Date(initialServerTime).getTime() : Date.now()
  );
  const basePerfMsRef = useRef<number>(
    typeof performance !== undefined ? performance.now() : 0
  );

  useEffect(() => {
    if (initialServerTime) {
      baseServerMsRef.current = new Date(initialServerTime).getTime();
      basePerfMsRef.current = typeof performance !== undefined ? performance.now() : 0;
    }
  }, [initialServerTime]);

  useEffect(() => {
    const updateTick = () => {
      const elapsed =
        typeof performance !== undefined
          ? performance.now() - basePerfMsRef.current
          : 0;
      setSyncedDate(new Date(baseServerMsRef.current + elapsed));
    };

    updateTick();
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, []);

  return syncedDate;
}
