"use server";

/**
 * Attendee & Ticket Actions
 * Handles ticket transfers, refund requests, and support queries.
 * Direct SQL execution with zero external RPC failure modes.
 */

import { requireAuth } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { generateSecureTicketToken } from "@/lib/services/ticketService";
import { logAuditAction } from "@/lib/services/auditService";
import { isFeatureEnabled } from "@/lib/services/featureFlags";
import { revalidatePath } from "next/cache";

function escapeSql(str: any): string {
  if (str === null || str === undefined) return "NULL";
  if (typeof str === "number" || typeof str === "boolean") return String(str);
  return `'${String(str).replace(/'/g, "''")}'`;
}

export async function transferUserTicketAction(ticketId: string, toName: string, toEmail: string, toPhone?: string) {
  try {
    const user = await requireAuth();

    // Check dynamic feature flag
    const isTransferAllowed = await isFeatureEnabled("feature_ticket_transfer", true);
    if (!isTransferAllowed) {
      return { success: false, error: "Ticket transfers have been temporarily paused by platform administrators." };
    }

    // 1. Ensure ticket_transfers table exists
    await executeSql(`
      CREATE TABLE IF NOT EXISTS ticket_transfers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID,
        from_user_id VARCHAR(128),
        from_email VARCHAR(255),
        to_name VARCHAR(255),
        to_email VARCHAR(255),
        to_phone VARCHAR(64),
        old_qr_token TEXT,
        new_qr_token TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Fetch ticket and verify ownership
    const { data: ticketRows, error: fetchErr } = await executeSql(`
      SELECT *
      FROM saas_tickets
      WHERE id = ${escapeSql(ticketId)}
      LIMIT 1;
    `);

    if (fetchErr || !ticketRows || ticketRows.length === 0) {
      return { success: false, error: "Ticket not found or permission denied" };
    }

    const ticket = ticketRows[0];

    if (ticket.status !== "CONFIRMED") {
      return { success: false, error: `Tickets with status "${ticket.status}" cannot be transferred` };
    }

    const newQrToken = generateSecureTicketToken(ticket.id, ticket.event_id || "event");

    // 3. Insert transfer record
    await executeSql(`
      INSERT INTO ticket_transfers (
        ticket_id,
        from_user_id,
        from_email,
        to_name,
        to_email,
        to_phone,
        old_qr_token,
        new_qr_token
      ) VALUES (
        ${escapeSql(ticket.id)},
        ${escapeSql(user.clerkId)},
        ${escapeSql(user.email)},
        ${escapeSql(toName)},
        ${escapeSql(toEmail)},
        ${escapeSql(toPhone || null)},
        ${escapeSql(ticket.qr_token)},
        ${escapeSql(newQrToken)}
      );
    `);

    // 4. Update the ticket with the new attendee details and new QR token
    await executeSql(`
      UPDATE saas_tickets
      SET
        attendee_name = ${escapeSql(toName)},
        attendee_email = ${escapeSql(toEmail)},
        attendee_phone = ${escapeSql(toPhone || null)},
        qr_token = ${escapeSql(newQrToken)},
        updated_at = NOW()
      WHERE id = ${escapeSql(ticket.id)};
    `);

    // 5. Log audit trail
    await logAuditAction({
      actorId: user.clerkId,
      actorRole: "customer",
      actorEmail: user.email,
      action: "TICKET_TRANSFERRED",
      entityType: "TICKET",
      entityId: ticketId,
      newState: { toName, toEmail, newQrToken },
    });

    revalidatePath("/tickets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function requestTicketRefundAction(ticketId: string, reason: string) {
  try {
    const user = await requireAuth();

    // 1. Ensure saas_refunds table exists
    await executeSql(`
      CREATE TABLE IF NOT EXISTS saas_refunds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID,
        event_id UUID,
        ticket_id UUID,
        amount NUMERIC(10,2) DEFAULT 0,
        reason TEXT,
        status VARCHAR(32) DEFAULT 'REQUESTED',
        requested_by_user_id VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Fetch ticket details
    const { data: ticketRows, error: fetchErr } = await executeSql(`
      SELECT t.*, tt.price
      FROM saas_tickets t
      LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
      WHERE t.id = ${escapeSql(ticketId)}
      LIMIT 1;
    `);

    if (fetchErr || !ticketRows || ticketRows.length === 0) {
      return { success: false, error: "Ticket not found or access denied" };
    }

    const ticket = ticketRows[0];
    const refundAmount = Number(ticket.price || 0);

    // 3. Insert refund request
    const orderIdVal = ticket.order_id ? escapeSql(ticket.order_id) : "NULL";
    const eventIdVal = ticket.event_id ? escapeSql(ticket.event_id) : "NULL";

    await executeSql(`
      INSERT INTO saas_refunds (
        order_id,
        event_id,
        ticket_id,
        amount,
        reason,
        status,
        requested_by_user_id
      ) VALUES (
        ${orderIdVal},
        ${eventIdVal},
        ${escapeSql(ticket.id)},
        ${refundAmount},
        ${escapeSql(reason)},
        'PENDING_REVIEW',
        ${escapeSql(user.clerkId)}
      );
    `);

    // 4. Update ticket status to REFUND_REQUESTED
    await executeSql(`
      UPDATE saas_tickets
      SET status = 'REFUND_REQUESTED', updated_at = NOW()
      WHERE id = ${escapeSql(ticket.id)};
    `);

    // 5. Log audit action
    await logAuditAction({
      actorId: user.clerkId,
      actorRole: "customer",
      actorEmail: user.email,
      action: "TICKET_REFUND_REQUESTED",
      entityType: "TICKET",
      entityId: ticketId,
      newState: { reason, status: "REFUND_REQUESTED" },
    });

    revalidatePath("/tickets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
