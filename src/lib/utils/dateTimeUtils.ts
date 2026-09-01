/**
 * Comprehensive Date, Time, and Timezone Utilities for RotaSphere
 * Handles multi-timezone parsing, unambiguous UTC serialization, and accurate server/client formatting.
 */

export const TIMEZONE_OPTIONS = [
  {
    value: "India Standard Time (IST) - UTC+05:30",
    label: "India Standard Time (IST) - UTC+05:30",
    iana: "Asia/Kolkata",
    shortCode: "IST",
    offsetMinutes: 330,
  },
  {
    value: "Eastern Standard Time (EST) - UTC-5",
    label: "Eastern Standard Time (EST) - UTC-5",
    iana: "America/New_York",
    shortCode: "EST",
    offsetMinutes: -300,
  },
  {
    value: "Universal Coordinated Time (UTC) - UTC+0",
    label: "Universal Coordinated Time (UTC) - UTC+0",
    iana: "UTC",
    shortCode: "UTC",
    offsetMinutes: 0,
  },
  {
    value: "Pacific Standard Time (PST) - UTC-8",
    label: "Pacific Standard Time (PST) - UTC-8",
    iana: "America/Los_Angeles",
    shortCode: "PST",
    offsetMinutes: -480,
  },
  {
    value: "Central European Time (CET) - UTC+1",
    label: "Central European Time (CET) - UTC+1",
    iana: "Europe/Paris",
    shortCode: "CET",
    offsetMinutes: 60,
  },
];

/**
 * Resolves standard IANA timezone name from arbitrary timezone string or database field.
 */
export function resolveIanaTimezone(tzStr?: string | null): string {
  if (!tzStr) return "Asia/Kolkata";
  const str = tzStr.trim();
  const lower = str.toLowerCase();

  const found = TIMEZONE_OPTIONS.find(
    (opt) =>
      opt.value === str ||
      opt.iana.toLowerCase() === lower ||
      opt.shortCode.toLowerCase() === lower
  );
  if (found) return found.iana;

  if (lower.includes("india") || lower.includes("ist") || lower.includes("kolkata") || lower.includes("+05:30")) {
    return "Asia/Kolkata";
  }
  if (lower.includes("eastern") || lower.includes("est") || lower.includes("new_york") || lower.includes("utc-5") || lower.includes("utc-05")) {
    return "America/New_York";
  }
  if (lower.includes("pacific") || lower.includes("pst") || lower.includes("los_angeles") || lower.includes("utc-8") || lower.includes("utc-08")) {
    return "America/Los_Angeles";
  }
  if (lower.includes("central european") || lower.includes("cet") || lower.includes("paris") || lower.includes("berlin") || lower.includes("utc+1") || lower.includes("utc+01")) {
    return "Europe/Paris";
  }
  if (lower.includes("utc") || lower.includes("gmt")) {
    return "UTC";
  }

  // Validate if it's already a recognized IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: str });
    return str;
  } catch {
    return "Asia/Kolkata";
  }
}

/**
 * Returns clean short abbreviation code (e.g. IST, EST, UTC, PST, CET) for badges and UI.
 */
export function formatTimezoneLabel(tzStr?: string | null): string {
  if (!tzStr) return "IST";
  const str = tzStr.trim();
  const lower = str.toLowerCase();

  if (lower.includes("ist") || lower.includes("india") || lower.includes("kolkata") || lower.includes("+05:30")) {
    return "IST";
  }
  if (lower.includes("est") || lower.includes("eastern") || lower.includes("new_york") || lower.includes("utc-5")) {
    return "EST";
  }
  if (lower.includes("pst") || lower.includes("pacific") || lower.includes("los_angeles") || lower.includes("utc-8")) {
    return "PST";
  }
  if (lower.includes("cet") || lower.includes("central european") || lower.includes("paris") || lower.includes("utc+1")) {
    return "CET";
  }
  if (lower.includes("utc") || lower.includes("gmt")) {
    return "UTC";
  }

  const match = str.match(/\(([A-Z]{3,4})\)/);
  if (match) return match[1];

  const firstPart = str.split(" - ")[0].trim();
  return firstPart || "IST";
}

/**
 * Returns timezone offset in minutes for a given timezone description.
 */
export function getTimezoneOffsetMinutes(tzStr?: string | null): number {
  if (!tzStr) return 330; // Default +05:30
  const iana = resolveIanaTimezone(tzStr);
  const found = TIMEZONE_OPTIONS.find((opt) => opt.iana === iana);
  if (found) return found.offsetMinutes;

  if (iana === "Asia/Kolkata") return 330;
  if (iana === "America/New_York") return -300;
  if (iana === "America/Los_Angeles") return -480;
  if (iana === "Europe/Paris") return 60;
  if (iana === "UTC") return 0;

  return 330;
}

/**
 * Combines date string (YYYY-MM-DD) and time string (HH:MM) with specified timezone into a deterministic UTC Date.
 */
export function combineDateAndTimeWithTz(dateStr: string, timeStr: string, tzStr?: string | null): Date | null {
  if (!dateStr) return null;
  const time = timeStr && timeStr.trim() ? timeStr.trim() : "10:00";
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const [hoursStr, minutesStr] = time.split(":");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hours = Number(hoursStr) || 0;
  const minutes = Number(minutesStr) || 0;

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const offsetMinutes = getTimezoneOffsetMinutes(tzStr);
  // UTC ms = Date.UTC(year, month - 1, day, hours, minutes) - offsetMinutes * 60,000
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - offsetMinutes * 60 * 1000;
  const d = new Date(utcMs);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date/ISO string to YYYY-MM-DD in the target timezone (or local if none provided).
 */
export function formatDateStringToInput(dateVal: Date | string | number | null | undefined, tzStr?: string | null): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" || typeof dateVal === "number" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const timeZone = tzStr ? resolveIanaTimezone(tzStr) : undefined;
  
  // Format to parts in given timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // "YYYY-MM-DD"
}

/**
 * Formats a Date/ISO string to HH:MM in the target timezone (or local if none provided).
 */
export function formatTimeStringToInput(dateVal: Date | string | number | null | undefined, tzStr?: string | null): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" || typeof dateVal === "number" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const timeZone = tzStr ? resolveIanaTimezone(tzStr) : undefined;
  
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const hour = parts.find((p) => p.type === "hour")?.value || "10";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";
  return `${hour}:${minute}`;
}

/**
 * Formats event date display string with accurate timezone context.
 */
export function formatEventDateDisplay(dateVal: Date | string | number, tzStr?: string | null): string {
  const d = typeof dateVal === "string" || typeof dateVal === "number" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const timeZone = resolveIanaTimezone(tzStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone,
  });
}

/**
 * Formats event time display string (e.g. 08:00 am or 8:00 am) with accurate timezone context.
 */
export function formatEventTimeDisplay(dateVal: Date | string | number, tzStr?: string | null): string {
  const d = typeof dateVal === "string" || typeof dateVal === "number" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const timeZone = resolveIanaTimezone(tzStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}
