import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";

interface AuditLogParams {
  actorUserId: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: params.actorUserId,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      details: params.details ?? {},
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    });

    if (error) {
      logger.error("Audit log write failed", { error: error.message, action: params.action });
    }
  } catch (err) {
    logger.error("Audit log exception", { error: String(err), action: params.action });
  }
}

export const AUDIT_ACTIONS = {
  USER_ROLE_CHANGED: "user.role_changed",
  USER_SUSPENDED: "user.suspended",
  USER_ACTIVATED: "user.activated",
  USER_REJECTED: "user.rejected",
  EVENT_CREATED: "event.created",
  EVENT_UPDATED: "event.updated",
  EVENT_SUBMITTED: "event.submitted_for_approval",
  EVENT_APPROVED: "event.approved",
  EVENT_REJECTED: "event.rejected",
  EVENT_PUBLISHED: "event.published",
  EVENT_CANCELLED: "event.cancelled",
  EVENT_PRICE_CHANGED: "event.price_changed",
  TICKET_TIER_CREATED: "ticket_tier.created",
  TICKET_TIER_UPDATED: "ticket_tier.updated",
  TICKET_MANUAL_ISSUED: "ticket.manual_issued",
  TICKET_CANCELLED: "ticket.cancelled",
  TICKET_TRANSFERRED: "ticket.transferred",
  PAYMENT_VERIFIED: "payment.verified",
  PAYMENT_REJECTED: "payment.rejected",
  REFUND_REQUESTED: "refund.requested",
  REFUND_APPROVED: "refund.approved",
  REFUND_REJECTED: "refund.rejected",
  REFUND_PROCESSED: "refund.processed",
  CHECKIN_OVERRIDE: "checkin.override",
  SETTLEMENT_CREATED: "settlement.created",
  PAYOUT_PROCESSED: "payout.processed",
  ATTENDEES_EXPORTED: "attendees.exported",
  SPONSOR_LEADS_EXPORTED: "sponsor_leads.exported",
} as const;
