/**
 * Ticket Lifecycle & Check-In Validation Service
 */

import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";
import crypto from "crypto";
import type { CheckInResult, SaasTicket } from "@/types/saas";

export function generateSecureTicketToken(ticketId: string, eventId: string): string {
  const secret = process.env.JWT_SECRET ?? "rotasphere-secret-token-key-2026";
  const payload = `${ticketId}:${eventId}:${Date.now()}`;
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  return `RS-${hash.toUpperCase()}`;
}

export interface VerifyCheckInParams {
  qrToken: string;
  eventId: string;
  gateName: string;
  scannerUserId: string;
  deviceInfo?: Record<string, any>;
}

export interface VerifyCheckInResult {
  result: CheckInResult;
  ticket?: SaasTicket;
  attendeeName?: string;
  ticketTierName?: string;
  message: string;
}

export async function processTicketCheckIn(params: VerifyCheckInParams): Promise<VerifyCheckInResult> {
  try {
    // 1. Look up ticket by qr_token and event_id
    const { data: ticket, error } = await supabaseAdmin
      .from("saas_tickets")
      .select("*, saas_ticket_tiers(name)")
      .eq("qr_token", params.qrToken)
      .eq("event_id", params.eventId)
      .single();

    if (error || !ticket) {
      await supabaseAdmin.from("check_in_logs").insert({
        ticket_id: "00000000-0000-0000-0000-000000000000",
        event_id: params.eventId,
        scanner_user_id: params.scannerUserId,
        gate_name: params.gateName,
        result: "INVALID",
        device_info: params.deviceInfo ?? {},
      });

      return {
        result: "INVALID",
        message: "Invalid ticket token. No matching ticket found for this event.",
      };
    }

    const tierName = (ticket as any).saas_ticket_tiers?.name ?? "General";

    // 2. Check for Cancelled / Refunded / Transferred states
    if (ticket.status === "CANCELLED") {
      await logCheckIn(ticket.id, params.eventId, params.scannerUserId, params.gateName, "CANCELLED", params.deviceInfo);
      return { result: "CANCELLED", ticket, attendeeName: ticket.attendee_name, ticketTierName: tierName, message: "Ticket was cancelled by organizer." };
    }

    if (ticket.status === "REFUNDED") {
      await logCheckIn(ticket.id, params.eventId, params.scannerUserId, params.gateName, "REFUNDED", params.deviceInfo);
      return { result: "REFUNDED", ticket, attendeeName: ticket.attendee_name, ticketTierName: tierName, message: "Ticket was refunded and is no longer valid." };
    }

    if (ticket.status === "TRANSFERRED") {
      await logCheckIn(ticket.id, params.eventId, params.scannerUserId, params.gateName, "INVALID", params.deviceInfo);
      return { result: "INVALID", ticket, attendeeName: ticket.attendee_name, ticketTierName: tierName, message: "Ticket has been transferred. This old QR code is invalid." };
    }

    // 3. Check for Duplicate Scan
    if (ticket.status === "USED") {
      await logCheckIn(ticket.id, params.eventId, params.scannerUserId, params.gateName, "DUPLICATE_SCAN", params.deviceInfo);
      const checkedInTime = ticket.checked_in_at ? new Date(ticket.checked_in_at).toLocaleTimeString("en-IN") : "earlier";
      return {
        result: "DUPLICATE_SCAN",
        ticket,
        attendeeName: ticket.attendee_name,
        ticketTierName: tierName,
        message: `ALREADY SCANNED at ${checkedInTime} at ${ticket.checked_in_gate ?? "Gate"}!`,
      };
    }

    // 4. Mark as USED atomically
    const now = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from("saas_tickets")
      .update({
        status: "USED",
        checked_in_at: now,
        checked_in_gate: params.gateName,
        checked_in_by_user_id: params.scannerUserId,
      })
      .eq("id", ticket.id)
      .eq("status", "CONFIRMED");

    if (updateErr) {
      return { result: "DUPLICATE_SCAN", message: "Concurrent scan detected." };
    }

    await logCheckIn(ticket.id, params.eventId, params.scannerUserId, params.gateName, "SUCCESS", params.deviceInfo);

    return {
      result: "SUCCESS",
      ticket,
      attendeeName: ticket.attendee_name,
      ticketTierName: tierName,
      message: "Valid entry pass. Welcome to the event!",
    };
  } catch (err) {
    logger.error("processTicketCheckIn error", { error: String(err) });
    return { result: "INVALID", message: "Scanner server error." };
  }
}

async function logCheckIn(ticketId: string, eventId: string, scannerId: string, gate: string, result: CheckInResult, deviceInfo?: any) {
  try {
    await supabaseAdmin.from("check_in_logs").insert({
      ticket_id: ticketId,
      event_id: eventId,
      scanner_user_id: scannerId,
      gate_name: gate,
      result,
      device_info: deviceInfo ?? {},
    });
  } catch {
    // Non-blocking log
  }
}

export interface TransferTicketParams {
  ticketId: string;
  fromUserId: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  toPhone?: string;
}

export async function executeTicketTransfer(params: TransferTicketParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: ticket, error } = await supabaseAdmin
      .from("saas_tickets")
      .select("*")
      .eq("id", params.ticketId)
      .eq("owner_user_id", params.fromUserId)
      .single();

    if (error || !ticket) {
      return { success: false, error: "Ticket not found or permission denied" };
    }

    if (ticket.status !== "CONFIRMED") {
      return { success: false, error: `Ticket in ${ticket.status} status cannot be transferred` };
    }

    const newQrToken = generateSecureTicketToken(ticket.id, ticket.event_id);

    // Record transfer log
    await supabaseAdmin.from("ticket_transfers").insert({
      ticket_id: ticket.id,
      from_user_id: params.fromUserId,
      from_email: params.fromEmail,
      to_name: params.toName,
      to_email: params.toEmail,
      to_phone: params.toPhone ?? null,
      old_qr_token: ticket.qr_token,
      new_qr_token: newQrToken,
    });

    // Update ticket with new attendee and regenerate QR
    await supabaseAdmin
      .from("saas_tickets")
      .update({
        attendee_name: params.toName,
        attendee_email: params.toEmail,
        attendee_phone: params.toPhone ?? null,
        qr_token: newQrToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    return { success: true };
  } catch (err) {
    logger.error("executeTicketTransfer error", { error: String(err) });
    return { success: false, error: "Failed to transfer ticket" };
  }
}
