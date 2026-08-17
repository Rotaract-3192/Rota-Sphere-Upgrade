/**
 * Structured Audit Logger — DPDP Act 2023 Compliance
 * Records all sensitive actions for auditability.
 *
 * CRITICAL: Never log passwords, OTPs, CVV, tokens, or API keys.
 * Mask sensitive values before logging (e.g. phone → ******3210)
 */

import { executeSql } from "@/lib/db/directDb";

export type AuditCategory =
  | "AUTH"
  | "DATA_ACCESS"
  | "DATA_EXPORT"
  | "DATA_DELETE"
  | "DATA_CORRECT"
  | "CONSENT"
  | "PAYMENT"
  | "ROLE_CHANGE"
  | "ADMIN_ACTION"
  | "SECURITY"
  | "PRIVACY_REQUEST"
  | "CONFIG_CHANGE";

export type AuditResult = "SUCCESS" | "FAILURE" | "BLOCKED";

export interface AuditEntry {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  category: AuditCategory;
  resourceType?: string;
  resourceId?: string;
  result?: AuditResult;
  metadata?: Record<string, unknown>;
  /** Pass request headers to extract IP/UA automatically */
  requestHeaders?: Headers;
}

/**
 * Mask sensitive strings — show last 4 chars only.
 * e.g. "9876543210" → "******3210"
 */
export function maskSensitive(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars) return "****";
  return "*".repeat(Math.max(value.length - visibleChars, 4)) + value.slice(-visibleChars);
}

/**
 * Write an audit log entry to the database.
 * Safe to call from Server Actions, API Routes, and Server Components.
 * Failures are caught and logged to console only — never throw.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    // Try to extract IP and UA from request headers
    try {
      if (entry.requestHeaders) {
        ipAddress = entry.requestHeaders.get("x-real-ip") ||
          entry.requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
        userAgent = entry.requestHeaders.get("user-agent") || null;
      } else {
        // Dynamic import so this only runs in App Router server context
        const { headers } = await import("next/headers");
        const hdrs = await headers();
        ipAddress = hdrs.get("x-real-ip") ||
          hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
        userAgent = hdrs.get("user-agent") || null;
      }
    } catch {
      // Safe to ignore — headers() may not be available in all contexts
    }

    const meta = JSON.stringify(entry.metadata ?? {}).replace(/'/g, "''");
    const escape = (v?: string | null) => (v ? `'${v.replace(/'/g, "''")}'` : "NULL");

    await executeSql(`
      INSERT INTO audit_logs (
        actor_id, actor_email, actor_role,
        action, category,
        resource_type, resource_id,
        result, ip_address, user_agent, metadata
      ) VALUES (
        ${escape(entry.actorId)},
        ${escape(entry.actorEmail)},
        ${escape(entry.actorRole)},
        ${escape(entry.action)},
        ${escape(entry.category)},
        ${escape(entry.resourceType)},
        ${escape(entry.resourceId)},
        '${entry.result ?? "SUCCESS"}',
        ${escape(ipAddress)},
        ${escape(userAgent)},
        '${meta}'::jsonb
      );
    `);
  } catch (err) {
    // Audit log failures must NOT crash the application
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────

export const auditAuth = (action: string, actorId: string, actorEmail: string, result: AuditResult, meta?: Record<string, unknown>) =>
  writeAuditLog({ actorId, actorEmail, action, category: "AUTH", result, metadata: meta });

export const auditDataAccess = (actorId: string, actorEmail: string, resourceType: string, resourceId: string, meta?: Record<string, unknown>) =>
  writeAuditLog({ actorId, actorEmail, action: `ACCESS_${resourceType.toUpperCase()}`, category: "DATA_ACCESS", resourceType, resourceId, result: "SUCCESS", metadata: meta });

export const auditDataExport = (actorId: string, actorEmail: string, scope: string, recordCount?: number) =>
  writeAuditLog({ actorId, actorEmail, action: "DATA_EXPORT", category: "DATA_EXPORT", resourceType: scope, result: "SUCCESS", metadata: { recordCount } });

export const auditDataDelete = (actorId: string, actorEmail: string, resourceType: string, resourceId: string, method: string) =>
  writeAuditLog({ actorId, actorEmail, action: "DATA_DELETE", category: "DATA_DELETE", resourceType, resourceId, result: "SUCCESS", metadata: { method } });

export const auditConsent = (userId: string, userEmail: string, purpose: string, status: "granted" | "withdrawn" | "denied") =>
  writeAuditLog({ actorId: userId, actorEmail: userEmail, action: `CONSENT_${status.toUpperCase()}`, category: "CONSENT", resourceType: "consent", resourceId: purpose, result: "SUCCESS", metadata: { purpose, status } });

export const auditPrivacyRequest = (userId: string, userEmail: string, requestType: string, requestId: string) =>
  writeAuditLog({ actorId: userId, actorEmail: userEmail, action: `PRIVACY_REQUEST_${requestType.toUpperCase()}`, category: "PRIVACY_REQUEST", resourceType: "privacy_request", resourceId: requestId, result: "SUCCESS" });

export const auditAdminAction = (actorId: string, actorEmail: string, actorRole: string, action: string, resourceType?: string, resourceId?: string, meta?: Record<string, unknown>) =>
  writeAuditLog({ actorId, actorEmail, actorRole, action, category: "ADMIN_ACTION", resourceType, resourceId, result: "SUCCESS", metadata: meta });

export const auditSecurity = (action: string, result: AuditResult, meta?: Record<string, unknown>) =>
  writeAuditLog({ action, category: "SECURITY", result, metadata: meta });
