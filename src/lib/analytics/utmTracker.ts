/**
 * UTM Parameter Tracker
 * Captures, stores, and attaches marketing campaign attribution (utm_source, utm_medium, utm_campaign)
 */

"use client";

import { useEffect } from "react";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export function UtmTracker() {
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
      const collected: Record<string, string> = {};

      utmKeys.forEach((key) => {
        const val = urlParams.get(key);
        if (val) collected[key] = val;
      });

      if (Object.keys(collected).length > 0) {
        const existing = JSON.parse(sessionStorage.getItem("rotasphere_utm") || "{}");
        sessionStorage.setItem("rotasphere_utm", JSON.stringify({ ...existing, ...collected }));
      }
    } catch {}
  }, []);

  return null;
}

export function getStoredUtmParams(): UtmParams {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(sessionStorage.getItem("rotasphere_utm") || "{}");
  } catch {
    return {};
  }
}
