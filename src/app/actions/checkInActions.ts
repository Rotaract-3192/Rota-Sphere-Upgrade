"use server";

/**
 * Check-in Server Actions
 * High-performance gate validation against saas_tickets and rotasphere_tickets.
 * Concurrency-safe duplicate scan protection with instant audio/haptic feedback support.
 * Rejects pending payment verification passes and enforces atomic state transitions.
 */

import { executeSql, escapeSql } from "@/lib/db/directDb";
import { writeAuditLog } from "@/lib/audit/auditLog";

export interface CheckInRequest {
  rawInput: string;
  eventId?: string;
  gateName?: string;
  scannerUserId?: string;
}

export interface CheckInResponse {
  result: "SUCCESS" | "DUPLICATE_SCAN" | "WRONG_EVENT" | "CANCELLED" | "REFUNDED" | "INVALID";
  ticketId?: string;
  ticketCode?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  ticketTierName?: string;
  eventTitle?: string;
  message: string;
  scannedAt?: string;
  checkedInGate?: string;
}

export async function checkInTicketAction(req: CheckInRequest): Promise<CheckInResponse> {
  try {
    let clean = req.rawInput?.trim();
    if (!clean) {
      return { result: "INVALID", message: "Empty scan code provided" };
    }

    // If a full URL was scanned (e.g. https://.../t/RS-...), extract the token
    if (clean.includes("/t/")) {
      clean = clean.split("/t/").pop() || clean;
    } else if (clean.includes("token=")) {
      clean = clean.split("token=").pop()?.split("&")[0] || clean;
    }

    const gateName = req.gateName?.trim() || "Main Gate";
    const scannerUserId = req.scannerUserId?.trim() || "staff-gate-ops";

    // 1. Query saas_tickets
    const sql = `
      SELECT 
        t.id, 
        t.ticket_code, 
        t.event_id, 
        t.ticket_tier_id, 
        t.attendee_name, 
        t.attendee_email, 
        t.attendee_phone,
        t.qr_token, 
        t.status, 
        t.checked_in_at, 
        t.checked_in_gate, 
        t.checked_in_by_user_id,
        e.title as event_title,
        e.city as event_city,
        tt.name as tier_name
      FROM saas_tickets t
      LEFT JOIN saas_events e ON t.event_id = e.id
      LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
      WHERE t.qr_token = ${escapeSql(clean)}
         OR t.ticket_code ILIKE ${escapeSql(clean)}
         OR t.id::text = ${escapeSql(clean)}
      LIMIT 1;
    `;

    const { data: ticketRows, error } = await executeSql(sql);

    if (error) {
      return { result: "INVALID", message: `Database error: ${error.message}` };
    }

    let ticket = ticketRows && ticketRows.length > 0 ? ticketRows[0] : null;

    // Fallback: check rotasphere_tickets if not found in saas_tickets
    if (!ticket) {
      const fallbackSql = `
        SELECT 
          rt.id,
          rt.ticket_code,
          rt.event_id,
          rt.status,
          rt.created_at,
          rtt.name as tier_name
        FROM rotasphere_tickets rt
        LEFT JOIN rotasphere_ticket_tiers rtt ON rt.tier_id = rtt.id
        WHERE rt.ticket_code ILIKE ${escapeSql(clean)}
           OR rt.qr_hash = ${escapeSql(clean)}
           OR rt.id::text = ${escapeSql(clean)}
        LIMIT 1;
      `;
      const fallbackRes = await executeSql(fallbackSql);
      if (fallbackRes.data && fallbackRes.data.length > 0) {
        const ft = fallbackRes.data[0];
        ticket = {
          id: ft.id,
          ticket_code: ft.ticket_code,
          event_id: ft.event_id,
          attendee_name: "Delegate Attendee",
          attendee_email: "delegate@rotasphere.org",
          tier_name: ft.tier_name || "General Pass",
          event_title: "Rotaract District Event",
          status: ft.status === "ACTIVE" ? "CONFIRMED" : ft.status,
          checked_in_at: null,
          checked_in_gate: null,
        };
      }
    }

    if (!ticket) {
      return {
        result: "INVALID",
        message: "Unrecognized QR code or ticket number. No matching pass in database.",
      };
    }

    const attendeeName = ticket.attendee_name || "Attendee";
    const tierName = ticket.tier_name || "Standard Pass";
    const eventTitle = ticket.event_title || "Event";

    // 2. SECURITY: Require a specific event to be locked in. Never allow cross-event scanning.
    if (!req.eventId || req.eventId === "all" || req.eventId === "default" || req.eventId === "") {
      return {
        result: "INVALID",
        message: "Security: Please select a specific event before scanning. Cross-event scanning is not permitted.",
      };
    }

    // Validate Event Filter — ticket must belong to the locked event
    if (ticket.event_id && String(ticket.event_id).toLowerCase() !== String(req.eventId).toLowerCase()) {
      return {
        result: "WRONG_EVENT",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        attendeeName,
        ticketTierName: tierName,
        eventTitle,
        message: `⛔ Pass is for "${eventTitle}" — not for this event. Cross-scanning is blocked.`,
      };
    }

    // 3. Status checks
    if (ticket.status === "PENDING_VERIFICATION") {
      return {
        result: "INVALID",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        attendeeName,
        ticketTierName: tierName,
        eventTitle,
        message: "⛔ PAYMENT PENDING VERIFICATION. This ticket has not been approved by the organizer yet.",
      };
    }

    if (ticket.status === "PAYMENT_REJECTED") {
      return {
        result: "INVALID",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        attendeeName,
        ticketTierName: tierName,
        eventTitle,
        message: "⛔ PAYMENT REJECTED. This pass was invalidated.",
      };
    }

    if (ticket.status === "CANCELLED") {
      return {
        result: "CANCELLED",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        attendeeName,
        ticketTierName: tierName,
        eventTitle,
        message: "Ticket was CANCELLED by organizer.",
      };
    }

    if (ticket.status === "REFUNDED") {
      return {
        result: "REFUNDED",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        attendeeName,
        ticketTierName: tierName,
        eventTitle,
        message: "Ticket was REFUNDED and voided.",
      };
    }

    // 4. Duplicate Check
    if (ticket.status === "USED" || ticket.status === "CHECKED_IN") {
      const formattedTime = ticket.checked_in_at
        ? new Date(ticket.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "earlier today";

      return {
        result: "DUPLICATE_SCAN",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        attendeeName,
        attendeeEmail: ticket.attendee_email,
        ticketTierName: tierName,
        eventTitle,
        scannedAt: formattedTime,
        checkedInGate: ticket.checked_in_gate || "Gate 1",
        message: `ALREADY SCANNED at ${formattedTime} at ${ticket.checked_in_gate || "Gate"}! Pass sharing prevented.`,
      };
    }

    // 5. Atomic check-in update: only transition if status is currently valid
    const updateSql = `
      UPDATE saas_tickets
      SET 
        status = 'USED',
        checked_in_at = NOW(),
        checked_in_gate = ${escapeSql(gateName)},
        checked_in_by_user_id = ${escapeSql(scannerUserId)},
        updated_at = NOW()
      WHERE id = ${escapeSql(ticket.id)}
        AND status IN ('CONFIRMED', 'ISSUED')
      RETURNING id;
    `;
    const { data: updatedTicketRows } = await executeSql(updateSql);

    if (!updatedTicketRows || updatedTicketRows.length === 0) {
      return {
        result: "DUPLICATE_SCAN",
        message: "Pass was just scanned concurrently at another gate or is in an invalid status.",
      };
    }

    // Also update rotasphere_tickets if it exists
    await executeSql(`UPDATE rotasphere_tickets SET status = 'CHECKED_IN' WHERE id = ${escapeSql(ticket.id)};`);

    // Audit log
    await writeAuditLog({
      actorId: scannerUserId,
      actorEmail: "gate-scanner@rotasphere.org",
      action: "TICKET_CHECKED_IN",
      category: "ADMIN_ACTION",
      resourceType: "TICKET",
      resourceId: ticket.id,
      result: "SUCCESS",
      metadata: { gate: gateName, timestamp: new Date().toISOString() },
    });

    return {
      result: "SUCCESS",
      ticketId: ticket.id,
      ticketCode: ticket.ticket_code,
      attendeeName,
      attendeeEmail: ticket.attendee_email,
      ticketTierName: tierName,
      eventTitle,
      checkedInGate: gateName,
      message: "VALID ENTRY PASS — ACCESS GRANTED",
    };
  } catch (err: any) {
    return {
      result: "INVALID",
      message: `Scanner error: ${err?.message || String(err)}`,
    };
  }
}

export async function getScannerEventsAction(): Promise<{
  events: Array<{ id: string; title: string; city: string; start_date: string }>;
}> {
  try {
    const { data } = await executeSql(`
      SELECT id, title, city, start_date 
      FROM saas_events 
      WHERE (deleted_at IS NULL AND status != 'TRASHED')
      ORDER BY start_date ASC 
      LIMIT 20;
    `);
    return { events: data || [] };
  } catch {
    return { events: [] };
  }
}
