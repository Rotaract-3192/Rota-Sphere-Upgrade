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
  result: "SUCCESS" | "DUPLICATE_SCAN" | "WRONG_EVENT" | "PAYMENT_PENDING" | "CANCELLED" | "REFUNDED" | "INVALID";
  ticketId?: string;
  ticketCode?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  memberType?: string;
  clubName?: string;
  zone?: string;
  designation?: string;
  ticketTierName?: string;
  eventTitle?: string;
  eventId?: string;
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
        t.member_type,
        t.club_name,
        t.designation,
        t.zone,
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
          attendee_phone: "",
          member_type: "Rotaract",
          club_name: "",
          zone: "",
          designation: "",
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
        message: "Unrecognized QR code or ticket number. No matching pass found in database.",
      };
    }

    const attendeeName = ticket.attendee_name || "Attendee";
    const tierName = ticket.tier_name || "Standard Pass";
    const eventTitle = ticket.event_title || "Event";

    // 2. Validate Event Filter (if an event is specifically locked)
    if (
      req.eventId &&
      req.eventId !== "all" &&
      req.eventId !== "ALL" &&
      req.eventId !== "default" &&
      req.eventId !== ""
    ) {
      if (ticket.event_id && String(ticket.event_id).toLowerCase() !== String(req.eventId).toLowerCase()) {
        return {
          result: "WRONG_EVENT",
          ticketId: ticket.id,
          ticketCode: ticket.ticket_code,
          attendeeName,
          ticketTierName: tierName,
          eventTitle,
          eventId: ticket.event_id,
          message: `⛔ Pass is for "${eventTitle}" — not for this event.`,
        };
      }
    }

    // 3. Status checks
    if (ticket.status === "PENDING_VERIFICATION") {
      return {
        result: "PAYMENT_PENDING",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        attendeeName,
        attendeeEmail: ticket.attendee_email,
        attendeePhone: ticket.attendee_phone,
        memberType: ticket.member_type,
        clubName: ticket.club_name,
        zone: ticket.zone,
        designation: ticket.designation,
        ticketTierName: tierName,
        eventTitle,
        eventId: ticket.event_id,
        message: "PAYMENT PENDING APPROVAL. Review attendee details or approve directly below.",
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
        eventId: ticket.event_id,
        message: "⛔ PAYMENT REJECTED. This pass was invalidated by the organizers.",
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
        eventId: ticket.event_id,
        message: "Ticket was CANCELLED by the attendee or organizer.",
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
        eventId: ticket.event_id,
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
        attendeePhone: ticket.attendee_phone,
        memberType: ticket.member_type,
        clubName: ticket.club_name,
        zone: ticket.zone,
        designation: ticket.designation,
        ticketTierName: tierName,
        eventTitle,
        eventId: ticket.event_id,
        scannedAt: formattedTime,
        checkedInGate: ticket.checked_in_gate || "Main Gate",
        message: `ALREADY SCANNED at ${formattedTime} (${ticket.checked_in_gate || "Gate"}). Pass re-use prevented.`,
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
        AND status IN ('CONFIRMED', 'ISSUED', 'VALID', 'ACTIVE')
      RETURNING id;
    `;
    const { data: updatedTicketRows } = await executeSql(updateSql);

    if (!updatedTicketRows || updatedTicketRows.length === 0) {
      return {
        result: "DUPLICATE_SCAN",
        message: "Pass was just admitted concurrently at another checkpoint or is not confirmed.",
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
      attendeePhone: ticket.attendee_phone,
      memberType: ticket.member_type,
      clubName: ticket.club_name,
      zone: ticket.zone,
      designation: ticket.designation,
      ticketTierName: tierName,
      eventTitle,
      eventId: ticket.event_id,
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

/**
 * Direct gate authorization for passes pending verification.
 * Allows gate leads to confirm payment and admit attendees directly at the entrance.
 */
export async function approveAndCheckInTicketAction(params: {
  ticketId: string;
  gateName?: string;
  scannerUserId?: string;
}): Promise<CheckInResponse> {
  try {
    const cleanId = escapeSql(params.ticketId);
    const gateName = params.gateName?.trim() || "Main Gate";
    const scannerUserId = params.scannerUserId?.trim() || "gate-manager";

    const updateSql = `
      UPDATE saas_tickets
      SET 
        status = 'USED',
        checked_in_at = NOW(),
        checked_in_gate = ${escapeSql(gateName)},
        checked_in_by_user_id = ${escapeSql(scannerUserId)},
        updated_at = NOW()
      WHERE id = ${cleanId}
      RETURNING id, ticket_code, attendee_name, attendee_email, attendee_phone, member_type, club_name, zone, designation, event_id, ticket_tier_id;
    `;
    const { data: updatedRows, error } = await executeSql(updateSql);
    if (error || !updatedRows || updatedRows.length === 0) {
      return { result: "INVALID", message: "Failed to approve ticket. Ticket record was not found." };
    }

    const t = updatedRows[0];

    // Also update order status if linked
    await executeSql(`
      UPDATE saas_orders
      SET status = 'PAID', updated_at = NOW()
      WHERE id = (SELECT order_id FROM saas_tickets WHERE id = ${cleanId});
    `);

    // Fetch event & tier titles
    const { data: info } = await executeSql(`
      SELECT e.title as event_title, tt.name as tier_name
      FROM saas_events e
      LEFT JOIN saas_ticket_tiers tt ON tt.id = ${escapeSql(t.ticket_tier_id)}
      WHERE e.id = ${escapeSql(t.event_id)}
      LIMIT 1;
    `);

    return {
      result: "SUCCESS",
      ticketId: t.id,
      ticketCode: t.ticket_code,
      attendeeName: t.attendee_name,
      attendeeEmail: t.attendee_email,
      attendeePhone: t.attendee_phone,
      memberType: t.member_type,
      clubName: t.club_name,
      zone: t.zone,
      designation: t.designation,
      ticketTierName: info?.[0]?.tier_name || "General Pass",
      eventTitle: info?.[0]?.event_title || "Event",
      eventId: t.event_id,
      checkedInGate: gateName,
      message: "PASS APPROVED & ADMITTED SUCCESSFULLY",
    };
  } catch (err: any) {
    return { result: "INVALID", message: `Error approving ticket: ${err?.message || err}` };
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
      ORDER BY start_date DESC 
      LIMIT 30;
    `);
    return { events: data || [] };
  } catch {
    return { events: [] };
  }
}
