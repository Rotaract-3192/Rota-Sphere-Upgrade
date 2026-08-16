/**
 * Audit Logging Service
 * Records immutable audit entries for all sensitive platform & organizer operations.
 */

import { executeSql } from "@/lib/db/directDb";
import { logger } from "@/lib/logger/logger";

export interface LogAuditParams {
  actorId: string;
  actorRole: string;
  actorEmail?: string | null;
  action: string;
  entityType: "ORGANIZATION" | "EVENT" | "TICKET_TIER" | "ORDER" | "TICKET" | "REFUND" | "USER" | "SETTING" | "FEATURE_FLAG";
  entityId: string;
  organizationId?: string | null;
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

export async function logAuditAction(params: LogAuditParams): Promise<void> {
  try {
    const prevStateJson = params.previousState ? `'${JSON.stringify(params.previousState).replace(/'/g, "''")}'::jsonb` : "NULL";
    const newStateJson = params.newState ? `'${JSON.stringify(params.newState).replace(/'/g, "''")}'::jsonb` : "NULL";

    const sql = `
      INSERT INTO platform_audit_logs (
        actor_id,
        actor_role,
        actor_email,
        action,
        entity_type,
        entity_id,
        organization_id,
        previous_state,
        new_state,
        ip_address,
        user_agent
      ) VALUES (
        ${escapeSql(params.actorId)},
        ${escapeSql(params.actorRole)},
        ${escapeSql(params.actorEmail)},
        ${escapeSql(params.action)},
        ${escapeSql(params.entityType)},
        ${escapeSql(params.entityId)},
        ${params.organizationId ? escapeSql(params.organizationId) : "NULL"},
        ${prevStateJson},
        ${newStateJson},
        ${escapeSql(params.ipAddress)},
        ${escapeSql(params.userAgent)}
      );
    `;

    await executeSql(sql);
  } catch (err) {
    logger.error("Failed to write audit log", { error: String(err), action: params.action });
  }
}
