/**
 * District 3192 Zone & Club Resolver Engine
 * Standardizes club name lookups and automatically maps delegates to official District 3192 Zones
 * (e.g. Taranga, Pravaha, Varuna, Arnava, etc.) for attendance and awards tallying.
 */

import { DISTRICT_3192_CLUBS } from "@/lib/data/districtClubsData";

// Lookup index: normalized club name -> zone
const CLUB_ZONE_MAP = new Map<string, string>();
const STANDARDIZED_CLUBS: Array<{ name: string; zone: string; partnerClub?: string }> = [];

function cleanClubKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/rotaract club of /gi, "")
    .replace(/rotary club of /gi, "")
    .replace(/rac /gi, "")
    .replace(/rc /gi, "")
    .replace(/[^a-z0-9]/gi, "");
}

// Build internal indexed lookup
for (const club of DISTRICT_3192_CLUBS) {
  const normKey = cleanClubKey(club.name);
  if (normKey && club.zone) {
    CLUB_ZONE_MAP.set(normKey, club.zone);
    CLUB_ZONE_MAP.set(club.name.toLowerCase().trim(), club.zone);
  }
  STANDARDIZED_CLUBS.push({
    name: club.name,
    zone: club.zone || "District 3192",
    partnerClub: club.partnerClub,
  });
}

/**
 * Returns all 85 authentic District 3192 clubs with their official zones for UI selectors
 */
export function getDistrictClubsWithZones(): Array<{ name: string; zone: string }> {
  return STANDARDIZED_CLUBS;
}

/**
 * Resolves official zone for a given club name string
 */
export function getClubZone(rawClubName?: string | null): string {
  if (!rawClubName || typeof rawClubName !== "string") return "General / Unassigned";
  const trimmed = rawClubName.trim();
  if (!trimmed) return "General / Unassigned";

  // Exact lowercase match
  const exactMatch = CLUB_ZONE_MAP.get(trimmed.toLowerCase());
  if (exactMatch) return exactMatch;

  // Normalized key match
  const cleanKey = cleanClubKey(trimmed);
  const normalizedMatch = CLUB_ZONE_MAP.get(cleanKey);
  if (normalizedMatch) return normalizedMatch;

  // Fuzzy substring match
  for (const [key, zone] of CLUB_ZONE_MAP.entries()) {
    if (key.length > 4 && (cleanKey.includes(key) || key.includes(cleanKey))) {
      return zone;
    }
  }

  // Check if zone is already explicit in the name (e.g., "Zone 1", "Taranga", "Varuna")
  const knownZones = ["Taranga", "Pravaha", "Varuna", "Arnava", "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10"];
  for (const z of knownZones) {
    if (new RegExp(`\\b${z}\\b`, "i").test(trimmed)) {
      return z;
    }
  }

  return "Other / External Club";
}

/**
 * Resolves both Club Name and District Zone from a ticket record or attendee custom answers,
 * along with Rotary affiliation (memberType) and Designation.
 */
export function resolveClubAndZone(ticketOrAttendee: {
  member_type?: string;
  memberType?: string;
  club_name?: string;
  clubName?: string;
  club?: string;
  rotaract_club?: string;
  organization_name?: string;
  designation?: string;
  zone?: string;
  custom_answers?: Record<string, any> | null;
  customAnswers?: Record<string, any> | null;
}): { clubName: string; zone: string; memberType: string; designation: string } {
  const custom = ticketOrAttendee.custom_answers || ticketOrAttendee.customAnswers || {};

  // 1. Resolve memberType
  const rawMemberType =
    ticketOrAttendee.member_type ||
    ticketOrAttendee.memberType ||
    custom.member_type ||
    custom.memberType ||
    custom.affiliation ||
    "Rotaract";
  const memberType = String(rawMemberType);

  // 2. Resolve designation
  const rawDesignation =
    ticketOrAttendee.designation ||
    custom.designation ||
    custom.role ||
    custom.portfolio ||
    "";
  const designation = String(rawDesignation).trim();

  // 3. Check direct fields
  let candidateClub =
    ticketOrAttendee.club_name ||
    ticketOrAttendee.clubName ||
    ticketOrAttendee.club ||
    ticketOrAttendee.rotaract_club ||
    ticketOrAttendee.organization_name ||
    custom.club_name ||
    custom.club ||
    custom.rotaract_club ||
    custom.home_club ||
    custom.college_or_club ||
    "";

  // 4. Check if questions have any club answers
  if (!candidateClub && custom && typeof custom === "object") {
    for (const [k, val] of Object.entries(custom)) {
      if (/club/i.test(k) && typeof val === "string" && val.trim().length > 0) {
        candidateClub = val;
        break;
      }
    }
  }

  // 5. Check if zone is explicitly provided in custom answers
  let explicitZone = ticketOrAttendee.zone || custom.zone || custom.district_zone || "";

  if (candidateClub && typeof candidateClub === "string" && candidateClub.trim().length > 0) {
    const cleanClub = candidateClub.trim();
    const resolvedZone = explicitZone || getClubZone(cleanClub);
    return {
      clubName: cleanClub,
      zone: resolvedZone,
      memberType,
      designation,
    };
  }

  return {
    clubName: memberType === "Non-Rotaract" ? "Non-Rotaract Guest" : "Individual Delegate",
    zone: explicitZone || (memberType === "Non-Rotaract" ? "General / Guest" : "General / Unassigned"),
    memberType,
    designation,
  };
}
