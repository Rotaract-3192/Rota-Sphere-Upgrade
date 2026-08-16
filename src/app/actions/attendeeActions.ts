"use server";

/**
 * Attendee & Ticket Actions
 * Handles ticket transfers, refund requests, and support queries.
 */

import { requireAuth } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { executeTicketTransfer } from "@/lib/services/ticketService";
import { logAuditAction } from "@/lib/services/auditService";
import { revalidatePath } from "next/cache";

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

export async function transferUserTicketAction(ticketId: string, toName: string, toEmail: string, toPhone?: string) {
  try {
    const user = await requireAuth();

    const result = await executeTicketTransfer({
      ticketId,
      fromUserId: user.clerkId,
      fromEmail: user.email,
      toName,
      toEmail,
      toPhone,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: "customer",
      actorEmail: user.email,
      action: "TICKET_TRANSFERRED",
      entityType: "TICKET",
      entityId: ticketId,
      newState: { toName, toEmail },
    });

    revalidatePath("/tickets");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function requestTicketRefundAction(ticketId: string, reason: string) {
  try {
    const user = await requireAuth();

    const { data: ticketRows } = await executeSql(`
      SELECT t.*, tt.price
      FROM saas_tickets t
      LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
      WHERE t.id = ${escapeSql(ticketId)} AND t.owner_user_id = ${escapeSql(user.clerkId)}
      LIMIT 1;
    `);

    const ticket = ticketRows?.[0];
    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    const refundAmount = ticket.price ?? 0;

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
        ${escapeSql(ticket.order_id)},
        ${escapeSql(ticket.event_id)},
        ${escapeSql(ticket.id)},
        ${refundAmount},
        ${escapeSql(reason)},
        'REQUESTED',
        ${escapeSql(user.clerkId)}
      );
    `);

    revalidatePath("/tickets");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
