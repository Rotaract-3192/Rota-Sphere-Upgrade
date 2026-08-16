"use server";

/**
 * Check-in Server Actions
 * Wraps ticketService verification and check-in for client components.
 */

import { verifyQRToken, recordCheckIn } from "@/lib/tickets/ticketService";

export async function verifyQRTokenAction(rawToken: string, eventId: string) {
  return await verifyQRToken(rawToken, eventId);
}

export async function recordCheckInAction(ticketId: string, eventId: string, operatorId: string) {
  return await recordCheckIn(ticketId, eventId, operatorId);
}
