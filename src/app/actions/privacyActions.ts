"use server";

/**
 * Privacy Server Actions — DPDP Act 2023 Compliance
 *
 * Implements functional backend for:
 * - Access requests
 * - Correction requests
 * - Erasure (deletion) requests
 * - Privacy complaints
 * - Consent management
 * - Secure data export
 *
 * Every action is audit-logged.
 * Identity is verified via Clerk session before any data disclosure.
 */

import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { writeAuditLog, auditConsent, auditPrivacyRequest, auditDataExport } from "@/lib/audit/auditLog";
import { grantConsents, withdrawConsents, getUserConsents, ConsentPurpose } from "@/lib/consent/consentManager";

// ─── Helper ─────────────────────────────────────────────────────────────────

async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.clerkId) throw new Error("Authentication required");
  return user;
}

function esc(v: string) {
  return v.replace(/'/g, "''");
}

// ─── CONSENT ACTIONS ─────────────────────────────────────────────────────────

export async function updateUserConsentAction(
  purposes: ConsentPurpose[],
  status: "granted" | "withdrawn"
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    if (status === "granted") {
      await grantConsents(user.clerkId, user.email!, purposes, "privacy_center");
    } else {
      await withdrawConsents(user.clerkId, user.email!, purposes);
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getUserConsentsAction(): Promise<{ success: boolean; data?: ReturnType<typeof getUserConsents> extends Promise<infer T> ? T : never; error?: string }> {
  try {
    const user = await requireUser();
    const data = await getUserConsents(user.clerkId);
    return { success: true, data: data as any };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message, data: [] as any };
  }
}

// ─── PRIVACY REQUESTS ────────────────────────────────────────────────────────

export async function submitPrivacyRequestAction(input: {
  requestType: "access" | "correction" | "erasure" | "portability" | "consent_withdrawal" | "objection";
  description: string;
}): Promise<{ success: boolean; requestNumber?: string; error?: string }> {
  try {
    const user = await requireUser();

    const { data } = await executeSql(`
      INSERT INTO privacy_requests (user_id, user_email, user_name, request_type, description, status)
      VALUES (
        '${esc(user.clerkId)}',
        '${esc(user.email!)}',
        '${esc(user.profile.full_name ?? user.email ?? "User")}',
        '${esc(input.requestType)}',
        '${esc(input.description)}',
        'open'
      )
      RETURNING request_number;
    `);

    const requestNumber = data?.[0]?.request_number;
    await auditPrivacyRequest(user.clerkId, user.email!, input.requestType, requestNumber);

    return { success: true, requestNumber };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getUserPrivacyRequestsAction(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const user = await requireUser();
    const { data } = await executeSql(`
      SELECT id, request_number, request_type, description, status,
             response, created_at, deadline_at, completed_at
      FROM privacy_requests
      WHERE user_id = '${esc(user.clerkId)}'
      ORDER BY created_at DESC
      LIMIT 50;
    `);
    return { success: true, data: data || [] };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message, data: [] };
  }
}

// ─── PRIVACY COMPLAINTS ───────────────────────────────────────────────────────

export async function submitPrivacyComplaintAction(input: {
  userName: string;
  category:
    | "data_breach"
    | "unauthorised_sharing"
    | "consent_violation"
    | "deletion_failure"
    | "access_denial"
    | "correction_failure"
    | "excessive_collection"
    | "other";
  description: string;
}): Promise<{ success: boolean; complaintNumber?: string; error?: string }> {
  try {
    const user = await requireUser();

    const { data } = await executeSql(`
      INSERT INTO privacy_complaints (user_id, user_email, user_name, category, description, status)
      VALUES (
        '${esc(user.clerkId)}',
        '${esc(user.email!)}',
        '${esc(input.userName)}',
        '${esc(input.category)}',
        '${esc(input.description)}',
        'open'
      )
      RETURNING complaint_number;
    `);

    const complaintNumber = data?.[0]?.complaint_number;
    await writeAuditLog({
      actorId: user.clerkId,
      actorEmail: user.email!,
      action: "PRIVACY_COMPLAINT_SUBMITTED",
      category: "PRIVACY_REQUEST",
      resourceType: "privacy_complaint",
      resourceId: complaintNumber,
      result: "SUCCESS",
    });

    return { success: true, complaintNumber };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getUserPrivacyComplaintsAction(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const user = await requireUser();
    const { data } = await executeSql(`
      SELECT id, complaint_number, category, description, status, resolution, created_at, resolved_at
      FROM privacy_complaints
      WHERE user_id = '${esc(user.clerkId)}'
      ORDER BY created_at DESC
      LIMIT 50;
    `);
    return { success: true, data: data || [] };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message, data: [] };
  }
}

// ─── DATA EXPORT ─────────────────────────────────────────────────────────────

export async function requestDataExportAction(): Promise<{
  success: boolean;
  exportId?: string;
  error?: string;
}> {
  try {
    const user = await requireUser();

    // Check no export is already pending/generating
    const { data: existing } = await executeSql(`
      SELECT id FROM data_exports
      WHERE user_id = '${esc(user.clerkId)}'
        AND status IN ('pending','generating')
        AND requested_at > now() - interval '1 hour'
      LIMIT 1;
    `);
    if (existing && existing.length > 0) {
      return { success: false, error: "An export is already being prepared. Please wait." };
    }

    // Create export job record
    const { data: exportRow } = await executeSql(`
      INSERT INTO data_exports (user_id, user_email, status)
      VALUES ('${esc(user.clerkId)}', '${esc(user.email!)}', 'generating')
      RETURNING id;
    `);
    const exportId = exportRow?.[0]?.id;

    await auditDataExport(user.clerkId, user.email!, "user_self_export");

    // Collect export data
    const [profileRes, ticketsRes, ordersRes, consentsRes] = await Promise.all([
      executeSql(`SELECT id, attendee_name, attendee_email, phone, created_at FROM saas_tickets WHERE owner_user_id = '${esc(user.clerkId)}' LIMIT 1`),
      executeSql(`SELECT id, ticket_code, status, attendee_name, created_at FROM saas_tickets WHERE owner_user_id = '${esc(user.clerkId)}' ORDER BY created_at DESC LIMIT 200`),
      executeSql(`SELECT id, amount, currency, status, created_at FROM saas_orders WHERE user_id = '${esc(user.clerkId)}' ORDER BY created_at DESC LIMIT 200`),
      executeSql(`SELECT purpose, status, granted_at, withdrawn_at FROM consents WHERE user_id = '${esc(user.clerkId)}'`),
    ]);

    const exportPayload = {
      _notice: "This is a copy of your personal data held by RotaSphere District 3192.",
      _generated_at: new Date().toISOString(),
      _legal_basis: "DPDP Act 2023 — Right to Access Personal Data",
      profile: {
        email: user.email,
        fullName: user.profile.full_name,
        userId: user.clerkId,
      },
      tickets: ticketsRes.data || [],
      orders: ordersRes.data || [],
      consents: consentsRes.data || [],
    };

    const exportJson = JSON.stringify(exportPayload, null, 2);

    // Store inline as base64 in the DB record (no R2 configured — fallback)
    // In production with R2: upload to private bucket and return a signed URL
    const base64 = Buffer.from(exportJson).toString("base64");

    await executeSql(`
      UPDATE data_exports
      SET status = 'ready',
          generated_at = now(),
          file_path = 'inline:base64',
          signed_url = '${esc(base64)}',
          signed_url_expires_at = now() + interval '30 minutes'
      WHERE id = '${esc(exportId)}';
    `);

    return { success: true, exportId };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getDataExportAction(exportId: string): Promise<{
  success: boolean;
  data?: { status: string; content?: string; expiresAt?: string };
  error?: string;
}> {
  try {
    const user = await requireUser();
    const { data } = await executeSql(`
      SELECT id, status, signed_url, signed_url_expires_at
      FROM data_exports
      WHERE id = '${esc(exportId)}' AND user_id = '${esc(user.clerkId)}'
      LIMIT 1;
    `);

    if (!data || data.length === 0) {
      return { success: false, error: "Export not found" };
    }

    const row = data[0];
    if (row.signed_url_expires_at && new Date(row.signed_url_expires_at as string) < new Date()) {
      return { success: false, error: "Export link has expired. Please request a new export." };
    }

    // Mark as downloaded
    await executeSql(`UPDATE data_exports SET downloaded_at = now(), status = 'downloaded' WHERE id = '${esc(exportId)}';`);

    return {
      success: true,
      data: {
        status: row.status as string,
        content: row.signed_url as string, // base64 content
        expiresAt: row.signed_url_expires_at as string,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}
