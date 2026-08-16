/**
 * Ticket Service
 * Architecture §23-25: Ticket generation, QR tokens, ticket codes.
 * Uses rotasphere_ table namespace to prevent collisions on shared databases.
 */

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";

function generateTicketCode(): string {
  const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `TKT-${part1}-${part2}`;
}

function generateQRToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export interface IssuedTicket {
  ticketId: string;
  ticketCode: string;
  qrToken: string;
}

export async function issueTickets(
  orderId: string,
  eventId: string,
  ownerUserId: string
): Promise<IssuedTicket[]> {
  const { data: orderItems } = await supabaseAdmin
    .from("rotasphere_order_items")
    .select("tier_id, quantity, unit_price")
    .eq("order_id", orderId);

  const items = (orderItems as Array<{ tier_id: string; quantity: number; unit_price: number }> | null) ?? [];
  if (!items.length) {
    logger.warn("No order items found for ticket issuance", { orderId });
    return [];
  }

  const issued: IssuedTicket[] = [];

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketCode = generateTicketCode();
      const { raw: qrToken, hash: qrTokenHash } = generateQRToken();

      const { data: ticket, error } = await supabaseAdmin
        .from("rotasphere_tickets")
        .insert({
          event_id: eventId,
          tier_id: item.tier_id,
          owner_user_id: ownerUserId,
          ticket_code: ticketCode,
          qr_hash: qrTokenHash,
          status: "ACTIVE",
        })
        .select("id")
        .single();

      const createdTicket = ticket as { id: string } | null;

      if (error || !createdTicket) {
        logger.error("Failed to issue ticket", { orderId, error: error?.message });
        throw new Error("TICKET_ISSUANCE_FAILED");
      }

      issued.push({
        ticketId: createdTicket.id,
        ticketCode,
        qrToken,
      });
    }
  }

  logger.info("Tickets issued", { orderId, count: issued.length });
  return issued;
}

export interface VerifyQRResult {
  valid: boolean;
  ticketId?: string;
  attendeeName?: string;
  tierName?: string;
  error?: "INVALID_TOKEN" | "ALREADY_CHECKED_IN" | "TICKET_CANCELLED" | "WRONG_EVENT";
}

export async function verifyQRToken(
  rawToken: string,
  eventId: string
): Promise<VerifyQRResult> {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const { data: ticket } = await supabaseAdmin
    .from("rotasphere_tickets")
    .select("id, event_id, status, tier_id, owner_user_id, rotasphere_ticket_tiers(name)")
    .eq("qr_hash", hash)
    .single();

  const t = ticket as {
    id: string;
    event_id: string;
    status: string;
    tier_id: string | null;
    owner_user_id: string;
    rotasphere_ticket_tiers: { name: string } | null;
  } | null;

  if (!t) {
    return { valid: false, error: "INVALID_TOKEN" };
  }

  if (t.event_id !== eventId) {
    return { valid: false, error: "WRONG_EVENT" };
  }

  if (t.status === "CANCELLED" || t.status === "VOID") {
    return { valid: false, error: "TICKET_CANCELLED" };
  }

  const { data: existingCheckIn } = await supabaseAdmin
    .from("rotasphere_check_ins")
    .select("id, scanned_at")
    .eq("ticket_id", t.id)
    .single();

  if (existingCheckIn) {
    return { valid: false, error: "ALREADY_CHECKED_IN" };
  }

  return {
    valid: true,
    ticketId: t.id,
    attendeeName: "Registered Attendee",
    tierName: t.rotasphere_ticket_tiers?.name ?? "General Admission",
  };
}

export async function recordCheckIn(
  ticketId: string,
  eventId: string,
  scannedBy: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin.from("rotasphere_check_ins").insert({
    event_id: eventId,
    ticket_id: ticketId,
    scanned_by: scannedBy,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "ALREADY_CHECKED_IN" };
    }
    logger.error("Check-in insert failed", { ticketId, error: error.message });
    return { success: false, error: "DB_ERROR" };
  }

  await supabaseAdmin
    .from("rotasphere_tickets")
    .update({ status: "CHECKED_IN" })
    .eq("id", ticketId);

  return { success: true };
}
